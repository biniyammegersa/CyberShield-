import type { AuthUser, OrganizationMembership, PlatformRole } from '@/types/auth';

export function getEffectiveRole(params: {
  user: AuthUser | null;
  memberships: OrganizationMembership[];
  currentOrganizationId: string | null;
}): PlatformRole | null {
  const { user, memberships, currentOrganizationId } = params;
  if (!user) return null;
  if (user.platformRole === 'SUPER_ADMIN') return 'SUPER_ADMIN';
  const membership = memberships.find((m) => m.organizationId === currentOrganizationId);
  return membership?.role ?? user.platformRole ?? null;
}

export function isRoleAllowed(role: PlatformRole | null, allowed: PlatformRole[]): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;
  return allowed.includes(role);
}

