import React from 'react';
import { ChevronLeft, ChevronRight, UserX, ExternalLink } from 'lucide-react';

export default function FuncionariosTable({
  funcionarios,
  loading,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onSelectFuncionario,
}) {
  const getBadgeClass = (categoria) => {
    switch (categoria) {
      case 'ALTO NIVEL': return 'badge-category badge-ALTO-NIVEL';
      case 'CONFIANZA': return 'badge-category badge-CONFIANZA';
      case 'COMISION': return 'badge-category badge-COMISION';
      case 'CONTRATADO': return 'badge-category badge-CONTRATADO';
      default: return 'badge-category';
    }
  };

  const startRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      {/* Encabezado de la tabla */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', color: '#f8fafc' }}>
            Listado Oficial de Personal
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Mostrando registros del <strong>{startRecord}</strong> al <strong>{endRecord}</strong> de un total de <strong>{total.toLocaleString()}</strong>
          </p>
        </div>

        {/* Selector de cantidad por página */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Filas por página:</span>
          <select
            className="select-control"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{ width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Contenedor con Scroll de la Tabla */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>N°</th>
              <th>Cédula</th>
              <th>Funcionario</th>
              <th>Categoría</th>
              <th>Cargo</th>
              <th>Unidad de Adscripción</th>
              <th>Estado</th>
              <th>Municipio</th>
              <th>Parroquia</th>
              <th style={{ textAlign: 'center' }}>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                    <div className="pulse-indicator"></div>
                    <span>Cargando registros del personal...</span>
                  </div>
                </td>
              </tr>
            ) : funcionarios.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                  <UserX size={36} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    No se encontraron funcionarios
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Pruebe ajustando los términos de búsqueda o limpiando los filtros seleccionados.
                  </p>
                </td>
              </tr>
            ) : (
              funcionarios.map((item, idx) => (
                <tr
                  key={item.id}
                  onClick={() => onSelectFuncionario(item)}
                  title="Clic para ver expediente completo"
                >
                  <td style={{ color: 'var(--text-dim)', fontWeight: 600 }}>
                    {item.numero_orden || (startRecord + idx)}
                  </td>
                  <td style={{ fontWeight: 700, color: '#93c5fd', whiteSpace: 'nowrap' }}>
                    {item.cedula}
                  </td>
                  <td style={{ fontWeight: 600, color: '#ffffff' }}>
                    {item.apellido_nombre}
                  </td>
                  <td>
                    <span className={getBadgeClass(item.categoria)}>
                      {item.categoria}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-main)', fontSize: '0.82rem' }}>
                    {item.cargo || '---'}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {item.unidad_adscripcion || '---'}
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#cbd5e1'
                    }}>
                      {item.estado || '---'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                    {item.municipio || '---'}
                  </td>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                    {item.parroquia || '---'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFuncionario(item);
                      }}
                    >
                      <ExternalLink size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '16px'
      }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Página <strong>{page}</strong> de <strong>{totalPages}</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <ChevronLeft size={16} />
            <span>Anterior</span>
          </button>

          <span style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            padding: '6px 14px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#a5b4fc',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            {page}
          </span>

          <button
            className="btn btn-secondary"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <span>Siguiente</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
