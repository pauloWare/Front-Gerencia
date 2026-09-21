import { useState, useEffect } from 'react';
import api from '../../service/api';
import { useNavigate } from 'react-router-dom';
import { User, CalendarCheck, IdCard } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { formatDate, formatTime } from '../../lib/dateUtils';

const rotuloSituacao = (situacao) => {
  switch (situacao) {
    case 'ATIVO': return 'Ativo';
    case 'INATIVO': return 'Inativo';
    case 'SUSPENSO': return 'Suspenso';
    case 'CANCELADO': return 'Cancelado';
    default: return situacao || 'Inativo';
  }
};

export default function Alunos() {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  // Detalhes do aluno (frequência real + informações já existentes no sistema)
  const [detalhe, setDetalhe] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [mensalidades, setMensalidades] = useState([]);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  useEffect(() => {
    buscarAlunos();
  }, []);

  const abrirDetalhes = async (aluno) => {
    setDetalhe(aluno);
    setResumo(null);
    setMensalidades([]);
    setCarregandoDetalhe(true);
    try {
      const [resFreq, resMens] = await Promise.all([
        api.get(`/frequencia/resumo/${aluno.id}`),
        api.get(`/mensalidade/aluno/${aluno.id}`),
      ]);
      setResumo(resFreq.data || null);
      setMensalidades(Array.isArray(resMens.data) ? resMens.data : []);
    } catch (error) {
      console.error('Erro ao buscar detalhes do aluno:', error);
      setErro('❌ Não foi possível carregar os detalhes do aluno.');
    } finally {
      setCarregandoDetalhe(false);
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

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir este aluno?')) {
      try {
        await api.delete(`/aluno/${id}`);
        buscarAlunos();
      } catch (error) {
        const msg = error.response?.data?.erro || error.response?.data?.error || 'Erro ao excluir aluno.';
        setErro(`❌ ${msg}`);
      }
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
      {erro && <div className="form-message error" style={{ marginBottom: 16 }}>{erro}</div>}

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <input type="text" placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="record-count">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/cadastro')}>+ Novo Aluno</button>
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
                      {aluno.situacao === 'ATIVO' ? 'Ativo' : 
                       aluno.situacao === 'INATIVO' ? 'Inativo' : 
                       aluno.situacao === 'SUSPENSO' ? 'Suspenso' : 
                       aluno.situacao === 'CANCELADO' ? 'Cancelado' : (aluno.situacao || 'Inativo')}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button onClick={() => abrirDetalhes(aluno)} className="btn btn-secondary btn-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <IdCard size={12} /> Detalhes
                      </button>
                      <button onClick={() => navigate(`/cadastro?id=${aluno.id}`)} className="btn btn-secondary btn-xs">Editar</button>
                      <button onClick={() => handleDelete(aluno.id)} className="btn btn-danger btn-xs">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!detalhe} onOpenChange={(open) => { if (!open) setDetalhe(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <User size={18} /> Detalhes do Aluno
              </span>
            </DialogTitle>
            <DialogDescription>Informações cadastrais, frequência e histórico de presença.</DialogDescription>
          </DialogHeader>

          {detalhe && (
            <>
              <div style={{ display: 'grid', gap: 4 }}>
                <strong style={{ fontSize: '1rem' }}>{detalhe.nome}</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Email: {detalhe.email || '—'}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Telefone: {detalhe.telefone || '—'}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>CPF: {detalhe.cpf || '—'}</span>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
                  <span className={`status-badge ${detalhe.situacao || 'INATIVO'}`}>{rotuloSituacao(detalhe.situacao)}</span>
                  {detalhe.plano && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'var(--primary-bg)', color: 'var(--primary-dark)' }}>
                      {detalhe.plano}
                    </span>
                  )}
                  {detalhe.dataMatricula && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Matrícula: {formatDate(detalhe.dataMatricula)}</span>
                  )}
                </div>
              </div>

              {carregandoDetalhe ? (
                <div className="loading" style={{ minHeight: 80 }}>Carregando detalhes...</div>
              ) : (
                <>
                  <div className="form-section">
                    <div className="form-group-title"><CalendarCheck size={15} /> Frequência</div>
                    {!resumo || resumo.totalPresencas === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Sem registros de frequência.</p>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: '1.35rem', fontWeight: 700 }}>{resumo.percentual != null ? `${resumo.percentual}%` : '—'}</div>
                            <div className="cell-sub">no mês atual</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '1.35rem', fontWeight: 700 }}>{resumo.presencasMes}</div>
                            <div className="cell-sub">presenças no mês</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '1.35rem', fontWeight: 700 }}>{resumo.totalPresencas}</div>
                            <div className="cell-sub">total registradas</div>
                          </div>
                        </div>
                        <p className="cell-sub" style={{ margin: '8px 0 0' }}>
                          Base do cálculo: {resumo.diasConsiderados} dia(s) útil(eis) decorrido(s) no mês.
                        </p>
                        {resumo.ultimaPresenca && (
                          <p style={{ fontSize: '0.85rem', margin: '8px 0 0' }}>
                            Última presença: <strong>{formatDate(resumo.ultimaPresenca.data)}</strong> às <strong>{formatTime(resumo.ultimaPresenca.horaEntrada)}</strong>
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {resumo && resumo.historico?.length > 0 && (
                    <div className="form-section">
                      <div className="form-group-title"><IdCard size={15} /> Histórico recente</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {resumo.historico.map((h) => (
                          <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span>{formatDate(h.data)}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{formatTime(h.horaEntrada) || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="form-section" style={{ marginBottom: 0, paddingBottom: 0 }}>
                    <div className="form-group-title"><CalendarCheck size={15} /> Mensalidade</div>
                    {!mensalidadeAtual ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Sem mensalidades registradas.</p>
                    ) : (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className={`status-badge ${mensalidadeAtual.status || 'PENDENTE'}`}>{mensalidadeAtual.status || 'PENDENTE'}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Vencimento: {formatDate(mensalidadeAtual.dataVencimento) || '—'}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}