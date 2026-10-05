import React, { useState } from 'react';
import { X, UserPlus, Save, AlertCircle } from 'lucide-react';
import { funcionariosApi } from '../api';

export default function CreateFuncionarioModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    cedula: '',
    apellido_nombre: '',
    categoria: 'CONTRATADO',
    cargo: '',
    unidad_adscripcion: '',
    estado: '',
    municipio: '',
    parroquia: '',
    centro_votacion: '',
    numero_orden: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        numero_orden: formData.numero_orden ? Number(formData.numero_orden) : null
      };
      await funcionariosApi.create(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al registrar el funcionario en el sistema.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(15, 23, 42, 0.7)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserPlus size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#f8fafc' }}>
                Registrar Nuevo Funcionario
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Incorporación manual a la nómina de MinJuventud
              </span>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '8px' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            margin: '16px 24px 0',
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            borderRadius: '8px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px',
            marginBottom: '16px'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                CÉDULA *
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="Ej: V-12345678"
                value={formData.cedula}
                onChange={(e) => handleChange('cedula', e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                CATEGORÍA LABORAL *
              </label>
              <select
                className="select-control"
                value={formData.categoria}
                onChange={(e) => handleChange('categoria', e.target.value)}
                required
              >
                <option value="ALTO NIVEL">ALTO NIVEL</option>
                <option value="CONFIANZA">CONFIANZA</option>
                <option value="COMISION">COMISION</option>
                <option value="CONTRATADO">CONTRATADO</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                APELLIDO Y NOMBRE *
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="Ej: PÉREZ GONZÁLEZ, JUAN CARLOS"
                value={formData.apellido_nombre}
                onChange={(e) => handleChange('apellido_nombre', e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                CARGO
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="Ej: COORDINADOR REGIONAL"
                value={formData.cargo}
                onChange={(e) => handleChange('cargo', e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                UNIDAD DE ADSCRIPCIÓN
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="Ej: DESPACHO DEL MINISTRO"
                value={formData.unidad_adscripcion}
                onChange={(e) => handleChange('unidad_adscripcion', e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                ESTADO
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="Ej: DISTRITO CAPITAL"
                value={formData.estado}
                onChange={(e) => handleChange('estado', e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                MUNICIPIO
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="Ej: LIBERTADOR"
                value={formData.municipio}
                onChange={(e) => handleChange('municipio', e.target.value)}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
                PARROQUIA
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="Ej: EL RECREO"
                value={formData.parroquia}
                onChange={(e) => handleChange('parroquia', e.target.value)}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#fbbf24', marginBottom: '5px' }}>
                CENTRO DE VOTACIÓN (ELECTORAL)
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="Ej: LICEO ANDRÉS BELLO"
                value={formData.centro_votacion}
                onChange={(e) => handleChange('centro_votacion', e.target.value)}
                style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '16px',
            gap: '10px'
          }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: '150px' }}>
              <Save size={16} />
              <span>{saving ? 'Guardando...' : 'Crear Funcionario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
