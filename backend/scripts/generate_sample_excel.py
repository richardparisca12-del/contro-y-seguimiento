"""
Generador de archivo Excel de prueba con las 4 pestañas requeridas
para validar la carga masiva y filtros del sistema MinJuventud.
"""
import pandas as pd
import os

ESTADOS_MUNICIPIOS = {
    "DISTRITO CAPITAL": [("LIBERTADOR", "EL RECREO", "LICEO ANDRÉS BELLO"), ("LIBERTADOR", "SUCRE", "UNIDAD EDUCATIVA CATIA")],
    "MIRANDA": [("SUCRE", "PETARE", "ESCUELA BÁSICA NACIONAL MARIANO PICÓN SALAS"), ("CHACAO", "CHACAO", "COLEGIO HUMBOLDT")],
    "CARABOBO": [("VALENCIA", "SAN JOSÉ", "LICEO PEDRO GUAL"), ("NAGUANAGUA", "NAGUANAGUA", "COMPLEJO EDUCATIVO BÁRBULA")],
    "ZULIA": [("MARACAIBO", "CHIQUINQUIRÁ", "GRUPO ESCOLAR ZULIA"), ("SAN FRANCISCO", "SAN FRANCISCO", "COLEGIO FE Y ALEGRÍA")],
    "ANZOÁTEGUI": [("SIMÓN BOLÍVAR", "BARCELONA", "LICEO BRICENO MÉNDEZ"), ("SOTILLO", "PUERTO LA CRUZ", "ESCUELA CARACAS")]
}

UNIDADES = [
    "DESPACHO DEL MINISTRO",
    "DIRECCIÓN GENERAL DE RECURSOS HUMANOS",
    "DIRECCIÓN DE PLANIFICACIÓN Y PRESUPUESTO",
    "VICEMINISTERIO PARA LA JUVENTUD PRODUCTIVA",
    "VICEMINISTERIO DE ORGANIZACIÓN Y PARTICIPACIÓN JUVENIL",
    "DIRECCIÓN DE COMUNICACIÓN Y RELACIONES INSTITUCIONALES",
    "OFICINA DE TECNOLOGÍA DE LA INFORMACIÓN Y COMUNICACIÓN"
]

