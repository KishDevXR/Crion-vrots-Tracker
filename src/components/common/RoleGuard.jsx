import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ShieldAlert } from 'lucide-react';

export default function RoleGuard({ allowedRoles, children, fallbackMode = 'redirect' }) {
  const currentRole = useAuthStore(state => state.currentRole);

  const isAuthorized = allowedRoles.includes(currentRole);

  if (!isAuthorized) {
    if (fallbackMode === 'redirect') {
      return <Navigate to="/" replace />;
    }
    
    // Render "Access Denied" view
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full mb-4">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">
          Your current role (<strong>{currentRole}</strong>) does not have permission to view this page. If you believe this is a mistake, please contact your administrator.
        </p>
      </div>
    );
  }

  return children;
}
