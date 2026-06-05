import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { verifyAccessToken } from '../utils/tokens';
import { unauthorized } from '../utils/errors';
import type { AuthUser } from '../types/express';

function toAuthUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: AuthUser['status'];
  platformRole: AuthUser['platformRole'];
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

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw unauthorized();
    }
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        platformRole: true,
      },
    });
    if (!user || user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
      throw unauthorized('Account is not active');
    }
    req.user = toAuthUser(user);
    next();
  } catch {
    next(unauthorized());
  }
}

export function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }
  authenticate(req, _res, next).catch(() => next());
}
