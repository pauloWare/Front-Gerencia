import React, { useState, useEffect } from 'react';
import api from '../../service/api';
import { Wallet, TrendingUp, TrendingDown, Scale, Banknote, BarChart3 } from 'lucide-react';

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const MESES_NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function BarChart({ data }) {
  const maxVal = Math.max(1, ...data.map(m => Math.max(m.receitas || 0, m.despesas || 0)));
  return (
    <>
      <div className="bar-chart">
        {data.map(m => (
          <div className="bar-col" key={m.referencia}>
            <div className="bar-pair">
              <div
                className="bar bar-receita"
                title={`${m.rotulo} — Receitas: R$ ${fmt(m.receitas)}`}
                style={{ height: `${Math.max(2, (m.receitas / maxVal) * 100)}%` }}
              />
              <div
                className="bar bar-despesa"
                title={`${m.rotulo} — Despesas: R$ ${fmt(m.despesas)}`}
                style={{ height: `${Math.max(2, (m.despesas / maxVal) * 100)}%` }}
              />
            </div>
            <div className="bar-label">{m.rotulo}</div>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--success)' }} /> Receitas</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--danger)' }} /> Despesas</span>
      </div>
    </>
  );
}

export default function HistoricoFaturamento() {
  const [meses, setMeses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [filtro, setFiltro] = useState({ periodo: '12', mes: '', ano: '' });

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get('/financeiro/faturamento/historico');
        setMeses(Array.isArray(res.data?.meses) ? res.data.meses : []);
      } catch (error) {
        console.error('Erro ao buscar histórico de faturamento:', error);
        setErro('Erro ao carregar o histórico de faturamento.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) return <div className="loading">Carregando faturamento...</div>;

  const anos = [...new Set(meses.map(m => m.referencia.slice(0, 4)))].sort((a, b) => b - a);

  const ajustarFiltro = (campo, valor) => setFiltro(prev => ({ ...prev, [campo]: valor }));

  let filtrados = meses.slice();
  if (filtro.periodo && filtro.periodo !== 'todos') {
    filtrados = filtrados.slice(0, Number(filtro.periodo));
  }
  if (filtro.mes) {
    filtrados = filtrados.filter(m => Number(m.referencia.slice(5, 7)) === Number(filtro.mes));
  }
  if (filtro.ano) {
    filtrados = filtrados.filter(m => m.referencia.slice(0, 4) === filtro.ano);
  }

  const soma = (key) => filtrados.reduce((acc, m) => acc + Number(m[key] || 0), 0);
  const qtd = filtrados.length;
  const faturamento = soma('receitas');
  const totalDespesas = soma('despesas');
  const saldo = faturamento - totalDespesas;

  const cards = [
    { label: 'Faturamento do Período', valor: faturamento, icon: <Wallet size={20} />, cor: 'blue', moeda: true },
    { label: 'Total Recebido', valor: faturamento, icon: <Banknote size={20} />, cor: 'green', moeda: true },
    { label: 'Total de Despesas', valor: totalDespesas, icon: <TrendingDown size={20} />, cor: 'red', moeda: true },
    { label: 'Saldo', valor: saldo, icon: <Scale size={20} />, cor: saldo < 0 ? 'red' : 'orange', moeda: true },
    { label: 'Média Mensal', valor: qtd > 0 ? faturamento / qtd : 0, icon: <TrendingUp size={20} />, cor: 'purple', moeda: true },
  ];

  return (
    <>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {cards.map(card => (
          <div className="stat-card" key={card.label}>
            <div className={`stat-icon ${card.cor}`}>{card.icon}</div>
            <h3>{card.label}</h3>
            <p className="stat-value" style={{ color: card.valor < 0 ? 'var(--danger)' : undefined }}>
              {card.moeda ? `R$ ${fmt(card.valor)}` : fmt(card.valor)}
            </p>
            <p className="stat-label">{qtd > 0 ? `${qtd} mês(es) analisado(s)` : 'Sem dados no período'}</p>
          </div>
        ))}
      </div>

      {erro && <div className="form-message error" style={{ marginBottom: 16 }}>{erro}</div>}

      <div className="filter-row">
        <div className="filter-group">
          <label>Período</label>
          <select className="theme-select" value={filtro.periodo} onChange={(e) => ajustarFiltro('periodo', e.target.value)}>
            <option value="6">Últimos 6 meses</option>
            <option value="12">Últimos 12 meses</option>
            <option value="24">Últimos 24 meses</option>
            <option value="todos">Todo o histórico</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Ano</label>
          <select className="theme-select" value={filtro.ano} onChange={(e) => ajustarFiltro('ano', e.target.value)}>
            <option value="">Todos</option>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Mês</label>
          <select className="theme-select" value={filtro.mes} onChange={(e) => ajustarFiltro('mes', e.target.value)}>
            <option value="">Todos</option>
            {MESES_NOMES.map((nome, idx) => <option key={idx + 1} value={String(idx + 1)}>{nome}</option>)}
          </select>
        </div>
        {(filtro.mes || filtro.ano || filtro.periodo !== '12') && (
          <button className="btn btn-secondary btn-sm" onClick={() => setFiltro({ periodo: '12', mes: '', ano: '' })}>
            Limpar filtros
          </button>
        )}
      </div>

      <div className="theme-card" style={{ marginBottom: 24 }}>
        <h2 className="section-title"><BarChart3 size={16} /> Evolução do Faturamento (Receitas x Despesas por mês)</h2>
        {filtrados.length === 0 ? (
          <p className="empty-state" style={{ margin: 0 }}>Sem dados de faturamento para o período selecionado.</p>
        ) : (
          <BarChart data={filtrados} />
        )}
      </div>

      <div className="theme-card">
        <h2 className="section-title"><Wallet size={16} /> Faturamento por Mês</h2>
        <div className="table-wrapper" style={{ overflowX: 'auto', boxShadow: 'none', margin: 0 }}>
          <table className="theme-table">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Receitas</th>
                <th>Mensalidades</th>
                <th>Outras Receitas</th>
                <th>Despesas</th>
                <th>Desp. Fixas</th>
                <th>Desp. Variáveis</th>
                <th>Desp. Manutenção</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan="9"><div className="empty-state">Sem histórico disponível.</div></td></tr>
              ) : (
                filtrados.map(m => (
                  <tr key={m.referencia}>
                    <td><strong>{m.rotulo}</strong></td>
                    <td style={{ color: 'var(--success)' }}>R$ {fmt(m.receitas)}</td>
                    <td>R$ {fmt(m.receitaMensalidade)}</td>
                    <td>R$ {fmt(m.outrasReceitas)}</td>
                    <td style={{ color: 'var(--danger)' }}>R$ {fmt(m.despesas)}</td>
                    <td>R$ {fmt(m.despesasFixas)}</td>
                    <td>R$ {fmt(m.despesasVariaveis)}</td>
                    <td>R$ {fmt(m.despesasManutencao)}</td>
                    <td><strong style={{ color: Number(m.saldo) < 0 ? 'var(--danger)' : 'var(--primary)' }}>R$ {fmt(m.saldo)}</strong></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
