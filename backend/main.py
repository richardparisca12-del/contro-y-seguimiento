import os
import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import auth, funcionarios, stats, upload, consulta, reportes
from app.services.scheduler import iniciar_scheduler, detener_scheduler

# Configuración de Logging centralizado y estructurado
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("minjuventud-api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[INIT] Iniciando aplicación y verificando tablas en MySQL...")
    db_initialized = False
    for attempt in range(1, 11):
        try:
            init_db()
            logger.info("[INIT] Base de datos y tablas inicializadas correctamente.")
            iniciar_scheduler()
            db_initialized = True
            break
        except Exception as e:
            logger.warning(f"[DB-RETRY] Intento {attempt}/10 de conexión a MySQL: {e}. Reintentando en 2s...")
            time.sleep(2)
    if not db_initialized:
        logger.error("[CRITICAL] No se pudo inicializar la base de datos tras 10 intentos.")
    yield
    logger.info("[SHUTDOWN] Deteniendo tareas de fondo...")
    try:
        detener_scheduler()
    except Exception:
        pass


app = FastAPI(
    title="Sistema de Seguimiento y Reporte - MinJuventud",
    description="API REST para control de personal ministerial y procesamiento masivo de nómina",
    version="1.0.0",
    lifespan=lifespan
)

# Configuración defensiva de CORS
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env:
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
else:
    allowed_origins = [
        "https://consulta.minjuventud.gob.ve",
        "http://consulta.minjuventud.gob.ve",
        "https://www.consulta.minjuventud.gob.ve",
        "http://www.consulta.minjuventud.gob.ve",
        "http://localhost:3085",
        "http://127.0.0.1:3085",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:80",
        "http://127.0.0.1:80",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|([a-zA-Z0-9-]+\.)?minjuventud\.gob\.ve)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Middleware de auditoría y rastreo de logs de solicitudes entrantes
@app.middleware("http")
async def audit_logging_middleware(request: Request, call_next):
    start_time = time.time()
    client_ip = request.client.host if request.client else "unknown"
    method = request.method
    path = request.url.path

    try:
        response = await call_next(request)
        process_time = round((time.time() - start_time) * 1000, 2)
        status_code = response.status_code

        # Log de advertencia para errores 4xx o 5xx
        if status_code >= 500:
            logger.error(f"[5xx ALARMA] {method} {path} - IP: {client_ip} - Status: {status_code} - {process_time}ms")
        elif status_code >= 400:
            logger.warning(f"[4xx RECHAZO] {method} {path} - IP: {client_ip} - Status: {status_code} - {process_time}ms")
        elif path.startswith("/api/upload") or path.startswith("/api/auth"):
            logger.info(f"[AUDIT-SEC] {method} {path} - IP: {client_ip} - Status: {status_code} - {process_time}ms")

        return response
    except Exception as exc:
        process_time = round((time.time() - start_time) * 1000, 2)
        logger.error(f"[UNHANDLED EXCEPTION] {method} {path} - IP: {client_ip} - {process_time}ms - Error: {exc}", exc_info=True)
        raise exc


# Registrar routers
app.include_router(consulta.router)
app.include_router(auth.router)
app.include_router(funcionarios.router)
app.include_router(stats.router)
app.include_router(upload.router)
app.include_router(reportes.router)


@app.get("/")
def read_root():
    return {
        "sistema": "Sistema de Seguimiento y Reporte - MinJuventud",
        "estado": "En línea",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
