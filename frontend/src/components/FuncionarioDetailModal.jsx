import React, { useState } from 'react';
import { X, User, MapPin, Vote, Briefcase, Edit3, Save, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { funcionariosApi } from '../api';

export default function FuncionarioDetailModal({ funcionario, onClose, onUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    cedula: funcionario?.cedula || '',
    apellido_nombre: funcionario?.apellido_nombre || '',
    categoria: funcionario?.categoria || 'CONTRATADO',
    cargo: funcionario?.cargo || '',
    unidad_adscripcion: funcionario?.unidad_adscripcion || '',
    estado: funcionario?.estado || '',
    municipio: funcionario?.municipio || '',
    parroquia: funcionario?.parroquia || '',
    centro_votacion: funcionario?.centro_votacion || '',
    numero_orden: funcionario?.numero_orden || ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!funcionario) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        ...formData,
        numero_orden: formData.numero_orden ? Number(formData.numero_orden) : null
      };
      await funcionariosApi.update(funcionario.id, payload);
      setSuccessMsg('¡Datos actualizados exitosamente!');
      setTimeout(() => {
        setIsEditing(false);
        setSuccessMsg('');
        if (onUpdated) onUpdated();
      }, 1000);
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al actualizar los datos del funcionario.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Está seguro de eliminar a ${funcionario.apellido_nombre} (${funcionario.cedula}) de la nómina?`)) {
      return;
    }
    setSaving(true);
    try {
      await funcionariosApi.delete(funcionario.id);
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      setError('Error al eliminar funcionario.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
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
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#f8fafc' }}>
                {isEditing ? 'Editar Datos del Funcionario' : 'Ficha del Funcionario'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Ministerio del Poder Popular para la Juventud
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                title="Completar o modificar datos faltantes"
              >
                <Edit3 size={15} />
                <span>Editar Datos</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '6px', borderRadius: '8px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notificaciones */}
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

        {successMsg && (
          <div style={{
            margin: '16px 24px 0',
            padding: '10px 14px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#6ee7b7',
            borderRadius: '8px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Vista o Formulario de Edición */}
        {isEditing ? (
          <form onSubmit={handleSave} style={{ padding: '24px' }}>
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
                  placeholder="Ej: ANALISTA DE SISTEMAS"
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
                  placeholder="Ej: DIRECCIÓN DE RECURSOS HUMANOS"
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
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '16px',
              marginTop: '10px'
            }}>
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-danger"
                style={{ fontSize: '0.8rem', padding: '8px 14px' }}
                disabled={saving}
              >
                <Trash2 size={15} />
                <span>Eliminar Funcionario</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={saving}
                  style={{ minWidth: '140px' }}
                >
                  <Save size={16} />
                  <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div style={{ padding: '24px' }}>
            {/* Identidad Principal */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#93c5fd',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    Cédula de Identidad
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
                    {funcionario.cedula}
                  </div>
                </div>
                <span className={`badge-category badge-${funcionario.categoria.replace(/\s+/g, '-')}`}>
                  {funcionario.categoria}
                </span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                {funcionario.apellido_nombre}
              </div>
            </div>

            {/* Información Laboral */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Briefcase size={14} color="#a5b4fc" />
                Datos Laborales
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px'
              }}>
                <div style={{ background: 'rgba(17, 23, 38, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Cargo Nominal / Asignado</span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: funcionario.cargo ? '#f1f5f9' : '#f87171', marginTop: '2px' }}>
                    {funcionario.cargo || '⚠️ Dato faltante (Clic en Editar)'}
                  </div>
                </div>

                <div style={{ background: 'rgba(17, 23, 38, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Unidad de Adscripción</span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: funcionario.unidad_adscripcion ? '#f1f5f9' : '#f87171', marginTop: '2px' }}>
                    {funcionario.unidad_adscripcion || '⚠️ Dato faltante (Clic en Editar)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Ubicación Territorial */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <MapPin size={14} color="#34d399" />
                Ubicación Geográfica
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px'
              }}>
                <div style={{ background: 'rgba(17, 23, 38, 0.5)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Estado</span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: funcionario.estado ? '#f1f5f9' : '#f87171', marginTop: '2px' }}>
                    {funcionario.estado || 'Sin registrar'}
                  </div>
                </div>

                <div style={{ background: 'rgba(17, 23, 38, 0.5)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Municipio</span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: funcionario.municipio ? '#f1f5f9' : '#f87171', marginTop: '2px' }}>
                    {funcionario.municipio || 'Sin registrar'}
                  </div>
                </div>

                <div style={{ background: 'rgba(17, 23, 38, 0.5)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Parroquia</span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: funcionario.parroquia ? '#f1f5f9' : '#f87171', marginTop: '2px' }}>
                    {funcionario.parroquia || 'Sin registrar'}
                  </div>
                </div>
              </div>
            </div>

            {/* Información Electoral */}
            <div>
              <h4 style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Vote size={14} color="#fbbf24" />
                Registro Electoral
              </h4>
              <div style={{
                background: funcionario.centro_votacion ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: funcionario.centro_votacion ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                padding: '14px'
              }}>
                <span style={{ fontSize: '0.72rem', color: funcionario.centro_votacion ? '#fbbf24' : '#fca5a5', fontWeight: 600 }}>Centro de Votación Asignado</span>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: funcionario.centro_votacion ? '#f8fafc' : '#fca5a5', marginTop: '4px' }}>
                  {funcionario.centro_votacion || '⚠️ Falta registrar centro de votación (Haga clic en "Editar Datos" arriba)'}
                </div>
              </div>
            </div>

            {/* Footer de solo lectura */}
            <div style={{
              paddingTop: '20px',
              marginTop: '20px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                <Edit3 size={16} />
                <span>Editar o Completar Datos</span>
              </button>
              <button onClick={onClose} className="btn btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
