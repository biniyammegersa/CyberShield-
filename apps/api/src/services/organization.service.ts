import { AuditAction, PlatformRole, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { uniqueOrgSlug } from '../utils/slug';
import { notFound, forbidden, conflict } from '../utils/errors';
import { createAuditLog } from './audit.service';

export async function listOrganizations(userId: string, isSuperAdmin: boolean) {
  if (isSuperAdmin) {
    return prisma.organization.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { members: true } } },
    });
  }
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: { include: { _count: { select: { members: true } } } },
    },
  });
  return memberships.map((m) => ({
    ...m.organization,
    memberRole: m.role,
  }));
}

export async function createOrganization(
  data: { name: string; domain?: string },
  creatorId: string,
  ip: string,
  userAgent?: string
) {
  const slug = await uniqueOrgSlug(data.name, async (s) => {
    const existing = await prisma.organization.findUnique({ where: { slug: s } });
    return !!existing;
  });

  const org = await prisma.$transaction(async (tx) => {
    const created = await tx.organization.create({
      data: { name: data.name, slug, domain: data.domain },
    });
    await tx.organizationMember.create({
      data: {
        organizationId: created.id,
        userId: creatorId,
        role: PlatformRole.SECURITY_ANALYST,
      },
    });
    return created;
  });

  await createAuditLog({
    action: AuditAction.ORG_SETTINGS_CHANGED,
    userId: creatorId,
    organizationId: org.id,
    resourceType: 'organization',
    resourceId: org.id,
    metadata: { action: 'created' },
    ipAddress: ip,
    userAgent,
  });

  return org;
}

export async function getOrganization(id: string, userId: string, isSuperAdmin: boolean) {
  if (!isSuperAdmin) {
    const member = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: id, userId } },
    });
    if (!member) throw forbidden();
  }
  const org = await prisma.organization.findUnique({
    where: { id },
    include: { _count: { select: { members: true, assets: true, vulnerabilities: true } } },
  });
  if (!org) throw notFound('Organization not found');
  return org;
}

export async function updateOrganization(
  id: string,
  data: { name?: string; domain?: string; settings?: Record<string, unknown> },
  userId: string,
  ip: string,
  userAgent?: string
) {
  const org = await prisma.organization.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.domain !== undefined && { domain: data.domain }),
      ...(data.settings && { settings: data.settings as Prisma.InputJsonValue }),
    },
  });

  await createAuditLog({
    action: AuditAction.ORG_SETTINGS_CHANGED,
    userId,
    organizationId: id,
    resourceType: 'organization',
    resourceId: id,
    ipAddress: ip,
    userAgent,
  });

  return org;
}

export async function listMembers(organizationId: string) {
  return prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          department: true,
        },
      },
    },
  });
}

export async function addMember(
  organizationId: string,
  data: { email: string; role: PlatformRole },
  actorId: string,
  ip: string,
  userAgent?: string
) {
  const user = await prisma.user.findFirst({
    where: { email: data.email.toLowerCase(), deletedAt: null },
  });
  if (!user) throw notFound('User not found. User must register first.');

  const existing = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (existing) throw conflict('User is already a member');

  const member = await prisma.organizationMember.create({
    data: { organizationId, userId: user.id, role: data.role },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });

  await createAuditLog({
    action: AuditAction.ROLE_CHANGED,
    userId: actorId,
    organizationId,
    resourceType: 'organization_member',
    resourceId: member.id,
    metadata: { email: data.email, role: data.role },
    ipAddress: ip,
    userAgent,
  });

  return member;
}

export async function updateMemberRole(
  organizationId: string,
  memberId: string,
  role: PlatformRole,
  actorId: string,
  ip: string,
  userAgent?: string
) {
  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId },
  });
  if (!member) throw notFound('Member not found');

  const updated = await prisma.organizationMember.update({
    where: { id: memberId },
    data: { role },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });

  await createAuditLog({
    action: AuditAction.ROLE_CHANGED,
    userId: actorId,
    organizationId,
    resourceType: 'organization_member',
    resourceId: memberId,
    metadata: { role },
    ipAddress: ip,
    userAgent,
  });

  return updated;
}

export async function removeMember(
  organizationId: string,
  memberId: string,
  actorId: string,
  ip: string,
  userAgent?: string
) {
  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId },
  });
  if (!member) throw notFound('Member not found');

  await prisma.organizationMember.delete({ where: { id: memberId } });

  await createAuditLog({
    action: AuditAction.USER_DELETED,
    userId: actorId,
    organizationId,
    resourceType: 'organization_member',
    resourceId: memberId,
    ipAddress: ip,
    userAgent,
  });
}
