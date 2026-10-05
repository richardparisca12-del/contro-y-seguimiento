import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsCards from './components/StatsCards';
import ChartsSection from './components/ChartsSection';
import FiltersBar from './components/FiltersBar';
import FuncionariosTable from './components/FuncionariosTable';
import FuncionarioDetailModal from './components/FuncionarioDetailModal';
import CreateFuncionarioModal from './components/CreateFuncionarioModal';
import UploadModal from './components/UploadModal';
import Login from './components/Login';
import { statsApi, funcionariosApi } from './api';
import { exportToExcel, exportToPdf } from './utils/exportUtils';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('minjuventud_token');
  });

  const [stats, setStats] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    categorias: [],
    estados: [],
    municipios: [],
    parroquias: [],
    unidades: []
  });

  const [filters, setFilters] = useState({
    search: '',
    categoria: '',
    estado: '',
    municipio: '',
    parroquia: '',
    unidad_adscripcion: ''
  });

  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modales
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);

  // Logout listener
  useEffect(() => {
    const handleLogout = () => setIsAuthenticated(false);
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  // Carga inicial de estadísticas y opciones de filtros
  const loadStatsAndOptions = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [statsRes, filtersRes] = await Promise.all([
        statsApi.getStats(),
        funcionariosApi.getFilterOptions()
      ]);
      setStats(statsRes.data);
      setFilterOptions(filtersRes.data);
    } catch (err) {
      console.error('Error al cargar estadísticas o filtros:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadStatsAndOptions();
  }, [loadStatsAndOptions]);

  // Carga de lista de funcionarios con filtros y paginación
  const loadFuncionarios = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        search: filters.search || undefined,
        categoria: filters.categoria || undefined,
        estado: filters.estado || undefined,
        municipio: filters.municipio || undefined,
        parroquia: filters.parroquia || undefined,
        unidad_adscripcion: filters.unidad_adscripcion || undefined,
      };

      const res = await funcionariosApi.getFuncionarios(params);
      setFuncionarios(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch (err) {
      console.error('Error al cargar funcionarios:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page, pageSize, filters]);

  useEffect(() => {
    loadFuncionarios();
  }, [loadFuncionarios]);

  // Manejador de cambio de filtros individuales
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reiniciar a página 1 al filtrar
  };

  // Manejador de selección de categoría desde las tarjetas superiores
  const handleSelectCategoria = (catName) => {
    handleFilterChange('categoria', catName);
  };

  // Restablecer filtros
  const handleResetFilters = () => {
    setFilters({
      search: '',
      categoria: '',
      estado: '',
      municipio: '',
      parroquia: '',
      unidad_adscripcion: ''
    });
    setPage(1);
  };

  // Exportar a Excel (todos los registros que coinciden con los filtros actuales)
  const handleExportExcel = async () => {
    try {
      // Pedir hasta 10000 registros para exportar todo el conjunto filtrado
      const params = {
        page: 1,
        page_size: 10000,
        search: filters.search || undefined,
        categoria: filters.categoria || undefined,
        estado: filters.estado || undefined,
        municipio: filters.municipio || undefined,
        parroquia: filters.parroquia || undefined,
        unidad_adscripcion: filters.unidad_adscripcion || undefined,
      };
      const res = await funcionariosApi.getFuncionarios(params);
      const dataToExport = res.data.data || [];
      exportToExcel(dataToExport);
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      // Fallback a los datos actuales
      exportToExcel(funcionarios);
    }
  };

  // Exportar a PDF con membrete
  const handleExportPdf = async () => {
    try {
      const params = {
        page: 1,
        page_size: 10000,
        search: filters.search || undefined,
        categoria: filters.categoria || undefined,
        estado: filters.estado || undefined,
        municipio: filters.municipio || undefined,
        parroquia: filters.parroquia || undefined,
        unidad_adscripcion: filters.unidad_adscripcion || undefined,
      };
      const res = await funcionariosApi.getFuncionarios(params);
      const dataToExport = res.data.data || [];
      exportToPdf(dataToExport, filters, stats ? stats.total_funcionarios : 0);
    } catch (err) {
      console.error('Error al exportar a PDF:', err);
      exportToPdf(funcionarios, filters, stats ? stats.total_funcionarios : 0);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('minjuventud_token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        onOpenUpload={() => setUploadModalOpen(true)}
        onOpenCreate={() => setCreateModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="container" style={{ flex: 1, paddingBottom: '40px' }}>
        {/* Tarjetas de Métricas por Categoría */}
        <StatsCards
          stats={stats}
          selectedCategoria={filters.categoria}
          onSelectCategoria={handleSelectCategoria}
        />

        {/* Gráficos de Distribución */}
        <ChartsSection stats={stats} />

        {/* Buscador y Filtros Avanzados */}
        <FiltersBar
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
          totalResultados={total}
        />

        {/* Tabla de Personal */}
        <FuncionariosTable
          funcionarios={funcionarios}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          onSelectFuncionario={setSelectedFuncionario}
        />
      </main>

      {/* Modal de Carga Masiva */}
      {uploadModalOpen && (
        <UploadModal
          onClose={() => setUploadModalOpen(false)}
          onSuccess={() => {
            loadStatsAndOptions();
            loadFuncionarios();
          }}
        />
      )}

      {/* Modal de Nuevo Funcionario */}
      {createModalOpen && (
        <CreateFuncionarioModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            loadStatsAndOptions();
            loadFuncionarios();
          }}
        />
      )}

      {/* Modal de Ficha Detallada y Edición */}
      {selectedFuncionario && (
        <FuncionarioDetailModal
          funcionario={selectedFuncionario}
          onClose={() => setSelectedFuncionario(null)}
          onUpdated={() => {
            loadStatsAndOptions();
            loadFuncionarios();
          }}
        />
      )}
    </div>
  );
}
