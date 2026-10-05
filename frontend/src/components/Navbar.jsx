import React from 'react';
import { UploadCloud, LogOut, Shield, Database } from 'lucide-react';

export default function Navbar({ onOpenUpload, onOpenCreate, onLogout }) {
  return (
    <header style={{
      background: 'rgba(4, 18, 43, 0.88)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '14px',
        paddingBottom: '14px',
      }}>
        {/* Logo e Identidad */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '6px 14px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <img
              src="/logo-minjuventud.png"
              alt="Ministerio del Poder Popular para la Juventud"
              style={{
                height: '42px',
                maxWidth: '220px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.15rem', color: '#f8fafc', lineHeight: 1.1 }}>
                Control y Seguimiento de Personal
              </h1>
              <span style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span className="pulse-indicator"></span>
                MySQL Activo
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Ministerio del Poder Popular para la Juventud
            </p>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onOpenCreate}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '9px 14px' }}
            title="Registrar funcionario manualmente"
          >
            <span>+ Nuevo Funcionario</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '9px 16px' }}
          >
            <UploadCloud size={18} />
            <span>Carga Masiva Excel</span>
          </button>

          <button
            onClick={onLogout}
            className="btn btn-secondary"
            title="Cerrar Sesión"
            style={{ padding: '9px 12px' }}
          >
            <LogOut size={17} color="var(--text-muted)" />
          </button>
        </div>
      </div>
    </header>
  );
}
