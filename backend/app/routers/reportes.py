import os
import io
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, Response, status
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.auth import get_current_user
from app.services.reporte_consulta_excel import (
    generar_libro_reporte_completo,
    obtener_datos_participacion_por_ente,
    ESTADOS_ORDEN_OFICIAL,
    HORAS_SLOTS
)
from app.services.scheduler import obtener_estado_scheduler

router = APIRouter(prefix="/api/reportes", tags=["Reportes Electorales de Consulta"])

CARPETA_REPORTES = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "reportes_horarios")
)
os.makedirs(CARPETA_REPORTES, exist_ok=True)


@router.get("/consulta-excel")
def descargar_reporte_excel(
    ente: Optional[str] = Query(None, description="MINISTERIO, INJ o None para consolidado"),
    titulo: Optional[str] = Query("2DA CONSULTA NACIONAL POPULAR 27 DE ABRIL DEL 2025"),
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user)
):
    """
    Genera en vivo y descarga el libro Excel con formato institucional,
    fórmulas de sumas y porcentajes para Ministerio e INJ.
    """
    wb = generar_libro_reporte_completo(db, titulo_jornada=titulo)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    now_str = datetime.now().strftime("%Y-%m-%d_%H-%M")
    filename = f"Reporte_Consulta_MinJuventud_{now_str}.xlsx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/consulta-stats-resumen")
def obtener_resumen_participacion(
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user)
):
    """
    Retorna métricas clave consolidadas para visualización en el panel administrativo.
    """
    stats_min = obtener_datos_participacion_por_ente(db, ente_filtro="MINISTERIO DE LA JUVENTUD")
    stats_inj = obtener_datos_participacion_por_ente(db, ente_filtro="INJ")

    def resumir_ente(stats_dict):
        total_mov = sum(v["movilizar"] for v in stats_dict.values())
        horas_acum = [sum(v["horas"][h] for v in stats_dict.values()) for h in range(9)]
        total_part = sum(horas_acum)
        porcentaje = round((total_part / total_mov * 100), 2) if total_mov > 0 else 0.0
        return {
            "total_movilizar": total_mov,
            "total_participacion": total_part,
            "porcentaje_participacion": porcentaje,
            "horas": horas_acum
        }

    res_min = resumir_ente(stats_min)
    res_inj = resumir_ente(stats_inj)

    total_mov_nal = res_min["total_movilizar"] + res_inj["total_movilizar"]
    total_part_nal = res_min["total_participacion"] + res_inj["total_participacion"]
    pct_nal = round((total_part_nal / total_mov_nal * 100), 2) if total_mov_nal > 0 else 0.0
    horas_nal = [res_min["horas"][h] + res_inj["horas"][h] for h in range(9)]

    # Top estados por participación nacional
    estados_resumen = []
    for est in ESTADOS_ORDEN_OFICIAL:
        m = stats_min[est]["movilizar"] + stats_inj[est]["movilizar"]
        p = sum(stats_min[est]["horas"]) + sum(stats_inj[est]["horas"])
        pct = round((p / m * 100), 1) if m > 0 else 0.0
        estados_resumen.append({
            "estado": est,
            "movilizar": m,
            "participacion": p,
            "porcentaje": pct
        })

    estados_resumen.sort(key=lambda x: x["participacion"], reverse=True)

    labels_horas = [lbl for lbl, _ in HORAS_SLOTS]

    return {
        "jornada": "2DA CONSULTA NACIONAL POPULAR 27 DE ABRIL DEL 2025",
        "labels_horas": labels_horas,
        "ministerio": res_min,
        "inj": res_inj,
        "consolidado": {
            "total_movilizar": total_mov_nal,
            "total_participacion": total_part_nal,
            "porcentaje_participacion": pct_nal,
            "horas": horas_nal
        },
        "top_estados": estados_resumen[:8],
        "scheduler": obtener_estado_scheduler()
    }


@router.get("/horarios-disponibles")
def listar_reportes_horarios(_user: dict = Depends(get_current_user)):
    """
    Retorna la lista de archivos Excel generados automáticamente cada hora en el servidor.
    """
    archivos = []
    if os.path.exists(CARPETA_REPORTES):
        for f in os.listdir(CARPETA_REPORTES):
            if f.endswith(".xlsx"):
                fpath = os.path.join(CARPETA_REPORTES, f)
                stat = os.stat(fpath)
                archivos.append({
                    "nombre": f,
                    "tamano_kb": round(stat.st_size / 1024, 1),
                    "fecha_creacion": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
                    "url_descarga": f"/api/reportes/horarios/{f}"
                })
    archivos.sort(key=lambda x: x["fecha_creacion"], reverse=True)
    return {"total": len(archivos), "archivos": archivos}


@router.get("/horarios/{filename}")
def descargar_reporte_horario_guardado(
    filename: str,
    _user: dict = Depends(get_current_user)
):
    """
    Descarga un corte horario previamente generado y archivado.
    """
    # Evitar directory traversal
    safe_filename = os.path.basename(filename)
    fpath = os.path.join(CARPETA_REPORTES, safe_filename)
    if not os.path.exists(fpath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El reporte solicitado no existe o fue archivado."
        )
    return FileResponse(
        path=fpath,
        filename=safe_filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@router.post("/generar-corte-manual")
def generar_corte_manual_ahora(
    titulo: Optional[str] = Query("2DA CONSULTA NACIONAL POPULAR 27 DE ABRIL DEL 2025"),
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user)
):
    """
    Permite al administrador forzar la creación inmediata del archivo de corte horario actual.
    """
    wb = generar_libro_reporte_completo(db, titulo_jornada=titulo)
    now_str = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"Reporte_Consulta_{now_str}.xlsx"
    filepath = os.path.join(CARPETA_REPORTES, filename)
    wb.save(filepath)

    return {
        "success": True,
        "mensaje": "Corte de reporte generado exitosamente.",
        "archivo": filename,
        "ruta": filepath
    }
