import api from "../../service/api";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Pencil, Trash2, Plus, ArrowLeft, Dumbbell,
  AlertCircle, CheckCircle2,
} from "lucide-react";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { FormField } from "../../components/ui/field";

/** Cargo com poder de gerenciar treinos (legado usa `status`, sessão atual usa `cargo`). */
const podeGerenciar = (usuario) =>
  usuario?.status === "admin" || usuario?.cargo === "ADMIN";

export default function Treino() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [treinos, setTreinos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState(id || "");
  const [formTreino, setFormTreino] = useState({ nomeTreino: "", descricao: "" });
  const [editandoTreinoId, setEditandoTreinoId] = useState(null);
  const [exercicioForm, setExercicioForm] = useState({ nome: "", series: "", repeticoes: "", carga: "", observacao: "" });
  const [exercicioTreinoId, setExercicioTreinoId] = useState(null);
  const [feedback, setFeedback] = useState({ tipo: "", texto: "" });
  const [excluirTreino, setExcluirTreino] = useState(null);
  const [excluirExercicio, setExcluirExercicio] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");
    if (!usuarioSalvo) {
      navigate("/login");
      return;
    }
    const parsed = JSON.parse(usuarioSalvo);
    setUsuario(parsed);

    if (parsed.status === "admin") {
      api.get("/usuario")
        .then(res => setUsuarios(res.data))
        .catch(() => setUsuarios([]));
    }

    if (id) {
      setAlunoSelecionadoId(id);
      carregarTreinos(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const carregarTreinos = (alunoId) => {
    const targetId = alunoId || alunoSelecionadoId;
    if (!targetId) return;
    api.get(`/treino/usuario/${targetId}`)
      .then(res => setTreinos(res.data))
      .catch(() => setTreinos([]));
  };

  const handleAlunoChange = (e) => {
    const novoId = e.target.value;
    setAlunoSelecionadoId(novoId);
    setFormTreino({ nomeTreino: "", descricao: "" });
    setEditandoTreinoId(null);
    if (novoId) {
      carregarTreinos(novoId);
    } else {
      setTreinos([]);
    }
  };

  const handleSubmitTreino = async (e) => {
    e.preventDefault();
    if (!podeGerenciar(usuario)) {
      setFeedback({ tipo: "error", texto: "Apenas administradores podem gerenciar treinos." });
      return;
    }
    if (!alunoSelecionadoId) {
      setFeedback({ tipo: "error", texto: "Selecione um aluno para salvar o treino." });
      return;
    }
    try {
      const payload = {
        nomeTreino: formTreino.nomeTreino,
        descricao: formTreino.descricao,
        usuario: { id: Number(alunoSelecionadoId) }
      };
      if (editandoTreinoId) {
        await api.put(`/treino/${editandoTreinoId}`, payload);
        setFeedback({ tipo: "success", texto: "Treino atualizado com sucesso." });
      } else {
        await api.post("/treino", payload);
        setFeedback({ tipo: "success", texto: "Treino adicionado com sucesso." });
      }
      setFormTreino({ nomeTreino: "", descricao: "" });
      setEditandoTreinoId(null);
      carregarTreinos();
    } catch (error) {
      console.error("Erro ao salvar treino:", error);
      setFeedback({ tipo: "error", texto: "Não foi possível salvar o treino. Tente novamente." });
    }
  };

  const handleEditarTreino = (treino) => {
    setFormTreino({ nomeTreino: treino.nomeTreino, descricao: treino.descricao || "" });
    setEditandoTreinoId(treino.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmarExclusaoTreino = async () => {
    if (!excluirTreino) return;
    setExcluindo(true);
    try {
      await api.delete(`/treino/${excluirTreino}`);
      setExcluirTreino(null);
      setFeedback({ tipo: "success", texto: "Treino excluído com sucesso." });
      carregarTreinos();
    } catch (error) {
      console.error("Erro ao deletar treino:", error);
      setFeedback({ tipo: "error", texto: "Não foi possível excluir o treino. Tente novamente." });
    } finally {
      setExcluindo(false);
    }
  };

  const handleSubmitExercicio = async (e, treinoId) => {
    e.preventDefault();
    if (!podeGerenciar(usuario)) {
      setFeedback({ tipo: "error", texto: "Apenas administradores podem gerenciar treinos." });
      return;
    }
    try {
      const payload = { ...exercicioForm, series: Number(exercicioForm.series), repeticoes: Number(exercicioForm.repeticoes) };
      const treino = treinos.find(t => t.id === treinoId);
      if (!treino) return;
      const exerciciosAtualizados = [...(treino.exercicios || []), payload];
      await api.put(`/treino/${treinoId}`, { ...treino, exercicios: exerciciosAtualizados });
      setExercicioForm({ nome: "", series: "", repeticoes: "", carga: "", observacao: "" });
      setExercicioTreinoId(null);
      setFeedback({ tipo: "success", texto: "Exercício adicionado com sucesso." });
      carregarTreinos();
    } catch (error) {
      console.error("Erro ao adicionar exercício:", error);
      setFeedback({ tipo: "error", texto: "Não foi possível adicionar o exercício. Tente novamente." });
    }
  };

  const confirmarExclusaoExercicio = async () => {
    if (!excluirExercicio) return;
    setExcluindo(true);
    try {
      const treino = treinos.find(t => t.id === excluirExercicio.treinoId);
      if (!treino) return;
      const exerciciosAtualizados = (treino.exercicios || []).filter(ex => ex.id !== excluirExercicio.exercicioId);
      await api.put(`/treino/${excluirExercicio.treinoId}`, { ...treino, exercicios: exerciciosAtualizados });
      setExcluirExercicio(null);
      setFeedback({ tipo: "success", texto: "Exercício excluído com sucesso." });
      carregarTreinos();
    } catch (error) {
      console.error("Erro ao deletar exercício:", error);
      setFeedback({ tipo: "error", texto: "Não foi possível excluir o exercício. Tente novamente." });
    } finally {
      setExcluindo(false);
    }
  };

  if (!usuario) return <div className="loading">Carregando...</div>;

  const isAdmin = podeGerenciar(usuario);

  return (
    <>
      <div className="theme-card" style={{ marginBottom: 20 }}>
        <h2 className="section-title"><Dumbbell size={16} /> Gerenciar Treinos{alunoSelecionadoId ? ` — Aluno #${alunoSelecionadoId}` : ''}</h2>

        {feedback.texto && (
          <div className={`form-message ${feedback.tipo === 'success' ? 'success' : 'error'}`} role={feedback.tipo === 'error' ? 'alert' : 'status'}>
            {feedback.tipo === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.texto}</span>
          </div>
        )}

        {!isAdmin && (
          <p className="form-message error" role="alert">
            <AlertCircle size={16} />
            <span>Apenas administradores podem gerenciar treinos.</span>
          </p>
        )}

        {/* Seletor de Aluno */}
        {isAdmin && (
          <FormField label="Selecionar Aluno" htmlFor="treino-aluno">
            <select
              id="treino-aluno"
              className="theme-select"
              value={alunoSelecionadoId}
              onChange={handleAlunoChange}
              required
            >
              <option value="">Selecione um aluno</option>
              {usuarios.filter(u => u.status === "user" || u.status === "usuario").map(u => (
                <option key={u.id} value={u.id}>{u.nome} (ID: {u.id})</option>
              ))}
            </select>
          </FormField>
        )}
      </div>

      {/* Formulário de Treino */}
      {isAdmin && alunoSelecionadoId && (
        <form onSubmit={handleSubmitTreino} className="theme-card" style={{ marginBottom: 20 }}>
          <h3 className="section-title">{editandoTreinoId ? "Editar Treino" : "Novo Treino"}</h3>
          <div className="form-grid-2">
            <FormField label="Nome do Treino" htmlFor="treino-nome" required>
              <input id="treino-nome" className="theme-input" type="text" value={formTreino.nomeTreino} onChange={e => setFormTreino({ ...formTreino, nomeTreino: e.target.value })} placeholder="Ex: Treino A - Peito" required />
            </FormField>
            <FormField label="Descrição" htmlFor="treino-descricao">
              <textarea id="treino-descricao" className="theme-textarea" value={formTreino.descricao} onChange={e => setFormTreino({ ...formTreino, descricao: e.target.value })} placeholder="Ex: Focar na cadência dos movimentos" rows={3} />
            </FormField>
          </div>
          <div className="form-actions form-actions-center">
            <button type="submit" className="btn btn-primary btn-sm">{editandoTreinoId ? "Salvar" : "Adicionar Treino"}</button>
            {editandoTreinoId && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setFormTreino({ nomeTreino: "", descricao: "" }); setEditandoTreinoId(null); }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {/* Lista de Treinos */}
      {!alunoSelecionadoId ? (
        <div className="theme-card">
          <p className="empty-state" style={{ margin: 0 }}>Selecione um aluno para visualizar os treinos.</p>
        </div>
      ) : treinos.length === 0 ? (
        <div className="theme-card">
          <p className="empty-state" style={{ margin: 0 }}>Nenhum treino cadastrado para este aluno.</p>
        </div>
      ) : (
        treinos.map(treino => (
          <div key={treino.id} className="theme-card" style={{ marginBottom: 20 }}>
            <div className="treino-card-head">
              <div>
                <h3 className="treino-card-title">{treino.nomeTreino}</h3>
                {treino.descricao && <p className="treino-card-desc">{treino.descricao}</p>}
              </div>
              {isAdmin && (
                <div className="actions">
                  <button type="button" className="icon-btn" onClick={() => handleEditarTreino(treino)} aria-label={`Editar ${treino.nomeTreino}`} title="Editar">
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button type="button" className="icon-btn danger" onClick={() => setExcluirTreino(treino.id)} aria-label={`Excluir ${treino.nomeTreino}`} title="Excluir">
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            {/* Exercícios */}
            {treino.exercicios && treino.exercicios.length > 0 && (
              <div className="table-wrapper">
                <table className="theme-table">
                  <thead>
                    <tr>
                      <th>Exercício</th>
                      <th style={{ textAlign: "center" }}>Séries</th>
                      <th style={{ textAlign: "center" }}>Reps</th>
                      <th style={{ textAlign: "center" }}>Carga</th>
                      <th>Obs</th>
                      {isAdmin && <th style={{ textAlign: "center" }}>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {treino.exercicios.map(ex => (
                      <tr key={ex.id}>
                        <td>{ex.nome}</td>
                        <td style={{ textAlign: "center" }}>{ex.series}</td>
                        <td style={{ textAlign: "center" }}>{ex.repeticoes}</td>
                        <td style={{ textAlign: "center" }}>{ex.carga || "—"}</td>
                        <td>{ex.observacao || "—"}</td>
                        {isAdmin && (
                          <td style={{ textAlign: "center" }}>
                            <button type="button" className="icon-btn danger" onClick={() => setExcluirExercicio({ treinoId: treino.id, exercicioId: ex.id })} aria-label={`Excluir ${ex.nome}`} title="Excluir">
                              <Trash2 size={15} aria-hidden="true" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Formulário de Exercício */}
            {isAdmin && (
              <form onSubmit={(e) => handleSubmitExercicio(e, treino.id)} className="treino-form-divider">
                <p className="treino-form-title">Adicionar Exercício</p>
                <div className="treino-exercise-grid">
                  <FormField label="Nome" htmlFor={`ex-nome-${treino.id}`} required>
                    <input id={`ex-nome-${treino.id}`} className="theme-input" type="text" value={exercicioTreinoId === treino.id ? exercicioForm.nome : ""} onChange={e => { setExercicioTreinoId(treino.id); setExercicioForm({ ...exercicioForm, nome: e.target.value }); }} placeholder="Supino Reto" required />
                  </FormField>
                  <FormField label="Séries" htmlFor={`ex-series-${treino.id}`} required>
                    <input id={`ex-series-${treino.id}`} className="theme-input" type="number" value={exercicioTreinoId === treino.id ? exercicioForm.series : ""} onChange={e => { setExercicioTreinoId(treino.id); setExercicioForm({ ...exercicioForm, series: e.target.value }); }} placeholder="3" required />
                  </FormField>
                  <FormField label="Repetições" htmlFor={`ex-reps-${treino.id}`} required>
                    <input id={`ex-reps-${treino.id}`} className="theme-input" type="number" value={exercicioTreinoId === treino.id ? exercicioForm.repeticoes : ""} onChange={e => { setExercicioTreinoId(treino.id); setExercicioForm({ ...exercicioForm, repeticoes: e.target.value }); }} placeholder="12" required />
                  </FormField>
                  <FormField label="Carga" htmlFor={`ex-carga-${treino.id}`}>
                    <input id={`ex-carga-${treino.id}`} className="theme-input" type="text" value={exercicioTreinoId === treino.id ? exercicioForm.carga : ""} onChange={e => { setExercicioTreinoId(treino.id); setExercicioForm({ ...exercicioForm, carga: e.target.value }); }} placeholder="20kg" />
                  </FormField>
                  <FormField label="Observação" htmlFor={`ex-obs-${treino.id}`}>
                    <input id={`ex-obs-${treino.id}`} className="theme-input" type="text" value={exercicioTreinoId === treino.id ? exercicioForm.observacao : ""} onChange={e => { setExercicioTreinoId(treino.id); setExercicioForm({ ...exercicioForm, observacao: e.target.value }); }} placeholder="45s descanso" />
                  </FormField>
                </div>
                <div className="form-actions" style={{ marginTop: 12 }}>
                  <button type="submit" className="btn btn-primary btn-sm"><Plus size={14} aria-hidden="true" /> Adicionar</button>
                </div>
              </form>
            )}
          </div>
        ))
      )}

      <div className="form-actions form-actions-center" style={{ marginTop: 20 }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate("/perfil")}><ArrowLeft size={14} aria-hidden="true" /> Voltar ao Perfil</button>
      </div>

      <ConfirmDialog
        open={Boolean(excluirTreino)}
        titulo="Excluir treino"
        mensagem="Excluir este treino e todos os seus exercícios? Essa ação não pode ser desfeita."
        rotuloConfirmar="Excluir"
        processando={excluindo}
        aoConfirmar={confirmarExclusaoTreino}
        aoCancelar={() => { if (!excluindo) setExcluirTreino(null); }}
      />
      <ConfirmDialog
        open={Boolean(excluirExercicio)}
        titulo="Excluir exercício"
        mensagem="Excluir este exercício? Essa ação não pode ser desfeita."
        rotuloConfirmar="Excluir"
        processando={excluindo}
        aoConfirmar={confirmarExclusaoExercicio}
        aoCancelar={() => { if (!excluindo) setExcluirExercicio(null); }}
      />
    </>
  );
}