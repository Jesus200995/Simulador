from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import re


class RegistroPayload(BaseModel):
    email: str
    curp: str
    nombre_completo: str
    password: str
    telefono: str

    @field_validator("email")
    @classmethod
    def validar_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", v):
            raise ValueError("Formato de email inválido")
        return v

    @field_validator("curp")
    @classmethod
    def validar_curp(cls, v: str) -> str:
        v = v.strip().upper()
        if not re.match(r"^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$", v):
            raise ValueError("Formato de CURP inválido. Debe ser 18 caracteres alfanuméricos")
        return v

    @field_validator("password")
    @classmethod
    def validar_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("La contraseña debe tener al menos 6 caracteres")
        return v

    @field_validator("telefono")
    @classmethod
    def validar_telefono(cls, v: str) -> str:
        v = re.sub(r"[\s\-\(\)]", "", v)
        if not re.match(r"^\d{10}$", v):
            raise ValueError("El teléfono debe tener 10 dígitos")
        return v

    @field_validator("nombre_completo")
    @classmethod
    def normalizar_nombre(cls, v: str) -> str:
        import unicodedata
        v = v.strip()
        if len(v) < 5:
            raise ValueError("Ingresa tu nombre completo")
        # Remove accents and uppercase
        nfkd = unicodedata.normalize("NFD", v)
        return "".join(c for c in nfkd if unicodedata.category(c) != "Mn").upper()


class LoginPayload(BaseModel):
    email: str
    password: str


class UsuarioResponse(BaseModel):
    id: int
    email: str
    curp: str
    nombre_completo: str
    telefono: str


class AuthResponse(BaseModel):
    message: str
    token: str
    usuario: UsuarioResponse


class NuevaBodegaPayload(BaseModel):
    clave: str
    nombre: str
    estado: str
    municipio: str
    ddr: Optional[str] = None
    cader: Optional[str] = None
    ejido: Optional[str] = None
    direccion: Optional[str] = None
    localidad: Optional[str] = None
    codigo_postal: Optional[str] = None
    capacidad_toneladas: Optional[float] = None
    latitud: float
    longitud: float

    @field_validator("clave")
    @classmethod
    def validar_clave(cls, v: str) -> str:
        v = v.strip().upper()
        if len(v) < 3:
            raise ValueError("La clave debe tener al menos 3 caracteres")
        return v

    @field_validator("nombre")
    @classmethod
    def validar_nombre_bodega(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("El nombre debe tener al menos 3 caracteres")
        return v

    @field_validator("latitud")
    @classmethod
    def validar_latitud(cls, v: float) -> float:
        if v < -90 or v > 90:
            raise ValueError("Latitud debe estar entre -90 y 90")
        return v

    @field_validator("longitud")
    @classmethod
    def validar_longitud(cls, v: float) -> float:
        if v < -180 or v > 180:
            raise ValueError("Longitud debe estar entre -180 y 180")
        return v

    @field_validator("codigo_postal")
    @classmethod
    def validar_cp(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = re.sub(r"\D", "", v)
            if v and len(v) != 5:
                raise ValueError("El codigo postal debe tener 5 digitos")
        return v or None


class InventarioPayload(BaseModel):
    ciclo: str
    tipo_maiz: str = "Maiz blanco"
    volumen_almacenamiento: float
    volumen_problemas: Optional[float] = 0

    @field_validator("ciclo")
    @classmethod
    def validar_ciclo(cls, v: str) -> str:
        v = v.strip()
        opciones = ["Primavera-Verano", "Otono-Invierno"]
        if v not in opciones:
            raise ValueError("Ciclo debe ser Primavera-Verano u Otono-Invierno")
        return v

    @field_validator("tipo_maiz")
    @classmethod
    def validar_tipo_maiz(cls, v: str) -> str:
        v = v.strip()
        opciones = ["Maiz blanco", "Maiz amarillo"]
        if v not in opciones:
            raise ValueError("Tipo de maiz debe ser Maiz blanco o Maiz amarillo")
        return v

    @field_validator("volumen_almacenamiento")
    @classmethod
    def validar_volumen(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("El volumen debe ser mayor a 0")
        return v
