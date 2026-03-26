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
