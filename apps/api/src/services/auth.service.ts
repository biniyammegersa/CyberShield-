import { AuditAction, PlatformRole, UserStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../utils/password';
import {
  generateAccessToken,
  generateFamilyId,
  generateRefreshToken,
  hashToken,
  parseExpiresIn,
} from '../utils/tokens';
import { env } from '../config/env';
import { conflict, unauthorized, badRequest } from '../utils/errors';
import type { AuthUser } from '../types/express';
import { createAuditLog } from './audit.service';

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  status: true,
  platformRole: true,
} as const;

function toAuthUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  platformRole: PlatformRole | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    platformRole: user.platformRole,
  };
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  memberships: Array<{
    organizationId: string;
    organizationName: string;
    role: PlatformRole;
  }>;
}

export async function register(
  input: RegisterInput,
  ip: string,
  userAgent?: string
): Promise<LoginResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) {
    throw conflict('Email already registered');
  }

  const passwordHash = await hashPassword(input.password);
  const orgName = input.organizationName ?? `${input.firstName}'s Organization`;

  const result = await prisma.$transaction(async (tx) => {
    const baseSlug = input.organizationName
      ? input.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : `org-${Date.now()}`;
    let slug = baseSlug.slice(0, 48);
    let n = 0;
    while (await tx.organization.findUnique({ where: { slug } })) {
      n += 1;
      slug = `${baseSlug.slice(0, 40)}-${n}`;
    }

    const org = await tx.organization.create({
      data: { name: orgName, slug },
    });

    const user = await tx.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
      select: userSelect,
    });

    await tx.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: PlatformRole.SECURITY_ANALYST,
      },
    });

    return { user, org };
  });

  await createAuditLog({
    action: AuditAction.USER_CREATED,
    userId: result.user.id,
    organizationId: result.org.id,
    resourceType: 'user',
    resourceId: result.user.id,
    ipAddress: ip,
    userAgent,
  });

  return createSession(result.user, ip, userAgent);
}

export async function login(
  email: string,
  password: string,
  ip: string,
  userAgent?: string
): Promise<LoginResult> {
  // #region agent log
  const dbUrl = process.env.DATABASE_URL ?? '';
  fetch('http://127.0.0.1:7515/ingest/3f9a8455-7964-4afe-8b32-a70a686d3f2e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7b1f10'},body:JSON.stringify({sessionId:'7b1f10',runId:'post-fix',hypothesisId:'H1-H2',location:'auth.service.ts:login:pre-query',message:'login attempt db context',data:{dbHost:dbUrl.replace(/\/\/[^@]+@/,'//***@').split('?')[0],emailDomain:email.split('@')[1]??'unknown'},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  let user;
  try {
    user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
    // #region agent log
    fetch('http://127.0.0.1:7515/ingest/3f9a8455-7964-4afe-8b32-a70a686d3f2e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7b1f10'},body:JSON.stringify({sessionId:'7b1f10',runId:'post-fix',hypothesisId:'H1',location:'auth.service.ts:login:post-query',message:'user query succeeded',data:{userFound:!!user},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  } catch (err: unknown) {
    // #region agent log
    const e = err as { code?: string; meta?: unknown; message?: string };
    fetch('http://127.0.0.1:7515/ingest/3f9a8455-7964-4afe-8b32-a70a686d3f2e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7b1f10'},body:JSON.stringify({sessionId:'7b1f10',runId:'post-fix',hypothesisId:'H1-H3',location:'auth.service.ts:login:query-error',message:'user query failed',data:{code:e.code,meta:e.meta,errorMessage:e.message?.slice(0,120)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    throw err;
  }

  if (!user) {
    await createAuditLog({
      action: AuditAction.LOGIN_FAILED,
      resourceType: 'auth',
      metadata: { email },
      ipAddress: ip,
      userAgent,
    });
    throw unauthorized('Invalid email or password');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await createAuditLog({
      action: AuditAction.LOGIN_FAILED,
      userId: user.id,
      resourceType: 'auth',
      ipAddress: ip,
      userAgent,
    });
    throw unauthorized('Invalid email or password');
  }

  if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.INACTIVE) {
    throw unauthorized('Account is suspended or inactive');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createAuditLog({
    action: AuditAction.LOGIN,
    userId: user.id,
    resourceType: 'auth',
    ipAddress: ip,
    userAgent,
  });

  await prisma.loginHistory.create({
    data: { userId: user.id, ipAddress: ip, userAgent, success: true },
  });

  return createSession(
    {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      platformRole: user.platformRole,
    },
    ip,
    userAgent
  );
}

async function createSession(
  user: AuthUser,
  _ip: string,
  _userAgent?: string
): Promise<LoginResult> {
  const refreshToken = generateRefreshToken();
  const familyId = generateFamilyId();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN),
    },
  });

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: user.id },
    include: { organization: { select: { id: true, name: true } } },
  });

  return {
    accessToken: generateAccessToken(user),
    refreshToken,
    user,
    memberships: memberships.map((m) => ({
      organizationId: m.organizationId,
      organizationName: m.organization.name,
      role: m.role,
    })),
  };
}

export async function refreshSession(
  rawRefreshToken: string,
  ip: string,
  userAgent?: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const tokenHash = hashToken(rawRefreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    include: {
      user: {
        select: { ...userSelect, deletedAt: true },
      },
    },
  });

  if (!stored || stored.user.deletedAt) {
    throw unauthorized('Invalid refresh token');
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: stored.userId,
      tokenHash: hashToken(refreshToken),
      familyId: stored.familyId,
      expiresAt: parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN),
    },
  });

  const authUser = toAuthUser(stored.user);
  return {
    accessToken: generateAccessToken(authUser),
    refreshToken,
  };
}

export async function logout(rawRefreshToken: string | undefined, userId?: string, ip?: string): Promise<void> {
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await prisma.refreshToken.findFirst({ where: { tokenHash } });
    if (stored) {
      await prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId },
        data: { revokedAt: new Date() },
      });
    }
  }

  if (userId && ip) {
    await createAuditLog({
      action: AuditAction.LOGOUT,
      userId,
      resourceType: 'auth',
      ipAddress: ip,
    });
  }
}

export async function getLoginHistory(userId: string, page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.loginHistory.count({ where: { userId } }),
  ]);
  return { items, total, page, limit };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      ...userSelect,
      department: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
      memberships: {
        include: { organization: { select: { id: true, name: true, slug: true } } },
      },
    },
  });
  if (!user) throw unauthorized();
  return user;
}
