import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsCards from './components/StatsCards';
import ChartsSection from './components/ChartsSection';
import FiltersBar from './components/FiltersBar';
import FuncionariosTable from './components/FuncionariosTable';
import FuncionarioDetailModal from './components/FuncionarioDetailModal';
import CreateFuncionarioModal from './components/CreateFuncionarioModal';
import UploadModal from './components/UploadModal';
import ClearDataModal from './components/ClearDataModal';
import ReporteHorarioModal from './components/ReporteHorarioModal';
import Login from './components/Login';
import ConsultaCedulaView from './components/ConsultaCedulaView';
import { statsApi, funcionariosApi } from './api';
import { exportToExcel, exportToPdf } from './utils/exportUtils';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('minjuventud_token');
  });

  const checkCurrentRoute = () => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const isAnalytics = path === '/analytics' || path.startsWith('/analytics/') || hash === '#analytics' || hash === '#admin';
    const isLogin = path === '/login' || hash === '#login';

    if (isAnalytics) {
      return localStorage.getItem('minjuventud_token') ? 'analytics' : 'login';
    }
    if (isLogin) {
      return 'login';
    }
    return 'consulta';
  };

  // Vista activa: 'consulta' en / (sin enlaces a analytics), 'analytics' en /analytics
  const [currentView, setCurrentView] = useState(checkCurrentRoute);

  const [stats, setStats] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    entes: [],
    categorias: [],
    estados: [],
    municipios: [],
    parroquias: [],
    unidades: []
  });

  const [filters, setFilters] = useState({
    search: '',
    ente: '',
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
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [reporteModalOpen, setReporteModalOpen] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);

  // Listener para sincronizar URL (/analytics, /login, /, etc.)
  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentView(checkCurrentRoute());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Logout listener de api interceptor
  useEffect(() => {
    const handleLogout = () => {
      setIsAuthenticated(false);
      setCurrentView('consulta');
      window.history.pushState({}, '', '/');
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  // Carga inicial de estadísticas y opciones de filtros (solo cuando está en vista analytics)
  const loadStatsAndOptions = useCallback(async () => {
    if (!isAuthenticated || currentView !== 'analytics') return;
    try {
      const [statsRes, filtersRes] = await Promise.all([
        statsApi.getStats(filters.ente ? { ente: filters.ente } : undefined),
        funcionariosApi.getFilterOptions()
      ]);
      setStats(statsRes.data);
      setFilterOptions(filtersRes.data);
    } catch (err) {
      console.error('Error al cargar estadísticas o filtros:', err);
    }
  }, [isAuthenticated, currentView, filters.ente]);

  useEffect(() => {
    if (isAuthenticated && currentView === 'analytics') {
      loadStatsAndOptions();
    }
  }, [isAuthenticated, currentView, loadStatsAndOptions]);

  // Carga de lista de funcionarios con filtros y paginación
  const loadFuncionarios = useCallback(async () => {
    if (!isAuthenticated || currentView !== 'analytics') return;
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        search: filters.search || undefined,
        ente: filters.ente || undefined,
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
  }, [isAuthenticated, currentView, page, pageSize, filters]);

  useEffect(() => {
    if (isAuthenticated && currentView === 'analytics') {
      loadFuncionarios();
    }
  }, [isAuthenticated, currentView, loadFuncionarios]);

  // Manejador de cambio de filtros individuales
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  // Manejador de selección de categoría desde las tarjetas superiores
  const handleSelectCategoria = (catName) => {
    handleFilterChange('categoria', catName);
  };

  // Manejador de selección de Ente desde los tabs superiores
  const handleSelectEnte = (enteName) => {
    handleFilterChange('ente', enteName);
  };

  // Restablecer filtros
  const handleResetFilters = () => {
    setFilters({
      search: '',
      ente: '',
      categoria: '',
      estado: '',
      municipio: '',
      parroquia: '',
      unidad_adscripcion: ''
    });
    setPage(1);
  };

  // Exportar a Excel
  const handleExportExcel = async () => {
    try {
      const params = {
        page: 1,
        page_size: 10000,
        search: filters.search || undefined,
        ente: filters.ente || undefined,
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
      exportToExcel(funcionarios);
    }
  };

  // Exportar a PDF
  const handleExportPdf = async () => {
    try {
      const params = {
        page: 1,
        page_size: 10000,
        search: filters.search || undefined,
        ente: filters.ente || undefined,
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
    setCurrentView('consulta');
    window.history.pushState({}, '', '/');
  };

  const handleGoToAdmin = () => {
    if (isAuthenticated) {
      setCurrentView('analytics');
      window.history.pushState({}, '', '/analytics');
    } else {
      setCurrentView('login');
      window.history.pushState({}, '', '/analytics');
    }
  };

  const handleBackToConsulta = () => {
    setCurrentView('consulta');
    window.history.pushState({}, '', '/');
  };

  // VISTA POR DEFECTO: Consulta pública y actualización electoral por cédula (sin enlace a analytics)
  if (currentView === 'consulta') {
    return <ConsultaCedulaView />;
  }

  // VISTA DE LOGIN: Acceso seguro al Panel de Analytics
  if (currentView === 'login' || !isAuthenticated) {
    return (
      <Login
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          setCurrentView('analytics');
          window.history.pushState({}, '', '/analytics');
        }}
        onBackToConsulta={handleBackToConsulta}
      />
    );
  }

  // VISTA DEL PANEL DE ANALYTICS Y CONTROL DE PERSONAL
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        onOpenUpload={() => setUploadModalOpen(true)}
        onOpenCreate={() => setCreateModalOpen(true)}
        onOpenClearData={() => setClearModalOpen(true)}
        onOpenReporteHorario={() => setReporteModalOpen(true)}
        onLogout={handleLogout}
        onGoToConsulta={handleBackToConsulta}
      />

      <main className="container" style={{ flex: 1, paddingBottom: '40px' }}>
        {/* Tarjetas de Métricas por Categoría y Ente */}
        <StatsCards
          stats={stats}
          selectedCategoria={filters.categoria}
          onSelectCategoria={handleSelectCategoria}
          selectedEnte={filters.ente}
          onSelectEnte={handleSelectEnte}
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

      {/* Modal de Eliminación de Datos */}
      {clearModalOpen && (
        <ClearDataModal
          onClose={() => setClearModalOpen(false)}
          onSuccess={() => {
            loadStatsAndOptions();
            loadFuncionarios();
          }}
        />
      )}
      {/* Modal de Reporte Horario de Consulta (Excel) */}
      <ReporteHorarioModal
        isOpen={reporteModalOpen}
        onClose={() => setReporteModalOpen(false)}
      />
    </div>
  );
}
