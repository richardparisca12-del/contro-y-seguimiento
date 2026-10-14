import io
import re
import logging
import unicodedata
import pandas as pd
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.dialects.mysql import insert as mysql_insert
from app.models import Funcionario
from app.database import init_db

logger = logging.getLogger("minjuventud-importer")

CATEGORIAS_BASE = [
    "ALTO NIVEL",
    "CONFIANZA",
    "COMISION",
    "CONTRATADO"
]

SHEET_ALIASES = {
    "ALTO NIVEL": ["ALTO NIVEL", "ALTONIVEL", "DIRECTIVOS", "DIRECTIVO"],
    "CONFIANZA": ["CONFIANZA", "CONFIANFA", "PERSONAL DE CONFIANZA", "EMPLEADOS DE CONFIANZA"],
    "COMISION": ["COMISION", "COMISION DE SERVICIO", "COMISIONES", "COMISION DE SERVICIOS"],
    "CONTRATADO": ["CONTRATADO", "CONTRATADOS", "PERSONAL CONTRATADO"],
    "OBRERO": ["OBRERO", "OBREROS", "PERSONAL OBRERO", "NOMINA OBRERA"]
}

COLUMN_MAPPINGS = {
    "numero_orden": ["Nª", "Nº", "N°", "NO", "NUMERO", "N", "NUM", "ITEM"],
    "cedula": ["CEDULA", "CÉDULA", "DOCUMENTO", "CI", "C.I.", "C.I", "IDENTIDAD", "CEDULA DE IDENTIDAD"],
    "apellido_nombre": [
        "APELLIDO Y NOMBRE", "APELLIDOS Y NOMBRES", "APELLIDO Y NOMBRES", "APELLIDOS Y NOMBRE",
        "NOMBRE Y APELLIDO", "NOMBRES Y APELLIDOS", "FUNCIONARIO", "TRABAJADOR", "NOMBRE", "NOMBRES"
    ],
    "cargo": ["CARGO", "PUESTO", "CARGO_NOMINAL", "CARGO ACTUAL", "DENOMINACION"],
    "unidad_adscripcion": [
        "UNIDAD DE ADSCRIPCIÓN", "UNIDAD DE ADSCRIPCION", "ADSCRIPCIÓN", "ADSCRIPCION",
        "UNIDAD", "DIRECCION", "DEPARTAMENTO", "DPTO", "GERENCIA", "AREA", "COORDINACION", "OFICINA"
    ],
    "estado": ["ESTADO", "ENTIDAD", "ESTADO_RESIDENCIA", "ESTADO DONDE VOTA"],
    "municipio": ["MUNICIPIO", "MUNICIPIO DONDE VOTA"],
    "parroquia": ["PARROQUIA", "PARROQUIA DONDE VOTA"],
    "centro_votacion": [
        "CENTRO DE VOTACIÓN", "CENTRO DE VOTACION", "CENTRO VOTACION", "CENTRO_VOTACION",
        "CENTRO ELECTORAL", "LUGAR DE VOTACION", "CENTRO"
    ],
    "ente": ["ENTE", "INSTITUCION", "INSTITUCIÓN", "ORGANISMO", "ENTE ADSCRITO", "ENTIDAD ADSCRITA"]
}


def normalize_key(text: Any) -> str:
    """
    Normaliza una cadena eliminando acentos/diacríticos y caracteres no alfanuméricos,
    convirtiéndola a mayúsculas para comparaciones robustas.
    Ejemplo: 'Cédula' -> 'CEDULA', '  UNIDAD DE ADSCRIPCIÓN  ' -> 'UNIDADDEADSCRIPCION'
    """
    if text is None or pd.isna(text):
        return ""
    s = str(text).strip()
    s = unicodedata.normalize('NFKD', s).encode('ASCII', 'ignore').decode('utf-8')
    return re.sub(r'[^A-Z0-9]', '', s.upper())


def clean_text(val: Any) -> str:
    if val is None or pd.isna(val):
        return ""
    val_str = str(val).strip()
    val_str = re.sub(r'\s+', ' ', val_str)
    return val_str.upper()


