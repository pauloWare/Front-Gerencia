import { useState, useEffect } from 'react';
import api from '../../service/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { FormField } from '../../components/ui/field';
import { MoneyInput } from '../../components/ui/money-input';
import { DateInput } from '../../components/ui/date-input';
import { TrendingUp, TrendingDown, Plus, History, AlertCircle, X, PiggyBank } from 'lucide-react';
import { formatDate } from '../../lib/dateUtils';

const obterDataHoje = () => {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
};

const TIPOS_DESPESA = ['ALUGUEL', 'FUNCIONARIOS', 'ENERGIA', 'AGUA', 'EQUIPAMENTOS', 'MANUTENCAO', 'OUTROS'];
const TIPOS_RECEITA = ['MENSALIDADE', 'VENDA_PRODUTOS', 'OUTROS'];

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

export default function Financeiro() {
  const [receitas, setReceitas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [indicadores, setIndicadores] = useState({ receitaRecebida: 0, aReceber: 0, despesasFixas: 0, despesasVariaveis: 0, despesasTotais: 0, saldo: 0 });
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  const [novaReceita, setNovaReceita] = useState(false);
  const [novaDespesa, setNovaDespesa] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [formReceita, setFormReceita] = useState({ tipo: 'OUTROS', descricao: '', valor: '', data: obterDataHoje() });
  const [formDespesa, setFormDespesa] = useState({ tipo: 'OUTROS', classificacao: 'FIXO', descricao: '', valor: '', data: obterDataHoje() });
  const [errosReceita, setErrosReceita] = useState({});
  const [errosDespesa, setErrosDespesa] = useState({});

  useEffect(() => {
    buscarDados();
  }, []);

  const buscarDados = async () => {
    try {
      const [resReceitas, resDespesas, resIndicadores, resHistorico] = await Promise.all([
        api.get('/financeiro/receitas'),
        api.get('/financeiro/despesas'),
        api.get('/financeiro/indicadores'),
        api.get('/financeiro/historico?meses=12'),
      ]);
      setReceitas(Array.isArray(resReceitas.data) ? resReceitas.data : []);
      setDespesas(Array.isArray(resDespesas.data) ? resDespesas.data : []);
      setIndicadores(resIndicadores.data || {});
      setHistorico(Array.isArray(resHistorico.data) ? resHistorico.data : []);
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReceita = async (id) => {
    if (window.confirm('Deseja excluir esta receita?')) {
      try {
        await api.delete(`/financeiro/receitas/${id}`);
        buscarDados();
      } catch (error) {
        const msg = error.response?.data?.erro || error.response?.data?.error || 'Erro ao excluir receita.';
        setErro(`❌ ${msg}`);
      }
    }
  };

  const handleDeleteDespesa = async (id) => {
    if (window.confirm('Deseja excluir esta despesa?')) {
      try {
        await api.delete(`/financeiro/despesas/${id}`);
        buscarDados();
      } catch (error) {
        const msg = error.response?.data?.erro || error.response?.data?.error || 'Erro ao excluir despesa.';
        setErro(`❌ ${msg}`);
      }
    }
  };

  const handleCriarReceita = async (e) => {
    e.preventDefault();
    const erros = {};
    if (!formReceita.valor || Number(formReceita.valor) <= 0) {
      erros.valor = 'Este campo é obrigatório.';
    }
    setErrosReceita(erros);
    if (Object.keys(erros).length > 0) return;
    setSalvando(true);
    setErro('');
    try {
      await api.post('/financeiro/receitas', {
        tipo: formReceita.tipo,
        descricao: formReceita.descricao,
        valor: Number(formReceita.valor || 0),
        data: formReceita.data,
      });
      setErrosReceita({});
      setNovaReceita(false);
      setFormReceita({ tipo: 'OUTROS', descricao: '', valor: '', data: obterDataHoje() });
      await buscarDados();
    } catch (error) {
      console.error('Erro ao criar receita:', error);
      setErro('Erro ao criar a receita.');
    } finally {
      setSalvando(false);
    }
  };

  const handleCriarDespesa = async (e) => {
    e.preventDefault();
    const erros = {};
    if (!formDespesa.valor || Number(formDespesa.valor) <= 0) {
      erros.valor = 'Este campo é obrigatório.';
    }
    setErrosDespesa(erros);
    if (Object.keys(erros).length > 0) return;
    setSalvando(true);
    setErro('');
    try {
      await api.post('/financeiro/despesas', {
        tipo: formDespesa.tipo,
        classificacao: formDespesa.classificacao,
        descricao: formDespesa.descricao,
        valor: Number(formDespesa.valor || 0),
        data: formDespesa.data,
      });
      setErrosDespesa({});
      setNovaDespesa(false);
      setFormDespesa({ tipo: 'OUTROS', classificacao: 'FIXO', descricao: '', valor: '', data: obterDataHoje() });
      await buscarDados();
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      setErro('Erro ao criar a despesa.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <div className="loading">Carregando...</div>;

  const saldo = Number(indicadores.saldo || 0);

  return (
    <>
      {/* Resumo financeiro (cálculo dos indicadores no backend) */}
      <div className="finance-summary">
        <div className="finance-card">
          <div className="finance-label">Receita Recebida</div>
          <div className="finance-value receita">R$ {fmt(indicadores.receitaRecebida)}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">A Receber</div>
          <div className="finance-value saldo">R$ {fmt(indicadores.aReceber)}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Despesas Fixas</div>
          <div className="finance-value despesa">R$ {fmt(indicadores.despesasFixas)}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Despesas Variáveis</div>
          <div className="finance-value despesa">R$ {fmt(indicadores.despesasVariaveis)}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Despesas Totais</div>
          <div className="finance-value despesa">R$ {fmt(indicadores.despesasTotais)}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Saldo</div>
          <div className={`finance-value saldo ${saldo < 0 ? 'negativo' : ''}`}>
            {saldo < 0 ? '- ' : ''}R$ {fmt(Math.abs(saldo))}
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <span className="record-count">{receitas.length} receita{receitas.length !== 1 ? 's' : ''} · {despesas.length} despesa{despesas.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { setNovaDespesa(true); setErro(''); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Nova Despesa
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { setNovaReceita(true); setErro(''); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Nova Receita
          </button>
        </div>
      </div>

      {/* Receitas */}
      <div className="theme-card" style={{ marginBottom: 24 }}>
        <h2 className="section-title"><TrendingUp size={16} /> Receitas</h2>
        <div className="table-wrapper">
          <table className="theme-table">
            <thead>
              <tr><th>Tipo</th><th>Descrição</th><th>Valor</th><th>Data</th><th>Aluno</th><th style={{ width: 100 }}>Ações</th></tr>
            </thead>
            <tbody>
              {receitas.length === 0 ? (
                <tr><td colSpan="6"><div className="empty-state">Nenhuma receita encontrada</div></td></tr>
              ) : (
                receitas.map(r => (
                  <tr key={r.id}>
                    <td>{r.tipo}</td><td>{r.descricao}</td>
                    <td><strong style={{ color: 'var(--success)' }}>R$ {Number(r.valor).toFixed(2)}</strong></td><td className="date-friendly">{formatDate(r.data) || '—'}</td>
                    <td>{r.aluno?.nome || '-'}</td>
                    <td><div className="actions">
                      <button onClick={() => handleDeleteReceita(r.id)} className="btn btn-danger btn-xs">Excluir</button>
                    </div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Despesas */}
      <div className="theme-card">
        <h2 className="section-title"><TrendingDown size={16} /> Despesas</h2>
        <div className="table-wrapper">
          <table className="theme-table">
            <thead>
              <tr><th>Tipo</th><th>Classificação</th><th>Descrição</th><th>Valor</th><th>Data</th><th style={{ width: 100 }}>Ações</th></tr>
            </thead>
            <tbody>
              {despesas.length === 0 ? (
                <tr><td colSpan="6"><div className="empty-state">Nenhuma despesa encontrada</div></td></tr>
              ) : (
                despesas.map(d => (
                  <tr key={d.id}>
                    <td>{d.tipo}</td>
                    <td><span className={`status-badge ${d.classificacao}`}>{d.classificacao || 'Não classificada'}</span></td>
                    <td>{d.descricao}</td>
                    <td><strong style={{ color: 'var(--danger)' }}>R$ {Number(d.valor).toFixed(2)}</strong></td><td className="date-friendly">{formatDate(d.data) || '—'}</td>
                    <td><div className="actions">
                      <button onClick={() => handleDeleteDespesa(d.id)} className="btn btn-danger btn-xs">Excluir</button>
                    </div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Histórico Financeiro */}
      <div className="theme-card" style={{ marginTop: 24 }}>
        <h2 className="section-title"><History size={16} /> Histórico Financeiro (por mês)</h2>
        <div className="table-wrapper">
          <table className="theme-table">
            <thead>
              <tr><th>Mês</th><th>Receitas</th><th>Despesas</th><th>Saldo</th></tr>
            </thead>
            <tbody>
              {historico.length === 0 ? (
                <tr><td colSpan="4"><div className="empty-state">Sem histórico financeiro disponível.</div></td></tr>
              ) : (
                historico.map(h => (
                  <tr key={h.referencia}>
                    <td><strong>{h.rotulo}</strong></td>
                    <td style={{ color: 'var(--success)' }}>R$ {fmt(h.receitas)}</td>
                    <td style={{ color: 'var(--danger)' }}>R$ {fmt(h.despesas)}</td>
                    <td><strong style={{ color: Number(h.saldo) < 0 ? 'var(--danger)' : 'var(--primary)' }}>R$ {fmt(h.saldo)}</strong></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nova Despesa */}
      <Dialog open={novaDespesa} onOpenChange={(open) => !open && setNovaDespesa(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <TrendingDown size={18} /> Nova Despesa
            </DialogTitle>
            <DialogDescription>Registre uma nova despesa. Será refletida no saldo e no histórico.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCriarDespesa} className="dialog-form dialog-body">
            <div className="form-grid-2">
              <FormField label="Tipo (categoria)" required>
                <select className="theme-select" value={formDespesa.tipo} onChange={(e) => setFormDespesa({ ...formDespesa, tipo: e.target.value })}>
                  {TIPOS_DESPESA.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Classificação">
                <select className="theme-select" value={formDespesa.classificacao} onChange={(e) => setFormDespesa({ ...formDespesa, classificacao: e.target.value })}>
                  <option value="FIXO">Fixo</option>
                  <option value="VARIAVEL">Variável</option>
                </select>
              </FormField>
            </div>
            <FormField label="Descrição">
              <input className="theme-input" type="text" value={formDespesa.descricao} onChange={(e) => setFormDespesa({ ...formDespesa, descricao: e.target.value })} placeholder="Ex.: Aluguel do prédio" />
            </FormField>
            <div className="form-grid-2">
              <FormField label="Valor" required error={errosDespesa.valor}>
                <MoneyInput value={formDespesa.valor} onChange={(v) => setFormDespesa({ ...formDespesa, valor: v })} placeholder="0,00" />
              </FormField>
              <FormField label="Data" required>
                <DateInput value={formDespesa.data} onChange={(e) => setFormDespesa({ ...formDespesa, data: e.target.value })} />
              </FormField>
            </div>
            {erro && <div className="form-message error" style={{ marginBottom: 0 }}><AlertCircle size={14} /> {erro}</div>}
            <DialogFooter className="dialog-footer">
              <button type="button" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setNovaDespesa(false)}>
                <X size={14} /> Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} disabled={salvando}>
                <PiggyBank size={14} /> {salvando ? 'Salvando...' : 'Salvar despesa'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Nova Receita */}
      <Dialog open={novaReceita} onOpenChange={(open) => !open && setNovaReceita(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <TrendingUp size={18} /> Nova Receita
            </DialogTitle>
            <DialogDescription>Registre uma nova receita. Será refletida no saldo e no histórico.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCriarReceita} className="dialog-form dialog-body">
            <FormField label="Tipo">
              <select className="theme-select" value={formReceita.tipo} onChange={(e) => setFormReceita({ ...formReceita, tipo: e.target.value })}>
                {TIPOS_RECEITA.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Descrição">
              <input className="theme-input" type="text" value={formReceita.descricao} onChange={(e) => setFormReceita({ ...formReceita, descricao: e.target.value })} placeholder="Ex.: Venda de produtos" />
            </FormField>
            <div className="form-grid-2">
              <FormField label="Valor" required error={errosReceita.valor}>
                <MoneyInput value={formReceita.valor} onChange={(v) => setFormReceita({ ...formReceita, valor: v })} placeholder="0,00" />
              </FormField>
              <FormField label="Data" required>
                <DateInput value={formReceita.data} onChange={(e) => setFormReceita({ ...formReceita, data: e.target.value })} />
              </FormField>
            </div>
            {erro && <div className="form-message error" style={{ marginBottom: 0 }}><AlertCircle size={14} /> {erro}</div>}
            <DialogFooter className="dialog-footer">
              <button type="button" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setNovaReceita(false)}>
                <X size={14} /> Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} disabled={salvando}>
                <TrendingUp size={14} /> {salvando ? 'Salvando...' : 'Salvar receita'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
