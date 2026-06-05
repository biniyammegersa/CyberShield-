export type PlatformRole =
  | 'SUPER_ADMIN'
  | 'SECURITY_ANALYST'
  | 'IT_ADMINISTRATOR'
  | 'EXECUTIVE_MANAGER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  platformRole: PlatformRole | null;
}

export interface OrganizationMembership {
  organizationId: string;
  organizationName: string;
  role: PlatformRole;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  memberships: OrganizationMembership[];
}
