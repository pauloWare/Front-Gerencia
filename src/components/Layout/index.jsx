import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "../Header";
import {
  LayoutDashboard, Users, UserCog, CreditCard, QrCode,
  Wallet, BarChart3, User, Dumbbell, Wrench, ClipboardList, History, TrendingUp
} from "lucide-react";

const pageConfig = {
  "/dashboard": { title: "Dashboard", subtitle: "Visão geral da academia", icon: LayoutDashboard },
  "/alunos": { title: "Alunos", subtitle: "Gerenciamento de matrículas e alunos", icon: Users },
  "/funcionarios": { title: "Funcionários", subtitle: "Equipe administrativa e operacional", icon: UserCog },
  "/mensalidades": { title: "Mensalidades", subtitle: "Controle de pagamentos e vencimentos", icon: CreditCard },
  
  "/financeiro": { title: "Financeiro", subtitle: "Receitas, despesas e saldo do período", icon: Wallet },
  "/historico-faturamento": { title: "Histórico de Faturamento", subtitle: "Evolução do faturamento ao longo do tempo", icon: TrendingUp },
  "/relatorios": { title: "Relatórios", subtitle: "Indicadores e métricas da academia", icon: BarChart3 },
  "/equipamentos": { title: "Equipamentos", subtitle: "Cadastro de aparelhos e máquinas", icon: Dumbbell },
  "/manutencao": { title: "Manutenção", subtitle: "Chamados técnicos e reparos", icon: Wrench },
  "/historico-chamados": { title: "Histórico de Chamados", subtitle: "Histórico completo dos chamados de manutenção", icon: History },
  "/presenca": { title: "Presença (QR Code)", subtitle: "QR Code do dia para os alunos registrarem presença", icon: QrCode },
  "/solicitar-manutencao": { title: "Solicitar Manutenção", subtitle: "Registrar solicitação de manutenção", icon: ClipboardList },
  "/perfil": { title: "Perfil", subtitle: "Informações do usuário logado", icon: User },
  "/cadastro": { title: "Novo Aluno", subtitle: "Cadastro de novo aluno na academia", icon: Users },
};

export default function Layout() {
  const location = useLocation();
  const config = pageConfig[location.pathname] || pageConfig["/dashboard"];

  const pathParts = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((part, idx) => ({
    label: idx === 0 ? config?.title || part : part,
    path: "/" + pathParts.slice(0, idx + 1).join("/"),
    isLast: idx === pathParts.length - 1,
  }));

  const Icon = config?.icon || LayoutDashboard;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header />
        <div className="page-container">
          <div className="page-header">
            <div>
              <div className="breadcrumb">
                <a href="/dashboard">Início</a>
                {breadcrumbs.map((crumb) => (
                  <>
                    <span className="sep">&nbsp;/&nbsp;</span>
                    {crumb.isLast ? (
                      <span>{crumb.label}</span>
                    ) : (
                      <a href={crumb.path}>{crumb.label}</a>
                    )}
                  </>
                ))}
              </div>
              <div className="page-title-row">
                <Icon size={22} className="page-title-icon" strokeWidth={1.8} />
                <h1>{config?.title || "Dashboard"}</h1>
              </div>
              <p className="page-subtitle">{config?.subtitle || ""}</p>
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}