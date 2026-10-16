import re
import time
import logging
from collections import defaultdict
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.database import get_db
from app.models import Funcionario
from app.schemas import ConsultaRequest, ConsultaResponse, FuncionarioConsultaItem, ConsultaUpdateRequest

logger = logging.getLogger("minjuventud-consulta")

router = APIRouter(prefix="/api/consulta", tags=["Consulta Pública de Cédula"])

# Limitador de tasa simple por IP en memoria para evitar raspado o abuso en producción
_request_counts = defaultdict(list)
MAX_CONSULTAS_PER_MINUTE = 40


def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    # Limpiar timestamps mayores a 60s
    _request_counts[client_ip] = [t for t in _request_counts[client_ip] if now - t < 60]
    if len(_request_counts[client_ip]) >= MAX_CONSULTAS_PER_MINUTE:
        logger.warning(f"[RATE-LIMIT ALARM] IP {client_ip} excedió el límite de {MAX_CONSULTAS_PER_MINUTE} consultas/min.")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Ha superado el límite de consultas permitidas por minuto. Por favor espere un momento."
        )
    _request_counts[client_ip].append(now)


def get_cedula_variants(raw_cedula: str) -> List[str]:
    """Genera variantes comunes de formato para la búsqueda de cédula."""
    clean = raw_cedula.strip().upper()
    # Quitar puntos, comas, guiones y espacios
    clean_no_symbols = re.sub(r'[\.,\s\-]', '', clean)
    
    # Extraer sólo números
    digits_match = re.search(r'\d+', clean_no_symbols)
    if not digits_match:
        return [clean]
    digits = digits_match.group(0)

    # Identificar prefijo si existe
    prefix = ""
    if clean_no_symbols.startswith("V") or "V" in clean:
        prefix = "V"
    elif clean_no_symbols.startswith("E") or "E" in clean:
        prefix = "E"
    elif clean_no_symbols.startswith("J") or "J" in clean:
        prefix = "J"

    variants = set()
    # Con y sin prefijo
    variants.add(digits)
    variants.add(f"V{digits}")
    variants.add(f"V-{digits}")
    variants.add(f"E{digits}")
    variants.add(f"E-{digits}")
    if prefix:
        variants.add(f"{prefix}{digits}")
        variants.add(f"{prefix}-{digits}")
    variants.add(clean_no_symbols)
    variants.add(clean)

    return list(variants)


@router.post("", response_model=ConsultaResponse)
def consultar_cedula(
    payload: ConsultaRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    check_rate_limit(request)
    raw = payload.cedula.strip()
    if not raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe ingresar un número de cédula válido."
        )

    variants = get_cedula_variants(raw)
    
    # Extraer dígitos para búsqueda de respaldo
    digits_match = re.search(r'\d+', raw)
    digits = digits_match.group(0) if digits_match else raw

    # 1. Búsqueda exacta por cualquiera de las variantes
    registros = db.query(Funcionario).filter(Funcionario.cedula.in_(variants)).all()

    # 2. Respaldo: si no encontró, buscar por cédula que termine o contenga los dígitos exactos
    if not registros and len(digits) >= 5:
        registros = db.query(Funcionario).filter(
            or_(
                Funcionario.cedula.like(f"%{digits}"),
                Funcionario.cedula.like(f"%{digits}%")
            )
        ).all()

    if not registros:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La cédula ingresada ({raw}) no se encuentra registrada en la base de datos institucional."
        )

    return {
        "encontrado": True,
        "mensaje": f"Se encontraron {len(registros)} registro(s) para la cédula indicada.",
        "total_registros": len(registros),
        "registros": registros
    }


@router.put("/{funcionario_id}", response_model=FuncionarioConsultaItem)
def actualizar_datos_electorales(
    funcionario_id: int,
    payload: ConsultaUpdateRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    check_rate_limit(request)
    client_ip = request.client.host if request.client else "unknown"

    funcionario = db.query(Funcionario).filter(Funcionario.id == funcionario_id).first()
    if not funcionario:
        logger.warning(f"[CONSULTA-PUT 404] Intento de actualización en funcionario inexistente ID {funcionario_id} desde IP {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El registro del funcionario no fue encontrado."
        )

    # Verificación de integridad / Anti-IDOR: Si el cliente envía cédula, debe coincidir con el registro
    if payload.cedula:
        clean_input = re.sub(r'[\.,\s\-]', '', payload.cedula.strip().upper())
        clean_target = re.sub(r'[\.,\s\-]', '', funcionario.cedula.strip().upper())
        
        # Comparar números o variantes
        input_digits = re.search(r'\d+', clean_input)
        target_digits = re.search(r'\d+', clean_target)
        digits_match = (input_digits and target_digits and input_digits.group(0) == target_digits.group(0))

        if clean_input != clean_target and not digits_match:
            logger.warning(
                f"[IDOR ALERT] Discrepancia de cédula para ID {funcionario_id}. "
                f"Recibida: '{payload.cedula}', Registrada: '{funcionario.cedula}'. IP: {client_ip}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acceso restringido: Los datos de identificación no corresponden a este registro."
            )

    logger.info(f"[AUDIT-UPDATE] Actualización autorizada para Funcionario ID {funcionario_id} (CI: {funcionario.cedula}) desde IP: {client_ip}")

    # Permitir ÚNICAMENTE modificar Estado, Municipio, Parroquia, Centro de Votación
    if payload.estado is not None:
        funcionario.estado = payload.estado.strip().upper() if payload.estado.strip() else None

    if payload.municipio is not None:
        funcionario.municipio = payload.municipio.strip().upper() if payload.municipio.strip() else None

    if payload.parroquia is not None:
        funcionario.parroquia = payload.parroquia.strip().upper() if payload.parroquia.strip() else None

    if payload.centro_votacion is not None:
        cv_clean = payload.centro_votacion.strip().upper() if payload.centro_votacion.strip() else None
        funcionario.centro_votacion = cv_clean
        if cv_clean:
            funcionario.participo_consulta = True
            if not funcionario.fecha_hora_voto:
                funcionario.fecha_hora_voto = func.now()

    if payload.confirma_voto:
        funcionario.participo_consulta = True
        if not funcionario.fecha_hora_voto:
            funcionario.fecha_hora_voto = func.now()

    db.commit()
    db.refresh(funcionario)

    return funcionario
