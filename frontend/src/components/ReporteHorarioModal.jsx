import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { reportesApi } from '../api';

export default function ReporteHorarioModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [manualGenerating, setManualGenerating] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [tituloJornada, setTituloJornada] = useState("2DA CONSULTA NACIONAL POPULAR 27 DE ABRIL DEL 2025");
  const [activeTab, setActiveTab] = useState('resumen'); // 'resumen' | 'archivos'
  const [msgExito, setMsgExito] = useState('');
  const [msgError, setMsgError] = useState('');

  const cargarDatos = async () => {
    setLoading(true);
    setMsgError('');
    try {
      const [resResumen, resArchivos] = await Promise.all([
        reportesApi.getResumenParticipacion(),
        reportesApi.getHorariosDisponibles()
      ]);
      setResumen(resResumen.data);
      setArchivos(resArchivos.data.archivos || []);
    } catch (err) {
      console.error("Error al cargar datos de reporte horario:", err);
      setMsgError("No se pudo obtener la información de participación. Verifique que el servidor esté activo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      cargarDatos();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDescargarEnVivo = async (enteSeleccionado = null) => {
    setDownloading(true);
    setMsgError('');
    setMsgExito('');
    try {
      const res = await reportesApi.descargarExcelBlob(enteSeleccionado, tituloJornada);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fechaHoy = new Date().toISOString().slice(0, 10);
      a.download = `Reporte_Consulta_${enteSeleccionado || 'Nacional'}_${fechaHoy}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMsgExito("¡Archivo Excel oficial descargado con éxito!");
      setTimeout(() => setMsgExito(''), 4000);
    } catch (err) {
      console.error("Error al descargar Excel:", err);
      setMsgError("Error al generar el archivo Excel en el servidor.");
    } finally {
      setDownloading(false);
    }
  };

  const handleGenerarCorteManual = async () => {
    setManualGenerating(true);
    setMsgError('');
    setMsgExito('');
    try {
      const res = await reportesApi.generarCorteManual(tituloJornada);
      setMsgExito(`¡Corte guardado en el servidor! Archivo: ${res.data.archivo}`);
      await cargarDatos();
      setTimeout(() => setMsgExito(''), 5000);
    } catch (err) {
      console.error("Error al generar corte manual:", err);
      setMsgError("No se pudo guardar el corte en el servidor.");
    } finally {
      setManualGenerating(false);
    }
  };

  const handleDescargarArchivoGuardado = async (filename) => {
    try {
      const res = await reportesApi.descargarHorarioGuardadoBlob(filename);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error descargando archivo guardado:", err);
      alert("Error al descargar el archivo guardado.");
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '960px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Cabecera del Modal */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #07367E 0%, #1e40af 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileSpreadsheet size={24} color="#fef08a" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                Reporte de Participación por Horas (Excel)
              </h2>
              <p style={{ fontSize: '0.82rem', margin: '3px 0 0', opacity: 0.85 }}>
                Control ministerial de actualización de centro de votación por cortes horarios y estados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Notificaciones */}
        {msgExito && (
          <div style={{
            background: '#ecfdf5',
            color: '#065f46',
            padding: '10px 24px',
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid #a7f3d0'
          }}>
            <CheckCircle2 size={18} color="#059669" />
            <span>{msgExito}</span>
          </div>
        )}
        {msgError && (
          <div style={{
            background: '#fef2f2',
            color: '#991b1b',
            padding: '10px 24px',
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid #fecaca'
          }}>
            <AlertCircle size={18} color="#dc2626" />
            <span>{msgError}</span>
          </div>
        )}

        {/* Barra de Pestañas y Opciones */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('resumen')}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'resumen' ? '#07367E' : '#e2e8f0',
                color: activeTab === 'resumen' ? '#ffffff' : '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Layers size={15} />
              <span>Balance en Vivo y Descarga</span>
            </button>
            <button
              onClick={() => setActiveTab('archivos')}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'archivos' ? '#07367E' : '#e2e8f0',
                color: activeTab === 'archivos' ? '#ffffff' : '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Clock size={15} />
              <span>Cortes Horarios Guardados ({archivos.length})</span>
            </button>
          </div>

          <button
            onClick={cargarDatos}
            disabled={loading}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Refrescar datos"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: '#07367E' }} />
              <p style={{ fontWeight: 600 }}>Cargando datos electorales y cómputo de horas...</p>
            </div>
          ) : activeTab === 'resumen' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Configuración de Título de la Jornada */}
              <div style={{
                background: '#eff6ff',
                borderRadius: '12px',
                padding: '14px 18px',
                border: '1.5px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Calendar size={20} color="#1d4ed8" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e40af', display: 'block', marginBottom: '4px' }}>
                    TÍTULO OFICIAL EN EL REPORTE EXCEL (BANNER SUPERIOR):
                  </label>
                  <input
                    type="text"
                    value={tituloJornada}
                    onChange={(e) => setTituloJornada(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #93c5fd',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#0f172a'
                    }}
                  />
                </div>
              </div>

              {/* Información de Programación Automática y Modo Manual */}
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1.5px solid #86efac',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={20} color="#15803d" />
                  <div>
                    <div style={{ fontWeight: 800, color: '#15803d', fontSize: '0.88rem' }}>
                      Generación Automática: Domingo 18/10/2026 (06:00 a. m.) hasta Lunes 19/10/2026 (12:00 a. m.)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '2px' }}>
                      El servidor generará los cortes cada hora en punto durante la jornada electoral hasta su cierre a las 12:00 a. m. La descarga y guardado manual permanecen disponibles en todo momento.
                    </div>
                  </div>
                </div>

                <span style={{
                  background: '#15803d',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  letterSpacing: '0.03em'
                }}>
                  PROGRAMADO 6:00 AM
                </span>
              </div>

              {/* Tarjetas de Métricas de los 3 Bloques (Ministerio, INJ, Consolidado) */}
              {resumen && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  {/* Ministerio de la Juventud */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    padding: '18px',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#07367E', textTransform: 'uppercase' }}>
                        Ministerio de la Juventud
                      </span>
                      <Building2 size={16} color="#07367E" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
                        {resumen.ministerio.total_participacion}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                        / {resumen.ministerio.total_movilizar} a movilizar
                      </span>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#07367E', marginBottom: '4px' }}>
                        <span>Participación</span>
                        <span>{resumen.ministerio.porcentaje_participacion}%</span>
                      </div>
                      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(resumen.ministerio.porcentaje_participacion, 100)}%`,
                          background: 'linear-gradient(90deg, #07367E, #3b82f6)',
                          borderRadius: '9999px'
                        }}></div>
                      </div>
                    </div>
                  </div>

                  {/* INJ */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    padding: '18px',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0891b2', textTransform: 'uppercase' }}>
                        Instituto Nac. de la Juventud (INJ)
                      </span>
                      <Building2 size={16} color="#0891b2" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
                        {resumen.inj.total_participacion}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                        / {resumen.inj.total_movilizar} a movilizar
                      </span>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#0891b2', marginBottom: '4px' }}>
                        <span>Participación</span>
                        <span>{resumen.inj.porcentaje_participacion}%</span>
                      </div>
                      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(resumen.inj.porcentaje_participacion, 100)}%`,
                          background: 'linear-gradient(90deg, #0891b2, #06b6d4)',
                          borderRadius: '9999px'
                        }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Consolidado General */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)',
                    borderRadius: '14px',
                    padding: '18px',
                    color: '#ffffff',
                    boxShadow: '0 8px 16px -4px rgba(30, 58, 138, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fde047', textTransform: 'uppercase' }}>
                        Consolidado General (Ambos)
                      </span>
                      <Sparkles size={16} color="#fde047" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff' }}>
                        {resumen.consolidado.total_participacion}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
                        / {resumen.consolidado.total_movilizar} meta
                      </span>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#fde047', marginBottom: '4px' }}>
                        <span>Porcentaje Nacional</span>
                        <span>{resumen.consolidado.porcentaje_participacion}%</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(resumen.consolidado.porcentaje_participacion, 100)}%`,
                          background: '#facc15',
                          borderRadius: '9999px'
                        }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Desglose por Horas (Plantilla de Cortes) */}
              {resumen && (
                <div style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1.5px solid #e2e8f0',
                  padding: '18px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={18} color="#07367E" />
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#07367E', margin: 0 }}>
                        Cómputo Nacional por Franjas Horarias
                      </h3>
                    </div>
                    <span style={{ fontSize: '0.75rem', background: '#fef08a', color: '#854d0e', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                      9 Cortes Horarios Oficiales
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: '#2f5597', color: '#ffffff' }}>
                          <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'left', borderRadius: '6px 0 0 0' }}>Ente / Pestaña</th>
                          {resumen.labels_horas.map((lbl, idx) => (
                            <th key={idx} style={{ padding: '8px 6px', fontWeight: 700, background: '#ffff00', color: '#000000', borderLeft: '1px solid #e2e8f0' }}>
                              {lbl}
                            </th>
                          ))}
                          <th style={{ padding: '8px 10px', fontWeight: 800, background: '#203764', borderRadius: '0 6px 0 0', borderLeft: '1px solid #ffffff' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'left', color: '#07367E' }}>Ministerio</td>
                          {resumen.ministerio.horas.map((h, i) => (
                            <td key={i} style={{ padding: '8px 6px', borderLeft: '1px solid #f1f5f9' }}>{h || '-'}</td>
                          ))}
                          <td style={{ padding: '8px 10px', fontWeight: 800, color: '#07367E', background: '#f8fafc', borderLeft: '1px solid #e2e8f0' }}>
                            {resumen.ministerio.total_participacion}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'left', color: '#0891b2' }}>INJ</td>
                          {resumen.inj.horas.map((h, i) => (
                            <td key={i} style={{ padding: '8px 6px', borderLeft: '1px solid #f1f5f9' }}>{h || '-'}</td>
                          ))}
                          <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0891b2', background: '#f8fafc', borderLeft: '1px solid #e2e8f0' }}>
                            {resumen.inj.total_participacion}
                          </td>
                        </tr>
                        <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                          <td style={{ padding: '8px 10px', textAlign: 'left', color: '#0f172a' }}>TOTAL GENERAL</td>
                          {resumen.consolidado.horas.map((h, i) => (
                            <td key={i} style={{ padding: '8px 6px', borderLeft: '1px solid #e2e8f0', color: '#0f172a' }}>{h || '0'}</td>
                          ))}
                          <td style={{ padding: '8px 10px', fontWeight: 900, color: '#1e3a8a', background: '#e2e8f0', borderLeft: '1px solid #cbd5e1' }}>
                            {resumen.consolidado.total_participacion}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Botones de Acción de Descarga */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '14px',
                padding: '20px',
                border: '1.5px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 800, color: '#07367E' }}>
                    Acciones de Descarga Oficial
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    El libro generado incluye las 3 pestañas (MINISTERIO, INJ y CONSOLIDADO) con formato institucional, colores y fórmulas automáticas.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleDescargarEnVivo(null)}
                    disabled={downloading}
                    style={{
                      background: 'linear-gradient(135deg, #07367E 0%, #1e40af 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '11px 20px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 10px rgba(7, 54, 126, 0.25)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Download size={18} />
                    <span>{downloading ? 'Generando Excel...' : 'Descargar Excel Completo (3 Pestañas)'}</span>
                  </button>

                  <button
                    onClick={handleGenerarCorteManual}
                    disabled={manualGenerating}
                    style={{
                      background: '#ffffff',
                      color: '#07367E',
                      border: '1.5px solid #07367E',
                      padding: '11px 18px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                  >
                    <Clock size={17} />
                    <span>{manualGenerating ? 'Guardando en servidor...' : 'Guardar Corte Manual en Servidor'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Pestaña: Cortes Horarios Guardados en el Servidor */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#07367E' }}>
                    Archivos de Cortes Horarios Generados
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    El servidor genera automáticamente un archivo Excel al inicio de cada hora estimada.
                  </p>
                </div>
                <button
                  onClick={handleGenerarCorteManual}
                  disabled={manualGenerating}
                  style={{
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Clock size={15} />
                  <span>Generar Corte Ahora</span>
                </button>
              </div>

              {archivos.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px dashed #cbd5e1'
                }}>
                  <Clock size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontWeight: 600, color: '#64748b' }}>
                    Aún no hay archivos de corte almacenados en el servidor.
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    El servicio programado generará automáticamente el primer corte al cumplirse la hora o puede pulsar "Generar Corte Ahora".
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {archivos.map((arc, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 18px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        transition: 'box-shadow 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          background: '#ecfdf5',
                          padding: '8px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FileSpreadsheet size={20} color="#059669" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                            {arc.nombre}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                            Generado: {arc.fecha_creacion} • Tamaño: {arc.tamano_kb} KB
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDescargarArchivoGuardado(arc.nombre)}
                        style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
                      >
                        <Download size={14} />
                        <span>Descargar</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div style={{
          padding: '14px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#e2e8f0',
              border: 'none',
              color: '#334155',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
