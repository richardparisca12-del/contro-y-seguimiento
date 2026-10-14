import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, CheckCircle2, RefreshCw, Landmark, Building2, Layers } from 'lucide-react';
import { funcionariosApi } from '../api';

export default function ClearDataModal({ onClose, onSuccess }) {
  const [targetEnte, setTargetEnte] = useState('all'); // 'all' | 'MINISTERIO DE LA JUVENTUD' | 'INJ'
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleClear = async (e) => {
    e.preventDefault();
    if (confirmText.trim().toUpperCase() !== 'ELIMINAR') {
      setError('Debe escribir exactamente la palabra "ELIMINAR" para confirmar.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const params = targetEnte === 'all' ? {} : { ente: targetEnte };
      const res = await funcionariosApi.clearFuncionarios(params);
      setSuccessMsg(res.data.message || 'Datos eliminados exitosamente.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Error al eliminar datos:', err);
      const detail = err.response?.data?.detail || err.message || 'Error al procesar la solicitud.';
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setLoading(false);
    }
  };

  const getScopeDescription = () => {
    switch (targetEnte) {
      case 'INJ':
        return 'Se eliminarán todos los registros asociados a INJ (Instituto Nacional de la Juventud). Los datos del Ministerio permanecerán intactos.';
      case 'MINISTERIO DE LA JUVENTUD':
        return 'Se eliminarán todos los registros del Ministerio de la Juventud (MinJuventud). Los datos de INJ permanecerán intactos.';
      default:
        return 'Se eliminarán absolutamente TODOS los registros de la base de datos (MinJuventud e INJ). Las métricas y gráficos volverán a cero.';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '560px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
            }}>
              <Trash2 size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
                Eliminar Datos del Analytics
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Reinicio y depuración del personal registrado
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '24px' }}>
          {/* Alerta de advertencia */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <AlertTriangle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.82rem', color: '#fca5a5', lineHeight: 1.45 }}>
              <strong>¡Acción destructiva e irreversible!</strong>
              <div style={{ marginTop: '2px' }}>
                Esta operación borrará los funcionarios seleccionados de la base de datos MySQL y reiniciará sus gráficos y estadísticas.
              </div>
            </div>
          </div>

          <form onSubmit={handleClear}>
            {/* Selector de alcance */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Seleccione qué datos desea eliminar:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {/* Opción Todos */}
                <div
                  onClick={() => setTargetEnte('all')}
                  style={{
                    border: targetEnte === 'all' ? '2px solid #ef4444' : '1px solid var(--border-color)',
                    background: targetEnte === 'all' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                    padding: '10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Layers size={18} color={targetEnte === 'all' ? '#f87171' : 'var(--text-dim)'} style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                    Toda la Nómina
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    MinJuventud + INJ
                  </div>
                </div>

                {/* Opción Solo MinJuventud */}
                <div
                  onClick={() => setTargetEnte('MINISTERIO DE LA JUVENTUD')}
                  style={{
                    border: targetEnte === 'MINISTERIO DE LA JUVENTUD' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                    background: targetEnte === 'MINISTERIO DE LA JUVENTUD' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                    padding: '10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Landmark size={18} color={targetEnte === 'MINISTERIO DE LA JUVENTUD' ? '#60a5fa' : 'var(--text-dim)'} style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                    Solo MinJuventud
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Ministerial
                  </div>
                </div>

                {/* Opción Solo INJ */}
                <div
                  onClick={() => setTargetEnte('INJ')}
                  style={{
                    border: targetEnte === 'INJ' ? '2px solid #10b981' : '1px solid var(--border-color)',
                    background: targetEnte === 'INJ' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                    padding: '10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Building2 size={18} color={targetEnte === 'INJ' ? '#34d399' : 'var(--text-dim)'} style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                    Solo INJ
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Ente Adscrito
                  </div>
                </div>
              </div>

              {/* Explicación del alcance seleccionado */}
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '10px', fontStyle: 'italic' }}>
                ℹ️ {getScopeDescription()}
              </p>
            </div>

            {/* Input de confirmación */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#f8fafc',
                marginBottom: '6px'
              }}>
                Para confirmar la eliminación, escriba <strong style={{ color: '#ef4444' }}>ELIMINAR</strong> a continuación:
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="Escriba ELIMINAR"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                style={{
                  fontSize: '0.85rem',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  borderColor: confirmText.trim().toUpperCase() === 'ELIMINAR' ? '#ef4444' : undefined
                }}
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Mensajes de Error o Éxito */}
            {error && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '0.8rem',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            {successMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#6ee7b7',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Botones de acción */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn btn-danger"
                disabled={confirmText.trim().toUpperCase() !== 'ELIMINAR' || loading}
                style={{
                  padding: '9px 18px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: confirmText.trim().toUpperCase() !== 'ELIMINAR' || loading ? 0.6 : 1
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Eliminar Definitivamente</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
