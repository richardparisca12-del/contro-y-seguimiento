from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.importer import process_full_excel
from app.schemas import ImportResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/upload", tags=["Carga Masiva"])


@router.post("", response_model=ImportResponse)
async def upload_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user)
):
    if not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de archivo inválido. Por favor cargue un archivo Excel (.xlsx o .xls)."
        )

    try:
        contents = await file.read()
        res = process_full_excel(contents, db)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error durante el procesamiento del archivo: {str(e)}"
        )
