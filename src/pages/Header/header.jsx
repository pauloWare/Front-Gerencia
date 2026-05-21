import { Link, useLocation, useNavigate } from "react-router-dom";
import tec from "../../assets/img/Teclogo.png";
import "./../css/style.css"; // Certifique-se de criar este arquivo

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  // Verifica se o usuário está logado no localStorage
  const usuarioLogado = localStorage.getItem("usuario");

  // Definindo as rotas que NÃO devem exibir o Header
  const rotasSemHeader = ["/login", "/cadastro"];

  if (rotasSemHeader.includes(location.pathname)) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("usuario"); // Remove os dados da sessão
    navigate("/login"); 
    window.location.reload(); // Atualiza para o Header ler o estado vazio
  };

  return (
    <header className="header-main">
      <div className="logo-container">
        <img className="Teclogo" src={tec} alt="Logo Academia" />
      </div>

      <nav className="nav-container">
        <Link to="/home" className="abas">home</Link>
        
        {/* Lógica Condicional: Se não estiver logado, mostra Login. Se estiver, mostra Sair */}
        {!usuarioLogado ? (
          <Link to="/login" className="abas login-link">Login</Link>
        ) : (
          <>
            <Link to="/perfil" className="abas">Perfil</Link>
            
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;