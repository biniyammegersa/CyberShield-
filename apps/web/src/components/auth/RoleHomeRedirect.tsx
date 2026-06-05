import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { getEffectiveRole } from '@/lib/authz';

export function RoleHomeRedirect() {
  const { user, memberships, currentOrganizationId } = useAppSelector((s) => s.auth);
  const role = getEffectiveRole({ user, memberships, currentOrganizationId });

  switch (role) {
    case 'SUPER_ADMIN':
      return <Navigate to="/dashboard/admin" replace />;
    case 'SECURITY_ANALYST':
      return <Navigate to="/dashboard/analyst" replace />;
    case 'IT_ADMINISTRATOR':
      return <Navigate to="/dashboard/it" replace />;
    case 'EXECUTIVE_MANAGER':
      return <Navigate to="/dashboard/executive" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

