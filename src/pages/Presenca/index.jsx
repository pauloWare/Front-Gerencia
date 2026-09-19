import React, { useState, useEffect } from 'react';
import api from '../../service/api';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, RefreshCw, CalendarDays } from 'lucide-react';
import { formatDate } from '../../lib/dateUtils';

/**
 * Página da academia que exibe o QR Code do dia.
 * O QR contém apenas a URL pública de registro + um token diário (não contém CPF).
 * O token é gerado/validado pelo backend e muda automaticamente a cada dia.
 */
export default function Presenca() {
  const [token, setToken] = useState('');
  const [data, setData] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const carregarToken = async () => {
    try {
      const res = await api.get('/frequencia/token');
      setToken(res.data?.token || '');
      setData(res.data?.data || '');
      setErro('');
    } catch (error) {
      console.error('Erro ao buscar token do dia:', error);
      setErro('Não foi possível gerar o QR Code do dia.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarToken();
    // Revalida periodicamente para renovar o QR automaticamente quando o dia virar
    const intervalo = setInterval(carregarToken, 60000);
    return () => clearInterval(intervalo);
  }, []);

  const urlRegistro = token ? `${window.location.origin}/registrar-presenca?token=${token}` : '';

  return (
    <div className="theme-card" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <h2 className="section-title" style={{ justifyContent: 'center' }}>
        <QrCode size={16} /> Presença por QR Code
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 0 }}>
        O aluno escaneia o QR Code abaixo com o celular e informa o CPF para registrar a presença.
      </p>

      {erro && (
        <div className="form-message error" style={{ marginBottom: 16, justifyContent: 'center' }}>{erro}</div>
      )}

      {carregando ? (
        <div className="loading">Gerando QR Code...</div>
      ) : token ? (
        <>
          <div style={{ display: 'inline-block', padding: 16, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <QRCodeSVG value={urlRegistro} size={240} level="M" />
          </div>
          <p style={{ marginTop: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <CalendarDays size={16} /> Válido para {formatDate(data)}
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all', marginTop: 4 }}>
            {urlRegistro}
          </p>
        </>
      ) : null}

      <div style={{ marginTop: 20 }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={carregarToken}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} /> Atualizar QR
        </button>
      </div>
    </div>
  );
}