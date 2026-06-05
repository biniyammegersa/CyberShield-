import { AuditAction, PlatformRole, UserStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../utils/password';
import { notFound, forbidden, conflict } from '../utils/errors';
import { createAuditLog } from './audit.service';

export async function listUsers(
  organizationId: string | undefined,
  isSuperAdmin: boolean,
  page: number,
  limit: number
) {
  const where = organizationId
    ? {
        deletedAt: null,
        memberships: { some: { organizationId } },
      }
    : isSuperAdmin
      ? { deletedAt: null }
      : { deletedAt: null, id: { in: [] as string[] } };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        status: true,
        platformRole: true,
        lastLoginAt: true,
        createdAt: true,
        memberships: organizationId
          ? { where: { organizationId }, select: { role: true, organizationId: true } }
          : { select: { role: true, organizationId: true, organization: { select: { name: true } } } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function createUser(
  data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department?: string;
    role?: PlatformRole;
    organizationId?: string;
  },
  actorId: string,
  ip: string,
  userAgent?: string
) {
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) throw conflict('Email already exists');

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        department: data.department,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });

    if (data.organizationId && data.role) {
      await tx.organizationMember.create({
        data: {
          organizationId: data.organizationId,
          userId: created.id,
          role: data.role,
        },
      });
    }

    return created;
  });

  await createAuditLog({
    action: AuditAction.USER_CREATED,
    userId: actorId,
    organizationId: data.organizationId,
    resourceType: 'user',
    resourceId: user.id,
    ipAddress: ip,
    userAgent,
  });

  return user;
}

export async function getUser(id: string, organizationId?: string, isSuperAdmin?: boolean) {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      department: true,
      status: true,
      platformRole: true,
      lastLoginAt: true,
      createdAt: true,
      memberships: {
        include: { organization: { select: { id: true, name: true, slug: true } } },
      },
    },
  });
  if (!user) throw notFound('User not found');

  if (organizationId && !isSuperAdmin) {
    const isMember = user.memberships.some((m) => m.organizationId === organizationId);
    if (!isMember) throw forbidden();
  }

  return user;
}

export async function updateUser(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    department?: string;
    platformRole?: PlatformRole | null;
  },
  actorId: string,
  organizationId: string | undefined,
  ip: string,
  userAgent?: string
) {
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.department !== undefined && { department: data.department }),
      ...(data.platformRole !== undefined && { platformRole: data.platformRole }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      department: true,
      status: true,
      platformRole: true,
    },
  });

  await createAuditLog({
    action: AuditAction.USER_UPDATED,
    userId: actorId,
    organizationId,
    resourceType: 'user',
    resourceId: id,
    ipAddress: ip,
    userAgent,
  });

  return user;
}

export async function updateUserStatus(
  id: string,
  status: UserStatus,
  actorId: string,
  organizationId: string | undefined,
  ip: string,
  userAgent?: string
) {
  const user = await prisma.user.update({
    where: { id },
    data: { status },
    select: { id: true, email: true, status: true },
  });

  await createAuditLog({
    action: AuditAction.USER_UPDATED,
    userId: actorId,
    organizationId,
    resourceType: 'user',
    resourceId: id,
    metadata: { status },
    ipAddress: ip,
    userAgent,
  });

  return user;
}

export async function deleteUser(
  id: string,
  actorId: string,
  organizationId: string | undefined,
  ip: string,
  userAgent?: string
) {
  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), status: UserStatus.INACTIVE },
  });

  await createAuditLog({
    action: AuditAction.USER_DELETED,
    userId: actorId,
    organizationId,
    resourceType: 'user',
    resourceId: id,
    ipAddress: ip,
    userAgent,
  });
}

export async function listAuditLogs(
  organizationId: string | undefined,
  isSuperAdmin: boolean,
  page: number,
  limit: number
) {
  const where = organizationId
    ? { organizationId }
    : isSuperAdmin
      ? {}
      : { id: { in: [] as string[] } };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total, page, limit };
}
