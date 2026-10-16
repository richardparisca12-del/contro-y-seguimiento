import React, { useState, useEffect } from 'react';
import {
  Search,
  User,
  MapPin,
  Vote,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
  Briefcase,
  ArrowLeft,
  RotateCcw,
  Shield,
  Lock
} from 'lucide-react';
import { consultaApi } from '../api';

const ESTADOS_VENEZUELA = [
  'AMAZONAS',
  'ANZOÁTEGUI',
  'APURE',
  'ARAGUA',
  'BARINAS',
  'BOLÍVAR',
  'CARABOBO',
  'COJEDES',
  'DELTA AMACURO',
  'DISTRITO CAPITAL',
  'FALCÓN',
  'GUÁRICO',
  'LA GUAIRA',
  'LARA',
  'MÉRIDA',
  'MIRANDA',
  'MONAGAS',
  'NUEVA ESPARTA',
  'PORTUGUESA',
  'SUCRE',
  'TÁCHIRA',
  'TRUJILLO',
  'YARACUY',
  'ZULIA'
];

export default function ConsultaCedulaView({ onGoToAdmin }) {
  const [nacionalidad, setNacionalidad] = useState('V');
  const [numeroCedula, setNumeroCedula] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Datos del funcionario encontrado
  const [registros, setRegistros] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Formulario de edición de campos electorales
  const [formData, setFormData] = useState({
    estado: '',
    municipio: '',
    parroquia: '',
    centro_votacion: ''
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Atajo de teclado discreto para administración: Ctrl + Alt + A
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        if (onGoToAdmin) onGoToAdmin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onGoToAdmin]);

  const handleConsultar = async (e) => {
    if (e) e.preventDefault();
    const cleanNum = numeroCedula.replace(/\D/g, '').trim();
    if (!cleanNum) {
      setErrorMsg('Por favor ingrese el número de cédula.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setRegistros(null);

    const cedulaConsultar = `${nacionalidad}${cleanNum}`;

    try {
      const response = await consultaApi.consultarCedula(cedulaConsultar);
      const data = response.data;
      if (data.registros && data.registros.length > 0) {
        setRegistros(data.registros);
        setSelectedIdx(0);
        // Cargar los campos editables del primer registro
        const reg = data.registros[0];
        setFormData({
          estado: reg.estado || '',
          municipio: reg.municipio || '',
          parroquia: reg.parroquia || '',
          centro_votacion: reg.centro_votacion || ''
        });
      } else {
        setErrorMsg('La cédula ingresada no se encuentra registrada en la base de datos institucional.');
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setErrorMsg(`La cédula ${nacionalidad}-${cleanNum} no se encuentra registrada en la base de datos.`);
      } else if (err.response && err.response.data && err.response.data.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg('Error de conexión al consultar el servidor. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecord = (idx) => {
    setSelectedIdx(idx);
    const reg = registros[idx];
    setFormData({
      estado: reg.estado || '',
      municipio: reg.municipio || '',
      parroquia: reg.parroquia || '',
      centro_votacion: reg.centro_votacion || ''
    });
    setSuccessMsg('');
  };

  const handleGuardarCambios = async (e) => {
    e.preventDefault();
    if (!registros || !registros[selectedIdx]) return;

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const targetId = registros[selectedIdx].id;

    try {
      const response = await consultaApi.actualizarDatosElectorales(targetId, formData);
      const updated = response.data;
      
      // Actualizar registro local
      const updatedList = [...registros];
      updatedList[selectedIdx] = {
        ...updatedList[selectedIdx],
        estado: updated.estado,
        municipio: updated.municipio,
        parroquia: updated.parroquia,
        centro_votacion: updated.centro_votacion,
        participo_consulta: true,
        fecha_hora_voto: updated.fecha_hora_voto
      };
      setRegistros(updatedList);
      setSuccessMsg('¡Participación registrada y centro de votación actualizado exitosamente en el sistema!');
      
      // Desplazar suavemente hacia arriba
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg('Error al guardar los datos electorales.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmarVotoDirecto = async () => {
    if (!registros || !registros[selectedIdx]) return;
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const targetId = registros[selectedIdx].id;
    try {
      const response = await consultaApi.actualizarDatosElectorales(targetId, {
        ...formData,
        confirma_voto: true,
        centro_votacion: formData.centro_votacion || registros[selectedIdx].centro_votacion || 'CONFIRMADO'
      });
      const updated = response.data;
      const updatedList = [...registros];
      updatedList[selectedIdx] = {
        ...updatedList[selectedIdx],
        estado: updated.estado,
        municipio: updated.municipio,
        parroquia: updated.parroquia,
        centro_votacion: updated.centro_votacion,
        participo_consulta: true,
        fecha_hora_voto: updated.fecha_hora_voto
      };
      setRegistros(updatedList);
      setSuccessMsg('¡Voto confirmado exitosamente! Su participación ha sido registrada en el reporte horario.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg('Error al registrar el voto.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetConsulta = () => {
    setRegistros(null);
    setNumeroCedula('');
    setErrorMsg('');
    setSuccessMsg('');
    setFormData({
      estado: '',
      municipio: '',
      parroquia: '',
      centro_votacion: ''
    });
  };

  const getCategoriaBadgeColor = (cat) => {
    switch (cat) {
      case 'ALTO NIVEL':
        return { bg: 'var(--cat-alto-nivel-bg)', border: 'var(--cat-alto-nivel-border)', text: 'var(--cat-alto-nivel)' };
      case 'CONFIANZA':
        return { bg: 'var(--cat-confianza-bg)', border: 'var(--cat-confianza-border)', text: 'var(--cat-confianza)' };
      case 'COMISION':
        return { bg: 'var(--cat-comision-bg)', border: 'var(--cat-comision-border)', text: 'var(--cat-comision)' };
      case 'CONTRATADO':
      default:
        return { bg: 'var(--cat-contratado-bg)', border: 'var(--cat-contratado-border)', text: 'var(--cat-contratado)' };
    }
  };

  const currentReg = registros ? registros[selectedIdx] : null;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 16px',
      position: 'relative'
    }}>
      {/* Header Institucional Superior */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          padding: '12px 24px',
          borderRadius: '16px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <img
            src="/logo-minjuventud.png"
            alt="Ministerio del Poder Popular para la Juventud"
            style={{
              height: '56px',
              maxWidth: '280px',
              objectFit: 'contain'
            }}
          />
        </div>

        <h1 style={{
          fontSize: '1.55rem',
          color: '#f8fafc',
          marginBottom: '6px',
          letterSpacing: '-0.02em',
          textShadow: '0 2px 10px rgba(0,0,0,0.6)'
        }}>
          Control y Seguimiento de Personal
        </h1>
        <p style={{
          fontSize: '0.88rem',
          color: '#94a3b8',
          maxWidth: '480px',
          margin: '0 auto'
        }}>
          Consulta y Actualización de Datos de Votación y Ubicación Electoral
        </p>
      </div>

      {/* Tarjeta Principal */}
      <div className="glass-card" style={{
        maxWidth: registros ? '680px' : '480px',
        width: '100%',
        padding: '32px 28px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
        transition: 'all 0.3s ease'
      }}>

        {/* ALERTA DE ERROR */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            background: 'rgba(239, 68, 68, 0.14)',
            border: '1.5px solid rgba(239, 68, 68, 0.45)',
            color: '#fca5a5',
            padding: '14px 16px',
            borderRadius: '12px',
            fontSize: '0.88rem',
            marginBottom: '22px'
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '2px', color: '#fecaca' }}>
                Atención
              </strong>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* ALERTA DE ÉXITO */}
        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(16, 185, 129, 0.16)',
            border: '1.5px solid rgba(16, 185, 129, 0.45)',
            color: '#a7f3d0',
            padding: '14px 16px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            marginBottom: '22px'
          }}>
            <CheckCircle2 size={22} style={{ flexShrink: 0, color: '#34d399' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* VISTA 1: FORMULARIO DE CONSULTA INICIAL */}
        {!registros && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'rgba(7, 54, 126, 0.5)',
                color: '#93c5fd',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                marginBottom: '12px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <Vote size={15} />
                <span>VERIFICACIÓN ELECTORAL</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', color: '#f8fafc', marginBottom: '6px' }}>
                Ingrese su Cédula de Identidad
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Solo podrán consultar y actualizar su información las cédulas registradas en el sistema institucional.
              </p>
            </div>

            <form onSubmit={handleConsultar}>
              <div style={{ marginBottom: '22px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Cédula de Identidad
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="input-control"
                    value={nacionalidad}
                    onChange={(e) => setNacionalidad(e.target.value)}
                    style={{
                      width: '78px',
                      height: '50px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      padding: '0 8px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="V">V-</option>
                    <option value="E">E-</option>
                    <option value="J">J-</option>
                  </select>

                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Ej: 14235890"
                      value={numeroCedula}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setNumeroCedula(val);
                      }}
                      style={{
                        height: '50px',
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        letterSpacing: '0.05em'
                      }}
                      autoFocus
                    />
                  </div>
                </div>
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                  Ingrese únicamente los números sin puntos ni comas.
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  height: '50px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                disabled={loading}
              >
                {loading ? (
                  <span>Consultando en base de datos...</span>
                ) : (
                  <>
                    <Search size={19} />
                    <span>Consultar</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* VISTA 2: RESULTADOS Y EDICIÓN DE CAMPOS ELECTORALES */}
        {registros && currentReg && (
          <div>
            {/* Cabecera del Funcionario Encontrado */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              background: 'rgba(7, 31, 69, 0.65)',
              padding: '16px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  {(() => {
                    const isInj = currentReg.ente === 'INJ' || (currentReg.ente && (currentReg.ente.toUpperCase().includes('INJ') || currentReg.ente.toUpperCase().includes('INSTITUTO')));
                    return (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: isInj ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        border: isInj ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)',
                        color: isInj ? '#34d399' : '#93c5fd'
                      }}>
                        {isInj ? '🏢 INJ' : '🏛️ MinJuventud'}
                      </span>
                    );
                  })()}
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: getCategoriaBadgeColor(currentReg.categoria).bg,
                    border: `1px solid ${getCategoriaBadgeColor(currentReg.categoria).border}`,
                    color: getCategoriaBadgeColor(currentReg.categoria).text
                  }}>
                    {currentReg.categoria}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#93c5fd', fontWeight: 700 }}>
                    {currentReg.cedula}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff', lineHeight: 1.2, marginBottom: '4px' }}>
                  {currentReg.apellido_nombre}
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {currentReg.cargo && <span>{currentReg.cargo} • </span>}
                  <span>{currentReg.unidad_adscripcion || ((currentReg.ente === 'INJ' || (currentReg.ente && currentReg.ente.toUpperCase().includes('INJ'))) ? 'INSTITUTO NACIONAL DE LA JUVENTUD' : 'MINISTERIO DE LA JUVENTUD')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetConsulta}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '6px 12px', gap: '5px' }}
                title="Realizar una nueva consulta"
              >
                <RotateCcw size={14} />
                <span>Nueva Consulta</span>
              </button>
            </div>

            {/* Si existen múltiples registros para la misma cédula */}
            {registros.length > 1 && (
              <div style={{ marginBottom: '18px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Seleccione el registro a consultar/editar:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {registros.map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelectRecord(i)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: selectedIdx === i ? '1.5px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                        background: selectedIdx === i ? 'rgba(59, 130, 246, 0.25)' : 'rgba(15, 23, 42, 0.5)',
                        color: selectedIdx === i ? '#93c5fd' : 'var(--text-muted)'
                      }}
                    >
                      {((r.ente === 'INJ' || (r.ente && r.ente.toUpperCase().includes('INJ'))) ? '🏢 INJ' : '🏛️ MinJuventud')} - {r.categoria} ({r.cargo || 'Funcionario'})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* BLOQUE DESTACADO DE PARTICIPACIÓN / CONFIRMACIÓN DE VOTO */}
            {currentReg.participo_consulta ? (
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.28) 100%)',
                border: '1.5px solid #10b981',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.25)',
                    padding: '8px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle2 size={26} color="#34d399" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#34d399', fontSize: '1rem', letterSpacing: '-0.01em' }}>
                      ¡PARTICIPACIÓN CONFIRMADA EN LA CONSULTA!
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#a7f3d0', marginTop: '2px' }}>
                      {currentReg.fecha_hora_voto ? (
                        <span>Voto registrado el: {new Date(currentReg.fecha_hora_voto).toLocaleString('es-VE')}</span>
                      ) : (
                        <span>Voto registrado y computado en el reporte oficial por horas</span>
                      )}
                    </div>
                  </div>
                </div>

                <span style={{
                  background: '#047857',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle2 size={14} />
                  <span>YA VOTÓ</span>
                </span>
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.28) 100%)',
                border: '1.5px solid #f59e0b',
                borderRadius: '14px',
                padding: '18px 22px',
                marginBottom: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.25)',
                    padding: '10px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Vote size={28} color="#fbbf24" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '1.05rem' }}>
                      ¿Ya participó en la Consulta Popular?
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#fef3c7', marginTop: '3px' }}>
                      Presione el botón para registrar su voto de inmediato con la hora oficial exacta.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmarVotoDirecto}
                  disabled={saving}
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontSize: '0.96rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(5, 150, 105, 0.45)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <CheckCircle2 size={20} />
                  <span>¡CONFIRMAR QUE YA VOTÉ!</span>
                </button>
              </div>
            )}

            {/* FORMULARIO DE EDICIÓN EXCLUSIVA: ESTADO, MUNICIPIO, PARROQUIA, CENTRO DE VOTACIÓN */}
            <form onSubmit={handleGuardarCambios}>
              <div style={{
                background: 'rgba(3, 14, 38, 0.55)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '20px 18px',
                marginBottom: '22px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Vote size={18} color="#38bdf8" />
                  <h4 style={{ fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700 }}>
                    Datos de Residencia y Centro de Votación
                  </h4>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
                  Modifique o complete los campos correspondientes a su centro electoral según los registros del CNE:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  {/* ESTADO */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                      textTransform: 'uppercase'
                    }}>
                      Estado
                    </label>
                    <select
                      className="input-control"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      style={{ height: '44px', fontSize: '0.88rem' }}
                    >
                      <option value="">-- Seleccionar Estado --</option>
                      {ESTADOS_VENEZUELA.map((est) => (
                        <option key={est} value={est}>
                          {est}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* MUNICIPIO */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                      textTransform: 'uppercase'
                    }}>
                      Municipio
                    </label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Ej: LIBERTADOR, CHACAO..."
                      value={formData.municipio}
                      onChange={(e) => setFormData({ ...formData, municipio: e.target.value.toUpperCase() })}
                      style={{ height: '44px', fontSize: '0.88rem' }}
                    />
                  </div>

                  {/* PARROQUIA */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                      textTransform: 'uppercase'
                    }}>
                      Parroquia
                    </label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Ej: EL RECREO, PETARE..."
                      value={formData.parroquia}
                      onChange={(e) => setFormData({ ...formData, parroquia: e.target.value.toUpperCase() })}
                      style={{ height: '44px', fontSize: '0.88rem' }}
                    />
                  </div>

                  {/* CENTRO DE VOTACIÓN */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                      textTransform: 'uppercase'
                    }}>
                      Centro de Votación
                    </label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Ej: LICEO ANDRÉS BELLO, COLEGIO DON BOSCO..."
                      value={formData.centro_votacion}
                      onChange={(e) => setFormData({ ...formData, centro_votacion: e.target.value.toUpperCase() })}
                      style={{ height: '44px', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleResetConsulta}
                  className="btn btn-secondary"
                  style={{ flex: 1, height: '48px', fontSize: '0.9rem' }}
                >
                  <ArrowLeft size={16} />
                  <span>Volver</span>
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, height: '48px', fontSize: '0.95rem', fontWeight: 700 }}
                  disabled={saving}
                >
                  {saving ? (
                    <span>Guardando...</span>
                  ) : currentReg.participo_consulta ? (
                    <>
                      <Save size={18} />
                      <span>Actualizar Datos</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Guardar y Confirmar Voto</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Institucional */}
        <div style={{
          marginTop: '28px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
            Ministerio del Poder Popular para la Juventud © {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );
}
