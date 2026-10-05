import React, { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { uploadApi } from '../api';

export default function UploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith('.xlsx') && !selected.name.endsWith('.xls')) {
        setError('Por favor seleccione un archivo Excel válido (.xlsx o .xls)');
        setFile(null);
        return;
      }
      setFile(selected);
      setError('');
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (!dropped.name.endsWith('.xlsx') && !dropped.name.endsWith('.xls')) {
        setError('Por favor suelte un archivo Excel (.xlsx o .xls)');
        return;
      }
      setFile(dropped);
      setError('');
      setResult(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Seleccione un archivo antes de procesar.');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await uploadApi.uploadExcel(formData);
      setResult(response.data);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Ocurrió un error al cargar o procesar el archivo Excel.');
      }
    } finally {
      setUploading(false);
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
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
            }}>
              <UploadCloud size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#f8fafc' }}>
                Importación Masiva de Personal (Excel)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Lectura y normalización automatizada de las 4 categorías
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div style={{ padding: '24px' }}>
          {/* Instrucciones sobre las 4 hojas */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#c7d2fe', marginBottom: '6px' }}>
              Estructura requerida del archivo Excel:
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              El libro de Excel debe contener las <strong>4 pestañas (hojas)</strong>:
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', marginBottom: '8px' }}>
                <span className="badge-category badge-ALTO-NIVEL">1. ALTO NIVEL</span>
                <span className="badge-category badge-CONFIANZA">2. CONFIANZA</span>
                <span className="badge-category badge-COMISION">3. COMISION</span>
                <span className="badge-category badge-CONTRATADO">4. CONTRATADO</span>
              </div>
              Columnas: <em>Nª, CEDULA, APELLIDO Y NOMBRE, CARGO, UNIDAD DE ADSCRIPCIÓN, ESTADO, MUNICIPIO, PARROQUIA, CENTRO DE VOTACIÓN</em>.
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario de Carga */}
          {!result && (
            <form onSubmit={handleSubmit}>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                style={{
                  border: '2px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.4)',
                  cursor: 'pointer',
                  marginBottom: '20px',
                  transition: 'border-color 0.2s ease'
                }}
                onClick={() => document.getElementById('excel-file-input').click()}
              >
                <input
                  id="excel-file-input"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <FileSpreadsheet size={42} color={file ? '#10b981' : '#6366f1'} style={{ marginBottom: '12px' }} />
                
                {file ? (
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      {(file.size / 1024).toFixed(1)} KB — Clic para cambiar archivo
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9' }}>
                      Arrastre y suelte aquí su archivo Excel
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      o haga clic para examinar desde su computadora (.xlsx, .xls)
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!file || uploading}
                  style={{ minWidth: '160px' }}
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={16} className="spin-animation" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} />
                      <span>Iniciar Procesamiento</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Resultado del Procesamiento */}
          {result && (
            <div>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, fontSize: '0.95rem' }}>
                  <CheckCircle2 size={20} />
                  <span>{result.mensaje}</span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  marginTop: '12px'
                }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Total Leídos</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>{result.total_procesados}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Insertados/Actualizados</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>{result.total_insertados}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Errores</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: result.total_errores > 0 ? '#f87171' : '#cbd5e1' }}>
                      {result.total_errores}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalle por Hoja */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Balance por Pestaña
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {result.hojas.map((h) => (
                    <div key={h.hoja} style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '10px 14px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <span className={`badge-category badge-${h.hoja.replace(/\s+/g, '-')}`}>
                          {h.hoja}
                        </span>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                          <strong>{h.insertados}</strong> registros procesados
                          {h.errores > 0 && <span style={{ color: '#f87171', marginLeft: '6px' }}>({h.errores} errores)</span>}
                        </div>
                      </div>

                      {h.detalles_errores && h.detalles_errores.length > 0 && (
                        <div style={{
                          marginTop: '8px',
                          fontSize: '0.74rem',
                          color: '#fca5a5',
                          background: 'rgba(239, 68, 68, 0.1)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          lineHeight: 1.4
                        }}>
                          {h.detalles_errores.slice(0, 3).map((err, i) => (
                            <div key={i}>• {err}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={onClose} className="btn btn-primary">
                  Finalizar y Ver Actualizaciones
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
