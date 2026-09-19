import React, { useState, useEffect } from 'react';
import api from '../../service/api';
import { Banknote, CalendarCheck, AlertCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { FormField } from '../../components/ui/field';
import { MoneyInput } from '../../components/ui/money-input';
import { DateInput } from '../../components/ui/date-input';
import { formatDate } from '../../lib/dateUtils';
import { formatCurrency } from '../../lib/format';

const FORMAS = [
  { valor: 'DINHEIRO', rotulo: 'Dinheiro' },
  { valor: 'CARTAO', rotulo: 'Cartão' },
  { valor: 'PIX', rotulo: 'PIX' },
];

const obterDataHoje = () => {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
};

const somarDias = (dias) => {
  const h = new Date();
  h.setDate(h.getDate() + dias);
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
};

const statusExibicao = (m, hoje) => {
  if (m.status === 'PAGA' || m.status === 'PAGO') return 'PAGA';
  if (m.dataVencimento && m.dataVencimento < hoje) return 'ATRASADA';
  return 'PENDENTE';
};

const rotuloStatus = {
  PAGA: 'Paga',
  PENDENTE: 'Pendente',
  ATRASADA: 'Atrasada',
};

export default function Mensalidades() {
  const [mensalidades, setMensalidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('TODAS');
  const [pagamento, setPagamento] = useState(null);
  const [formPagamento, setFormPagamento] = useState({ valor: '', dataPagamento: '', formaPagamento: '' });
  const [salvando, setSalvando] = useState(false);
  const [erroPagamento, setErroPagamento] = useState('');

  const hoje = obterDataHoje();
  const limiteBreve = somarDias(7);

  useEffect(() => {
    buscarMensalidades();
  }, []);

  const buscarMensalidades = async () => {
    try {
      const response = await api.get('/mensalidade');
      setMensalidades(response.data);
    } catch (error) {
      console.error('Erro ao buscar mensalidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirPagamento = (m) => {
    setPagamento(m);
    setFormPagamento({ valor: m.valor != null ? m.valor : '', dataPagamento: hoje, formaPagamento: '' });
    setErroPagamento('');
  };

  const fecharPagamento = () => {
    setPagamento(null);
    setFormPagamento({ valor: '', dataPagamento: '', formaPagamento: '' });
    setErroPagamento({});
  };

  const registrarPagamento = async (e) => {
    e.preventDefault();
    const erros = {};
    if (!formPagamento.formaPagamento) {
      erros.formaPagamento = 'Selecione a forma de pagamento.';
    }
    if (!formPagamento.valor || Number(formPagamento.valor) <= 0) {
      erros.valor = 'Informe o valor pago.';
    }
    setErroPagamento(erros);
    if (Object.keys(erros).length > 0) return;
    setSalvando(true);
    setErroPagamento({});
    try {
      let usuarioResponsavel = '';
      try {
        const u = JSON.parse(localStorage.getItem('usuario') || '{}');
        usuarioResponsavel = u?.nome || u?.email || '';
      } catch { /* usuário não disponível */ }
      await api.post(`/mensalidade/${pagamento.id}/pagar`, {
        valor: Number(formPagamento.valor || 0),
        dataPagamento: formPagamento.dataPagamento,
        formaPagamento: formPagamento.formaPagamento,
        usuarioResponsavel,
      });
      fecharPagamento();
      await buscarMensalidades();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      setErroPagamento({ global: '❌ Erro ao registrar o pagamento.' });
    } finally {
      setSalvando(false);
    }
  };

  const comStatus = mensalidades.map(m => ({ ...m, statusExibicao: statusExibicao(m, hoje), venceBreve: m.status !== 'PAGA' && m.dataVencimento >= hoje && m.dataVencimento <= limiteBreve }));

  const filtered = comStatus.filter(m =>
    (m.aluno?.nome && m.aluno.nome.toLowerCase().includes(search.toLowerCase())) ||
    (m.statusExibicao && m.statusExibicao.toLowerCase().includes(search.toLowerCase())) ||
    (m.aluno?.plano && m.aluno.plano.toLowerCase().includes(search.toLowerCase()))
  ).filter(m => {
    if (filtro === 'TODAS') return true;
    if (filtro === 'VENCIDAS') return m.statusExibicao === 'ATRASADA';
    if (filtro === 'BREVE') return m.venceBreve;
    if (filtro === 'PENDENTES') return m.statusExibicao === 'PENDENTE';
    if (filtro === 'PAGAS') return m.statusExibicao === 'PAGA';
    return true;
  });

  const contador = (tipo) => {
    if (tipo === 'VENCIDAS') return comStatus.filter(m => m.statusExibicao === 'ATRASADA').length;
    if (tipo === 'BREVE') return comStatus.filter(m => m.venceBreve).length;
    if (tipo === 'PENDENTES') return comStatus.filter(m => m.statusExibicao === 'PENDENTE').length;
    if (tipo === 'PAGAS') return comStatus.filter(m => m.statusExibicao === 'PAGA').length;
    return comStatus.length;
  };

  const filtros = [
    { chave: 'TODAS', rotulo: 'Todas' },
    { chave: 'VENCIDAS', rotulo: 'Vencidas' },
    { chave: 'BREVE', rotulo: 'Vencendo em breve' },
    { chave: 'PENDENTES', rotulo: 'Pendentes' },
    { chave: 'PAGAS', rotulo: 'Pagas' },
  ];

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <input type="text" placeholder="Buscar por aluno, plano ou status..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="record-count">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {filtros.map(f => (
            <button
              key={f.chave}
              onClick={() => setFiltro(f.chave)}
              className={`btn btn-xs ${filtro === f.chave ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontWeight: 600 }}
            >
              {f.rotulo} ({contador(f.chave)})
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="theme-table">
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Plano</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th style={{ width: 180 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="6"><div className="empty-state">Nenhuma mensalidade encontrada</div></td></tr>
            ) : (
              filtered.map(m => (
                <tr key={m.id}>
                  <td><strong>{m.aluno?.nome || m.alunoId}</strong></td>
                  <td>{m.aluno?.plano || '-'}</td>
                  <td><strong>{formatCurrency(m.valor)}</strong></td>
                  <td className="date-friendly">{formatDate(m.dataVencimento) || '—'}</td>
                  <td>
                    <span className={`status-badge ${m.statusExibicao}`}>{rotuloStatus[m.statusExibicao]}</span>
                  </td>
                  <td>
                    <div className="actions">
                      {m.statusExibicao !== 'PAGA' ? (
                        <button onClick={() => abrirPagamento(m)} className="btn btn-primary btn-xs" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Banknote size={12} /> Registrar pagamento
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {m.formaPagamento ? `Pago via ${m.formaPagamento}` : 'Paga'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagamento && (
        <Dialog open={!!pagamento} onOpenChange={(open) => !open && fecharPagamento()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <Banknote size={18} /> Registrar Pagamento
            </DialogTitle>
            <DialogDescription>Confirme os dados do pagamento do aluno abaixo.</DialogDescription>
          </DialogHeader>
          {pagamento && (
            <>
              <DialogDescription>
                Aluno: <strong>{pagamento?.aluno?.nome}</strong> — Vencimento: <strong className="date-friendly">{formatDate(pagamento?.dataVencimento) || '—'}</strong> — Valor: <strong>{formatCurrency(pagamento?.valor)}</strong>
              </DialogDescription>
              <form onSubmit={registrarPagamento} className="dialog-form">
                <FormField label="Valor pago" required error={erroPagamento.valor}>
                  <MoneyInput
                    value={formPagamento.valor}
                    onChange={(v) => setFormPagamento({ ...formPagamento, valor: v })}
                  />
                </FormField>
                <FormField label="Data do pagamento" required>
                  <DateInput
                    value={formPagamento.dataPagamento}
                    onChange={(e) => setFormPagamento({ ...formPagamento, dataPagamento: e.target.value })}
                  />
                </FormField>
                <FormField label="Forma de pagamento" required error={erroPagamento.formaPagamento}>
                  <select
                    className="theme-select"
                    value={formPagamento.formaPagamento}
                    onChange={(e) => setFormPagamento({ ...formPagamento, formaPagamento: e.target.value })}
                  >
                    <option value="">Selecione a forma</option>
                    {FORMAS.map(f => <option key={f.valor} value={f.valor}>{f.rotulo}</option>)}
                  </select>
                </FormField>
                {erroPagamento.global && (
                  <div className="form-message error" style={{ marginBottom: 0 }}><AlertCircle size={14} /> {erroPagamento.global}</div>
                )}
                <DialogFooter className="dialog-footer">
                  <button type="button" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={fecharPagamento}>
                    <X size={14} /> Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} disabled={salvando}>
                    <CalendarCheck size={14} /> {salvando ? 'Salvando...' : 'Confirmar pagamento'}
                  </button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
      )}
    </>
  );
}