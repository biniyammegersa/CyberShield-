import type { Request, Response, NextFunction } from 'express';
import * as assetService from '../services/asset.service';
import { getClientIp } from '../services/audit.service';
import { param } from '../utils/params';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await assetService.listAssets(req.organizationId!, req.query as never);
    res.json({ data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
  } catch (err) {
    next(err);
  }
}

export async function attackSurface(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await assetService.getAttackSurface(req.organizationId!);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = getClientIp(req);
    const asset = await assetService.createAsset(
      req.organizationId!,
      req.body,
      req.user!.id,
      ip,
      req.headers['user-agent'] as string
    );
    res.status(201).json({ data: asset });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const asset = await assetService.getAsset(req.organizationId!, param(req.params.id));
    res.json({ data: asset });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = getClientIp(req);
    const asset = await assetService.updateAsset(
      req.organizationId!,
      param(req.params.id),
      req.body,
      req.user!.id,
      ip,
      req.headers['user-agent'] as string
    );
    res.json({ data: asset });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = getClientIp(req);
    await assetService.deleteAsset(
      req.organizationId!,
      param(req.params.id),
      req.user!.id,
      ip,
      req.headers['user-agent'] as string
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function vulnerabilities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await assetService.getAssetVulnerabilities(
      req.organizationId!,
      param(req.params.id)
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function addService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const service = await assetService.addService(
      req.organizationId!,
      param(req.params.id),
      req.body
    );
    res.status(201).json({ data: service });
  } catch (err) {
    next(err);
  }
}
