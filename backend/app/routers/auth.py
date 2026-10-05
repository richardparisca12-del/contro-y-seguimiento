from fastapi import APIRouter, HTTPException, status
from app.schemas import LoginRequest, Token
from app.auth import verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest):
    if not verify_password(payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña incorrecta",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": "admin", "role": "admin"})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/verify")
def verify():
    return {"status": "ok"}