def clean_ente(val: Any, default_ente: str = "MINISTERIO DE LA JUVENTUD") -> str:
    target = ""
    if val is not None and not pd.isna(val) and str(val).strip():
        target = str(val).strip().upper()
    elif default_ente:
        target = str(default_ente).strip().upper()

    if "INJ" in target or "INSTITUTO" in target:
        return "INJ"
    return "MINISTERIO DE LA JUVENTUD"


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
    """
    Busca una columna en df_columns comparando con las claves candidatas,
    primero por igualdad exacta de clave normalizada y luego por contención.
    """
    cols_norm = {normalize_key(c): c for c in df_columns if normalize_key(c)}

    # 1. Búsqueda exacta de candidato normalizado
    for cand in candidate_keys:
        nc = normalize_key(cand)
        if nc in cols_norm:
            return cols_norm[nc]

    # 2. Búsqueda por contención
    for cand in candidate_keys:
        nc = normalize_key(cand)
        if not nc or len(nc) < 3:
            continue
        for col_k, orig in cols_norm.items():
            if len(col_k) < 3:
                continue
            if nc in col_k or col_k in nc:
                return orig

    return None


def resolve_sheet_name(cat: str, sheets_in_file: List[str]) -> str | None:
    """
    Encuentra el nombre exacto de la pestaña dentro del archivo Excel
    utilizando alias y normalización de texto (ej. 'CONFIANFA' -> 'CONFIANZA').
    """
    aliases = SHEET_ALIASES.get(cat, [cat])
    norm_sheets = {normalize_key(s): s for s in sheets_in_file}

    # Búsqueda exacta
    for alias in aliases:
        na = normalize_key(alias)
        if na in norm_sheets:
            return norm_sheets[na]

    # Búsqueda por contención
    for alias in aliases:
        na = normalize_key(alias)
        if not na or len(na) < 4:
            continue
        for ns, orig in norm_sheets.items():
            if na in ns or ns in na:
                return orig

    return None


