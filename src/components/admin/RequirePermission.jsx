import React, { useEffect, useRef } from 'react';
import { usePermissions } from '../../context/PermissionsContext';

const RequirePermission = ({ module, action = 'enabled', children }) => {
  const { loading, hasPermission } = usePermissions();
  const hasAlertedRef = useRef(false);
  const allowed = hasPermission(module, action);

  useEffect(() => {
    if (!loading && !allowed && !hasAlertedRef.current) {
      hasAlertedRef.current = true;
      window.alert('You do not have permission to access this page.');
    }
  }, [allowed, loading]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-[#0D5C4D]">Checking permissions...</div>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600 font-semibold">
            You do not have permission to access this page.
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequirePermission;

