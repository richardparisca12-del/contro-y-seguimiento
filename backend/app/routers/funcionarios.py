from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, distinct
from typing import Optional, List
from app.database import get_db
from app.models import Funcionario
from app.schemas import PaginatedFuncionarios, FuncionarioResponse, FilterOptions, FuncionarioCreate, FuncionarioUpdate
from app.auth import get_current_user

router = APIRouter(prefix="/api/funcionarios", tags=["Funcionarios"])


@router.get("", response_model=PaginatedFuncionarios)
def get_funcionarios(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Búsqueda por cédula o nombre"),
    categoria: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    municipio: Optional[str] = Query(None),
    parroquia: Optional[str] = Query(None),
    unidad_adscripcion: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user)
):
    query = db.query(Funcionario)

    if search:
        s = f"%{search.strip().upper()}%"
        query = query.filter(
            or_(
                Funcionario.cedula.ilike(s),
                Funcionario.apellido_nombre.ilike(s),
                Funcionario.cargo.ilike(s)
            )
        )

    if categoria:
        query = query.filter(Funcionario.categoria == categoria)
    if estado:
        query = query.filter(Funcionario.estado == estado)
    if municipio:
        query = query.filter(Funcionario.municipio == municipio)
    if parroquia:
        query = query.filter(Funcionario.parroquia == parroquia)
    if unidad_adscripcion:
        query = query.filter(Funcionario.unidad_adscripcion == unidad_adscripcion)

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    records = query.order_by(Funcionario.categoria, Funcionario.numero_orden, Funcionario.apellido_nombre)\
                   .offset((page - 1) * page_size)\
                   .limit(page_size)\
                   .all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "data": records
    }


@router.get("/filters", response_model=FilterOptions)
def get_filter_options(
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user)
):
    """Devuelve listas únicas para llenar selectores de filtros."""
    categorias = [
        row[0] for row in db.query(distinct(Funcionario.categoria))
        .filter(Funcionario.categoria.isnot(None))
        .order_by(Funcionario.categoria).all()
    ]
    estados = [
        row[0] for row in db.query(distinct(Funcionario.estado))
        .filter(Funcionario.estado.isnot(None), Funcionario.estado != "")
        .order_by(Funcionario.estado).all()
    ]
    municipios = [
        row[0] for row in db.query(distinct(Funcionario.municipio))
        .filter(Funcionario.municipio.isnot(None), Funcionario.municipio != "")
        .order_by(Funcionario.municipio).all()
    ]
    parroquias = [
        row[0] for row in db.query(distinct(Funcionario.parroquia))
        .filter(Funcionario.parroquia.isnot(None), Funcionario.parroquia != "")
        .order_by(Funcionario.parroquia).all()
    ]
    unidades = [
        row[0] for row in db.query(distinct(Funcionario.unidad_adscripcion))
        .filter(Funcionario.unidad_adscripcion.isnot(None), Funcionario.unidad_adscripcion != "")
        .order_by(Funcionario.unidad_adscripcion).all()
    ]

    return {
        "categorias": categorias,
        "estados": estados,
        "municipios": municipios,
        "parroquias": parroquias,
        "unidades": unidades
    }


@router.get("/{id}", response_model=FuncionarioResponse)
def get_funcionario(
    id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user)
):
    funcionario = db.query(Funcionario).filter(Funcionario.id == id).first()
    if not funcionario:
        raise HTTPException(status_code=404, detail="Funcionario no encontrado")
    return funcionario


@router.post("", response_model=FuncionarioResponse)
def create_funcionario(
    payload: FuncionarioCreate,
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user)
):
    # Verificar si ya existe con esa cédula y categoría
    existente = db.query(Funcionario).filter(
        Funcionario.cedula == payload.cedula.strip().upper(),
        Funcionario.categoria == payload.categoria
    ).first()
    if existente:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un funcionario registrado con cédula {payload.cedula} en la categoría {payload.categoria}."
        )

    nuevo = Funcionario(
        cedula=payload.cedula.strip().upper(),
        categoria=payload.categoria,
        apellido_nombre=payload.apellido_nombre.strip().upper(),
        cargo=payload.cargo.strip().upper() if payload.cargo else None,
        unidad_adscripcion=payload.unidad_adscripcion.strip().upper() if payload.unidad_adscripcion else None,
        estado=payload.estado.strip().upper() if payload.estado else None,
        municipio=payload.municipio.strip().upper() if payload.municipio else None,
        parroquia=payload.parroquia.strip().upper() if payload.parroquia else None,
        centro_votacion=payload.centro_votacion.strip().upper() if payload.centro_votacion else None,
        numero_orden=payload.numero_orden
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id}", response_model=FuncionarioResponse)
def update_funcionario(
    id: int,
    payload: FuncionarioUpdate,
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user)
):
    funcionario = db.query(Funcionario).filter(Funcionario.id == id).first()
    if not funcionario:
        raise HTTPException(status_code=404, detail="Funcionario no encontrado")

    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None and isinstance(value, str):
            value = value.strip().upper()
        setattr(funcionario, field, value)

    db.commit()
    db.refresh(funcionario)
    return funcionario


@router.delete("/{id}")
def delete_funcionario(
    id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user)
):
    funcionario = db.query(Funcionario).filter(Funcionario.id == id).first()
    if not funcionario:
        raise HTTPException(status_code=404, detail="Funcionario no encontrado")
    db.delete(funcionario)
    db.commit()
    return {"message": "Funcionario eliminado exitosamente"}

