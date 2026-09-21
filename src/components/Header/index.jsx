import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { useRole } from "../../lib/useRole";

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

export default function Header() {
  const navigate = useNavigate();
  const { setRole } = useRole();

  const usuarioLogado = localStorage.getItem("usuario");
  let nomeUsuario = null;
  let cargoUsuario = null;
  if (usuarioLogado) {
    try {
      const user = JSON.parse(usuarioLogado);
      if (user) {
        nomeUsuario = user.nome || user.name;
        cargoUsuario = user.cargo ? cargoLabel(user.cargo) : null;
      }
    } catch {
      // dado corrompido: deixa os rótulos vazios (sem inventar cargo/nome).
    }
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
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
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
          title="Sair"
        >
          <LogOut size={16} />
        </Button>
      </div>
    </header>
  );
}
