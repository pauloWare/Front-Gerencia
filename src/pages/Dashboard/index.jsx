import { useState, useEffect } from 'react';
import api from '../../service/api';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Users, CalendarCheck, DollarSign, CreditCard, AlertTriangle, CheckCircle, TrendingDown, User, Zap, Wallet, Wrench } from 'lucide-react';

const fmtMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAlunos: 0,
    mensalidadesPendentes: 0,
    frequenciaHoje: 0,
    presencasHoje: 0,
    alunosBaixaFrequencia: 0,
    receitaMes: 0,
    aReceber: 0,
    despesaMes: 0,
    saldoMes: 0,
    manutencoesPendentes: 0,
  });
  const [alunosRecentes, setAlunosRecentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarDashboard();
  }, []);

  const buscarDashboard = async () => {
    try {
      const [resDash, resAlunos] = await Promise.all([
        api.get('/dashboard'),
        api.get('/aluno'),
      ]);
      const data = resDash.data;
      setStats({
        totalAlunos: data.totalAlunos || 0,
        mensalidadesPendentes: data.mensalidadesPendentes || 0,
        frequenciaHoje: data.frequenciaHoje || 0,
        presencasHoje: data.presencasHoje || 0,
        alunosBaixaFrequencia: data.alunosBaixaFrequencia || 0,
        receitaMes: data.receitaMes || 0,
        aReceber: data.aReceber || 0,
        despesaMes: data.despesaMes || 0,
        saldoMes: data.saldoMes || 0,
        manutencoesPendentes: data.manutencoesPendentes || 0,
      });
      const alunos = Array.isArray(resAlunos.data) ? resAlunos.data : [];
      setAlunosRecentes(alunos.slice(0, 5));
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Carregando painel...</div>;

  const pendentes = stats.mensalidadesPendentes;

  return (
    <>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={buscarDashboard} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>

        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <div className="stat-card">
            <div className="stat-icon blue"><Users size={20} /></div>
            <h3>Total de Alunos</h3>
            <p className="stat-value">{stats.totalAlunos}</p>
            <p className="stat-label">Matrículas ativas</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><CalendarCheck size={20} /></div>
            <h3>Frequência Hoje</h3>
            <p className="stat-value">{stats.frequenciaHoje}%</p>
            <p className="stat-label">Presença do dia</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><DollarSign size={20} /></div>
            <h3>Receita do Mês</h3>
            <p className="stat-value">R$ {fmtMoeda(stats.receitaMes)}</p>
            <p className="stat-label">Pagamentos recebidos</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow"><CreditCard size={20} /></div>
            <h3>Pendências</h3>
            <p className="stat-value">{pendentes}</p>
            <p className="stat-label">Mensalidades em aberto</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><CreditCard size={20} /></div>
            <h3>A Receber</h3>
            <p className="stat-value">R$ {fmtMoeda(stats.aReceber)}</p>
            <p className="stat-label">Mensalidades pendentes</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon red"><TrendingDown size={20} /></div>
            <h3>Despesas do Mês</h3>
            <p className="stat-value">R$ {fmtMoeda(stats.despesaMes)}</p>
            <p className="stat-label">Fixas + variáveis</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><Wallet size={20} /></div>
            <h3>Saldo do Mês</h3>
            <p className="stat-value">R$ {fmtMoeda(stats.saldoMes)}</p>
            <p className="stat-label">Receitas - despesas</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><Wrench size={20} /></div>
            <h3>Manutenções Pendentes</h3>
            <p className="stat-value">{stats.manutencoesPendentes}</p>
            <p className="stat-label">Corretivas + preventivas</p>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <div className="info-card-header"><Zap size={16} /> Alertas & Avisos</div>
            {pendentes > 0 ? (
              <div className="alert-card warning" style={{ marginBottom: 12 }}>
                <span className="alert-icon"><AlertTriangle size={18} /></span>
                <div>
                  <strong>{pendentes} mensalidade{pendentes !== 1 ? 's' : ''} pendente{pendentes !== 1 ? 's' : ''}</strong><br />
                  {pendentes === 1 ? 'Um aluno está com pagamento em aberto.' : `${pendentes} alunos estão com pagamento em aberto.`}
                </div>
              </div>
            ) : (
              <div className="alert-card info">
                <span className="alert-icon"><CheckCircle size={18} /></span>
                <div><strong>Tudo em dia</strong><br />Nenhuma pendência financeira no momento.</div>
              </div>
            )}
            {stats.frequenciaHoje < 30 && (
              <div className="alert-card warning" style={{ marginBottom: 12 }}>
                <span className="alert-icon"><TrendingDown size={18} /></span>
                <div><strong>Frequência baixa hoje</strong><br />Apenas {stats.frequenciaHoje}% dos alunos compareceram.</div>
              </div>
            )}
            {stats.manutencoesPendentes > 0 && (
              <div className="alert-card warning">
                <span className="alert-icon"><Wrench size={18} /></span>
                <div>
                  <strong>{stats.manutencoesPendentes} manutenção{stats.manutencoesPendentes !== 1 ? 'ões' : ''} pendente{stats.manutencoesPendentes !== 1 ? 's' : ''}</strong><br />
                  Chamados abertos e revisões preventivas em aberto.
                </div>
              </div>
            )}
          </div>

          <div className="info-card">
            <div className="info-card-header"><User size={16} /> Últimos Alunos</div>
            {alunosRecentes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum aluno cadastrado</p>
            ) : (
              alunosRecentes.map(aluno => (
                <div className="info-row" key={aluno.id}>
                  <span className="label">{aluno.nome}</span>
                  <span className={`status-badge ${aluno.situacao || 'INATIVO'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                    {aluno.situacao === 'ATIVO' ? 'Ativo' : 
                     aluno.situacao === 'INATIVO' ? 'Inativo' : 
                     aluno.situacao === 'SUSPENSO' ? 'Suspenso' : 
                     aluno.situacao === 'CANCELADO' ? 'Cancelado' : (aluno.situacao || 'Inativo')}
                  </span>
                </div>
              ))
            )}
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary btn-xs" onClick={() => navigate('/alunos')}>Ver todos os alunos →</button>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-header"><CalendarCheck size={16} /> Frequência</div>
            <div className="info-row">
              <span className="label">Presenças hoje</span>
              <strong>{stats.presencasHoje}</strong>
            </div>
            <div className="info-row">
              <span className="label">Alunos com baixa frequência</span>
              <strong>{stats.alunosBaixaFrequencia}</strong>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '10px 0 0' }}>
              Presenças de hoje contam cada aluno uma única vez. Baixa frequência = menos de 70% no mês.
            </p>
          </div>
        </div>

        <div className="info-card" style={{ marginTop: 24 }}>
          <div className="info-card-header"><Zap size={16} /> Atalhos Rápidos</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/cadastro')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} /> Novo Aluno</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/mensalidades')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CreditCard size={14} /> Mensalidades</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/financeiro')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><DollarSign size={14} /> Financeiro</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/presenca')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CalendarCheck size={14} /> Presença (QR)</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/manutencao')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Wrench size={14} /> Manutenção</button>
          </div>
        </div>
      </>
  );
}
