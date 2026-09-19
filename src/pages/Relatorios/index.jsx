import React, { useState, useEffect } from 'react';
import api from '../../service/api';
import { Users, CalendarCheck, DollarSign, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

export default function Relatorios() {
  const [dashboard, setDashboard] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [indicadores, setIndicadores] = useState(null);
  const [estimativa, setEstimativa] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/aluno'),
      api.get('/funcionario'),
      api.get('/financeiro/indicadores'),
      api.get('/financeiro/estimativa'),
    ])
      .then(([resDash, resAlunos, resFunc, resInd, resEst]) => {
        setDashboard(resDash.data);
        setAlunos(Array.isArray(resAlunos.data) ? resAlunos.data : []);
        setFuncionarios(Array.isArray(resFunc.data) ? resFunc.data : []);
        setIndicadores(resInd.data || null);
        setEstimativa(resEst.data || null);
      })
      .catch(error => console.error('Erro ao buscar relatórios:', error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Carregando...</div>;

  const totalAlunos = dashboard?.totalAlunos ?? alunos.length;
  const receitaMes = dashboard?.receitaMes ?? 0;
  const pendentes = dashboard?.mensalidadesPendentes ?? 0;
  const frequencia = dashboard?.frequenciaHoje ?? 0;
  const ativos = alunos.filter(a => a.ativo !== false).length;
  const inativos = alunos.filter(a => a.ativo === false).length;
  const totalFunc = funcionarios.length;

  return (
    <>
      {/* Indicadores principais */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={20} /></div>
          <h3>Total de Alunos</h3>
          <p className="stat-value">{totalAlunos}</p>
          <p className="stat-label">{ativos} ativos · {inativos} inativos</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CalendarCheck size={20} /></div>
          <h3>Frequência Hoje</h3>
          <p className="stat-value">{frequencia}%</p>
          <p className="stat-label">Presença do dia</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><DollarSign size={20} /></div>
          <h3>Receita do Mês</h3>
          <p className="stat-value">R$ {fmt(receitaMes)}</p>
          <p className="stat-label">Faturamento</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><CreditCard size={20} /></div>
          <h3>Pendências</h3>
          <p className="stat-value">{pendentes}</p>
          <p className="stat-label">Mensalidades em aberto</p>
        </div>
      </div>

      {/* Grid com mais informações */}
      <div className="info-grid">
        <div className="info-card">
          <div className="info-card-header"><Users size={16} /> Alunos por Situação</div>
          <div className="info-row">
            <span className="label">Ativos</span>
            <span className="value" style={{ color: 'var(--success)' }}>{ativos}</span>
          </div>
          <div className="info-row">
            <span className="label">Inativos</span>
            <span className="value" style={{ color: 'var(--danger)' }}>{inativos}</span>
          </div>
          <div className="info-row">
            <span className="label">Total</span>
            <span className="value">{totalAlunos}</span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-header"><CreditCard size={16} /> Financeiro</div>
          <div className="info-row">
            <span className="label">Receita do Mês</span>
            <span className="value" style={{ color: 'var(--success)' }}>R$ {fmt(receitaMes)}</span>
          </div>
          <div className="info-row">
            <span className="label">Mensalidades Pendentes</span>
            <span className="value" style={{ color: 'var(--warning)' }}>{pendentes}</span>
          </div>
          <div className="info-row">
            <span className="label">Funcionários</span>
            <span className="value">{totalFunc}</span>
          </div>
        </div>
      </div>

      {/* Indicadores financeiros consolidados */}
      <div className="info-card" style={{ marginTop: 24 }}>
        <div className="info-card-header"><DollarSign size={16} /> Indicadores Financeiros</div>
        {indicadores ? (
          <>
            <div className="info-row">
              <span className="label">Receita Recebida (pagamentos realizados)</span>
              <span className="value" style={{ color: 'var(--success)' }}>R$ {fmt(indicadores.receitaRecebida)}</span>
            </div>
            <div className="info-row">
              <span className="label">A Receber (mensalidades em aberto)</span>
              <span className="value" style={{ color: 'var(--warning)' }}>R$ {fmt(indicadores.aReceber)}</span>
            </div>
            <div className="info-row">
              <span className="label">Despesas Fixas</span>
              <span className="value" style={{ color: 'var(--danger)' }}>R$ {fmt(indicadores.despesasFixas)}</span>
            </div>
            <div className="info-row">
              <span className="label">Despesas Variáveis</span>
              <span className="value" style={{ color: 'var(--danger)' }}>R$ {fmt(indicadores.despesasVariaveis)}</span>
            </div>
            <div className="info-row">
              <span className="label">Despesas Totais (fixas + variáveis)</span>
              <span className="value" style={{ color: 'var(--danger)' }}>R$ {fmt(indicadores.despesasTotais)}</span>
            </div>
            <div className="info-row">
              <span className="label">Saldo</span>
              <span className="value" style={{ color: Number(indicadores.saldo) < 0 ? 'var(--danger)' : 'var(--primary)' }}>
                R$ {fmt(indicadores.saldo)}
              </span>
            </div>
          </>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Indicadores indisponíveis.</p>
        )}
      </div>

      {/* Estimativa de cenários */}
      <div className="info-card" style={{ marginTop: 24 }}>
        <div className="info-card-header"><TrendingUp size={16} /> Estimativa de Cenários</div>
        {estimativa && estimativa.mesesAnalisados && estimativa.mesesAnalisados.length > 0 ? (
          <>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 4px' }}>
              Receita média dos últimos meses: <strong>R$ {fmt(estimativa.mediaReceita)}</strong> · Despesa média: <strong>R$ {fmt(estimativa.mediaDespesa)}</strong>
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 8px' }}>
              Meses considerados: {estimativa.mesesAnalisados.join(', ')}
            </p>
            <div className="cenario-grid">
              {estimativa.cenarios.map(c => (
                <div className="cenario-card" key={c.nome}>
                  <div className="cenario-nome"><TrendingUp size={14} /> {c.nome}</div>
                  <div className="cenario-valor receita">R$ {fmt(c.receita)}</div>
                  <div className="cenario-rotulo">Receita estimada</div>
                  <div className="cenario-valor despesa">R$ {fmt(c.despesa)}</div>
                  <div className="cenario-rotulo">Despesa estimada</div>
                  <div className="cenario-valor saldo">R$ {fmt(c.saldo)}</div>
                  <div className="cenario-rotulo">Saldo estimado</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--warning-text)', background: 'var(--warning-bg)', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginTop: 16 }}>
              {estimativa.nota}
            </p>
          </>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Sem histórico financeiro suficiente para estimar cenários.
          </p>
        )}
      </div>
    </>
  );
}
