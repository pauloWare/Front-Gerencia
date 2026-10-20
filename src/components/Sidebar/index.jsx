import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  LayoutDashboard, Users, UserCog, CreditCard, QrCode,
  Wallet, Wrench, BarChart3, User, LogOut, ChevronDown, ChevronRight,
  Dumbbell, ClipboardList, History, TrendingUp
} from "lucide-react";
import { useRole } from "../../lib/useRole";
import { hasPermission } from "../../lib/permissions";
import { logout } from "../../lib/auth";

export default function Sidebar({ aberto = false, aoFechar = () => {} }) {
  const navigate = useNavigate();
  const [openSubmenu, setOpenSubmenu] = React.useState(false);
  const { role, setRole } = useRole();

  const handleLogout = () => {
    logout();
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
    { to: "/manutencao", label: "Manutenção", icon: Wrench },
    { to: "/historico-chamados", label: "Histórico de Chamados", icon: History },
  ];

  

  // "Solicitar Manutenção" — disponível para ADMIN, TÉCNICO e RECEPCIONISTA
  const recepcaoLinks = [
    { to: "/solicitar-manutencao", label: "Solicitar Manutenção", icon: ClipboardList },
    { to: "/presenca", label: "Presença do dia", icon: QrCode },
  ];



  // O submenu "Manutenção" aparece somente se o cargo possui algum módulo de
  // manutenção (ex.: TÉCNICO e ADMIN). FINANCEIRO/RECEPCIONISTA não veem.
  const temModuloManutencao = role
    ? subLinks.some((l) => hasPermission(role, l.to.split("/")[1]))
    : false;

  // Cada link é filtrado individualmente por permissão (mesma regra do
  // ProtectedRoute). A seção Recepção só aparece se algum link for visível.
  const linkPermitido = (link) => {
    const modulo = link.to.split("/")[1] || "dashboard";
    return role ? hasPermission(role, modulo) : true;
  };
  const recepcaoVisiveis = recepcaoLinks.filter(linkPermitido);

  const renderLink = (link, extraClass = "") => {
    if (!linkPermitido(link)) return null;
    return (
      <NavLink
        key={link.to}
        to={link.to}
        onClick={aoFechar}
        className={({ isActive }) =>
          `sidebar-link ${isActive ? "active" : ""} ${extraClass}`
        }
      >
        <link.icon size={18} strokeWidth={1.8} aria-hidden="true" />
        <span>{link.label}</span>
      </NavLink>
    );
  };

  return (
    <aside
      className={`sidebar ${aberto ? "is-open" : ""}`}
      id="menu-lateral"
      aria-label="Menu de navegação"
    >
      <div className="sidebar-brand">
        <div className="sidebar-logo" aria-hidden="true">
          <Dumbbell size={22} strokeWidth={2.5} />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-title">ACADEMIA</span>
          <span className="sidebar-subtitle">Sistema de Gerenciamento</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Principal">
        <div className="sidebar-section-label">Principal</div>
        {mainLinks.map(renderLink)}

        <div className="sidebar-divider" />

        {temModuloManutencao && (
          <button
            type="button"
            className="sidebar-link sidebar-submenu-toggle"
            aria-expanded={openSubmenu}
            aria-controls="submenu-manutencao"
            onClick={() => setOpenSubmenu(!openSubmenu)}
          >
            <Wrench size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>Manutenção</span>
            {openSubmenu ? (
              <ChevronDown size={14} className="sidebar-chevron" aria-hidden="true" />
            ) : (
              <ChevronRight size={14} className="sidebar-chevron" aria-hidden="true" />
            )}
          </button>
        )}

        {openSubmenu && temModuloManutencao && (
          <div className="sidebar-submenu" id="submenu-manutencao">
            {subLinks.map(renderLink)}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        {recepcaoVisiveis.length > 0 && (
          <>
            <div className="sidebar-divider" />
            <div className="sidebar-section-label">Recepção</div>
            {recepcaoLinks.map(renderLink)}
          </>
        )}

        {/* Perfil é acessível a todos os perfis autenticados (lib/permissions.js) */}
        {renderLink({ to: "/perfil", label: "Perfil", icon: User })}

        <button
          type="button"
          className="sidebar-link sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  aberto: PropTypes.bool,
  aoFechar: PropTypes.func,
};
