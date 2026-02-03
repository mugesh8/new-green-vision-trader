import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getRolesPermissions } from '../api/adminApi';

const PermissionsContext = createContext(null);

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const adminAid = localStorage.getItem('adminAid');
        if (!adminAid) {
          setLoading(false);
          return;
        }

        const response = await getRolesPermissions(adminAid);
        const data = response?.data || response;
        setPermissions(data);
      } catch (err) {
        console.error('Failed to load permissions', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

  const hasPermission = useCallback(
    (moduleName, permissionKey = 'enabled') => {
      const role = (localStorage.getItem('adminRole') || '').toLowerCase();
      if (role === 'superadmin') {
        return true;
      }

      if (!permissions) return false;

      const base = moduleName.toLowerCase().replace(/ /g, '_');

      if (permissionKey === 'enabled') {
        return !!permissions[`${base}_enabled`];
      }

      return !!permissions[`${base}_${permissionKey}`];
    },
    [permissions]
  );

  return (
    <PermissionsContext.Provider value={{ permissions, loading, error, hasPermission }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error('usePermissions must be used inside PermissionsProvider');
  }
  return ctx;
};

