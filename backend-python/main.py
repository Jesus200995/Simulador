import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext
from dotenv import load_dotenv
from psycopg2 import errors as pg_errors

import database as db
from models import RegistroPayload, LoginPayload, UsuarioResponse, AuthResponse

load_dotenv()

# --- Config ---
JWT_SECRET = os.getenv("JWT_SECRET", "default_secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

app = FastAPI(title="Bodegas de Maíz API", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:4173",
        "https://maiz.geodatos.com.mx",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Auth bearer
security = HTTPBearer()


# --- Helpers ---
def create_token(user_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {"userId": user_id, "email": email, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")


# --- Health ---
@app.get("/health")
def health():
    try:
        db.query_one("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception:
        raise HTTPException(status_code=500, detail="Database disconnected")


# =============================================
# AUTH ROUTES
# =============================================

@app.post("/auth/registro", response_model=AuthResponse)
def registro(payload: RegistroPayload):
    # Check existing
    existing = db.query_one(
        "SELECT id FROM usuarios WHERE email = %s OR curp = %s",
        (payload.email, payload.curp),
    )
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese email o CURP")

    # Hash password
    password_hash = pwd_ctx.hash(payload.password)

    try:
        row = db.execute(
            """INSERT INTO usuarios (email, curp, nombre_completo, password_hash, telefono)
               VALUES (%s, %s, %s, %s, %s)
               RETURNING id, email, curp, nombre_completo, telefono""",
            (payload.email, payload.curp, payload.nombre_completo, password_hash, payload.telefono),
        )
    except Exception as e:
        if hasattr(e, "pgcode") and e.pgcode == "23505":
            raise HTTPException(status_code=409, detail="Ya existe un usuario con ese email o CURP")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

    token = create_token(row["id"], row["email"])
    return {
        "message": "Usuario registrado exitosamente",
        "token": token,
        "usuario": {
            "id": row["id"],
            "email": row["email"],
            "curp": row["curp"],
            "nombre_completo": row["nombre_completo"],
            "telefono": row["telefono"],
        },
    }


@app.post("/auth/login", response_model=AuthResponse)
def login(payload: LoginPayload):
    email = payload.email.strip().lower()
    row = db.query_one(
        "SELECT * FROM usuarios WHERE email = %s AND activo = true",
        (email,),
    )
    if not row:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if not pwd_ctx.verify(payload.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = create_token(row["id"], row["email"])
    return {
        "message": "Inicio de sesión exitoso",
        "token": token,
        "usuario": {
            "id": row["id"],
            "email": row["email"],
            "curp": row["curp"],
            "nombre_completo": row["nombre_completo"],
            "telefono": row["telefono"],
        },
    }


@app.get("/auth/perfil")
def perfil(user: dict = Depends(verify_token)):
    row = db.query_one(
        "SELECT id, email, curp, nombre_completo, telefono FROM usuarios WHERE id = %s",
        (user["userId"],),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"usuario": dict(row)}


# =============================================
# BODEGAS ROUTES
# =============================================

@app.get("/bodegas/catalogos")
def catalogos(user: dict = Depends(verify_token)):
    regiones = db.query("SELECT id, nombre FROM regiones ORDER BY nombre")
    estados = db.query(
        "SELECT DISTINCT estado, region_id FROM bodegas WHERE estado IS NOT NULL ORDER BY estado"
    )
    municipios = db.query(
        "SELECT DISTINCT municipio, estado FROM bodegas WHERE municipio IS NOT NULL ORDER BY municipio"
    )
    return {
        "regiones": [dict(r) for r in regiones],
        "estados": [dict(e) for e in estados],
        "municipios": [dict(m) for m in municipios],
    }


@app.get("/bodegas")
def listar_bodegas(
    region_id: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    municipio: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    user: dict = Depends(verify_token),
):
    conditions = []
    params = []

    if region_id is not None:
        conditions.append("b.region_id = %s")
        params.append(region_id)
    if estado:
        conditions.append("b.estado = %s")
        params.append(estado)
    if municipio:
        conditions.append("b.municipio = %s")
        params.append(municipio)
    if q:
        conditions.append(
            "(b.nombre ILIKE %s OR b.clave ILIKE %s OR b.estado ILIKE %s OR b.municipio ILIKE %s)"
        )
        like = f"%{q}%"
        params.extend([like, like, like, like])

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    bodegas_sql = f"""
        SELECT b.*, r.nombre as region_nombre
        FROM bodegas b
        LEFT JOIN regiones r ON b.region_id = r.id
        {where}
        ORDER BY b.nombre ASC
    """

    kpi_sql = f"""
        SELECT
            COUNT(*)::int as total_bodegas,
            COALESCE(SUM(b.toneladas_total), 0)::float as total_toneladas,
            COALESCE(SUM(b.toneladas_nacional), 0)::float as total_nacional,
            COALESCE(SUM(b.toneladas_importacion), 0)::float as total_importacion
        FROM bodegas b
        {where}
    """

    bodegas = db.query(bodegas_sql, tuple(params))
    kpi = db.query_one(kpi_sql, tuple(params))

    return {
        "bodegas": [dict(b) for b in bodegas],
        "kpi": dict(kpi) if kpi else {
            "total_bodegas": 0,
            "total_toneladas": 0,
            "total_nacional": 0,
            "total_importacion": 0,
        },
    }


@app.get("/bodegas/{bodega_id}")
def obtener_bodega(bodega_id: int, user: dict = Depends(verify_token)):
    row = db.query_one(
        """SELECT b.*, r.nombre as region_nombre
           FROM bodegas b
           LEFT JOIN regiones r ON b.region_id = r.id
           WHERE b.id = %s""",
        (bodega_id,),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Bodega no encontrada")
    return {"bodega": dict(row)}


# =============================================
# Validation error handler – match Express format
# =============================================
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    # Return first error message
    errors = exc.errors()
    if errors:
        msg = errors[0].get("msg", "Error de validación")
        # pydantic prefixes with "Value error, "
        if msg.startswith("Value error, "):
            msg = msg[13:]
        return JSONResponse(status_code=400, content={"error": msg})
    return JSONResponse(status_code=400, content={"error": "Error de validación"})


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
