import { useState, useEffect, useRef } from 'react';
import api from '../../service/api';
import { useNavigate } from 'react-router-dom';
import { User, CalendarCheck, Plus, X, CheckCircle2, AlertCircle, Eye, History, Pencil, Trash2, KeyRound, Copy, RefreshCw, Loader2, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { formatDate, formatTime } from '../../lib/dateUtils';
import { formatCpf, formatTelefone } from '../../lib/format';
import { useRole } from '../../lib/useRole';
import AlunoForm from '../Cadastro/AlunoForm';

// Cargos autorizados pelo backend em POST /api/aluno/** (ver SecurityConfig).
// Aqui é só para exibir/ocultar a ação; a conferência real acontece na API.
const CARGOS_AUXILIO_ATIVACAO = ['ADMIN', 'RECEPCIONISTA'];

const diaSemana = (dataIso) => {
  const texto = String(dataIso || '').slice(0, 10);
  const partes = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!partes) return '';
  const dataUtc = new Date(Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])));
  if (Number.isNaN(dataUtc.getTime())) return '';
  return ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][dataUtc.getUTCDay()] || '';
};

const rotuloSituacao = (situacao) => {
  switch (situacao) {
    case 'ATIVO': return 'Ativo';
    case 'INATIVO': return 'Inativo';
    case 'SUSPENSO': return 'Suspenso';
    case 'CANCELADO': return 'Cancelado';
    default: return situacao || 'Inativo';
  }
};

