// ============================================================================
// Mapa central de permissões por cargo (role).
// Cada módulo corresponde ao primeiro segmento da rota protegida e é usado
// por ProtectedRoute.jsx e pelo menu da Sidebar para decidir o acesso.
// ----------------------------------------------------------------------------
// ADMIN          -> acesso geral a todas as áreas.
// FINANCEIRO     -> área financeira + dashboard + funcionários.
// TECNICO        -> manutenção (tickets/equipamentos) + solicitar manutenção.
// RECEPCIONISTA  -> funcionalidades de recepção + solicitar manutenção.
// ============================================================================
export const roles = {
  ADMIN: [
    'dashboard', 'alunos', 'cadastro', 'mensalidades', 'presenca',
    'funcionarios', 'equipamentos', 'manutencao', 'financeiro', 'relatorios',
    'solicitar-manutencao', 'historico-chamados', 'historico-faturamento',
  ],
  // Financeiro: área financeira (mensalidades, financeiro, relatórios,
  // histórico de faturamento) + dashboard + funcionários.
  FINANCEIRO: [
    'dashboard', 'mensalidades', 'financeiro', 'relatorios',
    'historico-faturamento', 'funcionarios',
  ],
  // Técnico de manutenção: tickets/equipamentos + solicitar manutenção.
  TECNICO: [
    'equipamentos', 'manutencao', 'historico-chamados', 'solicitar-manutencao',
  ],
  // Recepcionista: funcionalidades de recepção + solicitar manutenção.
  RECEPCIONISTA: [
    'alunos', 'cadastro', 'mensalidades', 'presenca', 'solicitar-manutencao',
  ],
};

export const hasPermission = (role, module) => {
  // Sem cargo definido, libera para rotas públicas (compatilidade)
  if (!role) return true;

  // Perfil é acessível a todos os usuários autenticados
  if (module === 'perfil') return true;

  const roleKey = role.toUpperCase().replace('-', '_');
  const allowedModules = roles[roleKey] || [];
  return allowedModules.includes(module);
};

export const getAllowedModules = (role) => {
  if (!role) return Object.values(roles).flat();

  const roleKey = role.toUpperCase().replace('-', '_');
  return roles[roleKey] || [];
};

// Primeiro módulo permitido ao cargo. Usado como destino seguro quando o cargo
// não tem acesso à rota solicitada (evita loops, ex.: bloquear /dashboard de
// quem não tem acesso a ele).
export const getDefaultModule = (role) => {
  if (!role) return null;
  const roleKey = role.toUpperCase().replace('-', '_');
  const allowed = roles[roleKey];
  if (!allowed || allowed.length === 0) return null;
  return allowed[0];
};
