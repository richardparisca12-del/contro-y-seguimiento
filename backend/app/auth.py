import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "minjuventud_secret_key_super_segura_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))
import hmac
import time
from collections import defaultdict

SYSTEM_PASSWORD = os.getenv("SYSTEM_PASSWORD", "Minj2026!")

# Registro de intentos fallidos de autenticación por IP (Protección contra fuerza bruta en producción)
_login_failed_attempts = defaultdict(list)
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 300  # 5 minutos


def check_login_allowed(ip: str):
    now = time.time()
    # Limpiar intentos más viejos que el período de bloqueo
    _login_failed_attempts[ip] = [t for t in _login_failed_attempts[ip] if now - t < LOCKOUT_DURATION_SECONDS]
    if len(_login_failed_attempts[ip]) >= MAX_FAILED_ATTEMPTS:
        remaining = int(LOCKOUT_DURATION_SECONDS - (now - _login_failed_attempts[ip][0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Demasiados intentos fallidos. Acceso bloqueado por seguridad. Intente nuevamente en {max(1, remaining)} segundos."
        )


def record_failed_attempt(ip: str):
    _login_failed_attempts[ip].append(time.time())


def clear_failed_attempts(ip: str):
    if ip in _login_failed_attempts:
        del _login_failed_attempts[ip]


def verify_password(plain_password: str) -> bool:
    return hmac.compare_digest(plain_password.strip(), SYSTEM_PASSWORD.strip())


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


security = HTTPBearer(auto_error=False)


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role: str = payload.get("role")
        if role != "admin":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
