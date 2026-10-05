@echo off
chcp 65001 > nul
echo ==============================================================
echo   MINJUVENTUD - SISTEMA DE SEGUIMIENTO Y CONTROL DE PERSONAL
echo ==============================================================
echo.

echo [1/3] Verificando servicio MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo       MySQL ya se encuentra en ejecucion.
) else (
    echo       Iniciando MySQL MariaDB desde XAMPP...
    start /B "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini"
    timeout /t 3 /nobreak > nul
)

echo.
echo [2/3] Iniciando Servidor Backend (FastAPI en http://127.0.0.1:8000)...
start "MinJuventud Backend API" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo.
echo [3/3] Iniciando Servidor Frontend (Vite React en http://localhost:5173)...
start "MinJuventud Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak > nul
echo.
echo ==============================================================
echo   ¡Sistema iniciado correctamente!
echo   Acceda en su navegador: http://localhost:5173
echo   Contraseña de acceso: admin123
echo ==============================================================
start http://localhost:5173
pause
