from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import date, datetime

# ============================================================
# 1. ESQUEMAS DE SEGURIDAD (Login / Registro)
# ============================================================

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str


# ============================================================
# 2. CLIENTES
# ============================================================

class ClienteBase(BaseModel):
    dni: str = Field(..., min_length=8, max_length=8)
    nombres: str
    apellidos: str
    email: str
    telefono: str
    ingreso_mensual: float
    edad: int
    calificacion_sentinel: str = "Normal"
    direccion_actual: str

class ClienteCreate(ClienteBase):
    pass

class ClienteResponse(ClienteBase):
    id: int
    class Config:
        from_attributes = True


# ============================================================
# 3. INMUEBLES
# ============================================================

class InmuebleBase(BaseModel):
    codigo_proyecto: str
    direccion: str
    tipo: str
    area_m2: float
    precio_venta: float
    moneda_venta: str

class InmuebleCreate(InmuebleBase):
    pass

class InmuebleResponse(InmuebleBase):
    id: int
    estado: str
    class Config:
        from_attributes = True


# ============================================================
# 4. COTIZACIÓN
# ============================================================

class CotizacionInput(BaseModel):
    cliente_id: int
    inmueble_id: int

    moneda_prestamo: str = "PEN"
    precio_final_inmueble: float

    porcentaje_cuota_inicial: float
    monto_bono_buen_pagador: float = 0.0

    tipo_tasa: str
    valor_tasa: float
    capitalizacion: int = 30
    plazo_anios: int

    tipo_periodo_gracia: str = "Sin Gracia"
    meses_gracia: int = 0

    seguro_desgravamen_porc: float
    seguro_riesgo_porc: float
    gastos_administrativos: float = 0.0

    class Config:
        from_attributes = True

class CotizacionResponse(BaseModel):
    id: int
    fecha_cotizacion: datetime

    monto_prestamo: float
    cuota_mensual_referencial: float
    tcea: float
    van: float
    tir: float
    cronograma_json: str

    class Config:
        from_attributes = True
