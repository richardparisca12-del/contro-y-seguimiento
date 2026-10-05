from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class LoginRequest(BaseModel):
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class FuncionarioBase(BaseModel):
    cedula: str
    categoria: str
    apellido_nombre: str
    cargo: Optional[str] = None
    unidad_adscripcion: Optional[str] = None
    estado: Optional[str] = None
    municipio: Optional[str] = None
    parroquia: Optional[str] = None
    centro_votacion: Optional[str] = None
    numero_orden: Optional[int] = None


class FuncionarioCreate(FuncionarioBase):
    pass


class FuncionarioUpdate(BaseModel):
    cedula: Optional[str] = None
    categoria: Optional[str] = None
    apellido_nombre: Optional[str] = None
    cargo: Optional[str] = None
    unidad_adscripcion: Optional[str] = None
    estado: Optional[str] = None
    municipio: Optional[str] = None
    parroquia: Optional[str] = None
    centro_votacion: Optional[str] = None
    numero_orden: Optional[int] = None


class FuncionarioResponse(FuncionarioBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedFuncionarios(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    data: List[FuncionarioResponse]


class SheetReport(BaseModel):
    hoja: str
    total_leidos: int
    insertados: int
    actualizados: int
    errores: int
    detalles_errores: List[str] = []


class ImportResponse(BaseModel):
    success: bool
    mensaje: str
    total_procesados: int
    total_insertados: int
    total_actualizados: int
    total_errores: int
    hojas: List[SheetReport]


class CategoryStat(BaseModel):
    categoria: str
    total: int
    porcentaje: float


class GeoStat(BaseModel):
    nombre: str
    total: int


class StatsResponse(BaseModel):
    total_funcionarios: int
    por_categoria: List[CategoryStat]
    top_estados: List[GeoStat]
    top_unidades: List[GeoStat]


class FilterOptions(BaseModel):
    categorias: List[str]
    estados: List[str]
    municipios: List[str]
    parroquias: List[str]
    unidades: List[str]
