import React from 'react';
import { Users, Award, ShieldAlert, Briefcase, FileBadge, Building2, Landmark, Layers } from 'lucide-react';

const CATEGORY_CONFIG = {
  'ALTO NIVEL': {
    color: '#c084fc',
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.35)',
    icon: Award,
    description: 'Dirección y Jefatura Superior'
  },
  'CONFIANZA': {
    color: '#22d3ee',
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.35)',
    icon: ShieldAlert,
    description: 'Asesoría y Coordinación Estratégica'
  },
  'COMISION': {
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.35)',
    icon: Briefcase,
    description: 'Comisión de Servicio Interinstitucional'
  },
  'CONTRATADO': {
    color: '#60a5fa',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.35)',
    icon: FileBadge,
    description: 'Personal Técnico y Operativo'
  }
};

export default function StatsCards({ stats, selectedCategoria, onSelectCategoria, selectedEnte = '', onSelectEnte }) {
  if (!stats) return null;

  const total = stats.total_funcionarios || 0;
  const categoriesMap = {};
  (stats.por_categoria || []).forEach(c => {
    categoriesMap[c.categoria] = c;
  });

  const entesMap = {};
  (stats.por_ente || []).forEach(e => {
    entesMap[e.categoria] = e;
  });

  const totalMin = entesMap['MINISTERIO DE LA JUVENTUD']?.total || 0;
  const totalInj = entesMap['INJ']?.total || 0;

  const categories = ['ALTO NIVEL', 'CONFIANZA', 'COMISION', 'CONTRATADO'];

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Selector de Pestañas de Ente Institucional */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'inline-flex',
          background: 'rgba(15, 23, 42, 0.65)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          gap: '4px',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={() => onSelectEnte && onSelectEnte('')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              background: selectedEnte === '' ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' : 'transparent',
              color: selectedEnte === '' ? '#ffffff' : 'var(--text-dim)',
              boxShadow: selectedEnte === '' ? '0 2px 8px rgba(37, 99, 235, 0.4)' : 'none'
            }}
          >
            <Layers size={15} />
            <span>Consolidado Global</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectEnte && onSelectEnte('MINISTERIO DE LA JUVENTUD')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              background: selectedEnte === 'MINISTERIO DE LA JUVENTUD' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
              color: selectedEnte === 'MINISTERIO DE LA JUVENTUD' ? '#ffffff' : 'var(--text-dim)',
              boxShadow: selectedEnte === 'MINISTERIO DE LA JUVENTUD' ? '0 2px 8px rgba(2, 132, 199, 0.4)' : 'none'
            }}
          >
            <Landmark size={15} />
            <span>Ministerio de la Juventud</span>
            {totalMin > 0 && (
              <span style={{
                background: selectedEnte === 'MINISTERIO DE LA JUVENTUD' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                padding: '2px 6px',
                borderRadius: '999px',
                fontSize: '0.72rem'
              }}>
                {totalMin.toLocaleString()}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectEnte && onSelectEnte('INJ')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              background: selectedEnte === 'INJ' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'transparent',
              color: selectedEnte === 'INJ' ? '#ffffff' : 'var(--text-dim)',
              boxShadow: selectedEnte === 'INJ' ? '0 2px 8px rgba(5, 150, 105, 0.4)' : 'none'
            }}
          >
            <Building2 size={15} />
            <span>INJ (Instituto Nacional)</span>
            {totalInj > 0 && (
              <span style={{
                background: selectedEnte === 'INJ' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                padding: '2px 6px',
                borderRadius: '999px',
                fontSize: '0.72rem'
              }}>
                {totalInj.toLocaleString()}
              </span>
            )}
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
      }}>
        {/* Tarjeta Total */}
        <div
          className="glass-card"
          onClick={() => onSelectCategoria('')}
          style={{
            padding: '20px',
            cursor: 'pointer',
            borderColor: selectedCategoria === '' ? '#1a6ff2' : undefined,
            background: selectedCategoria === '' ? 'rgba(7, 54, 126, 0.45)' : undefined,
            boxShadow: selectedCategoria === '' ? '0 0 16px rgba(7, 54, 126, 0.6)' : undefined,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {selectedEnte ? (selectedEnte === 'INJ' ? 'Total INJ' : 'Total Ministerio') : 'Nómina Total'}
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={20} color="#e2e8f0" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.1 }}>
            {total.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            {selectedCategoria === '' ? 'Filtro activo: Todo el personal' : 'Clic para ver nómina completa'}
          </div>
        </div>

      {/* 4 Tarjetas de Categorías */}
      {categories.map((catName) => {
        const conf = CATEGORY_CONFIG[catName];
        const data = categoriesMap[catName] || { total: 0, porcentaje: 0 };
        const isSelected = selectedCategoria === catName;
        const IconComponent = conf.icon;

        return (
          <div
            key={catName}
            className="glass-card"
            onClick={() => onSelectCategoria(isSelected ? '' : catName)}
            style={{
              padding: '20px',
              cursor: 'pointer',
              borderColor: isSelected ? conf.color : conf.border,
              background: isSelected ? conf.bg : undefined,
              boxShadow: isSelected ? `0 0 16px ${conf.bg}` : undefined,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: conf.color,
                letterSpacing: '0.04em'
              }}>
                {catName}
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: conf.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${conf.border}`
              }}>
                <IconComponent size={18} color={conf.color} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc' }}>
                {data.total.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: conf.color }}>
                {data.porcentaje}%
              </div>
            </div>

            {/* Barra de progreso */}
            <div style={{
              width: '100%',
              height: '5px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '999px',
              marginTop: '12px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(data.porcentaje, 100)}%`,
                height: '100%',
                background: conf.color,
                borderRadius: '999px',
                transition: 'width 0.5s ease'
              }} />
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '8px' }}>
              {conf.description}
            </div>
          </div>
        );
      })}
    </div>
  );
}
