from sqlalchemy import Column, Integer, String, DateTime, Index
from sqlalchemy.sql import func
from app.database import Base


class Funcionario(Base):
    __tablename__ = "funcionarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cedula = Column(String(30), nullable=False, index=True)
    categoria = Column(String(50), nullable=False, index=True)
    apellido_nombre = Column(String(250), nullable=False)
    cargo = Column(String(300))
    unidad_adscripcion = Column(String(350))
    estado = Column(String(120))
    municipio = Column(String(120))
    parroquia = Column(String(120))
    centro_votacion = Column(String(500))
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
