import { UploadCloud, LogOut, Vote, ArrowLeft, Trash2, FileSpreadsheet } from 'lucide-react';

export default function Navbar({
  onOpenUpload,
  onOpenCreate,
  onOpenClearData,
  onOpenReporteHorario,
  onLogout,
  onGoToConsulta
}) {
  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '12px',
        paddingBottom: '12px',
      }}>
        {/* Logo e Identidad Institucional */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img
            src="/logo-minjuventud.png"
            alt="Ministerio del Poder Popular para la Juventud"
            style={{
              height: '46px',
              maxWidth: '240px',
              objectFit: 'contain',
              display: 'block',
            }}
          />

          <div style={{ borderLeft: '1.5px solid #cbd5e1', paddingLeft: '16px' }}>
            <h1 style={{
              fontSize: '1.15rem',
              color: '#07367E',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              Panel de Analytics - Control de Personal
            </h1>
            <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500, marginTop: '2px', marginBottom: 0 }}>
              Ministerio del Poder Popular para la Juventud
            </p>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onGoToConsulta && (
            <button
              onClick={onGoToConsulta}
              style={{
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1.5px solid #bfdbfe',
                fontSize: '0.84rem',
                padding: '9px 14px',
                fontWeight: 700,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
              title="Ir a la pantalla de consulta de cédula"
            >
              <ArrowLeft size={16} />
              <span>Consulta Cédula</span>
            </button>
          )}

          {onOpenReporteHorario && (
            <button
              onClick={onOpenReporteHorario}
              style={{
                background: '#ecfdf5',
                color: '#047857',
                border: '1.5px solid #a7f3d0',
                fontSize: '0.84rem',
                padding: '9px 14px',
                fontWeight: 700,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#d1fae5';
                e.currentTarget.style.borderColor = '#6ee7b7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ecfdf5';
                e.currentTarget.style.borderColor = '#a7f3d0';
              }}
              title="Descargar reporte oficial en Excel de participación por horas (Ministerio e INJ)"
            >
              <FileSpreadsheet size={16} />
              <span>Reporte Horario Excel</span>
            </button>
          )}

          <button
            onClick={onOpenCreate}
            style={{
              background: '#f8fafc',
              color: '#07367E',
              border: '1.5px solid #07367E',
              fontSize: '0.84rem',
              padding: '9px 14px',
              fontWeight: 700,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#eef2ff'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
            title="Registrar funcionario manualmente"
          >
            <span>+ Nuevo Funcionario</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '9px 16px' }}
          >
            <UploadCloud size={18} />
            <span>Carga Masiva Excel</span>
          </button>

          {onOpenClearData && (
            <button
              onClick={onOpenClearData}
              style={{
                background: '#fef2f2',
                color: '#dc2626',
                border: '1.5px solid #fecaca',
                fontSize: '0.84rem',
                padding: '9px 14px',
                fontWeight: 700,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fee2e2';
                e.currentTarget.style.borderColor = '#f87171';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fef2f2';
                e.currentTarget.style.borderColor = '#fecaca';
              }}
              title="Eliminar datos de personal y reiniciar estadísticas"
            >
              <Trash2 size={16} />
              <span>Eliminar Datos</span>
            </button>
          )}

          <button
            onClick={onLogout}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '9px 12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.borderColor = '#fca5a5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            title="Cerrar Sesión"
          >
            <LogOut size={17} color="#475569" />
          </button>
        </div>
      </div>
    </header>
  );
}
