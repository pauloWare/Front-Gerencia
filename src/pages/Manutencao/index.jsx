import { useState, useEffect } from 'react';
import api from '../../service/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { FormField } from '../../components/ui/field';
import { DateInput } from '../../components/ui/date-input';
import { TimeInput } from '../../components/ui/time-input';
import { MoneyInput } from '../../components/ui/money-input';
import { UploadInput } from '../../components/ui/upload-input';
import { formatDate, formatTime } from '../../lib/dateUtils';
import { Plus, Wrench, CalendarClock, CheckCircle, Image as ImageIcon, AlertCircle, X } from 'lucide-react';

const obterDataHoje = () => {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
};

const PRIORIDADES = ['URGENTE', 'ALTA', 'MEDIA', 'BAIXA'];

// RODADA 1 — SLA DE MANUTENÇÃO: prazo definido pelo SISTEMA a partir da
// prioridade (não editável pelo usuário). CRITICA mantido apenas para
// exibição de chamados históricos.
const SLA_DIAS_POR_PRIORIDADE = { URGENTE: 0, ALTA: 1, MEDIA: 3, BAIXA: 5, CRITICA: 0 };

const rotuloPrioridade = { URGENTE: 'Urgente', BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta', CRITICA: 'Crítica' };
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
const rotuloStatusPrev = { AGENDADA: 'Agendada', EM_ANDAMENTO: 'Em andamento', CONCLUIDA: 'Concluída', ATRASADA: 'Atrasada' };

const textoSla = (prioridade) => {
  const dias = SLA_DIAS_POR_PRIORIDADE[prioridade];
  if (dias == null) return 'SLA calculado pelo sistema após salvar';
  if (dias === 0) return 'SLA: mesmo dia (URGENTE)';
  return `SLA: ${dias} dia${dias !== 1 ? 's' : ''} (calculado pelo sistema)`;
};

const formChamadoVazio = () => ({ equipamentoId: '', problema: '', prioridade: 'MEDIA', data: obterDataHoje(), hora: '', responsavel: '', status: 'ABERTO', fotoBase64: '' });
const formPrevVazio = () => ({ equipamentoId: '', servico: '', periodicidade: '', dataUltimaManutencao: '', proximaManutencao: '', responsavel: '', status: 'AGENDADA' });

export default function Manutencao() {
  const [aba, setAba] = useState('corretivas');
  const [equipamentos, setEquipamentos] = useState([]);
  const [chamados, setChamados] = useState([]);
  const [preventivas, setPreventivas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [novoChamado, setNovoChamado] = useState(false);
  const [novaPrev, setNovaPrev] = useState(false);
  // RODADA 4: alvo da conclusão (despesa opcional dentro do mesmo modal).
  // Formato: { kind: 'chamado' | 'preventiva', item }
  const [concluir, setConcluir] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [errosChamado, setErrosChamado] = useState({});
  const [errosPrev, setErrosPrev] = useState({});
  const [errosDespesa, setErrosDespesa] = useState({});
  const [formChamado, setFormChamado] = useState(formChamadoVazio());
  const [formPrev, setFormPrev] = useState(formPrevVazio());
  const [formDespesa, setFormDespesa] = useState({ valor: '', data: obterDataHoje(), descricao: '' });
  const [previewImagemChamado, setPreviewImagemChamado] = useState('');
  const [imagemAmpliada, setImagemAmpliada] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const [resEq, resCh, resPrev] = await Promise.all([
          api.get('/manutencao/equipamentos'),
          api.get('/manutencao/chamados'),
          api.get('/manutencao/preventivas'),
        ]);
        setEquipamentos(Array.isArray(resEq.data) ? resEq.data : []);
        setChamados(Array.isArray(resCh.data) ? resCh.data : []);
        setPreventivas(Array.isArray(resPrev.data) ? resPrev.data : []);
      } catch (error) {
        console.error('Erro ao buscar manutenções:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const buscarChamados = async () => {
    try {
      const response = await api.get('/manutencao/chamados');
      setChamados(response.data);
    } catch (error) {
      console.error('Erro ao buscar chamados:', error);
    }
  };

  const buscarPreventivas = async () => {
    try {
      const response = await api.get('/manutencao/preventivas');
      setPreventivas(response.data);
    } catch (error) {
      console.error('Erro ao buscar preventivas:', error);
    }
  };

  const handleDeleteChamado = async (id) => {
    if (window.confirm('Deseja excluir este chamado?')) {
      try {
        await api.delete(`/manutencao/chamados/${id}`);
        await buscarChamados();
      } catch (error) {
        const msg = error.response?.data?.erro || error.response?.data?.error || 'Erro ao excluir chamado.';
        setErro(`❌ ${msg}`);
      }
    }
  };

  const handleDeletePrev = async (id) => {
    if (window.confirm('Deseja excluir esta manutenção preventiva?')) {
      try {
        await api.delete(`/manutencao/preventivas/${id}`);
        await buscarPreventivas();
      } catch (error) {
        const msg = error.response?.data?.erro || error.response?.data?.error || 'Erro ao excluir preventiva.';
        setErro(`❌ ${msg}`);
      }
    }
  };

  const handleImagemChamadoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErro('Selecione um arquivo de imagem válido.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErro('A imagem deve ter no máximo 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormChamado({ ...formChamado, fotoBase64: reader.result });
      setPreviewImagemChamado(reader.result);
      setErro('');
    };
    reader.onerror = () => setErro('Erro ao ler o arquivo de imagem.');
    reader.readAsDataURL(file);
  };

  const removerImagemChamado = () => {
    setFormChamado({ ...formChamado, fotoBase64: '' });
    setPreviewImagemChamado('');
  };

  const handleSubmitChamado = async (e) => {
    e.preventDefault();
    const erros = {};
    const equip = equipamentos.find(eq => eq.id === Number(formChamado.equipamentoId));
    if (!equip) {
      erros.equipamentoId = 'Selecione o equipamento.';
    }
    if (!formChamado.problema.trim()) {
      erros.problema = 'Este campo é obrigatório.';
    }
    setErrosChamado(erros);
    if (Object.keys(erros).length > 0) return;
    setSalvando(true);
    setErro('');
    try {
      await api.post('/manutencao/chamados', {
        equipamento: equip,
        problema: formChamado.problema,
        prioridade: formChamado.prioridade,
        // RODADA 1: SLA calculado pelo backend a partir da prioridade.
        data: formChamado.data,
        hora: formChamado.hora || null,
        responsavel: formChamado.responsavel,
        status: formChamado.status,
        fotoBase64: formChamado.fotoBase64 || null,
      });
      setErrosChamado({});
      setNovoChamado(false);
      setFormChamado(formChamadoVazio());
      setPreviewImagemChamado('');
      await buscarChamados();
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      setErro('❌ Erro ao criar o chamado.');
    } finally {
      setSalvando(false);
    }
  };

  // RODADA 4: "Concluir" abre o modal (a despesa opcional vai dentro dele).
  const abrirConcluir = (kind, item) => {
    setConcluir({ kind, item });
    setFormDespesa({ valor: '', data: obterDataHoje(), descricao: item.problema || item.servico || '' });
    setErro('');
    setErrosDespesa({});
  };

  // RODADA 4: confirma a conclusão; registra a despesa (opcional) antes de concluir.
  // Sem valor => só conclui, sem criar despesa. Com valor => 1 única despesa
  // (mesmo endpoint da Rodada 3) + conclusão. Erro mantém o modal aberto.
  const confirmarConclusao = async (e) => {
    e.preventDefault();
    if (!concluir) return;
    const { kind, item } = concluir;
    const valorPreenchido = formDespesa.valor !== '' && formDespesa.valor !== null && formDespesa.valor !== undefined;
    const valorNumerico = Number(formDespesa.valor || 0);
    if (valorPreenchido && !(valorNumerico > 0)) {
      setErrosDespesa({ valor: 'Informe um valor válido ou deixe vazio para concluir sem despesa.' });
      return;
    }
    const temDespesa = valorPreenchido && valorNumerico > 0;
    setErro('');
    setSalvando(true);
    try {
      if (temDespesa) {
        await api.post('/financeiro/despesas/manutencao', {
          // RODADA 3/4: descrição digitada pelo usuário (ex.: "Troca da correia da
          // esteira"). Salva como-is na Despesa; fallback p/ serviço se vazia.
          descricao: (formDespesa.descricao || '').trim() || item.problema || item.servico || 'Serviço',
          equipamento: item.equipamento?.nome || '',
          valor: valorNumerico,
          data: formDespesa.data,
          manutencaoId: item.id,
        });
      }
      if (kind === 'chamado') {
        await api.put(`/manutencao/chamados/${item.id}`, {
          ...item,
          equipamento: item.equipamento,
          status: 'FINALIZADO',
          dataConclusao: item.dataConclusao || obterDataHoje(),
        });
        await buscarChamados();
      } else {
        await api.put(`/manutencao/preventivas/${item.id}`, {
          ...item,
          equipamento: item.equipamento,
          status: 'CONCLUIDA',
        });
        await buscarPreventivas();
      }
      setErrosDespesa({});
      setConcluir(null);
      setFormDespesa({ valor: '', data: obterDataHoje(), descricao: '' });
    } catch (error) {
      console.error('Erro ao concluir manutenção:', error);
      setErro('❌ Não foi possível concluir a manutenção.');
    } finally {
      setSalvando(false);
    }
  };

  const handleSubmitPrev = async (e) => {
    e.preventDefault();
    const erros = {};
    const equip = equipamentos.find(eq => eq.id === Number(formPrev.equipamentoId));
    if (!equip) {
      erros.equipamentoId = 'Selecione o equipamento.';
    }
    if (!formPrev.servico.trim()) {
      erros.servico = 'Este campo é obrigatório.';
    }
    setErrosPrev(erros);
    if (Object.keys(erros).length > 0) return;
    setSalvando(true);
    setErro('');
    try {
      await api.post('/manutencao/preventivas', {
        equipamento: equip,
        servico: formPrev.servico,
        periodicidade: formPrev.periodicidade ? Number(formPrev.periodicidade) : null,
        dataUltimaManutencao: formPrev.dataUltimaManutencao,
        proximaManutencao: formPrev.proximaManutencao || null,
        responsavel: formPrev.responsavel,
        status: formPrev.status,
      });
      setErrosPrev({});
      setNovaPrev(false);
      setFormPrev(formPrevVazio());
      await buscarPreventivas();
    } catch (error) {
      console.error('Erro ao criar preventiva:', error);
      setErro('❌ Erro ao criar a manutenção preventiva.');
    } finally {
      setSalvando(false);
    }
  };

  // (RODADA 4: conclusão sempre via modal abrirConcluir/confirmarConclusao.)

  if (loading) return <div className="loading">Carregando...</div>;

  const filtroChamados = chamados.filter(ch =>
    (ch.problema && ch.problema.toLowerCase().includes(search.toLowerCase())) ||
    (ch.equipamento?.nome && ch.equipamento.nome.toLowerCase().includes(search.toLowerCase())) ||
    (ch.status && ch.status.toLowerCase().includes(search.toLowerCase())) ||
    (ch.slaStatus && ch.slaStatus.toLowerCase().includes(search.toLowerCase()))
  );
  const filtroPreventivas = preventivas.filter(p =>
    (p.servico && p.servico.toLowerCase().includes(search.toLowerCase())) ||
    (p.equipamento?.nome && p.equipamento.nome.toLowerCase().includes(search.toLowerCase())) ||
    (p.statusExibicao && p.statusExibicao.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      {erro && <div className="form-message error" style={{ marginBottom: 16 }}>{erro}</div>}

      <div className="tabs">
        <button className={`tab ${aba === 'corretivas' ? 'active' : ''}`} onClick={() => setAba('corretivas')}>
          <Wrench size={16} /> Manutenções Corretivas
        </button>
        <button className={`tab ${aba === 'preventivas' ? 'active' : ''}`} onClick={() => setAba('preventivas')}>
          <CalendarClock size={16} /> Manutenções Preventivas
        </button>
      </div>

      {aba === 'corretivas' && (
        <>
          <div className="toolbar">
            <div className="toolbar-left">
              <div className="search-bar">
                <input type="text" placeholder="Buscar por equipamento, problema ou status..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <span className="record-count">{filtroChamados.length} registro{filtroChamados.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="toolbar-right">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { setNovoChamado(true); setErro(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={14} /> Novo Chamado
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="theme-table is-compact">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Equipamento</th>
                  <th>Problema</th>
                  <th>Prioridade</th>
                  <th>Abertura</th>
                  <th>Prazo (SLA)</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtroChamados.length === 0 ? (
                  <tr><td colSpan="8"><div className="empty-state">Nenhum chamado encontrado</div></td></tr>
                ) : (
                  filtroChamados.map(ch => (
                    <tr key={ch.id}>
                      <td><span className="status-badge CORRETIVA">Corretiva</span></td>
                      <td><strong>{ch.equipamento?.nome || ch.equipamentoId}</strong></td>
                      <td><div className="cell-wrap">{ch.problema}</div></td>
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
                      <td><span className={`status-badge ${ch.status}`}>{rotuloStatusChamado[ch.status] || ch.status}</span></td>
                      <td>
                        <div className="actions">
                          {ch.fotoBase64 && (
                            <button onClick={() => setImagemAmpliada(ch.fotoBase64)} className="btn btn-secondary btn-xs" style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Visualizar imagem">
                              <ImageIcon size={12} /> Imagem
                            </button>
                          )}
                          {ch.status !== 'FINALIZADO' && (
                            <button onClick={() => abrirConcluir('chamado', ch)} className="btn btn-success btn-xs" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle size={12} /> Concluir
                            </button>
                          )}
                          <button onClick={() => handleDeleteChamado(ch.id)} className="btn btn-danger btn-xs">Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {aba === 'preventivas' && (
        <>
          <div className="toolbar">
            <div className="toolbar-left">
              <div className="search-bar">
                <input type="text" placeholder="Buscar por equipamento, serviço ou status..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <span className="record-count">{filtroPreventivas.length} registro{filtroPreventivas.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="toolbar-right">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { setNovaPrev(true); setErro(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={14} /> Nova Preventiva
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="theme-table is-compact">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Equipamento</th>
                  <th>Serviço</th>
                  <th>Periodicidade</th>
                  <th>Última</th>
                  <th>Próxima</th>
                  <th>Responsável</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtroPreventivas.length === 0 ? (
                  <tr><td colSpan="9"><div className="empty-state">Nenhuma manutenção preventiva encontrada</div></td></tr>
                ) : (
                  filtroPreventivas.map(p => (
                    <tr key={p.id}>
                      <td><span className="status-badge PREVENTIVA">Preventiva</span></td>
                      <td><strong>{p.equipamento?.nome || p.equipamentoId}</strong></td>
                      <td><div className="cell-wrap">{p.servico}</div></td>
                      <td>{p.periodicidade ? `${p.periodicidade} dias` : '—'}</td>
                      <td className="date-friendly">{formatDate(p.dataUltimaManutencao) || '—'}</td>
                      <td className="date-friendly"><strong>{formatDate(p.proximaManutencao) || '—'}</strong></td>
                      <td>{p.responsavel || '—'}</td>
                      <td><span className={`status-badge ${p.statusExibicao}`}>{rotuloStatusPrev[p.statusExibicao] || p.statusExibicao}</span></td>
                      <td>
                        <div className="actions">
                          {p.statusExibicao !== 'CONCLUIDA' && (
                            <button onClick={() => abrirConcluir('preventiva', p)} className="btn btn-success btn-xs" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle size={12} /> Concluir
                            </button>
                          )}
                          <button onClick={() => handleDeletePrev(p.id)} className="btn btn-danger btn-xs">Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

            {/* Novo Chamado (corretiva com SLA) */}
      <Dialog open={novoChamado} onOpenChange={(open) => !open && setNovoChamado(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <Wrench size={18} /> Novo Chamado (Manutenção Corretiva)
            </DialogTitle>
            <DialogDescription>Registre um novo chamado de manutenção corretiva. O SLA é calculado pelo sistema a partir da prioridade.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitChamado} className="dialog-form dialog-body">
            <FormField label="Equipamento" required error={errosChamado.equipamentoId}>
              <select className="theme-select" value={formChamado.equipamentoId} onChange={(e) => setFormChamado({ ...formChamado, equipamentoId: e.target.value })}>
                <option value="">Selecione o equipamento</option>
                {equipamentos.map(eq => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}
              </select>
            </FormField>
            <FormField label="Problema" required error={errosChamado.problema}>
              <textarea className="theme-textarea" value={formChamado.problema} onChange={(e) => setFormChamado({ ...formChamado, problema: e.target.value })} placeholder="Ex.: Correia danificada" rows={3} />
            </FormField>
            <div className="form-grid-2">
              <FormField label="Prioridade">
                <select className="theme-select" value={formChamado.prioridade} onChange={(e) => setFormChamado({ ...formChamado, prioridade: e.target.value })}>
                  {PRIORIDADES.map(pr => <option key={pr} value={pr}>{rotuloPrioridade[pr]}</option>)}
                </select>
              </FormField>
              {/* RODADA 1: SLA apenas informativo, calculado pelo backend. */}
              <FormField label="SLA (prazo)" hint="Definido pelo sistema">
                <input className="theme-input" type="text" value={textoSla(formChamado.prioridade)} readOnly disabled />
              </FormField>
            </div>
            <div className="form-grid-2">
              <FormField label="Data de abertura" required>
                <DateInput value={formChamado.data} onChange={(e) => setFormChamado({ ...formChamado, data: e.target.value })} />
              </FormField>
              <FormField label="Horário">
                <TimeInput value={formChamado.hora} onChange={(e) => setFormChamado({ ...formChamado, hora: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Imagem do equipamento (opcional)">
              <UploadInput id="upload-imagem-chamado" onChange={handleImagemChamadoChange} preview={previewImagemChamado} onRemove={removerImagemChamado} />
            </FormField>
            <div className="form-grid-2">
              <FormField label="Responsável">
                <input className="theme-input" type="text" value={formChamado.responsavel} onChange={(e) => setFormChamado({ ...formChamado, responsavel: e.target.value })} placeholder="Ex.: Técnico" />
              </FormField>
              <FormField label="Status">
                <select className="theme-select" value={formChamado.status} onChange={(e) => setFormChamado({ ...formChamado, status: e.target.value })}>
                  <option value="ABERTO">Aberto</option>
                  <option value="EM_ANDAMENTO">Em andamento</option>
                </select>
              </FormField>
            </div>
            {erro && <div className="form-message error" style={{ marginBottom: 0 }}><AlertCircle size={14} /> {erro}</div>}
            <DialogFooter className="dialog-footer">
              <button type="button" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setNovoChamado(false)}>
                <X size={14} /> Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} disabled={salvando}>
                <Wrench size={14} /> {salvando ? 'Salvando...' : 'Abrir chamado'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Nova Preventiva */}
      <Dialog open={novaPrev} onOpenChange={(open) => !open && setNovaPrev(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <CalendarClock size={18} /> Nova Manutenção Preventiva
            </DialogTitle>
            <DialogDescription>Agende uma manutenção preventiva recorrente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPrev} className="dialog-form dialog-body">
            <FormField label="Equipamento" required error={errosPrev.equipamentoId}>
              <select className="theme-select" value={formPrev.equipamentoId} onChange={(e) => setFormPrev({ ...formPrev, equipamentoId: e.target.value })}>
                <option value="">Selecione o equipamento</option>
                {equipamentos.map(eq => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}
              </select>
            </FormField>
            <FormField label="Serviço" required error={errosPrev.servico}>
              <textarea className="theme-textarea" value={formPrev.servico} onChange={(e) => setFormPrev({ ...formPrev, servico: e.target.value })} placeholder="Ex.: Lubrificação" rows={2} />
            </FormField>
            <div className="form-grid-2">
              <FormField label="Periodicidade (dias)" hint="Intervalo entre manutenções">
                <input className="theme-input" type="number" min="1" value={formPrev.periodicidade} onChange={(e) => setFormPrev({ ...formPrev, periodicidade: e.target.value })} placeholder="Ex.: 30" />
              </FormField>
              <FormField label="Status">
                <select className="theme-select" value={formPrev.status} onChange={(e) => setFormPrev({ ...formPrev, status: e.target.value })}>
                  <option value="AGENDADA">Agendada</option>
                  <option value="EM_ANDAMENTO">Em andamento</option>
                </select>
              </FormField>
            </div>
            <div className="form-grid-2">
              <FormField label="Última manutenção">
                <DateInput value={formPrev.dataUltimaManutencao} onChange={(e) => setFormPrev({ ...formPrev, dataUltimaManutencao: e.target.value })} />
              </FormField>
              <FormField label="Próxima manutenção">
                <DateInput value={formPrev.proximaManutencao} onChange={(e) => setFormPrev({ ...formPrev, proximaManutencao: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Responsável">
              <input className="theme-input" type="text" value={formPrev.responsavel} onChange={(e) => setFormPrev({ ...formPrev, responsavel: e.target.value })} placeholder="Ex.: Técnico" />
            </FormField>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Se a próxima manutenção não for informada, ela será calculada automaticamente somando a periodicidade à última manutenção.
            </p>
            {erro && <div className="form-message error" style={{ marginBottom: 0 }}><AlertCircle size={14} /> {erro}</div>}
            <DialogFooter className="dialog-footer">
              <button type="button" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setNovaPrev(false)}>
                <X size={14} /> Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} disabled={salvando}>
                <CalendarClock size={14} /> {salvando ? 'Salvando...' : 'Agendar manutenção'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* RODADA 4: Concluir manutenção (despesa opcional no mesmo fluxo) */}
      <Dialog open={!!concluir} onOpenChange={(open) => !open && !salvando && setConcluir(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <CheckCircle size={18} /> Concluir manutenção
            </DialogTitle>
            <DialogDescription>Informe os dados da despesa (opcional) antes de concluir. Se lançada, ela aparece no Financeiro com a mesma descrição.</DialogDescription>
          </DialogHeader>
          {concluir && (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                Equipamento: <strong>{concluir.item.equipamento?.nome || '-'}</strong> — Serviço: <strong>{concluir.item.problema || concluir.item.servico}</strong>
              </p>

              <form onSubmit={confirmarConclusao} className="dialog-form">
                {/* RODADA 3/4: descrição do gasto (ex.: "Troca da correia da esteira").
                    Opcional; persistida na Despesa e exibida também em /financeiro. */}
                <FormField label="Descrição" hint="Opcional — explique o gasto realizado">
                  <input
                    className="theme-input"
                    type="text"
                    value={formDespesa.descricao}
                    onChange={(e) => setFormDespesa({ ...formDespesa, descricao: e.target.value })}
                    placeholder="Ex.: Troca da correia da esteira"
                    maxLength={255}
                  />
                </FormField>
                <div className="form-grid-2">
                  <FormField label="Valor" hint="Opcional — vazio conclui sem despesa" error={errosDespesa.valor}>
                    <MoneyInput value={formDespesa.valor} onChange={(v) => setFormDespesa({ ...formDespesa, valor: v })} placeholder="0,00" />
                  </FormField>
                  <FormField label="Data" required>
                    <DateInput value={formDespesa.data} onChange={(e) => setFormDespesa({ ...formDespesa, data: e.target.value })} />
                  </FormField>
                </div>
                {erro && <div className="form-message error" style={{ marginBottom: 0 }}><AlertCircle size={14} /> {erro}</div>}
                <DialogFooter className="dialog-footer">
                  <button type="button" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setConcluir(null)} disabled={salvando}>
                    <X size={14} /> Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} disabled={salvando}>
                    <CheckCircle size={14} /> {salvando ? 'Concluindo...' : 'Concluir manutenção'}
                  </button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

{/* Visualizar imagem do chamado */}
      <Dialog open={!!imagemAmpliada} onOpenChange={(open) => !open && setImagemAmpliada('')}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ImageIcon size={18} /> Imagem do Equipamento
            </DialogTitle>
          </DialogHeader>
          {imagemAmpliada && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img src={imagemAmpliada} alt="Imagem do equipamento" style={{ maxWidth: '100%', maxHeight: 500, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
