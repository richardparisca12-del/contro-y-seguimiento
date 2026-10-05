from sqlalchemy import Column, Integer, String, DateTime, Enum, Index, text
from sqlalchemy.sql import func
from app.database import Base
import enum


class CategoriaPersonal(str, enum.Enum):
    ALTO_NIVEL = "ALTO NIVEL"
    CONFIANZA = "CONFIANZA"
    COMISION = "COMISION"
    CONTRATADO = "CONTRATADO"


class Funcionario(Base):
    __tablename__ = "funcionarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cedula = Column(String(20), nullable=False, index=True)
    categoria = Column(
        Enum("ALTO NIVEL", "CONFIANZA", "COMISION", "CONTRATADO", name="categoria_enum"),
        nullable=False
    )
    apellido_nombre = Column(String(200), nullable=False)
    cargo = Column(String(200))
    unidad_adscripcion = Column(String(200))
    estado = Column(String(100))
    municipio = Column(String(100))
    parroquia = Column(String(100))
    centro_votacion = Column(String(200))
    numero_orden = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_cedula_categoria", "cedula", "categoria", unique=True),
        Index("idx_estado", "estado"),
        Index("idx_municipio", "municipio"),
        Index("idx_categoria", "categoria"),
        Index("idx_unidad", "unidad_adscripcion"),
    )
