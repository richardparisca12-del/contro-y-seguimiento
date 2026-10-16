import os
import time
import threading
import logging
from datetime import datetime

from app.database import SessionLocal
from app.services.reporte_consulta_excel import generar_libro_reporte_completo

logger = logging.getLogger("minjuventud-scheduler")

CARPETA_REPORTES = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "reportes_horarios")
)
os.makedirs(CARPETA_REPORTES, exist_ok=True)

_scheduler_running = False
_scheduler_thread = None


def obtener_fecha_inicio_programada() -> datetime:
    """Retorna la fecha y hora configurada para el inicio de la generación automática."""
    fecha_env = os.getenv("AUTO_REPORTE_FECHA_INICIO", "2026-10-18 06:00:00").strip().replace('"', '').replace("'", "")
    try:
        return datetime.strptime(fecha_env, "%Y-%m-%d %H:%M:%S")
    except Exception:
        return datetime(2026, 10, 18, 6, 0, 0)


def obtener_fecha_fin_programada() -> datetime:
    """Retorna la fecha y hora configurada para el cierre de la generación automática (12:00 am del 19/10/2026)."""
    fecha_env = os.getenv("AUTO_REPORTE_FECHA_FIN", "2026-10-19 00:00:00").strip().replace('"', '').replace("'", "")
    try:
        return datetime.strptime(fecha_env, "%Y-%m-%d %H:%M:%S")
    except Exception:
        return datetime(2026, 10, 19, 0, 0, 0)


def obtener_estado_scheduler() -> dict:
    """Devuelve el estado de programación del scheduler para la interfaz."""
    fecha_inicio = obtener_fecha_inicio_programada()
    fecha_fin = obtener_fecha_fin_programada()
    now = datetime.now()

    if now < fecha_inicio:
        estado = "en_espera"
        activo_generando = False
        segundos_restantes = max(0, int((fecha_inicio - now).total_seconds()))
    elif now < fecha_fin:
        estado = "activo"
        activo_generando = True
        segundos_restantes = 0
    else:
        estado = "finalizado"
        activo_generando = False
        segundos_restantes = 0

    horas_restantes = round(segundos_restantes / 3600, 1)

    return {
        "fecha_inicio_iso": fecha_inicio.strftime("%Y-%m-%d %H:%M:%S"),
        "fecha_inicio_legible": "Domingo 18 de Octubre de 2026 a las 06:00 a. m.",
        "fecha_fin_iso": fecha_fin.strftime("%Y-%m-%d %H:%M:%S"),
        "fecha_fin_legible": "Lunes 19 de Octubre de 2026 a las 12:00 a. m. (Medianoche)",
        "estado": estado,
        "generacion_automatica_activa": activo_generando,
        "horas_restantes_para_inicio": horas_restantes,
        "modo_manual_disponible": True
    }


def ejecutar_corte_horario(razon: str = "programado"):
    """
    Genera y almacena el archivo Excel del corte horario actual.
    Puede ser ejecutado en cualquier momento de forma manual o según el horario programado.
    """
    db = SessionLocal()
    try:
        now = datetime.now()
        timestamp_str = now.strftime("%Y-%m-%d_%H-00")
        filename = f"Reporte_Consulta_{timestamp_str}.xlsx"
        filepath = os.path.join(CARPETA_REPORTES, filename)

        wb = generar_libro_reporte_completo(db)
        wb.save(filepath)
        logger.info(f"[SCHEDULER] Corte horario generado exitosamente ({razon}): {filename}")
        print(f"[+] [SCHEDULER] Archivo Excel guardado en: {filepath}")
        return filename
    except Exception as e:
        logger.error(f"[SCHEDULER] Error al generar corte horario: {e}", exc_info=True)
        return None
    finally:
        db.close()


def _ciclo_scheduler():
    global _scheduler_running
    logger.info("[SCHEDULER] Hilo de generación de reportes horarios iniciado.")
    
    fecha_inicio = obtener_fecha_inicio_programada()
    fecha_fin = obtener_fecha_fin_programada()
    logger.info(
        f"[SCHEDULER] Generación horaria automática programada desde {fecha_inicio.strftime('%Y-%m-%d %H:%M:%S')} "
        f"hasta el cierre del {fecha_fin.strftime('%Y-%m-%d %H:%M:%S')}"
    )

    ultimo_corte_hora = -1

    while _scheduler_running:
        try:
            now = datetime.now()

            # La generación automática opera únicamente dentro de la ventana programada
            if fecha_inicio <= now < fecha_fin:
                # Cada hora en punto (minuto 0) que no se haya procesado
                if now.minute == 0 and now.hour != ultimo_corte_hora:
                    ultimo_corte_hora = now.hour
                    ejecutar_corte_horario(razon=f"programado_{now.hour}:00")

            # Revisión periódica cada 30 segundos
            time.sleep(30)
        except Exception as e:
            logger.error(f"[SCHEDULER] Excepción en ciclo de reloj: {e}")
            time.sleep(30)


def iniciar_scheduler():
    global _scheduler_running, _scheduler_thread
    if not _scheduler_running:
        _scheduler_running = True
        _scheduler_thread = threading.Thread(target=_ciclo_scheduler, daemon=True, name="ReporteHorarioScheduler")
        _scheduler_thread.start()
        logger.info("[SCHEDULER] Programador de reportes en segundo plano activado.")


def detener_scheduler():
    global _scheduler_running
    _scheduler_running = False
