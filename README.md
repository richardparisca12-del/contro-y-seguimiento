# Sistema de Seguimiento, Consulta y Reporte — MinJuventud

Sistema web para el control de personal del **Ministerio del Poder Popular para la Juventud**, con procesamiento automatizado de archivos Excel en 4 categorías laborales, normalización de datos, filtros geográficos cruzados, buscador rápido, visualizaciones estadísticas y reportes descargables en tiempo real.

---

## 🚀 Inicio Rápido (1 Clic)

Haga doble clic en el archivo:
```text
iniciar_sistema.bat
```
Este script:
1. Inicia el motor MySQL (XAMPP MariaDB) si no está activo.
2. Inicia la API Backend (FastAPI en `http://127.0.0.1:8000`).
3. Inicia la interfaz Frontend (React + Vite en `http://localhost:5173`).
4. Abre automáticamente su navegador web predeterminado.

> **Contraseña de Acceso al Sistema:** `admin123`

---

## 🐳 Despliegue con Docker (Servidor o Producción)

El proyecto incluye configuración completa para **Docker y Docker Compose**, adaptado para no entrar en conflicto con puertos ya utilizados en su servidor:

* **Iniciar en 1 Clic (Windows):** Ejecute [`iniciar_docker.bat`](file:///c:/Users/rparisca/Documents/control-y-seguimiento/iniciar_docker.bat)
* **Iniciar en Linux / VPS:**
  ```bash
  chmod +x iniciar_docker.sh && ./iniciar_docker.sh
  ```
  O directamente con:
  ```bash
  docker compose up -d --build
  ```

### Puertos en Docker
* **Frontend Web (Nginx + React):** [http://localhost:3085](http://localhost:3085)
* **Backend API (FastAPI):** [http://localhost:8005/docs](http://localhost:8005/docs)
* **MySQL Interno:** Red aislada `minjuventud_network` (puerto externo: `33065`).
* *(Variables editables en [`.env.docker`](file:///c:/Users/rparisca/Documents/control-y-seguimiento/.env.docker))*.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Base de Datos** | **MySQL / MariaDB** | Base de datos relacional local (`minjuventud`), con tabla `funcionarios` e índices en cédula, categoría y territorio. |
| **Backend** | **Python 3.12 + FastAPI** | API REST rápida y tipada con SQLAlchemy 2.0, PyMySQL y JWT. |
| **Procesamiento** | **pandas + openpyxl** | Limpieza de strings, normalización de cédula y upsert masivo por `(cedula, categoria)`. |
| **Frontend** | **React + Vite** | Interfaz moderna con diseño institucional, glassmorphism, temas oscuros y gráficos interactivos. |
| **Métricas** | **Recharts** | Distribución porcentual por categoría y gráficos de concentración por Estado y Unidad de Adscripción. |
| **Exportación** | **xlsx + jsPDF (AutoTable)** | Generación y descarga de nóminas en Excel y reportes formales con membrete ministerial en PDF. |

---

## 📊 Estructura del Archivo Excel de Origen

El sistema procesa archivos `.xlsx` o `.xls` estructurados en **4 pestañas obligatorias**:
1. `ALTO NIVEL`
2. `CONFIANZA`
3. `COMISION`
4. `CONTRATADO`

Todas las pestañas contienen las columnas estándar:
* **Nª** (Número de orden)
* **CEDULA** (Identificación única del funcionario, ej: `V-14235890`, `14.235.890`)
* **APELLIDO Y NOMBRE** (Nombre completo)
* **CARGO** (Denominación del puesto)
* **UNIDAD DE ADSCRIPCIÓN** (Despacho, Viceministerio o Dirección)
* **ESTADO** (Entidad federal)
* **MUNICIPIO**
* **PARROQUIA**
* **CENTRO DE VOTACIÓN** (Centro electoral asignado)

---

## 📥 Módulos y Funcionalidades

### 1. Carga Masiva (Excel)
* **Desde la Interfaz Web:** Clic en el botón **"Carga Masiva Excel"** en la barra superior. Arrastre su archivo `.xlsx` y presione **"Iniciar Procesamiento"**. Al finalizar, verá un balance individual por cada una de las 4 pestañas.
* **Desde la Terminal (CLI):**
  ```bash
  python backend/scripts/importar_cli.py test_personal_minjuventud.xlsx
  ```

### 2. Panel de Indicadores y Filtros
* **Tarjetas Superiores:** Muestran el total de nómina y el balance porcentual de cada una de las 4 categorías. Haga clic en cualquiera de las tarjetas para filtrar la tabla al instante.
* **Gráficos Estadísticos:** Visualice la composición porcentual y cambie entre **Top Estados** y **Top Unidades de Adscripción**.
* **Buscador Rápido:** Encuentre funcionarios al instante por número de cédula, apellido o cargo.
* **Filtros Geográficos Cruzados:** Filtrado dependiente o independiente por **Categoría**, **Estado**, **Municipio**, **Parroquia** y **Unidad de Adscripción**.
* **Ficha del Funcionario:** Al hacer clic sobre cualquier fila de la tabla se abre su ficha detallada laboral, geográfica y electoral.

### 3. Generación de Reportes
* **Exportar Excel:** Descarga la vista activa con todas las columnas formateadas.
* **Exportar PDF:** Emite un reporte oficial landscape con cintillo ministerial, fecha de emisión, lista de filtros aplicados y numeración de páginas.

---

## ⚙️ Configuración Manual (Opcional)

Si desea ejecutar backend y frontend por separado:

### Backend
```bash
cd backend
# Variables en backend/.env (por defecto: DB_HOST=127.0.0.1, DB_NAME=minjuventud, SYSTEM_PASSWORD=admin123)
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm run dev
```
Acceda a: `http://localhost:5173`
