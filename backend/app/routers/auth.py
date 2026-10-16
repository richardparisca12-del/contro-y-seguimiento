import logging
from fastapi import APIRouter, HTTPException, Request, Depends, status
from app.schemas import LoginRequest, Token
from app.auth import (
    verify_password,
    create_access_token,
    check_login_allowed,
    record_failed_attempt,
    clear_failed_attempts,
    get_current_user
)

logger = logging.getLogger("minjuventud-auth")
router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    check_login_allowed(client_ip)

    if not verify_password(payload.password):
        record_failed_attempt(client_ip)
        logger.warning(f"[AUTH FAIL] Intento fallido de autenticación administrativa desde IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña de acceso administrativo incorrecta.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    clear_failed_attempts(client_ip)
    logger.info(f"[AUTH SUCCESS] Sesión administrativa iniciada correctamente desde IP: {client_ip}")
    access_token = create_access_token(data={"sub": "admin", "role": "admin"})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/verify")
def verify(_user: dict = Depends(get_current_user)):
    """Verifica si el token JWT actual es válido y está vigente."""
    return {"status": "ok", "user": _user.get("sub", "admin")}

