# backend/main.py   (antes lo llamaste schemas.py, pero este es tu archivo principal)

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models, schemas, crud, logic, auth_utils
import json
from fastapi.middleware.cors import CORSMiddleware

# ============================================================
# Inicializar BD
# ============================================================
Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Inmobiliaria - Crédito MiVivienda")

# ============================================================
# CORS para permitir conexión desde Angular
# ============================================================
origins = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Seguridad - Token OAuth2
# ============================================================
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user = auth_utils.decode_access_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas o sesión expirada",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# ============================================================
# 1. AUTENTICACIÓN (Login / Registro)
# ============================================================

@app.post("/api/registrar-usuario", tags=["Seguridad"])
def registrar_usuario(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # validar username
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="El usuario ya existe")

    # validar email
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    return crud.create_user(db=db, user=user)


@app.post("/token", response_model=schemas.Token, tags=["Seguridad"])
def login_para_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Permite login usando username O correo en el campo 'username'.
    En el front tú envías el correo en ese campo.
    """
    # Si lo que viene parece un correo, buscamos por email
    if "@" in form_data.username:
        user = crud.get_user_by_email(db, form_data.username)
    else:
        user = crud.get_user_by_username(db, form_data.username)

    if not user or not auth_utils.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth_utils.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


# (el resto de endpoints clientes / inmuebles / cotizar los dejas como ya los tienes)



# ============================================================
# 2. CLIENTES (Protegido)
# ============================================================

@app.post("/api/clientes", response_model=schemas.ClienteResponse, tags=["Gestión"])
def crear_cliente(
    cliente: schemas.ClienteCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    return crud.create_cliente(db=db, cliente=cliente)


@app.get("/api/clientes", response_model=list[schemas.ClienteResponse], tags=["Gestión"])
def listar_clientes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    return crud.get_clientes(db, skip=skip, limit=limit)


# ============================================================
# 3. INMUEBLES (Protegido)
# ============================================================

@app.post("/api/inmuebles", response_model=schemas.InmuebleResponse, tags=["Gestión"])
def crear_inmueble(
    inmueble: schemas.InmuebleCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    return crud.create_inmueble(db=db, inmueble=inmueble)


@app.get("/api/inmuebles", response_model=list[schemas.InmuebleResponse], tags=["Gestión"])
def listar_inmuebles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    return crud.get_inmuebles(db, skip=skip, limit=limit)


# ============================================================
# 4. MOTOR DE COTIZACIÓN (Protegido)
# ============================================================

@app.post("/api/cotizar", response_model=schemas.CotizacionResponse, tags=["Cotización"])
def generar_cotizacion(
    datos: schemas.CotizacionInput,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    # validar existencia
    cliente = db.query(models.Cliente).filter(models.Cliente.id == datos.cliente_id).first()
    inmueble = db.query(models.Inmueble).filter(models.Inmueble.id == datos.inmueble_id).first()

    if not cliente or not inmueble:
        raise HTTPException(status_code=404, detail="Cliente o inmueble no encontrados")

    # ejecutar cálculo financiero
    resultado_calculo = logic.calcular_cotizacion(datos)

    # cronograma en JSON
    cronograma_str = json.dumps(resultado_calculo["cronograma"])

    # crear objeto cotización
    nueva_cotizacion = models.Cotizacion(
        vendedor_id=current_user.id,
        cliente_id=datos.cliente_id,
        inmueble_id=datos.inmueble_id,
        moneda_prestamo=datos.moneda_prestamo,
        precio_final_inmueble=datos.precio_final_inmueble,
        porcentaje_cuota_inicial=datos.porcentaje_cuota_inicial,
        monto_cuota_inicial=datos.precio_final_inmueble * (datos.porcentaje_cuota_inicial / 100),
        monto_bono_buen_pagador=datos.monto_bono_buen_pagador,
        monto_prestamo=resultado_calculo["monto_prestamo"],
        tipo_tasa=datos.tipo_tasa,
        valor_tasa=datos.valor_tasa,
        capitalizacion=datos.capitalizacion,
        plazo_meses=datos.plazo_anios * 12,
        tipo_periodo_gracia=datos.tipo_periodo_gracia,
        meses_gracia=datos.meses_gracia,
        seguro_desgravamen_porc=datos.seguro_desgravamen_porc,
        seguro_riesgo_porc=datos.seguro_riesgo_porc,
        gastos_administrativos=datos.gastos_administrativos,
        tcea=resultado_calculo["tcea"],
        van=resultado_calculo["van"],
        tir=resultado_calculo["tir"],
        cuota_mensual_referencial=resultado_calculo["cuota_mensual_referencial"],
        cronograma_json=cronograma_str
    )

    db.add(nueva_cotizacion)
    db.commit()
    db.refresh(nueva_cotizacion)

    return nueva_cotizacion


# ============================================================
# 5. EDITAR CLIENTE
# ============================================================

@app.put("/api/clientes/{cliente_id}", response_model=schemas.ClienteResponse, tags=["Gestión"])
def actualizar_cliente(
    cliente_id: int,
    cliente: schemas.ClienteCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    return crud.update_cliente(db, cliente_id, cliente)
