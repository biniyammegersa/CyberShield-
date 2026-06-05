import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { getEffectiveRole, isRoleAllowed } from '@/lib/authz';
import type { PlatformRole } from '@/types/auth';

export function RoleProtectedRoute({
  allowed,
  children,
}: {
  allowed: PlatformRole[];
  children: React.ReactNode;
}) {
  const location = useLocation();
  const { user, memberships, currentOrganizationId } = useAppSelector((s) => s.auth);
  const role = getEffectiveRole({ user, memberships, currentOrganizationId });

  if (!isRoleAllowed(role, allowed)) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

