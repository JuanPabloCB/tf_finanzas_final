# backend/auth_utils.py

from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from sqlalchemy.orm import Session
import models

# ============================================================
# Configuración del JWT
# ============================================================

SECRET_KEY = "mi_clave_secreta_super_segura_cambiame"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hora


# ============================================================
# Password hashing (solo sha256_crypt, sin bcrypt)
# ============================================================

# IMPORTANTE: aquí solo usamos sha256_crypt para evitar problemas con bcrypt
pwd_context = CryptContext(
    schemes=["sha256_crypt"],   # <--- NADA de "bcrypt" aquí
    deprecated="auto"
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si la contraseña en texto plano coincide con el hash guardado.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Genera el hash de la contraseña usando sha256_crypt.
    Es rápido y suficiente para este proyecto.
    """
    return pwd_context.hash(password)


# ============================================================
# Token JWT
# ============================================================

def create_access_token(data: dict) -> str:
    """
    Crea un JWT de acceso con expiración.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ============================================================
# Decodificar token + obtener usuario
# ============================================================

def decode_access_token(token: str, db: Session):
    """
    Decodifica el token, extrae el username y devuelve
    el usuario de la base de datos. Si algo falla, retorna None.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None

    return db.query(models.Usuario).filter(models.Usuario.username == username).first()
