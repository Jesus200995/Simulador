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
from models import (
    RegistroPayload, LoginPayload, UsuarioResponse, AuthResponse,
    NuevaBodegaPayload, InventarioPayload,
)

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
    regiones = db.query("SELECT id, nombre, estado FROM regiones ORDER BY estado, nombre")
    estados = db.query(
        "SELECT DISTINCT estado FROM bodegas WHERE estado IS NOT NULL ORDER BY estado"
    )
    municipios = db.query(
        "SELECT DISTINCT municipio, estado FROM bodegas WHERE municipio IS NOT NULL ORDER BY estado, municipio"
    )
    ddrs = db.query(
        "SELECT DISTINCT ddr, estado FROM bodegas WHERE ddr IS NOT NULL ORDER BY estado, ddr"
    )
    return {
        "regiones": [dict(r) for r in regiones],
        "estados": [{"estado": e["estado"]} for e in estados],
        "municipios": [dict(m) for m in municipios],
        "ddrs": [dict(d) for d in ddrs],
    }


@app.get("/bodegas")
def listar_bodegas(
    region_id: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    municipio: Optional[str] = Query(None),
    ddr: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    user: dict = Depends(verify_token),
):
    conditions = []
    params = []

    # Excluir bodegas rechazadas del visualizador principal
    conditions.append("(b.estatus = 'aprobada' OR b.estatus = 'pendiente')")

    if region_id is not None:
        conditions.append("b.region_id = %s")
        params.append(region_id)
    if estado:
        conditions.append("b.estado = %s")
        params.append(estado)
    if municipio:
        conditions.append("b.municipio = %s")
        params.append(municipio)
    if ddr:
        conditions.append("b.ddr = %s")
        params.append(ddr)
    if q:
        conditions.append(
            "(b.nombre ILIKE %s OR b.clave ILIKE %s OR b.estado ILIKE %s OR b.municipio ILIKE %s OR b.ddr ILIKE %s)"
        )
        like = f"%{q}%"
        params.extend([like, like, like, like, like])

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    bodegas_sql = f"""
        SELECT b.id, b.clave, b.nombre, b.estado, b.municipio, b.region_id,
               b.ddr, b.cader, b.ejido, b.direccion, b.localidad, b.codigo_postal,
               b.latitud, b.longitud, b.capacidad_toneladas,
               b.cvegeo, b.cve_ent, b.cve_mun, b.estatus,
               r.nombre as region_nombre
        FROM bodegas b
        LEFT JOIN regiones r ON b.region_id = r.id
        {where}
        ORDER BY b.estado, b.nombre ASC
    """

    kpi_sql = f"""
        SELECT
            COUNT(*)::int as total_bodegas,
            COALESCE(SUM(b.capacidad_toneladas), 0)::float as total_capacidad,
            COUNT(DISTINCT b.estado) as total_estados,
            COUNT(DISTINCT b.municipio) as total_municipios
        FROM bodegas b
        {where}
    """

    bodegas = db.query(bodegas_sql, tuple(params))
    kpi = db.query_one(kpi_sql, tuple(params))

    return {
        "bodegas": [dict(b) for b in bodegas],
        "kpi": dict(kpi) if kpi else {
            "total_bodegas": 0,
            "total_capacidad": 0,
            "total_estados": 0,
            "total_municipios": 0,
        },
    }


