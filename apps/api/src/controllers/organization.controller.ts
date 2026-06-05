import type { Request, Response, NextFunction } from 'express';
import { PlatformRole } from '@prisma/client';
import * as orgService from '../services/organization.service';
import { getClientIp } from '../services/audit.service';
import { param } from '../utils/params';

function isSuperAdmin(req: Request): boolean {
  return req.user?.platformRole === PlatformRole.SUPER_ADMIN;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgs = await orgService.listOrganizations(req.user!.id, isSuperAdmin(req));
    res.json({ data: orgs });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = getClientIp(req);
    const org = await orgService.createOrganization(
      req.body,
      req.user!.id,
      ip,
      req.headers['user-agent'] as string
    );
    res.status(201).json({ data: org });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const org = await orgService.getOrganization(
      param(req.params.id),
      req.user!.id,
      isSuperAdmin(req)
    );
    res.json({ data: org });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = getClientIp(req);
    const org = await orgService.updateOrganization(
      param(req.params.id),
      req.body,
      req.user!.id,
      ip,
      req.headers['user-agent'] as string
    );
    res.json({ data: org });
  } catch (err) {
    next(err);
  }
}

export async function listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const members = await orgService.listMembers(param(req.params.id));
    res.json({ data: members });
  } catch (err) {
    next(err);
  }
}

export async function addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = getClientIp(req);
    const member = await orgService.addMember(
      param(req.params.id),
      req.body,
      req.user!.id,
      ip,
      req.headers['user-agent'] as string
    );
    res.status(201).json({ data: member });
  } catch (err) {
    next(err);
  }
}

export async function updateMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = getClientIp(req);
    const member = await orgService.updateMemberRole(
      param(req.params.id),
      param(req.params.memberId),
      req.body.role,
      req.user!.id,
      ip,
      req.headers['user-agent'] as string
    );
    res.json({ data: member });
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = getClientIp(req);
    await orgService.removeMember(
      param(req.params.id),
      param(req.params.memberId),
      req.user!.id,
      ip,
      req.headers['user-agent'] as string
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
