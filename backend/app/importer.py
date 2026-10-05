import io
import re
import logging
import pandas as pd
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.dialects.mysql import insert as mysql_insert
from app.models import Funcionario
from app.database import init_db

logger = logging.getLogger("minjuventud-importer")

CATEGORIAS_VALIDAS = [
    "ALTO NIVEL",
    "CONFIANZA",
    "COMISION",
    "CONTRATADO"
]

COLUMN_MAPPINGS = {
    "numero_orden": ["Nª", "Nº", "N°", "NO", "NUMERO", "N", "NUM"],
    "cedula": ["CEDULA", "CÉDULA", "DOCUMENTO", "CI", "C.I.", "C.I"],
    "apellido_nombre": ["APELLIDO Y NOMBRE", "APELLIDOS Y NOMBRES", "NOMBRE Y APELLIDO", "NOMBRES Y APELLIDOS", "FUNCIONARIO", "NOMBRE"],
    "cargo": ["CARGO", "PUESTO", "CARGO_NOMINAL", "CARGO ACTUAL"],
    "unidad_adscripcion": ["UNIDAD DE ADSCRIPCIÓN", "UNIDAD DE ADSCRIPCION", "ADSCRIPCIÓN", "ADSCRIPCION", "UNIDAD", "DIRECCION"],
    "estado": ["ESTADO", "ENTIDAD", "ESTADO_RESIDENCIA"],
    "municipio": ["MUNICIPIO"],
    "parroquia": ["PARROQUIA"],
    "centro_votacion": ["CENTRO DE VOTACIÓN", "CENTRO DE VOTACION", "CENTRO VOTACION", "CENTRO_VOTACION", "CENTRO ELECTORAL"]
}


def clean_text(val: Any) -> str:
    if val is None or pd.isna(val):
        return ""
    val_str = str(val).strip()
    val_str = re.sub(r'\s+', ' ', val_str)
    return val_str.upper()


def clean_cedula(val: Any) -> str:
    if val is None or pd.isna(val):
        return ""
    val_str = str(val).strip().upper()
    if val_str.endswith(".0"):
        val_str = val_str[:-2]
    # Quitar puntos, comas, guiones y espacios
    val_str = re.sub(r'[\.,\s\-]', '', val_str)
    # Conservar prefijo V/E si viene o sólo dígitos
    match = re.search(r'([VEJ]?\d+)', val_str)
    if match:
        return match.group(1)
    return val_str


def find_column(df_columns: List[str], candidate_keys: List[str]) -> str | None:
    normalized_cols = {re.sub(r'[^A-Z0-9]', '', str(c).upper()): c for c in df_columns}
    for cand in candidate_keys:
        norm_cand = re.sub(r'[^A-Z0-9]', '', cand.upper())
        if norm_cand in normalized_cols:
            return normalized_cols[norm_cand]
    return None


def load_sheet_with_header_detection(excel_file: Any, sheet_name: str) -> pd.DataFrame:
    """
    Carga una hoja de cálculo buscando dinámicamente la fila donde están los encabezados
    (útil cuando el archivo contiene membretes, logos o títulos institucionales en las primeras filas).
    """
    raw_df = pd.read_excel(excel_file, sheet_name=sheet_name, header=None, dtype=str)
    raw_df = raw_df.dropna(how="all")
    if raw_df.empty:
        return raw_df

    header_row_idx = None
    # Buscar en las primeras 25 filas la fila que contiene las columnas clave
    for idx in range(min(25, len(raw_df))):
        row_vals = [str(x).strip().upper() for x in raw_df.iloc[idx].values if pd.notna(x)]
        row_norm = [re.sub(r'[^A-Z0-9]', '', x) for x in row_vals]

        has_cedula = any(
            "CEDULA" in x or "DOCUMENTO" in x or x in ["CI", "C.I.", "C.I"]
            for x in row_norm
        )
        has_nombre = any(
            "APELLIDO" in x or "NOMBRE" in x or "FUNCIONARIO" in x
            for x in row_norm
        )

        if has_cedula and has_nombre:
            header_row_idx = idx
            break

    if header_row_idx is not None:
        headers = raw_df.iloc[header_row_idx].fillna("").astype(str).tolist()
        df = raw_df.iloc[header_row_idx + 1:].copy()
        df.columns = headers
        df = df.dropna(how="all").reset_index(drop=True)
        logger.info(f"Hoja '{sheet_name}': encabezados encontrados en fila {header_row_idx + 1}. Filas de datos: {len(df)}")
        return df

    # Si no se detectó un membrete, usar la primera fila como encabezado estándar
    raw_df.columns = [str(c) for c in raw_df.iloc[0]]
    return raw_df.iloc[1:].dropna(how="all").reset_index(drop=True)


