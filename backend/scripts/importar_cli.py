"""
Script de importación por línea de comandos (CLI)
Uso: python backend/scripts/importar_cli.py [ruta_al_archivo.xlsx]
"""
import sys
import os

# Agregar directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal, init_db
from app.importer import process_full_excel


def main():
    if len(sys.argv) < 2:
        archivo = "test_personal_minjuventud.xlsx"
        print(f"No se especificó archivo. Usando archivo de prueba: {archivo}")
    else:
        archivo = sys.argv[1]

    if not os.path.exists(archivo):
        print(f"Error: El archivo '{archivo}' no existe.")
        sys.exit(1)

    print(f"--- Iniciando importación masiva de: {archivo} ---")
    
    # Asegurar que las tablas existan
    init_db()

    with open(archivo, "rb") as f:
        file_bytes = f.read()

    db = SessionLocal()
    try:
        resultado = process_full_excel(file_bytes, db)
        print("\n=== RESUMEN DE PROCESAMIENTO ===")
        print(f"Total registros procesados: {resultado['total_procesados']}")
        print(f"Total insertados / actualizados: {resultado['total_insertados']}")
        print(f"Total errores: {resultado['total_errores']}")
        print("\n--- Balance por Hoja ---")
        for h in resultado['hojas']:
            print(f"  * {h['hoja']}: {h['insertados']} cargados | {h['errores']} errores")
            for err in h.get('detalles_errores', []):
                print(f"      - {err}")
    finally:
        db.close()

    print("\n¡Proceso finalizado con éxito!")


if __name__ == "__main__":
    main()
