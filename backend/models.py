from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# --- 1. SEGURIDAD (Login) ---
class Rol(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    nombre_rol = Column(String(50), unique=True, nullable=False)
    usuarios = relationship("Usuario", back_populates="rol")


class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)

    # email para registro
    email = Column(String(120), unique=True, nullable=False)

    # nombre de usuario que usarás en el login
    username = Column(String(50), unique=True, nullable=False)

    # contraseña encriptada (el valor ya vendrá hasheado desde crud)
    password = Column(String(255), nullable=False)

    rol_id = Column(Integer, ForeignKey("roles.id"))
    rol = relationship("Rol", back_populates="usuarios")

    # Relación con las cotizaciones que haga el vendedor
    cotizaciones = relationship("Cotizacion", back_populates="vendedor")


# --- 2. GESTIÓN INMOBILIARIA (Requisitos del Enunciado) ---

class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    dni = Column(String(8), unique=True, index=True)
    nombres = Column(String(100))
    apellidos = Column(String(100))
    email = Column(String(100))
    telefono = Column(String(20))

    ingreso_mensual = Column(Float)
    edad = Column(Integer)
    calificacion_sentinel = Column(String(20))
    direccion_actual = Column(String(200))

    cotizaciones = relationship("Cotizacion", back_populates="cliente")


class Inmueble(Base):
    __tablename__ = "inmuebles"
    id = Column(Integer, primary_key=True, index=True)
    codigo_proyecto = Column(String(50))
    direccion = Column(String(200))
    tipo = Column(String(50))
    area_m2 = Column(Float)
    precio_venta = Column(Float)
    moneda_venta = Column(String(3))
    estado = Column(String(20), default="Disponible")

    cotizaciones = relationship("Cotizacion", back_populates="inmueble")


# --- 3. MOTOR FINANCIERO (Crédito MiVivienda) ---

class Cotizacion(Base):
    __tablename__ = "cotizaciones"
    id = Column(Integer, primary_key=True, index=True)
    fecha_cotizacion = Column(DateTime, default=datetime.utcnow)

    vendedor_id = Column(Integer, ForeignKey("usuarios.id"))
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    inmueble_id = Column(Integer, ForeignKey("inmuebles.id"))

    moneda_prestamo = Column(String(3))
    precio_final_inmueble = Column(Float)
    porcentaje_cuota_inicial = Column(Float)
    monto_cuota_inicial = Column(Float)
    monto_bono_buen_pagador = Column(Float)
    monto_prestamo = Column(Float)

    tipo_tasa = Column(String(20))
    valor_tasa = Column(Float)
    capitalizacion = Column(Integer, default=30)
    plazo_meses = Column(Integer)

    tipo_periodo_gracia = Column(String(20))
    meses_gracia = Column(Integer, default=0)

    seguro_desgravamen_porc = Column(Float)
    seguro_riesgo_porc = Column(Float)
    gastos_administrativos = Column(Float)

    tcea = Column(Float)
    van = Column(Float)
    tir = Column(Float)
    cuota_mensual_referencial = Column(Float)

    cronograma_json = Column(Text)

    vendedor = relationship("Usuario", back_populates="cotizaciones")
    cliente = relationship("Cliente", back_populates="cotizaciones")
    inmueble = relationship("Inmueble", back_populates="cotizaciones")


class CuentaAgente(Base):
    __tablename__ = "cuentas_agente"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), nullable=False)  # Solo para mostrar en UI
    email = Column(String(120), unique=True, nullable=False, index=True)  # <-- PRINCIPAL
    password = Column(String(255), nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow)