def upsert_records(records: List[Dict[str, Any]], db: Session) -> Tuple[int, int, int, List[str]]:
    """
    Inserta o actualiza un lote de registros con MySQL ON DUPLICATE KEY UPDATE.
    Retorna (insertados, actualizados, errores, lista_errores).
    """
    if not records:
        return 0, 0, 0, []

    inserted_count = 0
    error_count = 0
    detalles_errores = []

    # 1. Asegurar que las tablas existan siempre
    try:
        init_db()
    except Exception as e:
        logger.warning(f"Aviso de init_db: {e}")

    # 2. Desduplicar registros en memoria por (cedula, categoria) para evitar errores en lotes
    dedup_dict = {}
    for r in records:
        key = (r["cedula"], r["categoria"])
        dedup_dict[key] = r
    unique_records = list(dedup_dict.values())

    batch_size = 100
    for i in range(0, len(unique_records), batch_size):
        batch = unique_records[i:i + batch_size]
        try:
            stmt = mysql_insert(Funcionario).values(batch)
            update_dict = {
                "apellido_nombre": stmt.inserted.apellido_nombre,
                "cargo": stmt.inserted.cargo,
                "unidad_adscripcion": stmt.inserted.unidad_adscripcion,
                "estado": stmt.inserted.estado,
                "municipio": stmt.inserted.municipio,
                "parroquia": stmt.inserted.parroquia,
                "centro_votacion": stmt.inserted.centro_votacion,
                "numero_orden": stmt.inserted.numero_orden,
            }
            upsert_stmt = stmt.on_duplicate_key_update(**update_dict)
            db.execute(upsert_stmt)
            db.commit()
            inserted_count += len(batch)
        except Exception as e:
            db.rollback()
            logger.warning(f"Falla en lote de {len(batch)} registros: {e}. Reintentando uno por uno...")
            # Fallback registro a registro para salvar todos los datos posibles
            for item in batch:
                try:
                    s = mysql_insert(Funcionario).values(item)
                    u = {
                        "apellido_nombre": s.inserted.apellido_nombre,
                        "cargo": s.inserted.cargo,
                        "unidad_adscripcion": s.inserted.unidad_adscripcion,
                        "estado": s.inserted.estado,
                        "municipio": s.inserted.municipio,
                        "parroquia": s.inserted.parroquia,
                        "centro_votacion": s.inserted.centro_votacion,
                        "numero_orden": s.inserted.numero_orden,
                    }
                    db.execute(s.on_duplicate_key_update(**u))
                    db.commit()
                    inserted_count += 1
                except Exception as ex_single:
                    db.rollback()
                    error_count += 1
                    err_msg = f"Cédula {item.get('cedula', '?')}: {str(ex_single)}"
                    logger.error(err_msg)
                    if len(detalles_errores) < 15:
                        detalles_errores.append(err_msg)

    return inserted_count, 0, error_count, detalles_errores


