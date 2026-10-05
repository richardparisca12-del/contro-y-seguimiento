import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import auth, funcionarios, stats, upload

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("minjuventud-api")

app = FastAPI(
    title="Sistema de Seguimiento y Reporte - MinJuventud",
    description="API REST para control de personal ministerial y procesamiento masivo de nómina",
    version="1.0.0"
)

# Configuración de CORS para permitir frontend Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(auth.router)
app.include_router(funcionarios.router)
app.include_router(stats.router)
app.include_router(upload.router)


@app.on_event("startup")
def startup_event():
    logger.info("Iniciando aplicación y verificando tablas en MySQL...")
    try:
        init_db()
        logger.info("Base de datos y tablas inicializadas correctamente.")
    except Exception as e:
        logger.error(f"Aviso de conexión inicial a MySQL: {e}")
        logger.info("Asegúrese de que el servicio MySQL esté corriendo en localhost:3306")


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
