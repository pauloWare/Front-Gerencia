import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { LogOut, Menu, X } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { useRole } from "../../lib/useRole";
import { getUsuario, logout } from "../../lib/auth";

// Rotulo amigavel para o cargo informado pelo login (usuario.cargo).
// O cargo continua resolvido apenas no frontend (sistema de permissoes
// nao foi alterado nesta etapa).
const cargoLabel = (cargo) => {
  if (!cargo) return "Administrador";
  switch (String(cargo).toUpperCase()) {
    case "ADMIN":
      return "Administrador";
    case "RECEPCIONISTA":
      return "Recepcionista";
    case "FINANCEIRO":
      return "Financeiro";
    case "TECNICO":
      return "Técnico";
    default:
      return String(cargo);
  }
};

export default function Header({ menuAberto = false, aoAlternarMenu = () => {} }) {
  const navigate = useNavigate();
  const { setRole } = useRole();

  const usuarioLogado = getUsuario();
  let nomeUsuario = null;
  let cargoUsuario = null;
  if (usuarioLogado) {
    nomeUsuario = usuarioLogado.nome || usuarioLogado.name;
    cargoUsuario = usuarioLogado.cargo ? cargoLabel(usuarioLogado.cargo) : null;
  }
  if (!nomeUsuario) nomeUsuario = "Administrador";
  if (!cargoUsuario) cargoUsuario = "Administrador";

  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleLogout = () => {
    logout();
    setRole(null);
    navigate("/login");
  };

  const initials = nomeUsuario
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button
          type="button"
          className="app-header-menu"
          onClick={aoAlternarMenu}
          aria-expanded={menuAberto}
          aria-controls="menu-lateral"
          aria-label={menuAberto ? "Fechar menu de navegação" : "Abrir menu de navegação"}
        >
          {menuAberto ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
        <span className="app-header-date">{dataAtual}</span>
      </div>
      <div className="app-header-right">
        <div className="app-header-user">
          <div className="app-header-user-info">
            <span className="app-header-name">{nomeUsuario}</span>
            <span className="app-header-role">{cargoUsuario}</span>
          </div>
          <Avatar className="app-header-avatar">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="app-header-logout"
          title="Sair do sistema"
          aria-label="Sair do sistema"
        >
          <LogOut size={16} aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}

Header.propTypes = {
  menuAberto: PropTypes.bool,
  aoAlternarMenu: PropTypes.func,
};
