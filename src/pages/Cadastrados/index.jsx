import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../service/api";
import { Dumbbell, ClipboardList, Trash2, MoreVertical, AlertCircle, UserRound } from "lucide-react";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";

export default function ListaClientes() {
  const [alunos, setAlunos] = useState([]);
  const [openMenus, setOpenMenus] = useState({});
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [excluirId, setExcluirId] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    buscarAlunos();
  }, []);

  const buscarAlunos = async () => {
    try {
      setCarregando(true);
      setErro("");
      const response = await api.get("/usuario");
      setAlunos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
      setErro(
        error.code === "ERR_NETWORK"
          ? "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
          : "Não foi possível carregar os cadastrados. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!excluirId) return;
    setExcluindo(true);
    try {
      await api.delete(`/usuario/${excluirId}`);
      setExcluirId(null);
      setOpenMenus((prev) => ({ ...prev }));
      buscarAlunos();
    } catch (error) {
      console.error("Erro ao deletar aluno:", error);
      setErro("Não foi possível excluir o aluno. Tente novamente.");
    } finally {
      setExcluindo(false);
    }
  };

  const toggleMenu = (id) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fecharMenus = () => setOpenMenus({});

  const handlePrescricao = (id) => {
    navigate(`/prescricao/${id}`);
  };

  const handleTreino = (id) => {
    navigate(`/treino/${id}`);
  };

  if (carregando) return <div className="loading">Carregando cadastrados...</div>;

  return (
    <>
      <div className="theme-card" style={{ marginBottom: 20 }}>
        <h2 className="section-title"><UserRound size={16} /> Cadastrados</h2>
        <p className="dialog-hint" style={{ margin: 0 }}>
          {alunos.length} aluno{alunos.length !== 1 ? "s" : ""} cadastrado{alunos.length !== 1 ? "s" : ""} no sistema.
        </p>
      </div>

      {erro && (
        <div className="form-message error" role="alert" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} />
          <span>{erro}</span>
        </div>
      )}

      {alunos.length === 0 ? (
        <div className="theme-card"><p className="empty-state" style={{ margin: 0 }}>Nenhum aluno cadastrado.</p></div>
      ) : (
        <ul className="aluno-card-list">
          {alunos.map((aluno) => (
            <li key={aluno.id} className="aluno-card">
              <div className="aluno-card-info">
                <p><strong>Nome:</strong> {aluno.nome}</p>
                <p><strong>Email:</strong> {aluno.email}</p>
                <p><strong>Data de Nascimento:</strong> {aluno.dataNascimento}</p>
                {aluno.comoConheceu?.length > 0 && (
                  <p><strong>Como conheceu:</strong> {aluno.comoConheceu.join(", ")}</p>
                )}
              </div>
              <div className="aluno-card-profile">
                <div className="aluno-foto">
                  {aluno.fotoPerfilBase64 ? (
                    <img
                      src={aluno.fotoPerfilBase64}
                      alt={`Foto de ${aluno.nome}`}
                    />
                  ) : (
                    <div className="aluno-foto-fallback" aria-hidden="true">
                      Sem foto
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="kebab-btn"
                aria-label={`Opções de ${aluno.nome}`}
                aria-expanded={Boolean(openMenus[aluno.id])}
                onClick={() => toggleMenu(aluno.id)}
              >
                <MoreVertical size={18} aria-hidden="true" />
              </button>
              {openMenus[aluno.id] && (
                <>
                  <button
                    type="button"
                    className="sidebar-overlay"
                    aria-label="Fechar opções"
                    onClick={fecharMenus}
                    style={{ position: "fixed", inset: 0, zIndex: 5 }}
                  />
                  <div className="card-menu" role="menu">
                    <button type="button" onClick={() => { fecharMenus(); handleTreino(aluno.id); }} role="menuitem">
                      <Dumbbell size={15} aria-hidden="true" /> Gerenciar Treinos
                    </button>
                    <button type="button" onClick={() => { fecharMenus(); handlePrescricao(aluno.id); }} role="menuitem">
                      <ClipboardList size={15} aria-hidden="true" /> Preencher prescrição
                    </button>
                    <button type="button" className="danger" onClick={() => { fecharMenus(); setExcluirId(aluno.id); }} role="menuitem">
                      <Trash2 size={15} aria-hidden="true" /> Excluir
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(excluirId)}
        titulo="Excluir aluno"
        mensagem="Excluir este aluno? Essa ação não pode ser desfeita."
        rotuloConfirmar="Excluir"
        processando={excluindo}
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => { if (!excluindo) setExcluirId(null); }}
      />
    </>
  );
}