import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { Severity, VulnerabilityStatus, RemediationStatus } from '@prisma/client';
import * as riskService from '../services/risk.service';
import * as remediationService from '../services/remediation.service';

const OPEN_VULN_STATUSES: VulnerabilityStatus[] = [VulnerabilityStatus.OPEN, VulnerabilityStatus.CONFIRMED];
const RESOLVED_VULN_STATUSES: VulnerabilityStatus[] = [VulnerabilityStatus.MITIGATED, VulnerabilityStatus.CLOSED];
const OPEN_REMEDIATION_STATUSES: RemediationStatus[] = [
  RemediationStatus.OPEN,
  RemediationStatus.ASSIGNED,
  RemediationStatus.IN_PROGRESS,
];

async function getCommonKpis(organizationId: string) {
  const [assetCount, vulnCount, criticalCount, openCount, resolvedCount, posture] = await Promise.all([
    prisma.asset.count({ where: { organizationId, deletedAt: null } }),
    prisma.vulnerability.count({ where: { organizationId } }),
    prisma.vulnerability.count({
      where: {
        organizationId,
        severity: Severity.CRITICAL,
        status: { in: OPEN_VULN_STATUSES },
      },
    }),
    prisma.vulnerability.count({
      where: {
        organizationId,
        status: { in: OPEN_VULN_STATUSES },
      },
    }),
    prisma.vulnerability.count({
      where: {
        organizationId,
        status: { in: RESOLVED_VULN_STATUSES },
      },
    }),
    riskService.getPosture(organizationId),
  ]);

  const score = typeof posture === 'object' && posture && 'score' in posture ? (posture as any).score : 100;

  return {
    totalAssets: assetCount,
    totalVulnerabilities: vulnCount,
    criticalVulnerabilities: criticalCount,
    openFindings: openCount,
    resolvedFindings: resolvedCount,
    securityPostureScore: score,
  };
}

