import logging
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.importer import process_full_excel
from app.schemas import ImportResponse
from app.auth import get_current_user

logger = logging.getLogger("minjuventud-upload")
router = APIRouter(prefix="/api/upload", tags=["Carga Masiva"])

# Límite máximo de carga en memoria: 60 MB
MAX_UPLOAD_SIZE = 60 * 1024 * 1024


@router.post("", response_model=ImportResponse)
async def upload_excel(
    file: UploadFile = File(...),
    ente: str = Form("MINISTERIO DE LA JUVENTUD"),
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user)
):
    fname = (file.filename or "").strip()
    fname_lower = fname.lower()

    if not (fname_lower.endswith(".xlsx") or fname_lower.endswith(".xls")):
        logger.warning(f"[UPLOAD REJECTED] Formato no permitido para archivo: '{fname}'")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de archivo inválido. Por favor cargue un archivo Excel (.xlsx o .xls)."
        )

    try:
        contents = await file.read()
        file_size = len(contents)

        if file_size > MAX_UPLOAD_SIZE:
            logger.warning(f"[UPLOAD REJECTED] Archivo '{fname}' excede tamaño máximo ({file_size} bytes)")
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="El archivo excede el tamaño máximo permitido de 60 MB."
            )

        logger.info(f"[UPLOAD START] Procesando archivo '{fname}' ({round(file_size / 1024 / 1024, 2)} MB) para ente: {ente}")
        res = process_full_excel(contents, db, default_ente=ente)
        logger.info(f"[UPLOAD SUCCESS] Archivo '{fname}' procesado. Insertados: {res.total_insertados}, Actualizados: {res.total_actualizados}, Errores: {res.total_errores}")
        return res
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UPLOAD ERROR] Error procesando archivo '{fname}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al procesar el archivo Excel. Verifique que el archivo no esté corrupto y cumpla con el formato institucional."
        )