@app.get("/bodegas/{bodega_id}")
def obtener_bodega(bodega_id: int, user: dict = Depends(verify_token)):
    row = db.query_one(
        """SELECT b.id, b.clave, b.nombre, b.estado, b.municipio, b.region_id,
                  b.ddr, b.cader, b.ejido, b.direccion, b.localidad, b.codigo_postal,
                  b.latitud, b.longitud, b.capacidad_toneladas,
                  b.cvegeo, b.cve_ent, b.cve_mun, b.fecha_actualizacion,
                  b.estatus, b.creado_por, b.aprobado_por, b.fecha_aprobacion,
                  r.nombre as region_nombre
           FROM bodegas b
           LEFT JOIN regiones r ON b.region_id = r.id
           WHERE b.id = %s""",
        (bodega_id,),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Bodega no encontrada")
    return {"bodega": dict(row)}


# =============================================
# NUEVA BODEGA (alta por usuario)
# =============================================

@app.post("/bodegas")
def crear_bodega(payload: NuevaBodegaPayload, user: dict = Depends(verify_token)):
    # Verificar clave duplicada
    existing = db.query_one(
        "SELECT id FROM bodegas WHERE clave = %s", (payload.clave,)
    )
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe una bodega con esa clave")

    row = db.execute(
        """INSERT INTO bodegas (clave, nombre, estado, municipio, ddr, cader, ejido,
                                direccion, localidad, codigo_postal, capacidad_toneladas,
                                latitud, longitud, estatus, creado_por, fecha_creacion)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pendiente', %s, NOW())
           RETURNING id, clave, nombre, estado, municipio, latitud, longitud, estatus""",
        (
            payload.clave, payload.nombre, payload.estado, payload.municipio,
            payload.ddr, payload.cader, payload.ejido, payload.direccion,
            payload.localidad, payload.codigo_postal, payload.capacidad_toneladas,
            payload.latitud, payload.longitud, user["userId"],
        ),
    )
    return {"message": "Bodega registrada, pendiente de aprobacion", "bodega": dict(row)}


# =============================================
# APROBACION ADMINISTRATIVA
# =============================================

@app.patch("/bodegas/{bodega_id}/aprobar")
def aprobar_bodega(bodega_id: int, user: dict = Depends(verify_token)):
    # Verificar rol admin
    admin = db.query_one("SELECT rol FROM usuarios WHERE id = %s", (user["userId"],))
    if not admin or admin["rol"] != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden aprobar bodegas")

    row = db.execute(
        """UPDATE bodegas SET estatus = 'aprobada', aprobado_por = %s, fecha_aprobacion = NOW()
           WHERE id = %s AND estatus = 'pendiente'
           RETURNING id, nombre, estatus""",
        (user["userId"], bodega_id),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Bodega no encontrada o ya procesada")
    return {"message": "Bodega aprobada", "bodega": dict(row)}


@app.patch("/bodegas/{bodega_id}/rechazar")
def rechazar_bodega(bodega_id: int, user: dict = Depends(verify_token)):
    admin = db.query_one("SELECT rol FROM usuarios WHERE id = %s", (user["userId"],))
    if not admin or admin["rol"] != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden rechazar bodegas")

    row = db.execute(
        """UPDATE bodegas SET estatus = 'rechazada', aprobado_por = %s, fecha_aprobacion = NOW()
           WHERE id = %s AND estatus = 'pendiente'
           RETURNING id, nombre, estatus""",
        (user["userId"], bodega_id),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Bodega no encontrada o ya procesada")
    return {"message": "Bodega rechazada", "bodega": dict(row)}


# =============================================
# INVENTARIOS
# =============================================

@app.post("/bodegas/{bodega_id}/inventario")
def registrar_inventario(bodega_id: int, payload: InventarioPayload, user: dict = Depends(verify_token)):
    # Verificar que la bodega existe
    bodega = db.query_one("SELECT id, estatus FROM bodegas WHERE id = %s", (bodega_id,))
    if not bodega:
        raise HTTPException(status_code=404, detail="Bodega no encontrada")

    row = db.execute(
        """INSERT INTO inventarios (bodega_id, usuario_id, ciclo, volumen_almacenamiento, volumen_problemas)
           VALUES (%s, %s, %s, %s, %s)
           RETURNING id, bodega_id, ciclo, volumen_almacenamiento, volumen_problemas, fecha_registro""",
        (bodega_id, user["userId"], payload.ciclo, payload.volumen_almacenamiento, payload.volumen_problemas),
    )
    return {"message": "Inventario registrado", "inventario": dict(row)}


@app.get("/bodegas/{bodega_id}/inventarios")
def listar_inventarios(bodega_id: int, user: dict = Depends(verify_token)):
    rows = db.query(
        """SELECT i.id, i.ciclo, i.volumen_almacenamiento, i.volumen_problemas, i.fecha_registro,
                  u.nombre_completo as registrado_por
           FROM inventarios i
           LEFT JOIN usuarios u ON i.usuario_id = u.id
           WHERE i.bodega_id = %s
           ORDER BY i.fecha_registro DESC
           LIMIT 20""",
        (bodega_id,),
    )
    return {"inventarios": [dict(r) for r in rows]}


# =============================================
# MIS BODEGAS
# =============================================

@app.get("/mis-bodegas")
def mis_bodegas(user: dict = Depends(verify_token)):
    bodegas = db.query(
        """SELECT b.id, b.clave, b.nombre, b.estado, b.municipio, b.estatus,
                  b.capacidad_toneladas, b.fecha_creacion, b.latitud, b.longitud,
                  (SELECT COUNT(*) FROM inventarios i WHERE i.bodega_id = b.id) as total_inventarios,
                  (SELECT MAX(i.fecha_registro) FROM inventarios i WHERE i.bodega_id = b.id) as ultimo_inventario
           FROM bodegas b
           WHERE b.creado_por = %s
           ORDER BY b.fecha_creacion DESC""",
        (user["userId"],),
    )
    return {"bodegas": [dict(b) for b in bodegas]}


# =============================================
# PRECIOS DE MAIZ
# =============================================

@app.get("/precios-maiz")
def precios_maiz(user: dict = Depends(verify_token)):
    rows = db.query("SELECT * FROM precios_maiz ORDER BY id")
    if not rows:
        return {
            "precios": [],
            "promedio": 0,
            "tendencia_general": "sin datos",
        }
    precios = [dict(r) for r in rows]
    promedio = sum(p["precio"] for p in precios) / len(precios)
    return {
        "precios": precios,
        "promedio": round(promedio, 2),
        "tendencia_general": "estable",
    }


# =============================================
# ADMIN: Bodegas pendientes
# =============================================

@app.get("/admin/bodegas-pendientes")
def bodegas_pendientes(user: dict = Depends(verify_token)):
    admin = db.query_one("SELECT rol FROM usuarios WHERE id = %s", (user["userId"],))
    if not admin or admin["rol"] != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado")

    rows = db.query(
        """SELECT b.id, b.clave, b.nombre, b.estado, b.municipio, b.estatus,
                  b.capacidad_toneladas, b.fecha_creacion, b.latitud, b.longitud,
                  u.nombre_completo as creado_por_nombre
           FROM bodegas b
           LEFT JOIN usuarios u ON b.creado_por = u.id
           WHERE b.estatus = 'pendiente'
           ORDER BY b.fecha_creacion DESC"""
    )
    return {"bodegas": [dict(r) for r in rows]}


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
