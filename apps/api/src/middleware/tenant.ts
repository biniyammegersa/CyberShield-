import type { NextFunction, Request, Response } from 'express';
import { PlatformRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { badRequest, forbidden, unauthorized } from '../utils/errors';

export async function resolveOrganization(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw unauthorized();
    }

    const headerOrgId = req.headers['x-organization-id'] as string | undefined;
    const queryOrgId = req.query.organizationId as string | undefined;
    let organizationId = headerOrgId ?? queryOrgId;

    if (req.user.platformRole === PlatformRole.SUPER_ADMIN && queryOrgId) {
      organizationId = queryOrgId;
    }

    if (!organizationId) {
      const membership = await prisma.organizationMember.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'asc' },
      });
      if (!membership && req.user.platformRole !== PlatformRole.SUPER_ADMIN) {
        throw badRequest('No organization context. Provide X-Organization-Id header.');
      }
      if (membership) {
        organizationId = membership.organizationId;
        req.member = {
          id: membership.id,
          organizationId: membership.organizationId,
          role: membership.role,
        };
      }
    } else {
      if (req.user.platformRole !== PlatformRole.SUPER_ADMIN) {
        const membership = await prisma.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId,
              userId: req.user.id,
            },
          },
        });
        if (!membership) {
          throw forbidden('Not a member of this organization');
        }
        req.member = {
          id: membership.id,
          organizationId: membership.organizationId,
          role: membership.role,
        };
      }
    }

    if (organizationId) {
      req.organizationId = organizationId;
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireOrganization(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.organizationId) {
    next(badRequest('Organization context required'));
    return;
  }
  next();
}
