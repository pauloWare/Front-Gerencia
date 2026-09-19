import api from "../../service/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./categoria.css";
 
export default function Categoria() {
  const navigate = useNavigate();
 
  // Estado para armazenar categorias
  const [vcategoria, setCategoria] = useState([]);
 
  // Estados do formulário
  const [vid, setId] = useState('');
  const [vnome, setNome] = useState('');
 
  // Controle de edição
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
 
  // Ao carregar a tela já traz os dados
  useEffect(() => {
    buscarCategorias();
  }, []);
 
  // Função para buscar as categorias no servidor
  const buscarCategorias = async () => {
    try {
      const response = await api.get("http://localhost:3000/categoria");
      setCategoria(response.data);
    } catch (err) {
      console.error("Erro ao buscar as categorias", err);
    }
  };
 
  // Função para cadastrar ou atualizar categoria
  const handleSubmit = async (e) => {
    e.preventDefault();
 
    const dataToSend = {
      id: vid,
      nome: vnome
    };
 
    try {
      if (isEditing) {
        // ======= Atualização (PUT) =======
        await api.put(`http://localhost:3000/categoria/${editingId}`, dataToSend);
      } else {
        // ======= Novo cadastro (POST) =======
        await api.post("http://localhost:3000/categoria", dataToSend);
      }
 
      // Atualiza a lista após cadastrar ou editar
      await buscarCategorias();
      resetForm();
    } catch (error) {
      console.log("Erro ao salvar categoria", error);
    }
  };
 
  // Função para preparar a edição de uma categoria
  const handleEdit = (cat) => {
    setIsEditing(true);
    setEditingId(cat.id);
    setId(cat.id);
    setNome(cat.nome);
  };
 
  // Função para deletar categoria
  const handleDelete = async (id) => {
    try {
      await api.delete(`http://localhost:3000/categoria/${id}`);
      await buscarCategorias();
    } catch (error) {
      console.log("Erro ao deletar categoria", error);
    }
  };
 
  // Função para resetar o formulário
  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setId('');
    setNome('');
  };
 
  return (
    <div className="app-container">
      <div className="main-content">
        Cadastro de Categoria
      </div>
 
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>ID</label>
          <input
            type="number"
            placeholder="ID da Categoria"
            required
            value={vid}
            onChange={(e) => setId(e.target.value)}
          />
        </div>
 
        <div className="form-group">
          <label>Nome da Categoria</label>
          <input
            type="text"
            placeholder="Nome da Categoria"
            required
            value={vnome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
 
        <div className="form-group">
          <button type="submit">
            {isEditing ? "Atualizar Categoria" : "Cadastrar Categoria"}
          </button>
        </div>
 
        {isEditing && (
          <div className="form-group">
            <button type="button" onClick={resetForm}>
              Cancelar
            </button>
          </div>
        )}
      </form>
 
      {/* Lista de Categorias */}
      <div className="main-content">
        Categorias Cadastradas
      </div>
      <ul>
        {vcategoria.map(item => (
          <li key={item.id}>
            {item.id} - {item.nome}
            <div className="botoes">
              <button onClick={() => handleEdit(item)}>Editar</button>
              <button onClick={() => handleDelete(item.id)}>Deletar</button>
            </div>
          </li>
        ))}
      </ul>

      <div style={{ textAlign: "center", marginTop: 20, marginBottom: 20 }}>
        <button onClick={() => navigate("/perfil")} style={{ backgroundColor: "#888", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Voltar ao Perfil
        </button>
      </div>
    </div>
  );
}
 
 
 