from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from app.database import get_db
from app.models import Funcionario
from app.schemas import StatsResponse, CategoryStat, GeoStat
from app.auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["Estadísticas"])


@router.get("", response_model=StatsResponse)
def get_stats(
    ente: Optional[str] = Query(None, description="Filtrar estadísticas por ente"),
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user)
):
    base_query = db.query(Funcionario)
    if ente:
        base_query = base_query.filter(Funcionario.ente == ente)

    total = base_query.with_entities(func.count(Funcionario.id)).scalar() or 0

    # Estadísticas por categoría (respetando filtro de ente si aplica)
    cat_query = db.query(
        Funcionario.categoria,
        func.count(Funcionario.id).label("total")
    )
    if ente:
        cat_query = cat_query.filter(Funcionario.ente == ente)
    cat_results = cat_query.group_by(Funcionario.categoria).all()

    por_categoria = []
    for cat, count in cat_results:
        porcentaje = round((count / total * 100), 2) if total > 0 else 0.0
        por_categoria.append(CategoryStat(categoria=cat, total=count, porcentaje=porcentaje))

    # Estadísticas globales por ente (distribución institucional)
    ente_query = db.query(
        Funcionario.ente,
        func.count(Funcionario.id).label("total")
    ).group_by(Funcionario.ente).all()

    total_general = db.query(func.count(Funcionario.id)).scalar() or 1
    por_ente = []
    for e_name, count in ente_query:
        nombre_ente = e_name or "MINISTERIO DE LA JUVENTUD"
        porcentaje_e = round((count / total_general * 100), 2)
        por_ente.append(CategoryStat(categoria=nombre_ente, total=count, porcentaje=porcentaje_e))

    # Top 10 estados
    estados_query = db.query(
        Funcionario.estado,
        func.count(Funcionario.id).label("total")
    ).filter(
        Funcionario.estado.isnot(None),
        Funcionario.estado != ""
    )
    if ente:
        estados_query = estados_query.filter(Funcionario.ente == ente)
    estados_results = estados_query.group_by(Funcionario.estado).order_by(desc("total")).limit(10).all()

    top_estados = [GeoStat(nombre=est or "Sin Estado", total=cnt) for est, cnt in estados_results]

    # Top 10 unidades de adscripción
    unidades_query = db.query(
        Funcionario.unidad_adscripcion,
        func.count(Funcionario.id).label("total")
    ).filter(
        Funcionario.unidad_adscripcion.isnot(None),
        Funcionario.unidad_adscripcion != ""
    )
    if ente:
        unidades_query = unidades_query.filter(Funcionario.ente == ente)
    unidades_results = unidades_query.group_by(Funcionario.unidad_adscripcion).order_by(desc("total")).limit(10).all()

    top_unidades = [GeoStat(nombre=uni or "Sin Unidad", total=cnt) for uni, cnt in unidades_results]

    return StatsResponse(
        total_funcionarios=total,
        por_categoria=por_categoria,
        por_ente=por_ente,
        top_estados=top_estados,
        top_unidades=top_unidades
    )
