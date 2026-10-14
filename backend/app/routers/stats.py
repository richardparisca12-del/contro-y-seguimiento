from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, and_
from typing import Optional
from app.database import get_db
from app.models import Funcionario
from app.schemas import StatsResponse, CategoryStat, GeoStat
from app.auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["Estadísticas"])


def normalize_ente(ente_val: Optional[str]) -> str:
    if not ente_val:
        return "MINISTERIO DE LA JUVENTUD"
    s = str(ente_val).strip().upper()
    if "INJ" in s or "INSTITUTO" in s:
        return "INJ"
    return "MINISTERIO DE LA JUVENTUD"


def apply_ente_filter(query, ente_str: str):
    ente_norm = normalize_ente(ente_str)
    if ente_norm == "INJ":
        return query.filter(
            or_(
                Funcionario.ente == "INJ",
                Funcionario.ente.ilike("%INJ%"),
                Funcionario.ente.ilike("%INSTITUTO%")
            )
        )
    else:
        return query.filter(
            or_(
                Funcionario.ente == "MINISTERIO DE LA JUVENTUD",
                and_(
                    Funcionario.ente.notilike("%INJ%"),
                    Funcionario.ente.notilike("%INSTITUTO%")
                )
            )
        )


@router.get("", response_model=StatsResponse)
def get_stats(
    ente: Optional[str] = Query(None, description="Filtrar estadísticas por ente"),
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user)
):
    base_query = db.query(Funcionario)
    if ente:
        base_query = apply_ente_filter(base_query, ente)

    total = base_query.with_entities(func.count(Funcionario.id)).scalar() or 0

    # Estadísticas por categoría (respetando filtro de ente si aplica)
    cat_query = db.query(
        Funcionario.categoria,
        func.count(Funcionario.id).label("total")
    )
    if ente:
        cat_query = apply_ente_filter(cat_query, ente)
    cat_results = cat_query.group_by(Funcionario.categoria).all()

    por_categoria = []
    for cat, count in cat_results:
        porcentaje = round((count / total * 100), 2) if total > 0 else 0.0
        por_categoria.append(CategoryStat(categoria=cat, total=count, porcentaje=porcentaje))

    # Estadísticas globales por ente (distribución institucional estricta MinJuventud e INJ)
    ente_query = db.query(
        Funcionario.ente,
        func.count(Funcionario.id).label("total")
    ).group_by(Funcionario.ente).all()

    total_general = db.query(func.count(Funcionario.id)).scalar() or 1
    por_ente_dict = {"MINISTERIO DE LA JUVENTUD": 0, "INJ": 0}
    for e_name, count in ente_query:
        norm = "INJ" if (e_name and ("INJ" in str(e_name).upper() or "INSTITUTO" in str(e_name).upper())) else "MINISTERIO DE LA JUVENTUD"
        por_ente_dict[norm] += count

    por_ente = [
        CategoryStat(
            categoria=k,
            total=v,
            porcentaje=round((v / total_general * 100), 2) if total_general > 0 else 0.0
        )
        for k, v in por_ente_dict.items()
    ]

    # Top 10 estados
    estados_query = db.query(
        Funcionario.estado,
        func.count(Funcionario.id).label("total")
    ).filter(
        Funcionario.estado.isnot(None),
        Funcionario.estado != ""
    )
    if ente:
        estados_query = apply_ente_filter(estados_query, ente)
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
        unidades_query = apply_ente_filter(unidades_query, ente)
    unidades_results = unidades_query.group_by(Funcionario.unidad_adscripcion).order_by(desc("total")).limit(10).all()

    top_unidades = [GeoStat(nombre=uni or "Sin Unidad", total=cnt) for uni, cnt in unidades_results]

    return StatsResponse(
        total_funcionarios=total,
        por_categoria=por_categoria,
        por_ente=por_ente,
        top_estados=top_estados,
        top_unidades=top_unidades
    )