// Iniciais do aluno para o avatar: primeira letra do primeiro e do último nome.
const iniciais = (nome) => {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '—';
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

export default function Alunos() {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const navigate = useNavigate();

  // Exclusão de aluno: confirmação em modal (mesmo contrato da API: DELETE /aluno/:id)
  const [excluirAluno, setExcluirAluno] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  // Detalhes do aluno (frequência real + informações já existentes no sistema)
  const [detalhe, setDetalhe] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [mensalidades, setMensalidades] = useState([]);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [erroDetalhe, setErroDetalhe] = useState('');
  const detalheIdRef = useRef(null);

  // RODADA 2: modal "+ Novo aluno" (mesmo padrão visual de Funcionários).
  // Remontar o AlunoForm a cada abertura garante formulário limpo.
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [chaveFormNovo, setChaveFormNovo] = useState(0);
  // Estado de envio vindo do AlunoForm: desabilita o botão do rodapé e
  // impede envios duplicados também pelo botão externo ao formulário.
  const [salvandoNovoAluno, setSalvandoNovoAluno] = useState(false);

  // ===== Auxílio à ativação (recepção) =====================================
  // O código de ativação NUNCA é consultado: ele só existe no banco como hash
  // BCrypt (com salt) e, portanto, não pode ser recuperado. O caminho seguro é
  // EMITIR um novo código (POST /aluno/:id/codigo-ativacao), operação que
  // substitui o registro e invalida o código anterior. O código novo é exibido
  // SOMENTE nesta resposta e desaparece ao fechar o diálogo.
  // O backend autoriza ADMIN/RECEPCIONISTA; aqui a ação apenas é exibida para
  // os mesmos cargos (a segurança real não depende do botão).
  const { role } = useRole();
  const podeAuxiliarAtivacao = CARGOS_AUXILIO_ATIVACAO.includes(String(role || '').toUpperCase());
  const [gerandoCodigo, setGerandoCodigo] = useState(false);
  const [codigoNovo, setCodigoNovo] = useState('');
  const [avisoAtivacao, setAvisoAtivacao] = useState('');
  const [erroAtivacao, setErroAtivacao] = useState('');
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  // Bloco de resultado da ativação (código/aviso/erro) — alvo da rolagem automática.
  const resultadoAtivacaoRef = useRef(null);

  /** Zera o auxílio ao abrir/fechar os detalhes: código não sobrevive à tela. */
  const limparAuxilioAtivacao = () => {
    setGerandoCodigo(false);
    setCodigoNovo('');
    setAvisoAtivacao('');
    setErroAtivacao('');
    setCodigoCopiado(false);
  };

  // Rola até o resultado da ativação sempre que ele aparece ou muda (ex.: 2ª geração de código).
  useEffect(() => {
    if (!codigoNovo && !avisoAtivacao && !erroAtivacao) return undefined;
    const frame = requestAnimationFrame(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      resultadoAtivacaoRef.current?.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'center',
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [codigoNovo, avisoAtivacao, erroAtivacao]);

  const auxiliarAtivacao = async () => {
    if (!detalhe || gerandoCodigo) return;
    setGerandoCodigo(true);
    setCodigoNovo('');
    setAvisoAtivacao('');
    setErroAtivacao('');
    setCodigoCopiado(false);
    try {
      const resposta = await api.post(`/aluno/${detalhe.id}/codigo-ativacao`);
      const dados = resposta.data || {};
      if (dados.contaJaAtiva) {
        // Conta já tem senha: o backend não emite código novo (e não o faria).
        setAvisoAtivacao(dados.mensagem || 'Esta conta já está ativada: o aluno já possui senha.');
      } else if (dados.codigoAtivacao) {
        setCodigoNovo(dados.codigoAtivacao);
      } else {
        setErroAtivacao('Não foi possível emitir o código de ativação. Tente novamente.');
      }
    } catch (error) {
      // Apenas mensagens devolvidas pela API (ou genéricas) — nunca o código.
      const status = error.response?.status;
      const mensagemApi = error.response?.data?.erro;
      if (status === 401) {
        setErroAtivacao('Sessão expirada. Faça login novamente.');
      } else if (status === 403) {
        setErroAtivacao('Seu perfil não tem permissão para emitir códigos de ativação.');
      } else if (status === 404) {
        setErroAtivacao('Aluno não encontrado.');
      } else {
        setErroAtivacao(mensagemApi || 'Não foi possível emitir um novo código de ativação. Tente novamente.');
      }
    } finally {
      setGerandoCodigo(false);
    }
  };

  const copiarCodigoNovo = async () => {
    if (!codigoNovo) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(codigoNovo);
      } else {
        // Fallback p/ contextos sem Clipboard API (HTTP / permissões).
        const area = document.createElement('textarea');
        area.value = codigoNovo;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
      setCodigoCopiado(true);
      setTimeout(() => setCodigoCopiado(false), 3000);
    } catch {
      setErroAtivacao('Não foi possível copiar automaticamente. Copie o código manualmente.');
    }
  };

  useEffect(() => {
    buscarAlunos();
  }, []);

  const abrirDetalhes = async (aluno) => {
    limparAuxilioAtivacao();
    setErroDetalhe('');
    detalheIdRef.current = aluno.id;
    setDetalhe(aluno);
    setResumo(null);
    setMensalidades([]);
    setCarregandoDetalhe(true);
    try {
      const [resFreq, resMens] = await Promise.all([
        api.get(`/frequencia/resumo/${aluno.id}`),
        api.get(`/mensalidade/aluno/${aluno.id}`),
      ]);
      if (detalheIdRef.current !== aluno.id) return;
      setResumo(resFreq.data || null);
      setMensalidades(Array.isArray(resMens.data) ? resMens.data : []);
    } catch (error) {
      if (detalheIdRef.current !== aluno.id) return;
      console.error('Erro ao buscar detalhes do aluno:', error);
      setErroDetalhe('Não foi possível carregar os detalhes do aluno.');
    } finally {
      if (detalheIdRef.current === aluno.id) {
        setCarregandoDetalhe(false);
      }
    }
  };

  const buscarAlunos = async () => {
    try {
      const response = await api.get('/aluno');
      setAlunos(response.data);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    } finally {
      setLoading(false);
    }
  };

  const solicitarExclusao = (aluno) => {
    setErro('');
    setSucesso('');
    setExcluirAluno(aluno);
  };

  const confirmarExclusao = async () => {
    if (!excluirAluno) return;
    setExcluindo(true);
    try {
      await api.delete(`/aluno/${excluirAluno.id}`);
      setExcluirAluno(null);
      setSucesso(`Aluno "${excluirAluno.nome}" excluído com sucesso.`);
      buscarAlunos();
    } catch (error) {
      const msg = error.response?.data?.erro || error.response?.data?.error || 'Erro ao excluir aluno.';
      setErro(msg);
      setExcluirAluno(null);
    } finally {
      setExcluindo(false);
    }
  };

  const filtered = alunos.filter(aluno =>
    aluno.nome.toLowerCase().includes(search.toLowerCase()) ||
    (aluno.email && aluno.email.toLowerCase().includes(search.toLowerCase()))
  );

  // Mensalidade mais recente do aluno aberto no detalhe (dado real da API)
  const mensalidadeAtual = mensalidades.length > 0
    ? [...mensalidades].sort((a, b) => String(b.dataVencimento || '').localeCompare(String(a.dataVencimento || '')))[0]
    : null;

  if (loading) return <div className="loading">Carregando alunos...</div>;

  return (
    <>
      {erro && (
        <div className="form-message error" style={{ marginBottom: 16 }} role="alert">
          <AlertCircle size={16} /> {erro}
        </div>
      )}
      {sucesso && (
        <div className="form-message success" style={{ marginBottom: 16 }} role="status">
          <CheckCircle2 size={16} /> {sucesso}
        </div>
      )}

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <input type="text" placeholder="Buscar por nome ou email..." aria-label="Buscar aluno por nome ou email" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="record-count">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="toolbar-right">
          {/* RODADA 2: cadastro abre em modal sobre a própria página (padrão Funcionários). */}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setChaveFormNovo((k) => k + 1);
              setSalvandoNovoAluno(false);
              setSucesso('');
              setModalNovoAberto(true);
            }}
          >
            <Plus size={14} /> Novo Aluno
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="theme-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Status</th>
              <th style={{ width: 230 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="5"><div className="empty-state">Nenhum aluno encontrado</div></td></tr>
            ) : (
              filtered.map(aluno => (
                <tr key={aluno.id}>
                  <td><strong>{aluno.nome}</strong></td>
                  <td>{aluno.email}</td>
                  <td>{aluno.telefone || '-'}</td>
                  
                  <td>
                    <span className={`status-badge ${aluno.situacao || 'INATIVO'}`}>
                      {rotuloSituacao(aluno.situacao)}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button onClick={() => abrirDetalhes(aluno)} className="btn btn-secondary btn-xs">
                        <Eye size={12} /> Detalhes
                      </button>
                      <button onClick={() => navigate(`/cadastro?id=${aluno.id}`)} className="btn btn-secondary btn-xs">
                        <Pencil size={12} /> Editar
                      </button>
                      <button onClick={() => solicitarExclusao(aluno)} className="btn btn-danger btn-xs" aria-label={`Excluir aluno ${aluno.nome}`}>
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!detalhe} onOpenChange={(open) => { if (!open) { setDetalhe(null); setErroDetalhe(''); limparAuxilioAtivacao(); } }}>
        <DialogContent className="max-w-2xl modal-aluno-detalhe">
          <DialogHeader className="modal-aluno-detalhe-header">
            <DialogTitle>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <User size={18} /> Detalhes do Aluno
              </span>
            </DialogTitle>
            <DialogDescription>Informações cadastrais, frequência e histórico de presença.</DialogDescription>
          </DialogHeader>

          <div className="aluno-detalhe-corpo">
          {erroDetalhe && (
            <div className="form-message error" role="alert"><AlertCircle size={16} /> {erroDetalhe}</div>
          )}

          {detalhe && (
            <>
              <div className="aluno-detalhe-topo">
                <span className="aluno-detalhe-avatar" aria-hidden="true">{iniciais(detalhe.nome)}</span>
                <div>
                  <strong className="aluno-detalhe-nome">{detalhe.nome}</strong>
                  <div className="aluno-detalhe-badges">
                    <span className={`status-badge ${detalhe.situacao || 'INATIVO'}`}>{rotuloSituacao(detalhe.situacao)}</span>
                    {detalhe.plano && (
                      <span className="aluno-detalhe-plano-badge">
                        {detalhe.plano}
                      </span>
                    )}
                    {detalhe.dataMatricula && (
                      <span className="cell-sub">Matrícula: {formatDate(detalhe.dataMatricula)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="aluno-detalhe-contatos">
                <div>
                  <span className="cell-sub aluno-detalhe-rotulo">E-mail</span>
                  <span className="aluno-detalhe-valor">{detalhe.email || '—'}</span>
                </div>
                <div>
                  <span className="cell-sub aluno-detalhe-rotulo">Telefone</span>
                  <span className="aluno-detalhe-valor">{formatTelefone(detalhe.telefone) || '—'}</span>
                </div>
                <div>
                  <span className="cell-sub aluno-detalhe-rotulo">CPF</span>
                  <span className="aluno-detalhe-valor">{detalhe.cpf ? formatCpf(detalhe.cpf) : '—'}</span>
                </div>
              </div>

              {carregandoDetalhe ? (
                <div className="aluno-detalhe-skeleton" role="status" aria-label="Carregando detalhes">
                  <span className="aluno-detalhe-skeleton-bloco" />
                  <span className="aluno-detalhe-skeleton-bloco" />
                  <span className="aluno-detalhe-skeleton-bloco" />
                </div>
              ) : (
                <>
                  <div className="aluno-detalhe-colunas">
                  <div className="form-section">
                    <div className="form-group-title"><CalendarCheck size={15} /> Frequência</div>
                    {!resumo || resumo.totalPresencas === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Sem registros de frequência.</p>
                    ) : (
                      <div className="aluno-detalhe-freq">
                        <p className="aluno-detalhe-freq-destaque">
                          {resumo.presencasMes} de {resumo.diasConsiderados} dias úteis
                          <span className="aluno-detalhe-freq-percentual">
                            ({resumo.percentual != null ? `${resumo.percentual}%` : '—'})
                          </span>
                        </p>
                        {resumo.percentual != null && (
                          <div
                            className="aluno-detalhe-freq-barra"
                            role="progressbar"
                            aria-valuenow={Math.min(100, Math.max(0, resumo.percentual))}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Frequência de ${resumo.percentual}% no mês atual`}
                          >
                            <span
                              className="aluno-detalhe-freq-barra-fill"
                              style={{ width: `${Math.min(100, Math.max(0, resumo.percentual))}%` }}
                            />
                          </div>
                        )}
                        <p className="cell-sub">
                          {resumo.totalPresencas} {resumo.totalPresencas === 1 ? 'presença registrada' : 'presenças registradas'} no total
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="form-section">
                    <div className="form-group-title"><CreditCard size={15} /> Mensalidade</div>
                    {!mensalidadeAtual ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Sem mensalidades registradas.</p>
                    ) : (
                      <div className="aluno-detalhe-mensalidade-status">
                        <span className={`status-badge ${mensalidadeAtual.status || 'PENDENTE'}`}>{mensalidadeAtual.status || 'PENDENTE'}</span>
                        <span className="aluno-detalhe-mensalidade-venc">
                          Vencimento: {formatDate(mensalidadeAtual.dataVencimento) || '—'}
                        </span>
                      </div>
                    )}
                  </div>
                  </div>

                  {resumo && resumo.historico?.length > 0 && (
                    <div className="form-section">
                      <div className="form-group-title"><History size={15} /> Últimas presenças</div>
                      <div className="aluno-detalhe-presencas-lista">
                        {[...resumo.historico].sort((a, b) => String(b.data).localeCompare(String(a.data))).slice(0, 5).map((h) => (
                          <div key={h.id} className="aluno-detalhe-presenca-item">
                            <span>{diaSemana(h.data)} · {formatDate(h.data)}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{formatTime(h.horaEntrada) || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Auxílio à ativação: o código NUNCA é consultado/exibido aqui.
                      A ação emite um novo código (invalidando o anterior) e o
                      mostra UMA vez, somente para quem clicou no botão. */}
                  {podeAuxiliarAtivacao && (
                    <div className="form-section">
                      <div className="form-group-title"><KeyRound size={15} /> Ativação da conta</div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 10px' }}>
                        O código de ativação não fica disponível para consulta. Se o aluno perdeu o
                        código, emita um novo — o código anterior é invalidado automaticamente.
                      </p>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={auxiliarAtivacao}
                        disabled={gerandoCodigo}
                      >
                        {gerandoCodigo ? <RefreshCw size={14} /> : <KeyRound size={14} />}
                        {gerandoCodigo ? 'Gerando código...' : 'Auxiliar na ativação'}
                      </button>

                      {(codigoNovo || avisoAtivacao || erroAtivacao) && (
                        <div ref={resultadoAtivacaoRef} className="aluno-detalhe-resultado-ativacao">
                      {codigoNovo && (
                        <div
                          className="form-message success"
                          role="status"
                          style={{ marginTop: 10, marginBottom: 0, display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}
                        >
                          <CheckCircle2 size={18} style={{ marginTop: 2 }} />
                          <span style={{ flex: 1, minWidth: 180 }}>
                            <strong>Novo código de ativação gerado.</strong>
                            <br />
                            <span>Código: </span>
                            <code aria-live="polite" style={{ fontSize: '1.2em', fontWeight: 700, letterSpacing: 2 }}>{codigoNovo}</code>
                            <br />
                            <span>
                              O código anterior foi invalidado. Entregue este código ao aluno para que ele
                              defina a senha no aplicativo — é um código de uso único.
                            </span>
                          </span>
                          <button type="button" className="btn btn-secondary btn-xs" onClick={copiarCodigoNovo}>
                            <Copy size={12} /> {codigoCopiado ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>
                      )}

                      {avisoAtivacao && !codigoNovo && (
                        <div
                          className="form-message success"
                          role="status"
                          style={{ marginTop: 10, marginBottom: 0, display: 'flex', alignItems: 'flex-start', gap: 10 }}
                        >
                          <CheckCircle2 size={18} style={{ marginTop: 2 }} />
                          <span>{avisoAtivacao}</span>
                        </div>
                      )}

                      {erroAtivacao && (
                        <div className="form-message error" role="alert" style={{ marginTop: 10, marginBottom: 0 }}>
                          <AlertCircle size={16} /> {erroAtivacao}
                        </div>
                      )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
          </div>

          {detalhe && (
            <DialogFooter className="dialog-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => { setDetalhe(null); limparAuxilioAtivacao(); navigate(`/cadastro?id=${detalhe.id}`); }}
              >
                <Pencil size={14} /> Editar
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => { setDetalhe(null); limparAuxilioAtivacao(); setErroDetalhe(''); }}
              >
                Fechar
              </button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* RODADA 2: cadastro de novo aluno em modal (padrão Funcionários). */}
      <Dialog
        open={modalNovoAberto}
        onOpenChange={(open) => {
          if (!open && !salvandoNovoAluno) {
            setModalNovoAberto(false);
            // Fecha via X/Escape/overlay após um sucesso já exibido no modal:
            // garante a lista atualizada mesmo sem passar pelo "Entendi".
            buscarAlunos();
          }
        }}
      >
        <DialogContent className="max-w-2xl modal-aluno-novo">
          <DialogHeader>
            <DialogTitle>
              <span className="dialog-title-icon"><Plus size={18} /> Cadastrar novo aluno</span>
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do aluno. Campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          <div className="dialog-body modal-aluno-body">
            <AlunoForm
              key={chaveFormNovo}
              idAluno={null}
              modo="modal"
              formId="aluno-form-modal-novo"
              onSalvandoChange={setSalvandoNovoAluno}
              // Chamado SOMENTE na conclusão explícita ("Entendi, fechar") do
              // AlunoForm: aqui sim fecha o modal e atualiza a lista.
              onSucesso={(aluno, infoAtivacao) => {
                setModalNovoAberto(false);
                setSalvandoNovoAluno(false);
                buscarAlunos();
                if (aluno?.nome) {
                  setSucesso(
                    infoAtivacao?.codigo
                      ? `Aluno "${aluno.nome}" cadastrado com sucesso! O código de ativação foi exibido no formulário.`
                      : `Aluno "${aluno.nome}" cadastrado com sucesso!`
                  );
                }
              }}
            />
          </div>

          <DialogFooter className="dialog-footer">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={salvandoNovoAluno}
              onClick={() => {
                setModalNovoAberto(false);
                buscarAlunos();
              }}
            >
              <X size={14} /> Cancelar
            </button>
            <button
              type="submit"
              form="aluno-form-modal-novo"
              className="btn btn-primary btn-sm"
              disabled={salvandoNovoAluno}
              aria-busy={salvandoNovoAluno}
            >
              {salvandoNovoAluno ? <Loader2 size={14} className="is-spinning" /> : <CheckCircle2 size={14} />}
              {salvandoNovoAluno ? 'Cadastrando...' : 'Cadastrar aluno'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exclusão de aluno — confirmação padronizada (substitui window.confirm) */}
      <ConfirmDialog
        open={!!excluirAluno}
        titulo="Excluir aluno"
        mensagem={excluirAluno ? `Deseja realmente excluir este aluno? Essa ação não pode ser desfeita. (${excluirAluno.nome})` : ''}
        rotuloConfirmar="Excluir"
        processando={excluindo}
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => setExcluirAluno(null)}
      />
    </>
  );
}