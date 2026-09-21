import { useState, useEffect } from 'react';
import api from '../../service/api';
import { History, CheckCircle2, Loader, Timer, AlertTriangle, Clock3 } from 'lucide-react';
import { DateInput } from '../../components/ui/date-input';
import { formatDate, formatDateTime, formatTime } from '../../lib/dateUtils';

const rotuloPrioridade = { BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta', CRITICA: 'Crítica' };
const rotuloStatusChamado = { ABERTO: 'Aberto', EM_ANDAMENTO: 'Em andamento', FINALIZADO: 'Finalizado' };
const rotuloSla = {
  DENTRO_PRAZO: 'Dentro do prazo',
  PROXIMO_VENCIMENTO: 'Próximo do vencimento',
  SLA_VENCIDO: 'SLA vencido',
  CONCLUIDO_DENTRO_SLA: 'Concluído no prazo',
  CONCLUIDO_APOS_SLA: 'Concluído com atraso',
  CONCLUIDO: 'Concluído',
  SEM_SLA: 'Sem SLA',
};

const STATUS_OPCOES = ['ABERTO', 'EM_ANDAMENTO', 'FINALIZADO'];
const PRIORIDADE_OPCOES = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];
const TIPO_OPCOES = ['CORRETIVA', 'PREVENTIVA'];
const SLA_OPCOES = [
  'DENTRO_PRAZO', 'PROXIMO_VENCIMENTO', 'SLA_VENCIDO',
  'CONCLUIDO_DENTRO_SLA', 'CONCLUIDO_APOS_SLA', 'CONCLUIDO', 'SEM_SLA',
];

const hojeISO = () => new Date().toISOString().slice(0, 10);

