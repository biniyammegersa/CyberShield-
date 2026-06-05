import { AuditAction, RemediationStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { notFound } from '../utils/errors';
import { createAuditLog } from './audit.service';
import { recalculateOrganizationRisk } from './risk.service';
import type { z } from 'zod';
import type {
  createCommentSchema,
  listRemediationQuerySchema,
  updateRemediationSchema,
} from '../validators/remediation.validator';

type ListQuery = z.infer<typeof listRemediationQuerySchema>;
type UpdateInput = z.infer<typeof updateRemediationSchema>;
type CommentInput = z.infer<typeof createCommentSchema>;

const STATUS_DATES: Partial<
  Record<RemediationStatus, (data: UpdateInput) => Partial<{ completedAt: Date; verifiedAt: Date }>>
> = {
  [RemediationStatus.RESOLVED]: () => ({ completedAt: new Date() }),
  [RemediationStatus.VERIFIED]: () => ({ verifiedAt: new Date() }),
  [RemediationStatus.CLOSED]: () => ({ completedAt: new Date(), verifiedAt: new Date() }),
};

export async function listRemediation(organizationId: string, query: ListQuery) {
  const where = {
    vulnerability: { organizationId },
    ...(query.status && { status: query.status }),
    ...(query.assignedToId && { assignedToId: query.assignedToId }),
  };

  const [items, total] = await Promise.all([
    prisma.remediationTask.findMany({
      where,
      include: {
        vulnerability: {
          select: {
            id: true,
            title: true,
            severity: true,
            status: true,
            cveId: true,
          },
        },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { comments: true, evidence: true } },
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.remediationTask.count({ where }),
  ]);

  return { items, total, page: query.page, limit: query.limit };
}

export async function getRemediation(organizationId: string, id: string) {
  const task = await prisma.remediationTask.findFirst({
    where: { id, vulnerability: { organizationId } },
    include: {
      vulnerability: {
        include: {
          affectedAssets: { include: { asset: { select: { id: true, name: true } } } },
        },
      },
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      comments: {
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'asc' },
      },
      evidence: true,
    },
  });
  if (!task) throw notFound('Remediation task not found');
  return task;
}

export async function updateRemediation(
  organizationId: string,
  id: string,
  data: UpdateInput,
  userId: string,
  ip: string,
  userAgent?: string
) {
  const task = await prisma.remediationTask.findFirst({
    where: { id, vulnerability: { organizationId } },
  });
  if (!task) throw notFound('Remediation task not found');

  const statusDates = data.status ? STATUS_DATES[data.status]?.(data) ?? {} : {};

  const updated = await prisma.remediationTask.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
      ...statusDates,
      ...(data.status === RemediationStatus.ASSIGNED &&
        task.status === RemediationStatus.OPEN && { status: RemediationStatus.ASSIGNED }),
    },
    include: {
      vulnerability: { select: { id: true, title: true, severity: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  if (
    data.status === RemediationStatus.RESOLVED ||
    data.status === RemediationStatus.CLOSED ||
    data.status === RemediationStatus.VERIFIED
  ) {
    await prisma.vulnerability.update({
      where: { id: task.vulnerabilityId },
      data: {
        status:
          data.status === RemediationStatus.CLOSED || data.status === RemediationStatus.VERIFIED
            ? 'CLOSED'
            : 'MITIGATED',
      },
    });
  }

  await createAuditLog({
    action: AuditAction.REMEDIATION_UPDATED,
    userId,
    organizationId,
    resourceType: 'remediation',
    resourceId: id,
    metadata: { status: data.status, assignedToId: data.assignedToId },
    ipAddress: ip,
    userAgent,
  });

  await recalculateOrganizationRisk(organizationId);
  return updated;
}

export async function addComment(
  organizationId: string,
  taskId: string,
  data: CommentInput,
  authorId: string,
  ip: string,
  userAgent?: string
) {
  const task = await prisma.remediationTask.findFirst({
    where: { id: taskId, vulnerability: { organizationId } },
  });
  if (!task) throw notFound('Remediation task not found');

  const comment = await prisma.remediationComment.create({
    data: { taskId, authorId, body: data.body },
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  });

  await createAuditLog({
    action: AuditAction.REMEDIATION_UPDATED,
    userId: authorId,
    organizationId,
    resourceType: 'remediation_comment',
    resourceId: comment.id,
    ipAddress: ip,
    userAgent,
  });

  return comment;
}

export async function getRemediationPerformance(organizationId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [resolved, inProgress, overdue] = await Promise.all([
    prisma.remediationTask.count({
      where: {
        vulnerability: { organizationId },
        status: { in: [RemediationStatus.RESOLVED, RemediationStatus.VERIFIED, RemediationStatus.CLOSED] },
        updatedAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.remediationTask.count({
      where: {
        vulnerability: { organizationId },
        status: RemediationStatus.IN_PROGRESS,
      },
    }),
    prisma.remediationTask.count({
      where: {
        vulnerability: { organizationId },
        status: { in: [RemediationStatus.OPEN, RemediationStatus.ASSIGNED, RemediationStatus.IN_PROGRESS] },
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  return { resolved, inProgress, overdue };
}
