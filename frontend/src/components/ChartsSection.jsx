import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { BarChart3, PieChart as PieIcon, ChevronDown, ChevronUp } from 'lucide-react';

const COLORS = {
  'ALTO NIVEL': '#a855f7',
  'CONFIANZA': '#06b6d4',
  'COMISION': '#f59e0b',
  'CONTRATADO': '#3b82f6',
};

export default function ChartsSection({ stats }) {
  const [collapsed, setCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('estados'); // 'estados' o 'unidades'

  if (!stats || stats.total_funcionarios === 0) return null;

  const pieData = (stats.por_categoria || []).map(c => ({
    name: c.categoria,
    value: c.total,
    porcentaje: c.porcentaje
  }));

  const barData = (viewMode === 'estados' ? stats.top_estados : stats.top_unidades || []).slice(0, 7);

  return (
    <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: collapsed ? '0' : '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BarChart3 size={18} color="#a5b4fc" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#f8fafc' }}>
              Métricas e Indicadores de Distribución
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Distribución porcentual por categoría y concentración geográfica / institucional
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!collapsed && (
            <div style={{
              display: 'inline-flex',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '3px'
            }}>
              <button
                className={`btn ${viewMode === 'estados' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '5px 12px', fontSize: '0.75rem', borderRadius: '6px' }}
                onClick={() => setViewMode('estados')}
              >
                Top Estados
              </button>
              <button
                className={`btn ${viewMode === 'unidades' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '5px 12px', fontSize: '0.75rem', borderRadius: '6px' }}
                onClick={() => setViewMode('unidades')}
              >
                Top Unidades
              </button>
            </div>
          )}

          <button
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          alignItems: 'center'
        }}>
          {/* Gráfico Circular de Categorías */}
          <div style={{ height: '260px' }}>
            <div style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Composición de Personal por Categoría
            </div>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{
                          background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: '#fff',
                          fontSize: '0.8rem'
                        }}>
                          <div style={{ fontWeight: 700, color: COLORS[data.name] }}>{data.name}</div>
                          <div>Total: <strong>{data.value}</strong> funcionarios</div>
                          <div>Porcentaje: <strong>{data.porcentaje}%</strong></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Barras: Estados o Unidades */}
          <div style={{ height: '260px' }}>
            <div style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Concentración por {viewMode === 'estados' ? 'Estado' : 'Unidad de Adscripción'}
            </div>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={barData} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="nombre"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div style={{
                          background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: '#fff',
                          fontSize: '0.8rem'
                        }}>
                          <div style={{ fontWeight: 700, color: '#a5b4fc' }}>{item.nombre}</div>
                          <div>Total: <strong>{item.total}</strong> funcionarios</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
