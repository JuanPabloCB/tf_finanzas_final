from sqlalchemy.orm import Session
from auth_utils import get_password_hash
import models               # <-- necesario para referenciar modelos
import schemas              # <-- necesario si usas anotaciones/objetos Pydantic


# ============================================================
# 1. USUARIOS (Registro / Login)
# ============================================================

def get_user_by_username(db: Session, username: str):
    return db.query(models.Usuario).filter(models.Usuario.username == username).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.Usuario).filter(models.Usuario.email == email).first()


def create_user(db: Session, user):
    """
    Crea un Usuario.
    Accepta tanto un Pydantic object (user.username/user.email/user.password)
    como un dict con keys 'username','email','password'.
    Se expone como create_user(db=db, user=...) para compatibilidad con main.py
    """
    # obtener valores independientemente de si user es Pydantic o dict
    username = getattr(user, "username", None) or user.get("username")
    email = getattr(user, "email", None) or user.get("email")
    password = getattr(user, "password", None) or user.get("password")

    hashed = get_password_hash(password)
    nuevo = models.Usuario(
        username=username,
        email=email,
        password=hashed,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


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


# ============================================================
# 4. CUENTAS AGENTE
# ============================================================

def get_cuenta_agente_by_email(db: Session, email: str):
    return db.query(models.CuentaAgente).filter(models.CuentaAgente.email == email).first()

def create_cuenta_agente(db: Session, username: str, email: str, plain_password: str):
    from auth_utils import get_password_hash
    hashed = get_password_hash(plain_password)
    nueva = models.CuentaAgente(
        username=username,
        email=email,
        password=hashed
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva
