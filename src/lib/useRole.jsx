import { createContext, useContext, useState, useEffect } from 'react';
import { getAllowedModules } from './permissions';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // In the future, this will be populated from the authenticated user
  useEffect(() => {
    const usuarioLogado = localStorage.getItem('usuario');
    
    if (usuarioLogado) {
      try {
        const user = JSON.parse(usuarioLogado);
        const userRole = user?.role || user?.cargo || null;
        setRole(userRole);
      } catch {
        setRole(null);
      }
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

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleConsumer = RoleContext.Consumer;