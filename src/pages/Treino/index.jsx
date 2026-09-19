import api from "../../service/api";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../Prescricao/prescricaoForm.css";

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
    if (!usuario || usuario.status !== "admin") {
      alert("Apenas administradores podem gerenciar treinos.");
      return;
    }
    if (!alunoSelecionadoId) {
      alert("Selecione um aluno!");
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
      } else {
        await api.post("/treino", payload);
      }
      setFormTreino({ nomeTreino: "", descricao: "" });
      setEditandoTreinoId(null);
      carregarTreinos();
    } catch (error) {
      console.error("Erro ao salvar treino:", error);
    }
  };

  const handleEditarTreino = (treino) => {
    setFormTreino({ nomeTreino: treino.nomeTreino, descricao: treino.descricao || "" });
    setEditandoTreinoId(treino.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeletarTreino = async (treinoId) => {
    if (!window.confirm("Excluir este treino e todos os seus exercícios?")) return;
    try {
      await api.delete(`/treino/${treinoId}`);
      carregarTreinos();
    } catch (error) {
      console.error("Erro ao deletar treino:", error);
    }
  };

  const handleSubmitExercicio = async (e, treinoId) => {
    e.preventDefault();
    if (!usuario || usuario.status !== "admin") {
      alert("Apenas administradores podem gerenciar treinos.");
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
      carregarTreinos();
    } catch (error) {
      console.error("Erro ao adicionar exercício:", error);
    }
  };

  const handleDeletarExercicio = async (treinoId, exercicioId) => {
    if (!window.confirm("Excluir este exercício?")) return;
    try {
      const treino = treinos.find(t => t.id === treinoId);
      if (!treino) return;
      const exerciciosAtualizados = (treino.exercicios || []).filter(ex => ex.id !== exercicioId);
      await api.put(`/treino/${treinoId}`, { ...treino, exercicios: exerciciosAtualizados });
      carregarTreinos();
    } catch (error) {
      console.error("Erro ao deletar exercício:", error);
    }
  };

  if (!usuario) return <div className="container"><p>Carregando...</p></div>;

  return (
    <div className="container">
      <h2 className="form-title">Gerenciar Treinos — Aluno #{alunoSelecionadoId || "Não selecionado"}</h2>

      {usuario.status !== "admin" && (
        <p className="info-text" style={{ textAlign: "center", color: "#fff", marginBottom: 16 }}>
          Apenas administradores podem gerenciar treinos.
        </p>
      )}

      {/* Seletor de Aluno */}
      {usuario.status === "admin" && (
        <div className="section">
          <div className="form-group">
            <label>Selecionar Aluno</label>
            <select 
              className="input" 
              value={alunoSelecionadoId} 
              onChange={handleAlunoChange}
              required
            >
              <option value="">Selecione um aluno</option>
              {usuarios.filter(u => u.status === "user" || u.status === "usuario").map(u => (
                <option key={u.id} value={u.id}>{u.nome} (ID: {u.id})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Formulário de Treino */}
      {usuario.status === "admin" && alunoSelecionadoId && (
        <form onSubmit={handleSubmitTreino} className="prescription-form">
          <div className="section">
            <h3 className="section-title">{editandoTreinoId ? "Editar Treino" : "Novo Treino"}</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Nome do Treino</label>
                <input className="input" type="text" value={formTreino.nomeTreino} onChange={e => setFormTreino({...formTreino, nomeTreino: e.target.value })} placeholder="Ex: Treino A - Peito" required />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea className="input" value={formTreino.descricao} onChange={e => setFormTreino({...formTreino, descricao: e.target.value })} placeholder="Ex: Focar na cadência dos movimentos" rows={3} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
              <button type="submit" className="button">{editandoTreinoId ? "Salvar" : "Adicionar Treino"}</button>
              {editandoTreinoId && (
                <button type="button" className="button" onClick={() => { setFormTreino({ nomeTreino: "", descricao: "" }); setEditandoTreinoId(null); }} style={{ backgroundColor: "#888" }}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Lista de Treinos */}
      {!alunoSelecionadoId ? (
        <div className="section" style={{ marginTop: 16 }}>
          <p style={{ textAlign: "center", color: "#666" }}>Selecione um aluno para visualizar os treinos.</p>
        </div>
      ) : treinos.length === 0 ? (
        <div className="section" style={{ marginTop: 16 }}>
          <p style={{ textAlign: "center", color: "#666" }}>Nenhum treino cadastrado para este aluno.</p>
        </div>
      ) : (
        treinos.map(treino => (
          <div key={treino.id} className="section" style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 className="section-title" style={{ marginBottom: 4 }}>{treino.nomeTreino}</h3>
                {treino.descricao && <p style={{ color: "#555", fontSize: "0.9rem", marginBottom: 12 }}>{treino.descricao}</p>}
              </div>
              {usuario.status === "admin" && (
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => handleEditarTreino(treino)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }} title="Editar">✏️</button>
                  <button onClick={() => handleDeletarTreino(treino.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }} title="Excluir">🗑️</button>
                </div>
              )}
            </div>

            {/* Exercícios */}
            {treino.exercicios && treino.exercicios.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #4b1c71", color: "#4b1c71" }}>
                      <th style={{ padding: "4px 8px", textAlign: "left" }}>Exercício</th>
                      <th style={{ padding: "4px 8px", textAlign: "center" }}>Séries</th>
                      <th style={{ padding: "4px 8px", textAlign: "center" }}>Reps</th>
                      <th style={{ padding: "4px 8px", textAlign: "center" }}>Carga</th>
                      <th style={{ padding: "4px 8px", textAlign: "left" }}>Obs</th>
                      {usuario.status === "admin" && <th style={{ padding: "4px 8px", textAlign: "center" }}>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {treino.exercicios.map(ex => (
                      <tr key={ex.id} style={{ borderBottom: "1px solid #ddd" }}>
                        <td style={{ padding: "4px 8px" }}>{ex.nome}</td>
                        <td style={{ padding: "4px 8px", textAlign: "center" }}>{ex.series}</td>
                        <td style={{ padding: "4px 8px", textAlign: "center" }}>{ex.repeticoes}</td>
                        <td style={{ padding: "4px 8px", textAlign: "center" }}>{ex.carga || "-"}</td>
                        <td style={{ padding: "4px 8px" }}>{ex.observacao || "-"}</td>
                        {usuario.status === "admin" && (
                          <td style={{ padding: "4px 8px", textAlign: "center" }}>
                            <button onClick={() => handleDeletarExercicio(treino.id, ex.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }} title="Excluir">🗑️</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Formulário de Exercício */}
            {usuario.status === "admin" && (
              <form onSubmit={(e) => handleSubmitExercicio(e, treino.id)} style={{ marginTop: 12, borderTop: "1px dashed #ccc", paddingTop: 12 }}>
                <p style={{ fontWeight: "bold", color: "#4b1c71", marginBottom: 8, fontSize: "0.9rem" }}>Adicionar Exercício</p>
                <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                  <div className="form-group">
                    <label style={{ fontSize: "0.8rem" }}>Nome</label>
                    <input className="input" type="text" value={exercicioTreinoId === treino.id ? exercicioForm.nome : ""} onChange={e => { setExercicioTreinoId(treino.id); setExercicioForm({ ...exercicioForm, nome: e.target.value }); }} placeholder="Supino Reto" required />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: "0.8rem" }}>Séries</label>
                    <input className="input" type="number" value={exercicioTreinoId === treino.id ? exercicioForm.series : ""} onChange={e => { setExercicioTreinoId(treino.id); setExercicioForm({ ...exercicioForm, series: e.target.value }); }} placeholder="3" required />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: "0.8rem" }}>Repetições</label>
                    <input className="input" type="number" value={exercicioTreinoId === treino.id ? exercicioForm.repeticoes : ""} onChange={e => { setExercicioTreinoId(treino.id); setExercicioForm({ ...exercicioForm, repeticoes: e.target.value }); }} placeholder="12" required />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: "0.8rem" }}>Carga</label>
                    <input className="input" type="text" value={exercicioTreinoId === treino.id ? exercicioForm.carga : ""} onChange={e => { setExercicioTreinoId(treino.id); setExercicioForm({ ...exercicioForm, carga: e.target.value }); }} placeholder="20kg" />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: "0.8rem" }}>Observação</label>
                    <input className="input" type="text" value={exercicioTreinoId === treino.id ? exercicioForm.observacao : ""} onChange={e => { setExercicioTreinoId(treino.id); setExercicioForm({ ...exercicioForm, observacao: e.target.value }); }} placeholder="45s descanso" />
                  </div>
                </div>
                <button type="submit" className="button" style={{ marginTop: 8, width: "auto", padding: "6px 16px", fontSize: "0.85rem" }}>Adicionar</button>
              </form>
            )}
          </div>
        ))
      )}

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button className="button" onClick={() => navigate("/perfil")} style={{ backgroundColor: "#888" }}>Voltar ao Perfil</button>
      </div>
    </div>
  );
}