def generate_sample_excel(output_path="test_personal_minjuventud.xlsx"):
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        # 1. ALTO NIVEL
        df_alto = pd.DataFrame([
            {
                "Nª": 1,
                "CEDULA": "V-14235890",
                "APELLIDO Y NOMBRE": "GARCÍA RODRÍGUEZ, MARCOS ANTONIO",
                "CARGO": "DIRECTOR GENERAL",
                "UNIDAD DE ADSCRIPCIÓN": "DESPACHO DEL MINISTRO",
                "ESTADO": "DISTRITO CAPITAL",
                "MUNICIPIO": "LIBERTADOR",
                "PARROQUIA": "EL RECREO",
                "CENTRO DE VOTACIÓN": "LICEO ANDRÉS BELLO"
            },
            {
                "Nª": 2,
                "CEDULA": "V-15894120",
                "APELLIDO Y NOMBRE": "MENDOZA SILVA, VALENTINA ANDREINA",
                "CARGO": "VICEMINISTRA",
                "UNIDAD DE ADSCRIPCIÓN": "VICEMINISTERIO PARA LA JUVENTUD PRODUCTIVA",
                "ESTADO": "MIRANDA",
                "MUNICIPIO": "CHACAO",
                "PARROQUIA": "CHACAO",
                "CENTRO DE VOTACIÓN": "COLEGIO HUMBOLDT"
            },
            {
                "Nª": 3,
                "CEDULA": "V-12450892",
                "APELLIDO Y NOMBRE": "ZAMBRANO PÉREZ, RAFAEL EDUARDO",
                "CARGO": "DIRECTOR DE LÍNEA",
                "UNIDAD DE ADSCRIPCIÓN": "DIRECCIÓN DE PLANIFICACIÓN Y PRESUPUESTO",
                "ESTADO": "DISTRITO CAPITAL",
                "MUNICIPIO": "LIBERTADOR",
                "PARROQUIA": "SUCRE",
                "CENTRO DE VOTACIÓN": "UNIDAD EDUCATIVA CATIA"
            }
        ])
        df_alto.to_excel(writer, sheet_name="ALTO NIVEL", index=False)

        # 2. CONFIANZA
        df_confianza = pd.DataFrame([
            {
                "Nª": 1,
                "CEDULA": "V-18756321",
                "APELLIDO Y NOMBRE": "HERNÁNDEZ CASTILLO, SOFÍA CAROLINA",
                "CARGO": "ASESOR TÉCNICO I",
                "UNIDAD DE ADSCRIPCIÓN": "DESPACHO DEL MINISTRO",
                "ESTADO": "DISTRITO CAPITAL",
                "MUNICIPIO": "LIBERTADOR",
                "PARROQUIA": "EL RECREO",
                "CENTRO DE VOTACIÓN": "LICEO ANDRÉS BELLO"
            },
            {
                "Nª": 2,
                "CEDULA": "V-19852360",
                "APELLIDO Y NOMBRE": "BLANCO TORRES, DIEGO JOSÉ",
                "CARGO": "COORDINADOR DE PROYECTOS",
                "UNIDAD DE ADSCRIPCIÓN": "VICEMINISTERIO DE ORGANIZACIÓN Y PARTICIPACIÓN JUVENIL",
                "ESTADO": "CARABOBO",
                "MUNICIPIO": "VALENCIA",
                "PARROQUIA": "SAN JOSÉ",
                "CENTRO DE VOTACIÓN": "LICEO PEDRO GUAL"
            },
            {
                "Nª": 3,
                "CEDULA": "V-20145698",
                "APELLIDO Y NOMBRE": "RIVAS MORALES, GABRIELA BEATRIZ",
                "CARGO": "AUDITORA INTERNA",
                "UNIDAD DE ADSCRIPCIÓN": "DIRECCIÓN GENERAL DE RECURSOS HUMANOS",
                "ESTADO": "MIRANDA",
                "MUNICIPIO": "SUCRE",
                "PARROQUIA": "PETARE",
                "CENTRO DE VOTACIÓN": "ESCUELA BÁSICA NACIONAL MARIANO PICÓN SALAS"
            }
        ])
        df_confianza.to_excel(writer, sheet_name="CONFIANZA", index=False)

        # 3. COMISION
        df_comision = pd.DataFrame([
            {
                "Nª": 1,
                "CEDULA": "V-16321458",
                "APELLIDO Y NOMBRE": "QUINTERO ALVAREZ, JAVIER ENRIQUE",
                "CARGO": "ESPECIALISTA EN ESTADÍSTICA JUVENIL",
                "UNIDAD DE ADSCRIPCIÓN": "DIRECCIÓN DE PLANIFICACIÓN Y PRESUPUESTO",
                "ESTADO": "ANZOÁTEGUI",
                "MUNICIPIO": "SIMÓN BOLÍVAR",
                "PARROQUIA": "BARCELONA",
                "CENTRO DE VOTACIÓN": "LICEO BRICENO MÉNDEZ"
            },
            {
                "Nª": 2,
                "CEDULA": "V-17894562",
                "APELLIDO Y NOMBRE": "DELGADO ROJAS, MARIANA ISABEL",
                "CARGO": "ENLACE REGIONAL OCCIDENTE",
                "UNIDAD DE ADSCRIPCIÓN": "VICEMINISTERIO DE ORGANIZACIÓN Y PARTICIPACIÓN JUVENIL",
                "ESTADO": "ZULIA",
                "MUNICIPIO": "MARACAIBO",
                "PARROQUIA": "CHIQUINQUIRÁ",
                "CENTRO DE VOTACIÓN": "GRUPO ESCOLAR ZULIA"
            }
        ])
        df_comision.to_excel(writer, sheet_name="COMISION", index=False)

        # 4. CONTRATADO
        df_contratado = pd.DataFrame([
            {
                "Nª": 1,
                "CEDULA": "V-24589632",
                "APELLIDO Y NOMBRE": "PAREDES GUZMÁN, CARLOS ALBERTO",
                "CARGO": "ANALISTA DE SISTEMAS",
                "UNIDAD DE ADSCRIPCIÓN": "OFICINA DE TECNOLOGÍA DE LA INFORMACIÓN Y COMUNICACIÓN",
                "ESTADO": "DISTRITO CAPITAL",
                "MUNICIPIO": "LIBERTADOR",
                "PARROQUIA": "EL RECREO",
                "CENTRO DE VOTACIÓN": "LICEO ANDRÉS BELLO"
            },
            {
                "Nª": 2,
                "CEDULA": "V-25120369",
                "APELLIDO Y NOMBRE": "RAMÍREZ SÁNCHEZ, DANIELA CAROLINA",
                "CARGO": "ASISTENTE ADMINISTRATIVO",
                "UNIDAD DE ADSCRIPCIÓN": "DIRECCIÓN GENERAL DE RECURSOS HUMANOS",
                "ESTADO": "MIRANDA",
                "MUNICIPIO": "SUCRE",
                "PARROQUIA": "PETARE",
                "CENTRO DE VOTACIÓN": "ESCUELA BÁSICA NACIONAL MARIANO PICÓN SALAS"
            },
            {
                "Nª": 3,
                "CEDULA": "V-26895412",
                "APELLIDO Y NOMBRE": "CAMPOS FUENTES, ALEJANDRO JOSÉ",
                "CARGO": "DISEÑADOR GRÁFICO",
                "UNIDAD DE ADSCRIPCIÓN": "DIRECCIÓN DE COMUNICACIÓN Y RELACIONES INSTITUCIONALES",
                "ESTADO": "CARABOBO",
                "MUNICIPIO": "NAGUANAGUA",
                "PARROQUIA": "NAGUANAGUA",
                "CENTRO DE VOTACIÓN": "COMPLEJO EDUCATIVO BÁRBULA"
            },
            {
                "Nª": 4,
                "CEDULA": "V-27412589",
                "APELLIDO Y NOMBRE": "MEDINA FLORES, ANDREA PAOLA",
                "CARGO": "PROMOTOR JUVENIL",
                "UNIDAD DE ADSCRIPCIÓN": "VICEMINISTERIO DE ORGANIZACIÓN Y PARTICIPACIÓN JUVENIL",
                "ESTADO": "ZULIA",
                "MUNICIPIO": "SAN FRANCISCO",
                "PARROQUIA": "SAN FRANCISCO",
                "CENTRO DE VOTACIÓN": "COLEGIO FE Y ALEGRÍA"
            }
        ])
        df_contratado.to_excel(writer, sheet_name="CONTRATADO", index=False)

    print(f"Archivo generado exitosamente en: {output_path}")

if __name__ == "__main__":
    generate_sample_excel()
