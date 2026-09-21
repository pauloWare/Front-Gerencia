import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, UserCog, CreditCard, QrCode,
  Wallet, Wrench, BarChart3, User, LogOut, ChevronDown, ChevronRight,
  Dumbbell, ClipboardList, History, TrendingUp
} from "lucide-react";
import { useRole } from "../../lib/useRole";
import { hasPermission } from "../../lib/permissions";

export default function Sidebar() {
  const navigate = useNavigate();
  const [openSubmenu, setOpenSubmenu] = React.useState(false);
  const { role, setRole } = useRole();

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    setRole(null);
    navigate("/login");
  };

  const mainLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/financeiro", label: "Financeiro", icon: Wallet },
    { to: "/mensalidades", label: "Mensalidades", icon: CreditCard },
    { to: "/alunos", label: "Alunos", icon: Users },
    { to: "/historico-faturamento", label: "Histórico de Faturamento", icon: TrendingUp },
    { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
    { to: "/funcionarios", label: "Funcionários", icon: UserCog },
    
    
  ];

  const subLinks = [
    { to: "/equipamentos", label: "Equipamentos", icon: Dumbbell },
    { to: "/manutencao", label: "Tickets", icon: Wrench },
    { to: "/historico-chamados", label: "Histórico de Chamados", icon: History },
  ];

  

  // "Solicitar Manutenção" — disponível para ADMIN, TÉCNICO e RECEPCIONISTA
  const recepcaoLinks = [
  { to: "/solicitar-manutencao", label: "Solicitar Manutenção", icon: ClipboardList },
  { to: "/presenca", label: "Presença do dia", icon: QrCode },
  { to: "/perfil", label: "Perfil", icon: User },
];



  // O submenu "Tickets" aparece somente se o cargo possui algum módulo de
  // manutenção (ex.: TÉCNICO e ADMIN). FINANCEIRO/RECEPCIONISTA não veem.
  const temModuloManutencao = role
    ? subLinks.some((l) => hasPermission(role, l.to.split("/")[1]))
    : false;

  // A seção "Recepção" (Solicitar Manutenção) depende da permissão, e não do
  // nome do cargo, cobrindo ADMIN, TÉCNICO e RECEPCIONISTA (não FINANCEIRO).
  const podeSolicitarManutencao = role
    ? hasPermission(role, "solicitar-manutencao")
    : false;

  const renderLink = (link, extraClass = "") => {
    const module = link.to.split("/")[1] || "dashboard";
    const isAllowed = role ? hasPermission(role, module) : true;
    if (!isAllowed) return null;
    return (
      <NavLink
        key={link.to}
        to={link.to}
        className={({ isActive }) =>
          `sidebar-link ${isActive ? "active" : ""} ${extraClass}`
        }
      >
        <link.icon size={18} strokeWidth={1.8} />
        <span>{link.label}</span>
      </NavLink>
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Dumbbell size={22} strokeWidth={2.5} />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-title">ACADEMIA</span>
          <span className="sidebar-subtitle">Sistema de Gerenciamento</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Principal</div>
        {mainLinks.map(renderLink)}

        <div className="sidebar-divider" />

        {temModuloManutencao && (
          <button
            className="sidebar-link sidebar-submenu-toggle"
            onClick={() => setOpenSubmenu(!openSubmenu)}
          >
            <Wrench size={18} strokeWidth={1.8} />
            <span>Manutenção</span>
            {openSubmenu ? (
              <ChevronDown size={14} className="sidebar-chevron" />
            ) : (
              <ChevronRight size={14} className="sidebar-chevron" />
            )}
          </button>
        )}

        {openSubmenu && temModuloManutencao && (
          <div className="sidebar-submenu">
            {subLinks.map(renderLink)}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        {podeSolicitarManutencao && (
          <>
            <div className="sidebar-divider" />
            <div className="sidebar-section-label">Recepção</div>
            {recepcaoLinks.map(renderLink)}
          </>
        )}

        <button className="sidebar-link sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} strokeWidth={1.8} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