export async function adminSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const [kpis, orgMembers] = await Promise.all([
      getCommonKpis(orgId),
      prisma.organizationMember.count({ where: { organizationId: orgId } }),
    ]);

    res.json({
      data: {
        ...kpis,
        orgMembers,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function adminLatest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const [vulnerabilities, remediationTasks, auditLogs] = await Promise.all([
      prisma.vulnerability.findMany({
        where: { organizationId: orgId, status: { in: OPEN_VULN_STATUSES } },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          title: true,
          severity: true,
          status: true,
          cveId: true,
          discoveryDate: true,
          updatedAt: true,
          remediation: {
            select: {
              status: true,
              dueDate: true,
              assignedTo: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),
      prisma.remediationTask.findMany({
        where: { status: { in: OPEN_REMEDIATION_STATUSES }, vulnerability: { organizationId: orgId } },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 6,
        select: {
          id: true,
          status: true,
          dueDate: true,
          createdAt: true,
          vulnerability: { select: { id: true, title: true, severity: true, cveId: true } },
          assignedTo: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.auditLog.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          createdAt: true,
          ipAddress: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          metadata: true,
        },
      }),
    ]);

    res.json({
      data: {
        vulnerabilities,
        remediationTasks,
        auditLogs,
      },
      generatedAt: new Date(),
    });
  } catch (err) {
    next(err);
  }
}

export async function analystSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [kpis, mitigatedLast30d, openBySeverity] = await Promise.all([
      getCommonKpis(orgId),
      prisma.vulnerability.count({
        where: {
          organizationId: orgId,
          status: { in: RESOLVED_VULN_STATUSES },
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.vulnerability.groupBy({
        by: ['severity'],
        where: { organizationId: orgId, status: { in: OPEN_VULN_STATUSES } },
        _count: true,
      }),
    ]);

    res.json({
      data: {
        ...kpis,
        mitigatedLast30d,
        openBySeverity: openBySeverity.map((x) => ({ severity: x.severity, count: x._count })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function analystLatest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const [vulnerabilities, remediationTasks] = await Promise.all([
      prisma.vulnerability.findMany({
        where: { organizationId: orgId, status: { in: OPEN_VULN_STATUSES } },
        orderBy: { updatedAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          severity: true,
          status: true,
          cveId: true,
          discoveryDate: true,
          updatedAt: true,
          remediation: {
            select: {
              status: true,
              dueDate: true,
              assignedTo: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),
      prisma.remediationTask.findMany({
        where: {
          status: { in: OPEN_REMEDIATION_STATUSES },
          vulnerability: { organizationId: orgId },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 6,
        select: {
          id: true,
          status: true,
          dueDate: true,
          createdAt: true,
          vulnerability: { select: { id: true, title: true, severity: true, cveId: true } },
          assignedTo: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    res.json({
      data: {
        vulnerabilities,
        remediationTasks,
      },
      generatedAt: new Date(),
    });
  } catch (err) {
    next(err);
  }
}

export async function itAdminSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const now = new Date();
    const in30d = new Date(now);
    in30d.setDate(in30d.getDate() + 30);

    const [kpis, activeAssets, remediationQueue, overdueRemediation, dueSoonRemediation] =
      await Promise.all([
        getCommonKpis(orgId),
        prisma.asset.count({ where: { organizationId: orgId, deletedAt: null, status: 'ACTIVE' } }),
        prisma.remediationTask.count({
          where: {
            vulnerability: { organizationId: orgId },
            status: { in: OPEN_REMEDIATION_STATUSES },
          },
        }),
        prisma.remediationTask.count({
          where: {
            vulnerability: { organizationId: orgId },
            status: { in: OPEN_REMEDIATION_STATUSES },
            dueDate: { lt: now },
          },
        }),
        prisma.remediationTask.count({
          where: {
            vulnerability: { organizationId: orgId },
            status: { in: OPEN_REMEDIATION_STATUSES },
            dueDate: { gte: now, lte: in30d },
          },
        }),
      ]);

    res.json({
      data: {
        ...kpis,
        activeAssets,
        remediationQueue,
        dueSoonRemediation,
        overdueRemediation,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function itAdminLatest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const [remediationTasks, vulnerabilities] = await Promise.all([
      prisma.remediationTask.findMany({
        where: { status: { in: OPEN_REMEDIATION_STATUSES }, vulnerability: { organizationId: orgId } },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 8,
        select: {
          id: true,
          status: true,
          dueDate: true,
          createdAt: true,
          vulnerability: { select: { id: true, title: true, severity: true, cveId: true } },
          assignedTo: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.vulnerability.findMany({
        where: { organizationId: orgId, status: { in: OPEN_VULN_STATUSES } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          severity: true,
          status: true,
          cveId: true,
          discoveryDate: true,
          updatedAt: true,
          remediation: {
            select: {
              status: true,
              dueDate: true,
              assignedTo: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),
    ]);

    res.json({
      data: {
        vulnerabilities,
        remediationTasks,
      },
      generatedAt: new Date(),
    });
  } catch (err) {
    next(err);
  }
}

export async function executiveSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [kpis, resolvedLast30d, riskTrend] = await Promise.all([
      getCommonKpis(orgId),
      prisma.vulnerability.count({
        where: {
          organizationId: orgId,
          status: { in: RESOLVED_VULN_STATUSES },
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      riskService.getRiskTrends(orgId),
    ]);

    const points = riskTrend ?? [];
    const prev = points.length >= 2 ? points[points.length - 2] : null;
    const last = points.length >= 1 ? points[points.length - 1] : null;
    const delta = prev && last ? last.score - prev.score : 0;
    const deltaPct = prev && prev.score !== 0 ? (delta / prev.score) * 100 : 0;

    res.json({
      data: {
        ...kpis,
        resolvedLast30d,
        riskTrendDelta: {
          delta,
          deltaPct,
          from: prev?.month ?? null,
          to: last?.month ?? null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function executiveLatest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.organizationId!;
    const [vulnerabilities, remediationTasks] = await Promise.all([
      prisma.vulnerability.findMany({
        where: {
          organizationId: orgId,
          status: { in: OPEN_VULN_STATUSES },
          severity: { in: [Severity.CRITICAL, Severity.HIGH] },
        },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          title: true,
          severity: true,
          status: true,
          cveId: true,
          discoveryDate: true,
          updatedAt: true,
          remediation: {
            select: {
              status: true,
              dueDate: true,
              assignedTo: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),
      prisma.remediationTask.findMany({
        where: { status: { in: OPEN_REMEDIATION_STATUSES }, vulnerability: { organizationId: orgId } },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 6,
        select: {
          id: true,
          status: true,
          dueDate: true,
          createdAt: true,
          vulnerability: { select: { id: true, title: true, severity: true, cveId: true } },
          assignedTo: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    res.json({
      data: {
        vulnerabilities,
        remediationTasks,
      },
      generatedAt: new Date(),
    });
  } catch (err) {
    next(err);
  }
}

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
