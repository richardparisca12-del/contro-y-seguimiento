@echo off
chcp 65001 > nul
echo ==============================================================
echo   MINJUVENTUD - CONSTRUCCIÓN Y DESPLIEGUE EN DOCKER
echo ==============================================================
echo.

if not exist .env (
    echo Creando archivo .env a partir de .env.docker...
    copy .env.docker .env > nul
)

echo Construyendo e iniciando contenedores con docker-compose...
docker compose up -d --build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] No se pudo iniciar con 'docker compose'. Intentando con 'docker-compose'...
    docker-compose up -d --build
)

echo.
echo ==============================================================
echo   ¡Contenedores iniciados exitosamente!
echo   Frontend: http://localhost:3085
echo   Backend API: http://localhost:8005/docs
echo   Contraseña de acceso: Minj2026!
echo ==============================================================
pause
