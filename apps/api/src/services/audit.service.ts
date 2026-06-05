import type { AuditAction } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface AuditParams {
  action: AuditAction;
  userId?: string;
  organizationId?: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      userId: params.userId,
      organizationId: params.organizationId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      metadata: (params.metadata ?? {}) as object,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}

export function getClientIp(req: { ip?: string; headers: Record<string, unknown> }): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip ?? 'unknown';
}
