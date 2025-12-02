from sqlalchemy.orm import Session
import models, schemas
from auth_utils import get_password_hash


# ============================================================
# 1. USUARIOS (Registro / Login)
# ============================================================

def get_user_by_username(db: Session, username: str):
    return db.query(models.Usuario).filter(models.Usuario.username == username).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.Usuario).filter(models.Usuario.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    """
    Crea un usuario nuevo. 
    OJO: el modelo Usuario usa la columna 'password', no 'hashed_password'.
    Guardamos el hash dentro de 'password'.
    """
    hashed_password = get_password_hash(user.password)

    db_user = models.Usuario(
        username=user.username,
        email=user.email,
        password=hashed_password,   # <-- aquí va 'password', NO 'hashed_password'
        rol_id=1                    # rol vendedor por defecto
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# ============================================================
# 2. CLIENTES
# ============================================================

def create_cliente(db: Session, cliente: schemas.ClienteCreate):
    db_cliente = models.Cliente(**cliente.dict())
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente


def get_cliente_by_dni(db: Session, dni: str):
    return db.query(models.Cliente).filter(models.Cliente.dni == dni).first()


def get_clientes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Cliente).offset(skip).limit(limit).all()


def update_cliente(db: Session, cliente_id: int, cliente_update: schemas.ClienteCreate):
    db_cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if db_cliente:
        for key, value in cliente_update.dict().items():
            setattr(db_cliente, key, value)
        db.commit()
        db.refresh(db_cliente)
    return db_cliente


# ============================================================
# 3. INMUEBLES
# ============================================================

def create_inmueble(db: Session, inmueble: schemas.InmuebleCreate):
    db_inmueble = models.Inmueble(**inmueble.dict())
    db.add(db_inmueble)
    db.commit()
    db.refresh(db_inmueble)
    return db_inmueble


def get_inmuebles(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Inmueble).offset(skip).limit(limit).all()


def update_inmueble(db: Session, inmueble_id: int, inmueble_update: schemas.InmuebleCreate):
    db_inmueble = db.query(models.Inmueble).filter(models.Inmueble.id == inmueble_id).first()
    if db_inmueble:
        for key, value in inmueble_update.dict().items():
            setattr(db_inmueble, key, value)
        db.commit()
        db.refresh(db_inmueble)
    return db_inmueble
