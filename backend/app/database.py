from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "minjuventud")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Crea la base de datos y tablas si no existen."""
    # Crear base de datos si no existe
    engine_root = create_engine(
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}?charset=utf8mb4",
        pool_pre_ping=True
    )
    with engine_root.connect() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
        conn.commit()

    # Importar modelos para que Base.metadata los reconozca
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Migración defensiva en caliente para bases de datos existentes en producción
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE funcionarios MODIFY COLUMN categoria VARCHAR(50) NOT NULL"))
            conn.execute(text("ALTER TABLE funcionarios MODIFY COLUMN cedula VARCHAR(30) NOT NULL"))
            conn.execute(text("ALTER TABLE funcionarios MODIFY COLUMN apellido_nombre VARCHAR(250) NOT NULL"))
            conn.execute(text("ALTER TABLE funcionarios MODIFY COLUMN cargo VARCHAR(300)"))
            conn.execute(text("ALTER TABLE funcionarios MODIFY COLUMN unidad_adscripcion VARCHAR(350)"))
            conn.execute(text("ALTER TABLE funcionarios MODIFY COLUMN centro_votacion VARCHAR(500)"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE funcionarios ADD COLUMN ente VARCHAR(100) NOT NULL DEFAULT 'MINISTERIO DE LA JUVENTUD'"))
            conn.commit()
        except Exception:
            pass  # La columna ya existe

        try:
            conn.execute(text("CREATE INDEX idx_ente ON funcionarios (ente)"))
            conn.commit()
        except Exception:
            pass

        try:
            # Reemplazar índice único anterior por (cedula, categoria, ente)
            conn.execute(text("ALTER TABLE funcionarios DROP INDEX idx_cedula_categoria"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("CREATE UNIQUE INDEX idx_cedula_categoria_ente ON funcionarios (cedula, categoria, ente)"))
            conn.commit()
        except Exception:
            pass

        try:
            # Normalización automática en caliente de entes en la base de datos
            conn.execute(text("""
                UPDATE funcionarios
                SET ente = 'INJ'
                WHERE UPPER(ente) LIKE '%INJ%' OR UPPER(ente) LIKE '%INSTITUTO%';
            """))
            conn.execute(text("""
                UPDATE funcionarios
                SET ente = 'MINISTERIO DE LA JUVENTUD'
                WHERE ente IS NULL OR ente = '' OR (UPPER(ente) NOT LIKE '%INJ%' AND UPPER(ente) NOT LIKE '%INSTITUTO%');
            """))
            conn.commit()
        except Exception:
            pass
