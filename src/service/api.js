import axios from "axios"
import { getToken, limparSessao } from "../lib/auth"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://backend-gerencia-0k9o.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Rotas que não exigem login (não devem redirecionar para /login em caso de erro).
const ROTAS_PUBLICAS = ['/usuario/login', '/frequencia/check-in', '/aluno/cpf/'];

/**
 * Anexa o token de acesso no cabeçalho Authorization (padrão Bearer), que é o
 * único mecanismo aceito pelo backend. O cargo do usuário NÃO é enviado pelo
 * cliente: ele é lido do token assinado, portanto não pode ser falsificado por
 * cabeçalho ou corpo da requisição.
 */
api.interceptors.request.use((config) => {
  // Rotas públicas (login/check-in) NÃO recebem o token: se o navegador ainda
  // tiver um token antigo/expirado guardado, ele não deve influenciar o login.
  const url = String(config.url || '');
  const rotaPublica = ROTAS_PUBLICAS.some((rota) => url.includes(rota));
  const token = rotaPublica ? null : getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Trata a expiração/invalidação do token de forma previsível: descarta a sessão
 * local e leva o usuário para a tela de login.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url || '');
    const rotaPublica = ROTAS_PUBLICAS.some((rota) => url.includes(rota));

    if (status === 401) {
      // Descarta a sessão em QUALQUER 401 — inclusive em rota pública. Sem isso,
      // um token inválido/expirado ficava preso no localStorage e o login era
      // recusado em loop com "Autenticação necessária. Faça login novamente.".
      limparSessao();
      if (!rotaPublica && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
