from fastapi import APIRouter, HTTPException, Request, status
from app.schemas import LoginRequest, Token
from app.auth import verify_password, create_access_token, check_login_allowed, record_failed_attempt, clear_failed_attempts

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    check_login_allowed(client_ip)

    if not verify_password(payload.password):
        record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña de acceso administrativo incorrecta.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    clear_failed_attempts(client_ip)
    access_token = create_access_token(data={"sub": "admin", "role": "admin"})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/verify")
def verify():
    return {"status": "ok"}

