import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./PerfilUsuario.css"; 

export default function PerfilUsuario() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("dados");
  const [treino, setTreino] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false);
  
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");
    if (!usuarioSalvo) {
      navigate("/login");
      return;
    }
    const parsedUser = JSON.parse(usuarioSalvo);
    setUser(parsedUser);
    
    axios.get(`http://localhost:8080/api/prescricoes/cliente/${parsedUser.id}`)
      .then(res => setTreino(res.data))
      .catch(() => console.log("Sem treinos cadastrados."));

    setLoading(false);

    const handleClickFora = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAberto(false);
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, [navigate]);

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair?")) {
      localStorage.removeItem("usuario");
      navigate("/login");
    }
  };

  if (loading) return <div className="loading-screen">Carregando Perfil...</div>;

  return (
    <div className="perfil-container fade-in-page">
      <h2 className="titulo-painel">Meu Perfil</h2>
      
      {user && (
        <div className="card-perfil-full">
          {/* Card da Esquerda */}
          <aside className="sidebar-visual">
            
            {/* Menu de 3 Pontinhos posicionado no canto superior direito do card */}
            <div className="menu-contextual-absoluto" ref={menuRef}>
              <button 
                className="btn-pontinhos-clean-v2" 
                onClick={() => setMenuAberto(!menuAberto)}
              >
                ⋮
              </button>
              
              {menuAberto && (
                <div className="dropdown-perfil-v2">
                  <button onClick={() => {setAbaAtiva('dados'); setMenuAberto(false)}}>
                    👤 Meus Dados
                  </button>
                  <button onClick={() => {setAbaAtiva('treino'); setMenuAberto(false)}}>
                    💪 Visualizar Treino
                  </button>
                  <button className="btn-sair-dropdown" onClick={handleLogout}>
                    🚪 Sair da Conta
                  </button>
                </div>
              )}
            </div>

            <div className="foto-perfil-wrapper">
              {user.fotoPerfilBase64 ? (
                <img src={user.fotoPerfilBase64} alt="Perfil" />
              ) : (
                <div className="placeholder-foto">SEM FOTO</div>
              )}
            </div>

            <div className="info-resumo-usuario">
              <h3 className="nome-resumo">{user.nome?.split(' ')[0]}</h3>
              <div className="tag-status-wrapper">
                <span className="tag-status-neon">Membro Ativo</span>
              </div>
            </div>
          </aside>

          {/* Painel da Direita */}
          <main className="conteudo-dados">
            {abaAtiva === "dados" ? (
              <section className="section-animada">
                <div className="header-dados">
                  <h3>Dados Pessoais</h3>
                  <span className="id-texto-destaque">Matrícula #{user.id}</span>
                </div>
                <div className="dados-pessoais-grid">
                  <div className="dado-bloco"><label>Nome Completo</label><p>{user.nome}</p></div>
                  <div className="dado-bloco"><label>E-mail Corporativo</label><p>{user.email}</p></div>
                  <div className="dado-bloco-full"><label>Data de Nascimento</label><p>{user.dataNascimento || "---"}</p></div>
                </div>
              </section>
            ) : (
              <section className="section-animada">
                <div className="header-dados">
                  <h3>Ficha de Treino</h3>
                  {treino && <span className="id-texto-destaque">📅 {treino.dataCriacao}</span>}
                </div>
                
                {treino ? (
                  <div className="dados-pessoais-grid">
                    <div className="dado-bloco"><label>Peso</label><p>{treino.peso} kg</p></div>
                    <div className="dado-bloco"><label>Altura</label><p>{treino.altura} m</p></div>
                    <div className="dado-bloco-full">
                      <label>Treino Prescrito</label>
                      <div className="caixa-texto-treino-premium">{treino.treino}</div>
                    </div>
                  </div>
                ) : (
                  <div className="msg-vazia-container">
                    <p>Nenhuma prescrição encontrada.</p>
                  </div>
                )}
              </section>
            )}
          </main>
        </div>
      )}
    </div>
  );
}