def process_excel_sheet(
    df: pd.DataFrame,
    categoria: str,
    db: Session
) -> Tuple[int, int, int, List[str]]:
    """
    Procesa un DataFrame correspondiente a una hoja del Excel.
    """
    insertados = 0
    actualizados = 0
    errores = 0
    detalles_errores = []

    # Identificar columnas
    cols_map = {}
    for standard_col, candidates in COLUMN_MAPPINGS.items():
        found = find_column(list(df.columns), candidates)
        if found:
            cols_map[standard_col] = found

    if "cedula" not in cols_map or "apellido_nombre" not in cols_map:
        columnas_encontradas = [str(c) for c in df.columns[:10]]
        return 0, 0, len(df), [
            f"Hoja '{categoria}': No se encontraron las columnas requeridas (CEDULA, APELLIDO Y NOMBRE). "
            f"Encabezados leídos: {columnas_encontradas}"
        ]

    records_to_upsert = []

    for idx, row in df.iterrows():
        fila_num = idx + 2
        try:
            raw_cedula = row.get(cols_map.get("cedula"))
            cedula_clean = clean_cedula(raw_cedula)
            if not cedula_clean:
                continue  # Fila vacía o sin cédula

            nombre_clean = clean_text(row.get(cols_map.get("apellido_nombre")))
            if not nombre_clean:
                detalles_errores.append(f"Fila {fila_num}: Falta el nombre del funcionario con cédula {cedula_clean}.")
                errores += 1
                continue

            raw_orden = row.get(cols_map.get("numero_orden")) if "numero_orden" in cols_map else None
            numero_orden = None
            if raw_orden is not None and not pd.isna(raw_orden):
                try:
                    numero_orden = int(float(str(raw_orden).strip()))
                except Exception:
                    numero_orden = None

            cargo = clean_text(row.get(cols_map.get("cargo"))) if "cargo" in cols_map else None
            unidad = clean_text(row.get(cols_map.get("unidad_adscripcion"))) if "unidad_adscripcion" in cols_map else None
            estado = clean_text(row.get(cols_map.get("estado"))) if "estado" in cols_map else None
            municipio = clean_text(row.get(cols_map.get("municipio"))) if "municipio" in cols_map else None
            parroquia = clean_text(row.get(cols_map.get("parroquia"))) if "parroquia" in cols_map else None
            centro = clean_text(row.get(cols_map.get("centro_votacion"))) if "centro_votacion" in cols_map else None

            # Límites defensivos para asegurar compatibilidad total con MySQL
            record = {
                "cedula": cedula_clean[:30],
                "categoria": categoria,
                "apellido_nombre": nombre_clean[:250],
                "cargo": cargo[:300] if cargo else None,
                "unidad_adscripcion": unidad[:350] if unidad else None,
                "estado": estado[:120] if estado else None,
                "municipio": municipio[:120] if municipio else None,
                "parroquia": parroquia[:120] if parroquia else None,
                "centro_votacion": centro[:500] if centro else None,
                "numero_orden": numero_orden
            }
            records_to_upsert.append(record)

        except Exception as e:
            errores += 1
            detalles_errores.append(f"Fila {fila_num}: Error al parsear datos - {str(e)}")

    if records_to_upsert:
        ins, act, err_db, detalles_db = upsert_records(records_to_upsert, db)
        insertados = ins
        errores += err_db
        detalles_errores.extend(detalles_db)

    return insertados, actualizados, errores, detalles_errores[:20]


def process_full_excel(file_bytes: bytes, db: Session) -> Dict[str, Any]:
    """
    Lee las 4 pestañas requeridas del archivo Excel detectando membretes institucionales.
    """
    # Garantizar que las tablas existan en MySQL
    try:
        init_db()
    except Exception as e:
        logger.warning(f"init_db check: {e}")

    excel_file = io.BytesIO(file_bytes)
    xl = pd.ExcelFile(excel_file, engine="openpyxl")
    hojas_encontradas = xl.sheet_names

    resultados_hojas = []
    total_proc = 0
    total_ins = 0
    total_act = 0
    total_err = 0

    # Normalizar nombres de hojas encontradas
    sheets_map = {re.sub(r'[^A-Z0-9]', '', h.upper()): h for h in hojas_encontradas}

    for cat in CATEGORIAS_VALIDAS:
        norm_cat = re.sub(r'[^A-Z0-9]', '', cat)
        sheet_name = sheets_map.get(norm_cat)

        if not sheet_name:
            resultados_hojas.append({
                "hoja": cat,
                "total_leidos": 0,
                "insertados": 0,
                "actualizados": 0,
                "errores": 1,
                "detalles_errores": [f"La pestaña '{cat}' no fue encontrada en el archivo."]
            })
            total_err += 1
            continue

        try:
            df = load_sheet_with_header_detection(excel_file, sheet_name)
            ins, act, err, detalles = process_excel_sheet(df, cat, db)

            total_hoja = len(df)
            total_proc += total_hoja
            total_ins += ins
            total_act += act
            total_err += err

            resultados_hojas.append({
                "hoja": cat,
                "total_leidos": total_hoja,
                "insertados": ins,
                "actualizados": act,
                "errores": err,
                "detalles_errores": detalles
            })
        except Exception as e:
            total_err += 1
            resultados_hojas.append({
                "hoja": cat,
                "total_leidos": 0,
                "insertados": 0,
                "actualizados": 0,
                "errores": 1,
                "detalles_errores": [f"Error al procesar hoja: {str(e)}"]
            })

    mensaje = f"Procesamiento finalizado. {total_ins} registros cargados exitosamente." if total_ins > 0 else "No se pudieron insertar registros. Revise los detalles de error."

    return {
        "success": total_ins > 0,
        "mensaje": mensaje,
        "total_procesados": total_proc,
        "total_insertados": total_ins,
        "total_actualizados": total_act,
        "total_errores": total_err,
        "hojas": resultados_hojas
    }
