import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, AlertCircle, Wrench, CreditCard, ChevronRight, Check } from "lucide-react";
import api from "../../service/api";
import { useRole } from "../../lib/useRole";
import { hasPermission } from "../../lib/permissions";
import { formatDate, hojeISO, somarDias } from "../../lib/dateUtils";

// Periodicidade de refresh (ms)
const REFRESH_MS = 60000;
// Janela (em dias) para considerar um vencimento "próximo"
const PROXIMOS_DIAS = 7;

/**
 * Agrupa alertas de SLA, preventivas e mensalidades diretamente a partir dos
 * endpoints já existentes no backend. Nenhum dado é inventado: apenas
 * calculamos vencimento/próximos client-side com as regras de negócio atuais.
 */
export default function NotificationCenter() {
  const { role } = useRole();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);
  const containerRef = useRef(null);

  // Determina quais módulos o cargo pode consultar (mantém apenas os 4 cargos existentes)
  const podeManutencao = !role || hasPermission(role, "manutencao");
  const podeMensalidade = !role || hasPermission(role, "mensalidades");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(false);
    const requests = [];
    if (podeManutencao) {
      requests.push(api.get("/manutencao/chamados").then((r) => r.data).catch(() => []));
      requests.push(api.get("/manutencao/preventivas").then((r) => r.data).catch(() => []));
    }
    if (podeMensalidade) {
      requests.push(api.get("/mensalidade").then((r) => r.data).catch(() => []));
    }
    if (requests.length === 0) {
      setNotificacoes([]);
      setLoading(false);
      return;
    }

    try {
      const resultados = await Promise.all(requests);
      const lista = [];
      const hoje = hojeISO();
      const limiteProximo = somarDias(PROXIMOS_DIAS);

      if (podeManutencao) {
        const [chamados, preventivas] = resultados;

        // 🔴 Chamados com SLA vencido
        (Array.isArray(chamados) ? chamados : []).forEach((c) => {
          if (c.status === "FINALIZADO") return;
          if (c.slaStatus === "SLA_VENCIDO") {
            lista.push({
              id: `sla-vencido-${c.id}`,
              tipo: "chamado",
              prioridade: "alta",
              titulo: "Chamado com SLA vencido",
              descricao: c.equipamento?.nome || c.equipamentoId || "Equipamento",
              detalhe: c.problema || "",
              rota: "/manutencao",
              dataRef: c.prazo || c.data,
            });
          }
        });

        // 🟠 Chamados próximos do vencimento do SLA
        (Array.isArray(chamados) ? chamados : []).forEach((c) => {
          if (c.status === "FINALIZADO") return;
          if (c.slaStatus === "PROXIMO_VENCIMENTO") {
            lista.push({
              id: `sla-proximo-${c.id}`,
              tipo: "chamado",
              prioridade: "media",
              titulo: "Chamado próximo do vencimento do SLA",
              descricao: c.equipamento?.nome || c.equipamentoId || "Equipamento",
              detalhe: c.problema || "",
              rota: "/manutencao",
              dataRef: c.prazo || c.data,
            });
          }
        });

        // 🔵 Manutenções preventivas vencidas ou próximas
        (Array.isArray(preventivas) ? preventivas : []).forEach((p) => {
          if (p.status === "CONCLUIDA") return;
          const vencida = p.proximaManutencao && p.proximaManutencao < hoje;
          const proxima = p.proximaManutencao && !vencida && p.proximaManutencao <= limiteProximo;
          if (vencida || proxima) {
            lista.push({
              id: `prev-${p.id}`,
              tipo: "preventiva",
              prioridade: vencida ? "media" : "baixa",
              titulo: vencida ? "Manutenção preventiva atrasada" : "Manutenção preventiva próxima",
              descricao: p.equipamento?.nome || p.equipamentoId || "Equipamento",
              detalhe: p.servico || "",
              rota: "/manutencao",
              dataRef: p.proximaManutencao,
            });
          }
        });
      }

      if (podeMensalidade) {
        const [mensalidades] = podeManutencao ? [resultados[2]] : resultados;
        // 🟡 Mensalidades em atraso ou próximas do vencimento (apenas pendentes)
        (Array.isArray(mensalidades) ? mensalidades : []).forEach((m) => {
          if (m.status === "PAGA") return;
          const vencida = m.dataVencimento && m.dataVencimento < hoje;
          const proxima = m.dataVencimento && !vencida && m.dataVencimento <= limiteProximo;
          if (vencida || proxima) {
            lista.push({
              id: `mens-${m.id}`,
              tipo: "mensalidade",
              prioridade: vencida ? "alta" : "media",
              titulo: vencida ? "Mensalidade em atraso" : "Mensalidade próxima do vencimento",
              descricao: m.aluno?.nome || `Aluno #${m.id}`,
              detalhe: m.dataVencimento ? `Vence ${formatDate(m.dataVencimento)}` : "",
              rota: "/mensalidades",
              dataRef: m.dataVencimento,
            });
          }
        });
      }

      // Ordena: mais urgentes primeiro (alta > média > baixa), depois por data mais antiga
      const ordem = { alta: 0, media: 1, baixa: 2 };
      lista.sort((a, b) => {
        const pa = ordem[a.prioridade] ?? 1;
        const pb = ordem[b.prioridade] ?? 1;
        if (pa !== pb) return pa - pb;
        return String(a.dataRef || "").localeCompare(String(b.dataRef || ""));
      });

      setNotificacoes(lista);
    } catch (e) {
      console.error("Erro ao carregar notificações:", e);
      setErro(true);
    } finally {
      setLoading(false);
    }
  }, [podeManutencao, podeMensalidade]);

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, REFRESH_MS);
    return () => clearInterval(interval);
  }, [carregar]);

  // Fecha ao clicar fora do painel
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const abrirNotificacao = (n) => {
    setOpen(false);
    navigate(n.rota);
  };

  const temNotificacao = notificacoes.length > 0;

  const rotuloPrioridade = (p) =>
    p === "alta" ? "Urgente" : p === "media" ? "Atenção" : "Aviso";

  const IconePrioridade = ({ prioridade }) =>
    prioridade === "alta" ? (
      <AlertCircle size={15} />
    ) : prioridade === "media" ? (
      <AlertTriangle size={15} />
    ) : (
      <Check size={15} />
    );

    IconePrioridade.propTypes = { prioridade: PropTypes.string };

  return (
    <div className="notification-center" ref={containerRef}>
      <button
        className="notification-bell"
        onClick={() => setOpen((v) => !v)}
        title="Centro de Notificações"
        aria-label="Centro de Notificações"
      >
        <Bell size={18} />
        {temNotificacao && (
          <span className="notification-badge">{notificacoes.length}</span>
        )}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <span className="notification-panel-title">Notificações</span>
            {temNotificacao && (
              <span className="notification-panel-count">
                {notificacoes.length} pendente{notificacoes.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loading && notificacoes.length === 0 ? (
            <div className="notification-empty">Carregando...</div>
          ) : erro && notificacoes.length === 0 ? (
            <div className="notification-empty">Não foi possível carregar.</div>
          ) : notificacoes.length === 0 ? (
            <div className="notification-empty">Nenhuma pendência no momento.</div>
          ) : (
            <ul className="notification-list">
              {notificacoes.map((n) => (
                <li key={n.id}>
                  <button
                    className={`notification-item notification-item-${n.prioridade}`}
                    onClick={() => abrirNotificacao(n)}
                  >
                    <span className="notification-item-icon">
                      {n.tipo === "chamado" ? (
                        <Wrench size={16} />
                      ) : n.tipo === "preventiva" ? (
                        <Check size={16} />
                      ) : (
                        <CreditCard size={16} />
                      )}
                    </span>
                    <span className="notification-item-body">
                      <span className="notification-item-title">{n.titulo}</span>
                      <span className="notification-item-desc">{n.descricao}</span>
                      {n.detalhe && (
                        <span className="notification-item-detail">{n.detalhe}</span>
                      )}
                      <span className="notification-item-meta">
                        <IconePrioridade prioridade={n.prioridade} />
                        <span>{rotuloPrioridade(n.prioridade)}</span>
                      </span>
                    </span>
                    <ChevronRight size={15} className="notification-item-arrow" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}