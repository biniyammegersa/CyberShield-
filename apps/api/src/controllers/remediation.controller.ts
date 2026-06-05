import type { Request, Response, NextFunction } from 'express';
import * as remediationService from '../services/remediation.service';
import { getClientIp } from '../services/audit.service';
import { param } from '../utils/params';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await remediationService.listRemediation(req.organizationId!, req.query as never);
    res.json({ data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await remediationService.getRemediation(req.organizationId!, param(req.params.id));
    res.json({ data: task });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = getClientIp(req);
    const task = await remediationService.updateRemediation(
      req.organizationId!,
      param(req.params.id),
      req.body,
      req.user!.id,
      ip,
      req.headers['user-agent'] as string
    );
    res.json({ data: task });
  } catch (err) {
    next(err);
  }
}

export async function addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = getClientIp(req);
    const comment = await remediationService.addComment(
      req.organizationId!,
      param(req.params.id),
      req.body,
      req.user!.id,
      ip,
      req.headers['user-agent'] as string
    );
    res.status(201).json({ data: comment });
  } catch (err) {
    next(err);
  }
}
