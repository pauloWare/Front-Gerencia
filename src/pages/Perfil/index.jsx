import { useState, useEffect } from 'react';
import api from '../../service/api';
import { ClipboardList } from 'lucide-react';

export default function Perfil() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarPerfil();
  }, []);

  const buscarPerfil = async () => {
    try {
      const response = await api.get('/usuario');
      const usuarios = response.data;
      const stored = localStorage.getItem('usuario');
      if (stored) {
        const currentUser = JSON.parse(stored);
        const found = usuarios.find(u => u.id === currentUser.id) || usuarios.find(u => u.email === currentUser.email);
        setUsuario(found || currentUser);
      } else {
        setUsuario(usuarios[0] || null);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Carregando...</div>;

  const nome = usuario?.nome || usuario?.name || 'Usuário';
  const cargo = usuario?.role || usuario?.tipo || 'Administrador';
  const initiais = nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <>
      {usuario && (
        <div className="theme-card">
          {/* Avatar + Nome */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #1a56db)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff', flexShrink: 0
            }}>
              {initiais}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{nome}</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{cargo}</p>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="form-section">
            <h3 className="section-title"><ClipboardList size={16} /> Dados Pessoais</h3>
            <div className="theme-form">
              <div className="theme-form-row">
                <div className="theme-form-group">
                  <label>Email</label>
                  <input className="theme-input" value={usuario.email || '-'} readOnly />
                </div>
                <div className="theme-form-group">
                  <label>Telefone</label>
                  <input className="theme-input" value={usuario.telefone || '-'} readOnly />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}