import { Fragment, useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { PageInfoProvider } from "../../lib/pageInfoProvider";
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
  const [menuAberto, setMenuAberto] = useState(false);

  // Fecha a gaveta do menu ao navegar (mantém previsível em telas pequenas)
  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

  // Esc fecha a gaveta aberta (navegação por teclado)
  useEffect(() => {
    const aoPressionar = (e) => {
      if (e.key === "Escape") setMenuAberto(false);
    };
    window.addEventListener("keydown", aoPressionar);
    return () => window.removeEventListener("keydown", aoPressionar);
  }, []);

  // Rota /cadastro?id=NN é edição: título/breadcrumb/subtítulo específicos
  // (o subtítulo dinâmico vem do formulário via PageInfoProvider).
  const editandoAluno = location.pathname === "/cadastro" && new URLSearchParams(location.search).has("id");
  const [subtituloDinamico, setSubtituloDinamico] = useState(null);
  const configBase = pageConfig[location.pathname] || pageConfig["/dashboard"];
  const config = editandoAluno
    ? { title: "Editar aluno", subtitle: subtituloDinamico || "Carregando...", icon: Users }
    : configBase;

  const pathParts = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = editandoAluno
    ? [
        { label: "Alunos", path: "/alunos", isLast: false },
        { label: "Editar", path: "/cadastro", isLast: true },
      ]
    : pathParts.map((part, idx) => ({
        label: idx === 0 ? config?.title || part : part,
        path: "/" + pathParts.slice(0, idx + 1).join("/"),
        isLast: idx === pathParts.length - 1,
      }));

  const Icon = config?.icon || LayoutDashboard;

  return (
    <div className="app-layout">
      <a className="skip-link" href="#conteudo-principal">Pular para o conteúdo</a>
      <Sidebar aberto={menuAberto} aoFechar={() => setMenuAberto(false)} />
      {menuAberto && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Fechar menu de navegação"
          onClick={() => setMenuAberto(false)}
        />
      )}
      <div className="app-main">
        <Header
          menuAberto={menuAberto}
          aoAlternarMenu={() => setMenuAberto((aberto) => !aberto)}
        />
        <main className="page-container" id="conteudo-principal">
          <div className="page-header">
            <div>
              <nav className="breadcrumb" aria-label="Navegação estrutural">
                <Link to="/dashboard">Início</Link>
                {breadcrumbs.map((crumb) => (
                  <Fragment key={crumb.path}>
                    <span className="sep" aria-hidden="true">/</span>
                    {crumb.isLast ? (
                      <span aria-current="page">{crumb.label}</span>
                    ) : (
                      <Link to={crumb.path}>{crumb.label}</Link>
                    )}
                  </Fragment>
                ))}
              </nav>
              <div className="page-title-row">
                <Icon size={22} className="page-title-icon" strokeWidth={1.8} aria-hidden="true" />
                <h1>{config?.title || "Dashboard"}</h1>
              </div>
              <p className="page-subtitle">{config?.subtitle || ""}</p>
            </div>
          </div>
          <PageInfoProvider subtitulo={subtituloDinamico} onSubtituloChange={setSubtituloDinamico}>
            <Outlet />
          </PageInfoProvider>
        </main>
      </div>
    </div>
  );
}