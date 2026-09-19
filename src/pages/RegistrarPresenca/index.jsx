import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../service/api';
import { QrCode, UserCheck, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDate, formatTime } from '../../lib/dateUtils';

// Chave do CPF no localStorage. É apenas conveniência de UX — a validação
// definitiva (token, aluno, duplicidade) sempre acontece no backend.
const CPF_KEY = 'cpfAluno';

const apenasDigitos = (valor) => (valor || '').replace(/\D/g, '');

const mascararCpf = (valor) => {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const cpfOculto = (cpf) => {
  const d = apenasDigitos(cpf);
  return d.length === 11 ? `•••.•••.•••-${d.slice(9)}` : cpf;
};

/**
 * Página PÚBLICA de registro de presença (sem login administrativo).
 * Recebe o token diário do QR Code e registra a presença do aluno pelo CPF.
 */
export default function RegistrarPresenca() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [cpf, setCpf] = useState('');
  const [aluno, setAluno] = useState(null);
  const [registro, setRegistro] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState('error');
  const [salvando, setSalvando] = useState(false);

  const carregarAluno = useCallback(async (cpfValue) => {
    try {
      const res = await api.get(`/aluno/cpf/${encodeURIComponent(cpfValue)}`);
      setAluno(res.data);
    } catch (error) {
      // CPF salvo deixou de existir (ou falhou a consulta): volta ao formulário
      setAluno(null);
      if (error?.response?.status === 404) {
        localStorage.removeItem(CPF_KEY);
        setCpf('');
      }
    }
  }, []);

  // Recupera o CPF salvo anteriormente (conveniência para o aluno)
  useEffect(() => {
    const salvo = localStorage.getItem(CPF_KEY);
    if (salvo) {
      setCpf(salvo);
      carregarAluno(salvo);
    }
  }, [carregarAluno]);

  const registrarPresenca = async (e) => {
    if (e) e.preventDefault();
    if (!token) {
      setMensagem('QR Code ausente ou inválido. Escaneie o QR Code exibido na recepção da academia.');
      setTipoMensagem('error');
      return;
    }
    if (apenasDigitos(cpf).length !== 11) {
      setMensagem('Informe um CPF válido (11 dígitos).');
      setTipoMensagem('error');
      return;
    }

    setSalvando(true);
    setMensagem('');
    try {
      const res = await api.post('/frequencia/check-in', { token, cpf });
      localStorage.setItem(CPF_KEY, cpf);
      setRegistro(res.data);
      if (res.data?.aluno) setAluno(res.data.aluno);
      setMensagem(res.data?.mensagem || 'Presença registrada com sucesso!');
      setTipoMensagem('success');
    } catch (error) {
      const msg = error.response?.data?.erro || error.response?.data?.error
        || 'Não foi possível registrar a presença. Tente novamente.';
      setMensagem(msg);
      setTipoMensagem('error');
    } finally {
      setSalvando(false);
    }
  };

  const trocarAluno = () => {
    localStorage.removeItem(CPF_KEY);
    setAluno(null);
    setRegistro(null);
    setCpf('');
    setMensagem('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="theme-card" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="sidebar-logo" style={{ margin: '0 auto 12px' }}>
            <QrCode size={22} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.2rem', margin: 0 }}>Registrar Presença</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            {registro ? 'Sua presença de hoje foi confirmada.' : 'Informe seu CPF para registrar sua presença de hoje.'}
          </p>
        </div>

        {mensagem && (
          <div className={`form-message ${tipoMensagem === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
            {tipoMensagem === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{mensagem}</span>
          </div>
        )}

        {registro ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>{registro.aluno?.nome}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 0 }}>
              {formatDate(registro.data)} às {formatTime(registro.horaEntrada)}
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={trocarAluno}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8 }}
            >
              <LogOut size={14} /> Trocar aluno
            </button>
          </div>
        ) : (
          <form onSubmit={registrarPresenca} className="dialog-form" style={{ marginTop: 0 }}>
            {aluno ? (
              <>
                <p style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  Olá, {aluno.nome}!
                </p>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  CPF salvo: {cpfOculto(cpf)}
                </p>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={salvando}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <UserCheck size={14} /> {salvando ? 'Registrando...' : 'Registrar presença'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={trocarAluno}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <LogOut size={14} /> Trocar aluno
                </button>
              </>
            ) : (
              <>
                <div className="form-field">
                  <label className="form-label" htmlFor="cpf">CPF</label>
                  <input
                    id="cpf"
                    className="theme-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(mascararCpf(e.target.value))}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={salvando}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <UserCheck size={14} /> {salvando ? 'Registrando...' : 'Registrar presença'}
                </button>
              </>
            )}
          </form>
        )}

        {!token && (
          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 16 }}>
            É necessário escanear o QR Code da academia para registrar a presença.
          </p>
        )}
      </div>
    </div>
  );
}
