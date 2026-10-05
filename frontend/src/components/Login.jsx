import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { authApi } from '../api';

export default function Login({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Por favor ingrese la contraseña de acceso.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.login(password);
      const token = response.data.access_token;
      localStorage.setItem('minjuventud_token', token);
      onLoginSuccess();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al intentar conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
      <div className="glass-card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '40px 32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Header institucional */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.96)',
            padding: '10px 20px',
            borderRadius: '14px',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <img
              src="/logo-minjuventud.png"
              alt="Ministerio del Poder Popular para la Juventud"
              style={{
                height: '52px',
                maxWidth: '270px',
                objectFit: 'contain'
              }}
            />
          </div>
          <h2 style={{ fontSize: '1.35rem', color: '#f8fafc', marginBottom: '4px' }}>
            Control y Seguimiento de Personal
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Acceso Autorizado al Sistema
          </p>
          <div style={{
            marginTop: '8px',
            display: 'inline-block',
            fontSize: '0.72rem',
            padding: '3px 10px',
            background: 'rgba(7, 54, 126, 0.4)',
            color: '#93c5fd',
            borderRadius: '9999px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            CONTROL DE PERSONAL
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Contraseña de Acceso
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-control"
                placeholder="Ingrese contraseña de seguridad..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '44px', height: '48px', fontSize: '0.95rem' }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '48px', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? (
              <span>Verificando acceso...</span>
            ) : (
              <>
                <Lock size={18} />
                <span>Ingresar al Sistema</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Ministerio del Poder Popular para la Juventud © {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );
}
