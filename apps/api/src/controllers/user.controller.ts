import type { Request, Response, NextFunction } from 'express';
import { PlatformRole } from '@prisma/client';
import * as userService from '../services/user.service';
import { getClientIp } from '../services/audit.service';
import { param } from '../utils/params';

function isSuperAdmin(req: Request): boolean {
  return req.user?.platformRole === PlatformRole.SUPER_ADMIN;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await userService.listUsers(
      req.organizationId,
      isSuperAdmin(req),
      page,
      limit
    );
    res.json({
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit },
    });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = getClientIp(req);
    const user = await userService.createUser(
      { ...req.body, organizationId: req.organizationId, role: req.body.role },
      req.user!.id,
      ip,
      req.headers['user-agent'] as string
    );
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUser(param(req.params.id), req.organizationId, isSuperAdmin(req));
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = getClientIp(req);
    const user = await userService.updateUser(
      param(req.params.id),
      req.body,
      req.user!.id,
      req.organizationId,
      ip,
      req.headers['user-agent'] as string
    );
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = getClientIp(req);
    const user = await userService.updateUserStatus(
      param(req.params.id),
      req.body.status,
      req.user!.id,
      req.organizationId,
      ip,
      req.headers['user-agent'] as string
    );
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = getClientIp(req);
    await userService.deleteUser(
      param(req.params.id),
      req.user!.id,
      req.organizationId,
      ip,
      req.headers['user-agent'] as string
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function auditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await userService.listAuditLogs(
      req.organizationId,
      isSuperAdmin(req),
      page,
      limit
    );
    res.json({
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit },
    });
  } catch (err) {
    next(err);
  }
}
