import { useMemo } from 'react';
import { hasPermission, getAllowedModules } from './permissions';
import { useLocation } from 'react-router-dom';

export const usePermissions = (role) => {
  const location = useLocation();
  const currentModule = useMemo(() => {
    const path = location.pathname;
    if (path === '/') return null;
    const segments = path.split('/');
    return segments[1] || null;
  }, [location.pathname]);

  const permissions = useMemo(() => {
    if (!role) return {
      hasPermission: () => true,
      isAllowed: () => true,
      canAccess: () => true,
      getAllowedModules: () => [],
      currentModuleAllowed: false,
      allowedModules: []
    };

    return {
      hasPermission: (module) => hasPermission(role, module),
      isAllowed: (module) => hasPermission(role, module),
      canAccess: (module) => hasPermission(role, module),
      getAllowedModules: () => getAllowedModules(role),
      currentModuleAllowed: currentModule ? hasPermission(role, currentModule) : false,
      allowedModules: getAllowedModules(role)
    };
  }, [role, currentModule]);

  return permissions;
};