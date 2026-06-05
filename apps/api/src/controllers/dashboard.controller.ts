import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { Severity, VulnerabilityStatus } from '@prisma/client';
import * as riskService from '../services/risk.service';
import * as remediationService from '../services/remediation.service';

export async function summary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;

    const [assetCount, vulnCount, criticalCount, openCount, resolvedCount, posture] =
      await Promise.all([
        prisma.asset.count({ where: { organizationId: orgId, deletedAt: null } }),
        prisma.vulnerability.count({ where: { organizationId: orgId } }),
        prisma.vulnerability.count({
          where: {
            organizationId: orgId,
            severity: Severity.CRITICAL,
            status: { in: [VulnerabilityStatus.OPEN, VulnerabilityStatus.CONFIRMED] },
          },
        }),
        prisma.vulnerability.count({
          where: {
            organizationId: orgId,
            status: { in: [VulnerabilityStatus.OPEN, VulnerabilityStatus.CONFIRMED] },
          },
        }),
        prisma.vulnerability.count({
          where: {
            organizationId: orgId,
            status: { in: [VulnerabilityStatus.MITIGATED, VulnerabilityStatus.CLOSED] },
          },
        }),
        riskService.getPosture(orgId),
      ]);

    const score = typeof posture === 'object' && 'score' in posture ? posture.score : 100;

    res.json({
      data: {
        totalAssets: assetCount,
        totalVulnerabilities: vulnCount,
        criticalVulnerabilities: criticalCount,
        openFindings: openCount,
        resolvedFindings: resolvedCount,
        securityPostureScore: score,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function severityChart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const counts = await prisma.vulnerability.groupBy({
      by: ['severity'],
      where: {
        organizationId: orgId,
        status: { in: [VulnerabilityStatus.OPEN, VulnerabilityStatus.CONFIRMED] },
      },
      _count: true,
    });

    const order: Severity[] = [
      Severity.CRITICAL,
      Severity.HIGH,
      Severity.MEDIUM,
      Severity.LOW,
      Severity.INFORMATIONAL,
    ];

    const data = order.map((severity) => ({
      name: severity,
      count: counts.find((c) => c.severity === severity)?._count ?? 0,
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function assetTypeChart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const counts = await prisma.asset.groupBy({
      by: ['assetType'],
      where: { organizationId: orgId, deletedAt: null },
      _count: true,
    });

    const data = counts.map((c) => ({
      name: c.assetType,
      count: c._count,
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function riskTrendsChart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await riskService.getRiskTrends(req.organizationId!);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function remediationChart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await remediationService.getRemediationPerformance(req.organizationId!);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}
