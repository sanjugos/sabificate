import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth/useAuth';
import type { UserRole } from '../../../contracts/types';
import type { ReactNode } from 'react';

interface RequireRoleProps {
  role: UserRole | UserRole[];
  children: ReactNode;
}

export function RequireRole({ role, children }: RequireRoleProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const allowed = Array.isArray(role) ? role : [role];
  if (!user?.role || !allowed.includes(user.role)) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500">You don't have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