export default function HistoricoChamados() {
  const [chamados, setChamados] = useState([]);
  const [indicadores, setIndicadores] = useState({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [filtro, setFiltro] = useState({
    inicio: '',
    fim: '',
    status: '',
    tecnico: '',
    equipamento: '',
    prioridade: '',
    tipo: '',
    slaStatus: '',
  });
  const [nomeFiltros, setNomeFiltros] = useState({ tecnicos: [], equipamentos: [] });

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get('/manutencao/historico');
        const chamados = Array.isArray(res.data?.chamados) ? res.data.chamados : [];
        setChamados(chamados);
        setIndicadores(res.data?.indicadores || {});
        const tecnicos = [...new Set(chamados.map(c => c.responsavel).filter(Boolean))].sort();
        const equipamentos = [...new Set(chamados.map(c => c.equipamento?.id).filter(Boolean))]
          .map(id => chamados.find(c => c.equipamento?.id === id)?.equipamento)
          .filter(Boolean)
          .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
        setNomeFiltros({ tecnicos, equipamentos });
      } catch (error) {
        console.error('Erro ao buscar histórico de chamados:', error);
        setErro('Erro ao carregar o histórico de chamados.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) return <div className="loading">Carregando histórico...</div>;

  const ajustarFiltro = (campo, valor) => setFiltro(prev => ({ ...prev, [campo]: valor }));

  const filtrados = chamados.filter(c => {
    if (filtro.inicio && c.data && c.data < filtro.inicio) return false;
    if (filtro.fim && c.data && c.data > filtro.fim) return false;
    if (filtro.status && c.status !== filtro.status) return false;
    if (filtro.tecnico && c.responsavel !== filtro.tecnico) return false;
    if (filtro.equipamento && String(c.equipamento?.id || '') !== filtro.equipamento) return false;
    if (filtro.prioridade && c.prioridade !== filtro.prioridade) return false;
    if (filtro.tipo && c.tipo !== filtro.tipo) return false;
    if (filtro.slaStatus && c.slaStatus !== filtro.slaStatus) return false;
    return true;
  });

  const temFiltro = Object.values(filtro).some(v => v !== '');

  const cards = [
    { label: 'Total de Chamados', valor: indicadores.total ?? chamados.length, icon: <History size={20} />, cor: 'blue' },
    { label: 'Concluídos', valor: indicadores.concluidos ?? 0, icon: <CheckCircle2 size={20} />, cor: 'green' },
    { label: 'Em Andamento', valor: indicadores.emAndamento ?? 0, icon: <Loader size={20} />, cor: 'purple' },
    { label: 'Dentro do SLA', valor: indicadores.dentroSla ?? 0, icon: <Timer size={20} />, cor: 'blue' },
    { label: 'Fora do SLA', valor: indicadores.foraSla ?? 0, icon: <AlertTriangle size={20} />, cor: 'orange' },
    { label: 'Vencidos', valor: indicadores.vencidos ?? 0, icon: <Clock3 size={20} />, cor: 'red' },
  ];

  return (
    <>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {cards.map(card => (
          <div className="stat-card" key={card.label}>
            <div className={`stat-icon ${card.cor}`}>{card.icon}</div>
            <h3>{card.label}</h3>
            <p className="stat-value">{card.valor}</p>
            <p className="stat-label">Chamado{card.valor !== 1 ? 's' : ''} de manutenção</p>
          </div>
        ))}
      </div>

      {erro && <div className="form-message error" style={{ marginBottom: 16 }}>{erro}</div>}

      <div className="filter-row">
        <div className="filter-group">
          <label>Período (de)</label>
          <DateInput value={filtro.inicio} max={filtro.fim || hojeISO()} onChange={(e) => ajustarFiltro('inicio', e.target.value)} />
        </div>
        <div className="filter-group">
          <label>Período (até)</label>
          <DateInput value={filtro.fim} max={hojeISO()} onChange={(e) => ajustarFiltro('fim', e.target.value)} />
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select className="theme-select" value={filtro.status} onChange={(e) => ajustarFiltro('status', e.target.value)}>
            <option value="">Todos</option>
            {STATUS_OPCOES.map(s => <option key={s} value={s}>{rotuloStatusChamado[s] || s}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Técnico</label>
          <select className="theme-select" value={filtro.tecnico} onChange={(e) => ajustarFiltro('tecnico', e.target.value)}>
            <option value="">Todos</option>
            {nomeFiltros.tecnicos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Equipamento</label>
          <select className="theme-select" value={filtro.equipamento} onChange={(e) => ajustarFiltro('equipamento', e.target.value)}>
            <option value="">Todos</option>
            {nomeFiltros.equipamentos.map(eq => <option key={eq.id} value={String(eq.id)}>{eq.nome}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Prioridade</label>
          <select className="theme-select" value={filtro.prioridade} onChange={(e) => ajustarFiltro('prioridade', e.target.value)}>
            <option value="">Todas</option>
            {PRIORIDADE_OPCOES.map(p => <option key={p} value={p}>{rotuloPrioridade[p] || p}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Tipo do Chamado</label>
          <select className="theme-select" value={filtro.tipo} onChange={(e) => ajustarFiltro('tipo', e.target.value)}>
            <option value="">Todos</option>
            {TIPO_OPCOES.map(t => <option key={t} value={t}>{t === 'PREVENTIVA' ? 'Preventiva' : 'Corretiva'}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Status do SLA</label>
          <select className="theme-select" value={filtro.slaStatus} onChange={(e) => ajustarFiltro('slaStatus', e.target.value)}>
            <option value="">Todos</option>
            {SLA_OPCOES.map(s => <option key={s} value={s}>{rotuloSla[s] || s}</option>)}
          </select>
        </div>
        {temFiltro && (
          <button className="btn btn-secondary btn-sm" onClick={() => setFiltro({ inicio: '', fim: '', status: '', tecnico: '', equipamento: '', prioridade: '', tipo: '', slaStatus: '' })}>
            Limpar filtros
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <span className="record-count">{filtrados.length} chamado{filtrados.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="theme-table is-compact">
          <thead>
            <tr>
              <th>Chamado</th>
              <th>Equipamento</th>
              <th>Descrição / Observações</th>
              <th>Prioridade</th>
              <th>Abertura</th>
              <th>SLA</th>
              <th>Técnico</th>
              <th>Status</th>
              <th>Conclusão</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan="9"><div className="empty-state">Nenhum chamado encontrado.</div></td></tr>
            ) : (
              filtrados.map(ch => (
                <tr key={ch.id}>
                  <td>
                    <div className="cell-stack">
                      <strong>#{ch.id}</strong>
                      <span className={`status-badge ${ch.tipo}`}>{ch.tipo === 'PREVENTIVA' ? 'Preventiva' : 'Corretiva'}</span>
                    </div>
                  </td>
                  <td><div className="cell-wrap"><strong>{ch.equipamento?.nome || '—'}</strong></div></td>
                  <td><div className="cell-wrap">{ch.problema || '—'}{ch.observacoes && (<><br /><span className="cell-sub">{ch.observacoes}</span></>)}</div></td>
                  <td><span className={`status-badge ${ch.prioridade}`}>{rotuloPrioridade[ch.prioridade] || ch.prioridade}</span></td>
                  <td>
                    <div className="cell-stack">
                      <span className="date-friendly">{formatDate(ch.data) || '—'}</span>
                      <span className="cell-sub">{formatTime(ch.hora) || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="cell-stack">
                      <span className="date-friendly">{ch.prazo ? `${formatDate(ch.prazo)} (${ch.slaDias} dia${ch.slaDias !== 1 ? 's' : ''})` : '—'}</span>
                      {ch.slaStatus && <span className={`status-badge ${ch.slaStatus}`}>{rotuloSla[ch.slaStatus] || ch.slaStatus}</span>}
                    </div>
                  </td>
                  <td>{ch.responsavel || '—'}</td>
                  <td><span className={`status-badge ${ch.status}`}>{rotuloStatusChamado[ch.status] || ch.status}</span></td>
                  <td>
                    <div className="cell-stack">
                      <span className="date-friendly">{formatDateTime(ch.dataConclusao) || '—'}</span>
                      <span className="cell-sub">{ch.tempoAtendimentoDias != null ? `${ch.tempoAtendimentoDias} dia${ch.tempoAtendimentoDias !== 1 ? 's' : ''}` : '—'}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
