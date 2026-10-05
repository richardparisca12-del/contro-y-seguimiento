from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app.models import Funcionario
from app.schemas import StatsResponse, CategoryStat, GeoStat
from app.auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["Estadísticas"])


@router.get("", response_model=StatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user)
):
    total = db.query(func.count(Funcionario.id)).scalar() or 0

    # Estadísticas por categoría
    cat_query = db.query(
        Funcionario.categoria,
        func.count(Funcionario.id).label("total")
    ).group_by(Funcionario.categoria).all()

    por_categoria = []
    for cat, count in cat_query:
        porcentaje = round((count / total * 100), 2) if total > 0 else 0.0
        por_categoria.append(CategoryStat(categoria=cat, total=count, porcentaje=porcentaje))

    # Top 10 estados
    estados_query = db.query(
        Funcionario.estado,
        func.count(Funcionario.id).label("total")
    ).filter(
        Funcionario.estado.isnot(None),
        Funcionario.estado != ""
    ).group_by(Funcionario.estado).order_by(desc("total")).limit(10).all()

    top_estados = [GeoStat(nombre=est or "Sin Estado", total=cnt) for est, cnt in estados_query]

    # Top 10 unidades de adscripción
    unidades_query = db.query(
        Funcionario.unidad_adscripcion,
        func.count(Funcionario.id).label("total")
    ).filter(
        Funcionario.unidad_adscripcion.isnot(None),
        Funcionario.unidad_adscripcion != ""
    ).group_by(Funcionario.unidad_adscripcion).order_by(desc("total")).limit(10).all()

    top_unidades = [GeoStat(nombre=uni or "Sin Unidad", total=cnt) for uni, cnt in unidades_query]

    return StatsResponse(
        total_funcionarios=total,
        por_categoria=por_categoria,
        top_estados=top_estados,
        top_unidades=top_unidades
    )
