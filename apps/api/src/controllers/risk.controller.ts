import type { Request, Response, NextFunction } from 'express';
import * as riskService from '../services/risk.service';

export async function posture(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await riskService.getPosture(req.organizationId!);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function matrix(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await riskService.getRiskMatrix(req.organizationId!);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function trends(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await riskService.getRiskTrends(req.organizationId!);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function recalculate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await riskService.recalculateOrganizationRisk(req.organizationId!);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}
