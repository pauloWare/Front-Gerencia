import React, { useState } from 'react';
import api from '../../service/api';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../lib/useRole';
import { Dumbbell, Mail, Lock, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setRole } = useRole();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/usuario/login', { email, senha });
      const data = response.data;

      if (data && data.token) {
        setMessage('Login realizado!');
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        setRole(data.usuario?.cargo || null);
        setTimeout(() => navigate('/dashboard'), 300);
      } else {
        setMessage('Email ou senha inválidos.');
      }
    } catch (error) {
      const mensagem = error.response?.data?.erro;
      setMessage(mensagem || 'Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const sucesso = message.includes('Login realizado');

  return (
    <div className="login-container">
      <form className="form-login" onSubmit={handleLogin}>
        <div className="login-header">
          <div className="login-logo-icon">
            <Dumbbell size={26} strokeWidth={2} />
          </div>
          <div className="login-brand">
            <span className="login-brand-name">ACADEMIA</span>
            <span className="login-brand-sub">Sistema de Gerenciamento</span>
          </div>
        </div>

        <span className="login-welcome">Acesse sua conta para continuar</span>

        <div className="login-fields">
          <div className="login-field">
            <label htmlFor="email">Email</label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon" />
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="login-field">
            <label htmlFor="senha">Senha</label>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon" />
              <input
                id="senha"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
          <LogIn size={16} />
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        {message && (
          <div className={`form-message ${sucesso ? 'success' : 'error'}`}>
            {sucesso ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message.replace('✅ ', '').replace('❌ ', '')}</span>
          </div>
        )}
      </form>
    </div>
  );
}