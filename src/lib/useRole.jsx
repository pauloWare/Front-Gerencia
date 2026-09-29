import { createContext, useContext, useState, useEffect } from 'react';
import { getAllowedModules } from './permissions';
import { getCargo, limparSessao, sessaoValida } from './auth';
import PropTypes from 'prop-types';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // O perfil é lido da sessão salva pelo login e SEMPRE corresponde ao cargo
  // assinado no token (usado pelo backend para autorizar as requisições).
  // Sessão expirada é descartada aqui: o usuário volta para o login.
  useEffect(() => {
    if (!sessaoValida()) {
      limparSessao();
      setRole(null);
    } else {
      setRole(getCargo());
    }

    setLoading(false);
  }, []);

  const allowedModules = getAllowedModules(role);

  const value = {
    role,
    setRole,
    allowedModules,
    loading,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};


RoleProvider.propTypes = {
  children: PropTypes.node,
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleConsumer = RoleContext.Consumer;