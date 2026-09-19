import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { useRole } from "../../lib/useRole";

export default function Header() {
  const navigate = useNavigate();
  const { setRole } = useRole();
  const usuarioLogado = localStorage.getItem("usuario");
  let nomeUsuario = "Administrador";
  if (usuarioLogado) {
    try {
      const user = JSON.parse(usuarioLogado);
      nomeUsuario = user.nome || user.name || "Administrador";
    } catch {
      nomeUsuario = "Administrador";
    }
  }

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
            <span className="app-header-role">Administrador</span>
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