def load_sheet_with_header_detection(excel_file: Any, sheet_name: str) -> pd.DataFrame:
    """
    Carga una hoja de cálculo buscando dinámicamente la fila donde están los encabezados reales
    (supera membretes institucionales, títulos, logos o filas decorativas).
    """
    raw_df = pd.read_excel(excel_file, sheet_name=sheet_name, header=None, dtype=str)
    raw_df = raw_df.dropna(how="all")
    if raw_df.empty:
        return raw_df

    def _has_keys(values) -> bool:
        row_norm = [normalize_key(x) for x in values if pd.notna(x)]
        has_cedula = any(
            "CEDULA" in x or "DOCUMENTO" in x or "IDENTIDAD" in x or x in ["CI", "DNI", "CED"]
            for x in row_norm
        )
        has_nombre = any(
            "APELLIDO" in x or "NOMBRE" in x or "FUNCIONARIO" in x or "TRABAJADOR" in x
            for x in row_norm
        )
        return has_cedula and has_nombre

    raw_df = raw_df.reset_index(drop=True)
    max_scan = min(100, len(raw_df))
    header_row_idx = None
    n_header_rows = 1

    # 1. Encabezado en una sola fila
    for idx in range(max_scan):
        if _has_keys(raw_df.iloc[idx].values):
            header_row_idx = idx
            break

    # 2. Encabezado partido en dos filas consecutivas (celdas combinadas)
    if header_row_idx is None:
        for idx in range(max_scan - 1):
            a = raw_df.iloc[idx].values
            b = raw_df.iloc[idx + 1].values
            merged = [
                f"{'' if pd.isna(x) else x} {'' if pd.isna(y) else y}".strip()
                for x, y in zip(a, b)
            ]
            if _has_keys(merged):
                header_row_idx = idx
                n_header_rows = 2
                break

    if header_row_idx is not None:
        if n_header_rows == 2:
            a = raw_df.iloc[header_row_idx].values
            b = raw_df.iloc[header_row_idx + 1].values
            headers = [
                f"{'' if pd.isna(x) else x} {'' if pd.isna(y) else y}".strip()
                for x, y in zip(a, b)
            ]
        else:
            headers = [str(c).strip() for c in raw_df.iloc[header_row_idx].fillna("").values]
        df = raw_df.iloc[header_row_idx + n_header_rows:].copy()
        df.columns = headers
        df = df.dropna(how="all").reset_index(drop=True)
        logger.info(f"Hoja '{sheet_name}': encabezados detectados en fila {header_row_idx + 1}. Filas de datos: {len(df)}")
        return df

    logger.warning(f"Hoja '{sheet_name}': no se detectaron encabezados. Primeras filas: {raw_df.head(5).values.tolist()}")

    # Fallback: primera fila con más de una celda con datos
    for idx in range(max_scan):
        if raw_df.iloc[idx].notna().sum() > 1:
            raw_df.columns = [str(c).strip() if pd.notna(c) else "" for c in raw_df.iloc[idx]]
            return raw_df.iloc[idx + 1:].dropna(how="all").reset_index(drop=True)
    raw_df.columns = [str(c).strip() for c in raw_df.iloc[0]]
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

    # 2. Desduplicar registros en memoria por (cedula, categoria, ente) para evitar errores en lotes
    dedup_dict = {}
    for r in records:
        target_ente = clean_ente(r.get("ente"), "MINISTERIO DE LA JUVENTUD")
        r["ente"] = target_ente
        key = (r["cedula"], r["categoria"], target_ente)
        dedup_dict[key] = r
    unique_records = list(dedup_dict.values())

    # Reasignar ente a funcionarios existentes si se está reimportando bajo un nuevo ente
    try:
        for r in unique_records:
            db.query(Funcionario).filter(
                Funcionario.cedula == r["cedula"],
                Funcionario.categoria == r["categoria"],
                Funcionario.ente != r["ente"]
            ).update({"ente": r["ente"]}, synchronize_session=False)
        db.commit()
    except Exception as e_reassign:
        db.rollback()
        logger.warning(f"Aviso en sincronización de entes: {e_reassign}")

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
                "ente": stmt.inserted.ente,
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
                        "ente": s.inserted.ente,
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
    db: Session,
    default_ente: str = "MINISTERIO DE LA JUVENTUD"
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

            # Ente: de la columna o del ente por defecto seleccionado en la importación
            raw_ente = row.get(cols_map.get("ente")) if "ente" in cols_map else None
            ente_clean = clean_ente(raw_ente, default_ente=default_ente)

            # Límites defensivos para asegurar compatibilidad total con MySQL
            record = {
                "cedula": cedula_clean[:30],
                "categoria": categoria,
                "ente": ente_clean[:100],
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


def process_full_excel(file_bytes: bytes, db: Session, default_ente: str = "MINISTERIO DE LA JUVENTUD") -> Dict[str, Any]:
    """
    Lee las pestañas del archivo Excel detectando membretes institucionales,
    normalizando tildes y mapeando alias comunes (ej. CONFIANFA -> CONFIANZA, OBRERO).
    """
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

    # Categorías a procesar: las 4 base, más OBRERO si la pestaña está presente en el Excel
    categorias_a_procesar = list(CATEGORIAS_BASE)
    obrero_sheet = resolve_sheet_name("OBRERO", hojas_encontradas)
    if obrero_sheet:
        categorias_a_procesar.append("OBRERO")

    for cat in categorias_a_procesar:
        sheet_name = resolve_sheet_name(cat, hojas_encontradas)

        if not sheet_name:
            resultados_hojas.append({
                "hoja": cat,
                "total_leidos": 0,
                "insertados": 0,
                "actualizados": 0,
                "errores": 1,
                "detalles_errores": [f"La pestaña '{cat}' no fue encontrada en el archivo. Pestañas disponibles: {hojas_encontradas}"]
            })
            total_err += 1
            continue

        try:
            df = load_sheet_with_header_detection(excel_file, sheet_name)
            ins, act, err, detalles = process_excel_sheet(df, cat, db, default_ente=default_ente)

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
                "detalles_errores": [f"Error al procesar hoja '{sheet_name}': {str(e)}"]
            })

    mensaje = (
        f"Procesamiento finalizado. {total_ins} registros cargados exitosamente para {default_ente}."
        if total_ins > 0
        else "No se pudieron insertar registros. Revise los detalles de error."
    )

    return {
        "success": total_ins > 0,
        "mensaje": mensaje,
        "total_procesados": total_proc,
        "total_insertados": total_ins,
        "total_actualizados": total_act,
        "total_errores": total_err,
        "hojas": resultados_hojas
    }
