import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRole } from "./useRole";
import { hasPermission, getDefaultModule } from "./permissions";

export const ProtectedRoute = ({ children }) => {
  const { role, loading } = useRole();
  const location = useLocation();

  // Se ainda está carregando, não renderiza nada
  if (loading) return null;

  // Se não está autenticado, redireciona para login
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // Módulo da rota atual (primeiro segmento da URL)
  const currentModule = location.pathname.split('/')[1] || 'dashboard';

  // Bloqueia acesso direto por URL caso o cargo não tenha permissão ao módulo.
  // Redireciona para o primeiro módulo permitido ao cargo (e não para
  // /dashboard, que pode estar restrito) para evitar loops de redirecionamento.
  if (!hasPermission(role, currentModule)) {
    const fallback = getDefaultModule(role);
    return <Navigate to={fallback ? `/${fallback}` : '/login'} replace />;
  }

  return children;
};
