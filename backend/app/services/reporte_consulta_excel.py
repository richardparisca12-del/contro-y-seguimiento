import os
import re
import unicodedata
from datetime import datetime, date
from typing import Dict, List, Optional
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_

from app.models import Funcionario

ESTADOS_ORDEN_OFICIAL = [
    "AMAZONAS",
    "ANZOATEGUI",
    "APURE",
    "ARAGUA",
    "BARINAS",
    "BOLIVAR",
    "CARABOBO",
    "CARACAS",
    "COJEDES",
    "DELTA AMACURO",
    "FALCON",
    "GUARICO",
    "GUAYANA ESEQUIBA",
    "LARA",
    "LA GUAIRA",
    "MERIDA",
    "MIRANDA",
    "MONAGAS",
    "NUEVA ESPARTA",
    "PORTUGUESA",
    "SUCRE",
    "TACHIRA",
    "TRUJILLO",
    "YARACUY",
    "ZULIA"
]

HORAS_SLOTS = [
    ("10:00 a. m.", 10),
    ("11:00 a. m.", 11),
    ("12:00 p. m.", 12),
    ("1:00 p. m.", 13),
    ("2:00 p. m.", 14),
    ("3:00 p. m.", 15),
    ("4:00 p. m.", 16),
    ("5:00 p. m.", 17),
    ("6:00 p. m.", 18),
]


def normalizar_texto(texto: Optional[str]) -> str:
    if not texto:
        return ""
    s = str(texto).strip().upper()
    s = unicodedata.normalize('NFKD', s).encode('ASCII', 'ignore').decode('utf-8')
    s = re.sub(r'\s+', ' ', s)
    return s


def normalizar_estado(estado_raw: Optional[str]) -> str:
    norm = normalizar_texto(estado_raw)
    if not norm:
        return "CARACAS"
    if "DISTRITO" in norm or "CAPITAL" in norm or "CARACAS" in norm or "LIBERTADOR" in norm:
        return "CARACAS"
    if "VARGAS" in norm or "GUAIRA" in norm:
        return "LA GUAIRA"
    if "ANZOATEGUI" in norm:
        return "ANZOATEGUI"
    if "BOLIVAR" in norm:
        return "BOLIVAR"
    if "FALCON" in norm:
        return "FALCON"
    if "GUARICO" in norm:
        return "GUARICO"
    if "MERIDA" in norm:
        return "MERIDA"
    if "TACHIRA" in norm:
        return "TACHIRA"
    if "NUEVA" in norm or "ESPARTA" in norm or "MARGARITA" in norm:
        return "NUEVA ESPARTA"
    if "DELTA" in norm or "AMACURO" in norm:
        return "DELTA AMACURO"
    if "ESEQUIB" in norm:
        return "GUAYANA ESEQUIBA"

    for est in ESTADOS_ORDEN_OFICIAL:
        if est in norm or norm in est:
            return est
    return "CARACAS"


def clasificar_slot_hora(hora_int: int) -> int:
    """Retorna el índice del slot (0 a 8) según la hora militar (0-23)."""
    if hora_int <= 10:
        return 0  # 10:00 a. m. (incluye madrugadores)
    elif hora_int == 11:
        return 1  # 11:00 a. m.
    elif hora_int == 12:
        return 2  # 12:00 p. m.
    elif hora_int == 13:
        return 3  # 1:00 p. m.
    elif hora_int == 14:
        return 4  # 2:00 p. m.
    elif hora_int == 15:
        return 5  # 3:00 p. m.
    elif hora_int == 16:
        return 6  # 4:00 p. m.
    elif hora_int == 17:
        return 7  # 5:00 p. m.
    else:
        return 8  # 6:00 p. m. (incluye cierre vespertino/nocturno)


def obtener_datos_participacion_por_ente(db: Session, ente_filtro: Optional[str] = None):
    """
    Calcula:
    - total_movilizar por estado
    - votos_por_hora por estado (lista de 9 posiciones)
    """
    query = db.query(Funcionario)
    if ente_filtro:
        if ente_filtro == "INJ":
            query = query.filter(
                or_(
                    Funcionario.ente == "INJ",
                    Funcionario.ente.ilike("%INJ%"),
                    Funcionario.ente.ilike("%INSTITUTO%")
                )
            )
        else:
            query = query.filter(
                or_(
                    Funcionario.ente == "MINISTERIO DE LA JUVENTUD",
                    and_(
                        Funcionario.ente.notilike("%INJ%"),
                        Funcionario.ente.notilike("%INSTITUTO%")
                    )
                )
            )

    todos = query.all()

    # Estructura: estado -> {"movilizar": int, "horas": [0]*9}
    stats_por_estado = {est: {"movilizar": 0, "horas": [0] * 9} for est in ESTADOS_ORDEN_OFICIAL}

    for f in todos:
        est = normalizar_estado(f.estado)
        if est not in stats_por_estado:
            est = "CARACAS"
        stats_por_estado[est]["movilizar"] += 1

        # Verificar si participó o actualizó centro de votación
        participo = bool(f.participo_consulta) or bool(f.fecha_hora_voto)
        if participo:
            dt = f.fecha_hora_voto or f.updated_at or f.created_at
            if dt:
                hora = dt.hour
            else:
                hora = 10
            slot_idx = clasificar_slot_hora(hora)
            stats_por_estado[est]["horas"][slot_idx] += 1

    return stats_por_estado


