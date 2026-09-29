// ============================================================================
// Sessão do usuário (token + dados do usuário logado).
// ----------------------------------------------------------------------------
// O token é um JWT assinado pelo backend. Aqui ele é apenas guardado/enviado:
// a validação de assinatura, validade e permissões é SEMPRE feita no backend
// (as telas protegidas são só conveniência de navegação).
//
// SEGURANÇA (localStorage): este armazenamento é legível por JavaScript, então
// um XSS na aplicação poderia ler o token. Medidas adotadas para reduzir o
// risco: (1) o token tem prazo curto de validade; (2) nenhum conteúdo de
// terceiros/HTML dinâmico é injetado nas telas (o React escapa os textos);
// (3) o token é descartado ao expirar ou ao receber 401 do backend. A migração
// para cookies HttpOnly exigiria configurar Secure/SameSite e proteção CSRF no
// backend, por isso NÃO foi feita automaticamente.
// ============================================================================

const TOKEN_KEY = 'token';
const USUARIO_KEY = 'usuario';

/** Token atual (ou null). */
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

/** Usuário logado (objeto vindo do login) ou null. */
export const getUsuario = () => {
  try {
    const bruto = localStorage.getItem(USUARIO_KEY);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
};

/** Cargo/perfil do usuário logado (usado pelo mapa de permissões da interface). */
export const getCargo = () => getUsuario()?.cargo || null;

/** Guarda a sessão após o login. */
export const salvarSessao = (token, usuario) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (usuario) localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
  } catch {
    // Armazenamento indisponível (modo privado): a sessão fica apenas em memória.
  }
};

/** Remove a sessão (logout local). */
export const limparSessao = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
  } catch {
    // nada a fazer
  }
};

/** Decodifica o payload do JWT (somente leitura; não valida assinatura). */
const decodificarPayload = (token) => {
  try {
    const parte = String(token).split('.')[1];
    if (!parte) return null;
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

/**
 * Indica se o token já expirou (comparação apenas local, para redirecionar o
 * usuário ao login antes de tomar 401). Se o token for ilegível, devolve true.
 */
export const tokenExpirado = (token) => {
  if (!token) return true;
  const payload = decodificarPayload(token);
  if (!payload || !payload.exp) return false; // sem "exp": o backend decide
  return payload.exp * 1000 <= Date.now();
};

/** Há sessão utilizável (token presente e ainda dentro do prazo)? */
export const sessaoValida = () => {
  const token = getToken();
  if (!token || tokenExpirado(token)) return false;
  return Boolean(getUsuario());
};

/**
 * Encerra a sessão no cliente.
 *
 * LIMITAÇÃO CONHECIDA: o token JWT é stateless, então esta limpeza não revoga o
 * token no servidor — ele continua válido até expirar. A revogação imediata
 * exigiria uma lista de tokens invalidados no backend (fora do escopo atual).
 */
export const logout = () => limparSessao();
