import axios from "axios"
 
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://backend-gerencia-0k9o.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Informa ao backend o cargo do usuário logado. O backend aplica a mesma regra
 * de permissões usada na interface (ver lib/permissions.js), impedindo que uma
 * ação sensível (ex.: gerenciar funcionários) seja executada por outro cargo.
 */
api.interceptors.request.use((config) => {
  try {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (usuario?.cargo) {
      config.headers['X-Usuario-Cargo'] = usuario.cargo;
    }
  } catch {
    // Sem usuário logado: a requisição segue sem o header
  }
  return config;
});
 
export default api;