def aplicar_estilos_celda(cell, font=None, fill=None, alignment=None, border=None):
    if font:
        cell.font = font
    if fill:
        cell.fill = fill
    if alignment:
        cell.alignment = alignment
    if border:
        cell.border = border


def agregar_hoja_reporte(
    wb: openpyxl.Workbook,
    sheet_name: str,
    titulo_ente: str,
    ente_col_val: str,
    titulo_jornada: str,
    stats_data: Dict[str, dict]
):
    ws = wb.create_sheet(title=sheet_name)
    ws.views.sheetView[0].showGridLines = True

    # Paleta de colores oficial MinJuventud / Plantilla
    FONT_FAMILY = "Calibri"
    font_header_ente = Font(name=FONT_FAMILY, size=14, bold=True, color="1F497D")
    font_banner = Font(name=FONT_FAMILY, size=11, bold=True, color="FFFFFF")
    font_col_header = Font(name=FONT_FAMILY, size=9, bold=True, color="000000")
    font_col_header_white = Font(name=FONT_FAMILY, size=9, bold=True, color="FFFFFF")
    font_data = Font(name=FONT_FAMILY, size=10, bold=False, color="000000")
    font_data_bold = Font(name=FONT_FAMILY, size=10, bold=True, color="000000")
    font_total = Font(name=FONT_FAMILY, size=10, bold=True, color="FFFFFF")

    fill_banner = PatternFill(start_color="2F5597", end_color="2F5597", fill_type="solid")
    fill_header_base = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")
    fill_header_hours_group = PatternFill(start_color="B4C6E7", end_color="B4C6E7", fill_type="solid")
    fill_hours_yellow = PatternFill(start_color="FFFF00", end_color="FFFF00", fill_type="solid")
    fill_totals_header = PatternFill(start_color="203764", end_color="203764", fill_type="solid")
    fill_totals_row = PatternFill(start_color="2F5597", end_color="2F5597", fill_type="solid")

    thin_border = Border(
        left=Side(style="thin", color="000000"),
        right=Side(style="thin", color="000000"),
        top=Side(style="thin", color="000000"),
        bottom=Side(style="thin", color="000000")
    )

    align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    align_left = Alignment(horizontal="left", vertical="center")
    align_right = Alignment(horizontal="right", vertical="center")

    # Fila 1: Título Ente Centrado (ej. REPORTE INJ o REPORTE MINISTERIO)
    ws.merge_cells("C1:M1")
    cell_r1 = ws["C1"]
    cell_r1.value = titulo_ente
    cell_r1.font = font_header_ente
    cell_r1.alignment = align_center
    ws.row_dimensions[1].height = 24

    # Fila 2: Banner de la Jornada
    ws.merge_cells("A2:O2")
    cell_r2 = ws["A2"]
    cell_r2.value = titulo_jornada.upper()
    cell_r2.font = font_banner
    cell_r2.fill = fill_banner
    cell_r2.alignment = align_center
    ws.row_dimensions[2].height = 28
    for col in range(1, 16):
        ws.cell(row=2, column=col).border = thin_border
        ws.cell(row=2, column=col).fill = fill_banner

    # Fila 3 y 4: Encabezados de tabla
    ws.merge_cells("A3:A4")
    ws["A3"] = "N°"
    ws.merge_cells("B3:B4")
    ws["B3"] = "MINISTERIO"
    ws.merge_cells("C3:C4")
    ws["C3"] = "ESTADOS"
    ws.merge_cells("D3:D4")
    ws["D3"] = "CANTIDAD DE\nTRABAJADORES\nA MOVILIZAR"

    # Agrupador de horas (E3:M3)
    ws.merge_cells("E3:M3")
    ws["E3"] = "REPORTE CANT. TRABAJADORES QUE HAN PARTICIPADO EN LA CONSULTA:"

    # Sub-encabezados de horas en Fila 4
    for idx, (lbl, _) in enumerate(HORAS_SLOTS):
        col_idx = 5 + idx
        ws.cell(row=4, column=col_idx, value=lbl)

    # Totales y Porcentajes (N3:N4 y O3:O4)
    ws.merge_cells("N3:N4")
    ws["N3"] = "TOTAL\nPARTICIPACIÓN"
    ws.merge_cells("O3:O4")
    ws["O3"] = "PORCENTAJE\nDE\nPARTICIPACION"

    ws.row_dimensions[3].height = 25
    ws.row_dimensions[4].height = 25

    # Aplicar estilos a cabeceras de Fila 3 y 4
    for c in ["A", "B", "C", "D"]:
        for r in [3, 4]:
            cell = ws[f"{c}{r}"]
            aplicar_estilos_celda(cell, font=font_col_header, fill=fill_header_base, alignment=align_center, border=thin_border)

    # Estilo barra agrupada E3:M3
    for col in range(5, 14):
        cell = ws.cell(row=3, column=col)
        aplicar_estilos_celda(cell, font=font_col_header, fill=fill_header_hours_group, alignment=align_center, border=thin_border)

    # Estilo horas amarillas Fila 4
    for col in range(5, 14):
        cell = ws.cell(row=4, column=col)
        aplicar_estilos_celda(cell, font=font_col_header, fill=fill_hours_yellow, alignment=align_center, border=thin_border)

    # Estilo columnas finales N y O
    for c in ["N", "O"]:
        for r in [3, 4]:
            cell = ws[f"{c}{r}"]
            aplicar_estilos_celda(cell, font=font_col_header_white, fill=fill_totals_header, alignment=align_center, border=thin_border)

    # Filas de Datos (Fila 5 a 29 = 25 Estados)
    start_row = 5
    for i, estado in enumerate(ESTADOS_ORDEN_OFICIAL, start=1):
        row_num = start_row + i - 1
        ws.row_dimensions[row_num].height = 19
        data = stats_data.get(estado, {"movilizar": 0, "horas": [0] * 9})
        movilizar = data["movilizar"]
        horas = data["horas"]

        # A: N°
        cell_num = ws.cell(row=row_num, column=1, value=i)
        aplicar_estilos_celda(cell_num, font=font_data_bold, alignment=align_center, border=thin_border)

        # B: Ente
        cell_ente = ws.cell(row=row_num, column=2, value=ente_col_val)
        aplicar_estilos_celda(cell_ente, font=font_data, alignment=align_center, border=thin_border)

        # C: Estado
        cell_est = ws.cell(row=row_num, column=3, value=f"  {estado}")
        aplicar_estilos_celda(cell_est, font=font_data_bold, alignment=align_left, border=thin_border)

        # D: Cantidad a movilizar
        cell_mov = ws.cell(row=row_num, column=4, value=movilizar)
        aplicar_estilos_celda(cell_mov, font=font_data_bold, alignment=align_center, border=thin_border)
        cell_mov.number_format = '#,##0'

        # E-M: Horas
        for h_idx in range(9):
            col_idx = 5 + h_idx
            val_hora = horas[h_idx]
            # Si es cero, mostrar celda vacía o número según preferencia ministerial (mostramos número o vacío)
            cell_h = ws.cell(row=row_num, column=col_idx, value=val_hora if val_hora > 0 else "")
            aplicar_estilos_celda(cell_h, font=font_data, alignment=align_center, border=thin_border)
            if val_hora > 0:
                cell_h.number_format = '#,##0'

        # N: Total Participación (Fórmula nativa de Excel)
        formula_total = f"=SUM(E{row_num}:M{row_num})"
        cell_tot = ws.cell(row=row_num, column=14, value=formula_total)
        aplicar_estilos_celda(cell_tot, font=font_data_bold, alignment=align_center, border=thin_border)
        cell_tot.number_format = '#,##0'

        # O: Porcentaje de Participación (Fórmula nativa de Excel)
        formula_pct = f"=IF(D{row_num}>0, N{row_num}/D{row_num}, 0)"
        cell_pct = ws.cell(row=row_num, column=15, value=formula_pct)
        aplicar_estilos_celda(cell_pct, font=font_data_bold, alignment=align_center, border=thin_border)
        cell_pct.number_format = '0.00%'

    # Fila de Totales Generales
    total_row = start_row + len(ESTADOS_ORDEN_OFICIAL)
    ws.row_dimensions[total_row].height = 22
    end_data_row = total_row - 1

    ws.merge_cells(f"A{total_row}:C{total_row}")
    cell_tot_lbl = ws.cell(row=total_row, column=1, value="TOTAL GENERAL NACIONAL")
    aplicar_estilos_celda(cell_tot_lbl, font=font_total, fill=fill_totals_row, alignment=align_center, border=thin_border)
    for c in range(2, 4):
        aplicar_estilos_celda(ws.cell(row=total_row, column=c), fill=fill_totals_row, border=thin_border)

    # Suma D (Total movilización)
    cell_tot_mov = ws.cell(row=total_row, column=4, value=f"=SUM(D{start_row}:D{end_data_row})")
    aplicar_estilos_celda(cell_tot_mov, font=font_total, fill=fill_totals_row, alignment=align_center, border=thin_border)
    cell_tot_mov.number_format = '#,##0'

    # Sumas E-M (Por horas)
    for h_idx in range(9):
        col_idx = 5 + h_idx
        col_let = get_column_letter(col_idx)
        cell_h_tot = ws.cell(row=total_row, column=col_idx, value=f"=SUM({col_let}{start_row}:{col_let}{end_data_row})")
        aplicar_estilos_celda(cell_h_tot, font=font_total, fill=fill_totals_row, alignment=align_center, border=thin_border)
        cell_h_tot.number_format = '#,##0'

    # Suma N (Total participación)
    cell_n_tot = ws.cell(row=total_row, column=14, value=f"=SUM(N{start_row}:N{end_data_row})")
    aplicar_estilos_celda(cell_n_tot, font=font_total, fill=fill_totals_row, alignment=align_center, border=thin_border)
    cell_n_tot.number_format = '#,##0'

    # Total O (Porcentaje global)
    cell_o_tot = ws.cell(row=total_row, column=15, value=f"=IF(D{total_row}>0, N{total_row}/D{total_row}, 0)")
    aplicar_estilos_celda(cell_o_tot, font=font_total, fill=fill_totals_row, alignment=align_center, border=thin_border)
    cell_o_tot.number_format = '0.00%'

    # Ajuste de Ancho de Columnas
    anchos = {
        "A": 6,    # N°
        "B": 14,   # MINISTERIO / ENTE
        "C": 24,   # ESTADOS
        "D": 18,   # CANTIDAD A MOVILIZAR
        "E": 12,   # 10:00 a. m.
        "F": 12,   # 11:00 a. m.
        "G": 12,   # 12:00 p. m.
        "H": 12,   # 1:00 p. m.
        "I": 12,   # 2:00 p. m.
        "J": 12,   # 3:00 p. m.
        "K": 12,   # 4:00 p. m.
        "L": 12,   # 5:00 p. m.
        "M": 12,   # 6:00 p. m.
        "N": 16,   # TOTAL PARTICIPACIÓN
        "O": 17    # PORCENTAJE
    }
    for col_let, width in anchos.items():
        ws.column_dimensions[col_let].width = width


