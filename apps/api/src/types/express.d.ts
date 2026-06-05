import type { PlatformRole, UserStatus } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  platformRole: PlatformRole | null;
}

export interface OrgMemberContext {
  id: string;
  organizationId: string;
  role: PlatformRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      member?: OrgMemberContext;
      organizationId?: string;
      requestId?: string;
    }
  }
}

export {};
