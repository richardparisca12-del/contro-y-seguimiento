import React from 'react';
import { Users, Award, ShieldAlert, Briefcase, FileBadge } from 'lucide-react';

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

export default function StatsCards({ stats, selectedCategoria, onSelectCategoria }) {
  if (!stats) return null;

  const total = stats.total_funcionarios || 0;
  const categoriesMap = {};
  (stats.por_categoria || []).forEach(c => {
    categoriesMap[c.categoria] = c;
  });

  const categories = ['ALTO NIVEL', 'CONFIANZA', 'COMISION', 'CONTRATADO'];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* Tarjeta Total General */}
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
            Nómina Total
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