def generar_libro_reporte_completo(
    db: Session,
    titulo_jornada: str = "2DA CONSULTA NACIONAL POPULAR 27 DE ABRIL DEL 2025"
) -> openpyxl.Workbook:
    wb = openpyxl.Workbook()
    # Eliminar hoja por defecto
    wb.remove(wb.active)

    # 1. Pestaña Ministerio
    stats_min = obtener_datos_participacion_por_ente(db, ente_filtro="MINISTERIO DE LA JUVENTUD")
    agregar_hoja_reporte(
        wb=wb,
        sheet_name="MINISTERIO",
        titulo_ente="REPORTE MINISTERIO DE LA JUVENTUD",
        ente_col_val="MINISTERIO",
        titulo_jornada=titulo_jornada,
        stats_data=stats_min
    )

    # 2. Pestaña INJ
    stats_inj = obtener_datos_participacion_por_ente(db, ente_filtro="INJ")
    agregar_hoja_reporte(
        wb=wb,
        sheet_name="INJ",
        titulo_ente="REPORTE INJ",
        ente_col_val="INJ",
        titulo_jornada=titulo_jornada,
        stats_data=stats_inj
    )

    # 3. Pestaña Consolidado Nacional
    stats_ambos = {
        est: {
            "movilizar": stats_min[est]["movilizar"] + stats_inj[est]["movilizar"],
            "horas": [stats_min[est]["horas"][h] + stats_inj[est]["horas"][h] for h in range(9)]
        }
        for est in ESTADOS_ORDEN_OFICIAL
    }
    agregar_hoja_reporte(
        wb=wb,
        sheet_name="CONSOLIDADO",
        titulo_ente="REPORTE CONSOLIDADO NACIONAL (MINISTERIO + INJ)",
        ente_col_val="CONSOLIDADO",
        titulo_jornada=titulo_jornada,
        stats_data=stats_ambos
    )

    return wb
