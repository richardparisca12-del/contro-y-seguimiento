import React from 'react';
import { Search, RotateCcw, FileSpreadsheet, FileText, Filter } from 'lucide-react';

export default function FiltersBar({
  filters,
  filterOptions,
  onFilterChange,
  onResetFilters,
  onExportExcel,
  onExportPdf,
  totalResultados
}) {
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Título de Filtros */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="#93c5fd" />
          <h3 style={{ fontSize: '1rem', color: '#f8fafc', fontWeight: 600 }}>
            Panel de Búsqueda y Filtros Cruzados
          </h3>
          {activeCount > 0 && (
            <span style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(7, 54, 126, 0.55)',
              color: '#93c5fd',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontWeight: 700
            }}>
              {activeCount} activo{activeCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Acciones de Exportación */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {activeCount > 0 && (
            <button
              onClick={onResetFilters}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '7px 12px' }}
              title="Restablecer todos los filtros"
            >
              <RotateCcw size={15} />
              <span>Limpiar Filtros</span>
            </button>
          )}

          <button
            onClick={onExportExcel}
            className="btn btn-success"
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
            title="Exportar registros filtrados a formato Excel"
          >
            <FileSpreadsheet size={16} />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={onExportPdf}
            className="btn btn-danger"
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
            title="Generar reporte PDF con membrete ministerial"
          >
            <FileText size={16} />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Grid de Inputs y Selectores */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
      }}>
        {/* Buscador Rápido */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-dim)'
          }} />
          <input
            type="text"
            className="input-control"
            placeholder="Buscar cédula, nombre o cargo..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Filtro Categoría */}
        <div>
          <select
            className="select-control"
            value={filters.categoria || ''}
            onChange={(e) => onFilterChange('categoria', e.target.value)}
          >
            <option value="">Todas las Categorías</option>
            <option value="ALTO NIVEL">ALTO NIVEL</option>
            <option value="CONFIANZA">CONFIANZA</option>
            <option value="COMISION">COMISION</option>
            <option value="CONTRATADO">CONTRATADO</option>
          </select>
        </div>

        {/* Filtro Estado */}
        <div>
          <select
            className="select-control"
            value={filters.estado || ''}
            onChange={(e) => onFilterChange('estado', e.target.value)}
          >
            <option value="">Todos los Estados</option>
            {(filterOptions.estados || []).map((est) => (
              <option key={est} value={est}>{est}</option>
            ))}
          </select>
        </div>

        {/* Filtro Municipio */}
        <div>
          <select
            className="select-control"
            value={filters.municipio || ''}
            onChange={(e) => onFilterChange('municipio', e.target.value)}
          >
            <option value="">Todos los Municipios</option>
            {(filterOptions.municipios || []).map((mun) => (
              <option key={mun} value={mun}>{mun}</option>
            ))}
          </select>
        </div>

        {/* Filtro Parroquia */}
        <div>
          <select
            className="select-control"
            value={filters.parroquia || ''}
            onChange={(e) => onFilterChange('parroquia', e.target.value)}
          >
            <option value="">Todas las Parroquias</option>
            {(filterOptions.parroquias || []).map((parr) => (
              <option key={parr} value={parr}>{parr}</option>
            ))}
          </select>
        </div>

        {/* Filtro Unidad de Adscripción */}
        <div>
          <select
            className="select-control"
            value={filters.unidad_adscripcion || ''}
            onChange={(e) => onFilterChange('unidad_adscripcion', e.target.value)}
          >
            <option value="">Todas las Unidades de Adscripción</option>
            {(filterOptions.unidades || []).map((uni) => (
              <option key={uni} value={uni}>{uni}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
