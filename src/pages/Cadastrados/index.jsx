import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ListaAlunos.css";

export default function ListaClientes() {
  const [alunos, setAlunos] = useState([]);
  const [openMenus, setOpenMenus] = useState({});
  const navigate = useNavigate();

  // 🔹 URL base da API Spring Boot
  const API_URL = "http://localhost:8080/api/usuario";

  useEffect(() => {
    buscarAlunos();
  }, []);

  const buscarAlunos = async () => {
    try {
      const response = await axios.get(API_URL);
      setAlunos(response.data);
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
      if (error.code === "ERR_NETWORK") {
        alert("⚠️ Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:8080");
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      buscarAlunos();
    } catch (error) {
      console.error("Erro ao deletar aluno:", error);
    }
  };

  const toggleMenu = (id) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrescricao = (id) => {
    navigate(`/prescricao/${id}`);
    toggleMenu(id);
  };

  const handleTreino = (id) => {
    navigate(`/treino/${id}`);
    toggleMenu(id);
  };

  return (
    <div className="consulta-container">
      <h2>Seu cadastrado</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {alunos.map((aluno) => (
          <li key={aluno.id} className="aluno-item">
            <div className="aluno-info">
              <p><strong>Infos gerais do cliente:</strong></p>
              <p><strong>Nome:</strong> {aluno.nome}</p>
              <p><strong>Email:</strong> {aluno.email}</p>
              <p><strong>Data de Nascimento:</strong> {aluno.dataNascimento}</p>
              <p><strong>Como conheceu:</strong> {aluno.comoConheceu?.join(", ")}</p>
            </div>
            <div className="aluno-profile">
              <div className="aluno-foto">
                {aluno.fotoPerfilBase64 ? (
                  <img
                    src={aluno.fotoPerfilBase64}
                    alt={aluno.nome}
                  />
                ) : (
                  <div style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    background: '#d1b3ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4b1c71',
                    border: '3px solid #6a2c9f'
                  }}>
                    Sem Foto
                  </div>
                )}
              </div>
            </div>
            <div className="kebab-menu" onClick={() => toggleMenu(aluno.id)}>
              ⋮
            </div>
            {openMenus[aluno.id] && (
              <div className="dropdown open">
                <button
                  className="treino"
                  onClick={() => handleTreino(aluno.id)}
                >
                  Gerenciar Treinos
                </button>
                <button
                  className="prescricao"
                  onClick={() => handlePrescricao(aluno.id)}
                >
                  Preencher prescrição
                </button>
                <button
                  className="delete"
                  onClick={() => {
                    handleDelete(aluno.id);
                    toggleMenu(aluno.id);
                  }}
                >
                  Deletar
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}