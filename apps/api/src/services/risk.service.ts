import { Severity, VulnerabilityStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  calculatePostureScore,
  calculateRiskScore,
  OPEN_VULN_STATUSES,
  SEVERITY_WEIGHT,
} from '../utils/risk.engine';

export async function recalculateOrganizationRisk(organizationId: string) {
  const links = await prisma.vulnerabilityAsset.findMany({
    where: {
      vulnerability: {
        organizationId,
        status: { in: OPEN_VULN_STATUSES },
      },
      asset: { organizationId, deletedAt: null },
    },
    include: {
      vulnerability: { select: { severity: true } },
      asset: { select: { criticality: true } },
    },
  });

  for (const link of links) {
    const riskScore = calculateRiskScore(link.vulnerability.severity, link.asset.criticality);
    await prisma.vulnerabilityAsset.update({
      where: {
        vulnerabilityId_assetId: {
          vulnerabilityId: link.vulnerabilityId,
          assetId: link.assetId,
        },
      },
      data: { riskScore },
    });
  }

  const openVulns = await prisma.vulnerability.findMany({
    where: { organizationId, status: { in: OPEN_VULN_STATUSES } },
    include: {
      affectedAssets: {
        include: { asset: { select: { criticality: true, deletedAt: true } } },
      },
    },
  });

  const openRiskScores: number[] = [];
  let criticalCount = 0;

  for (const vuln of openVulns) {
    if (vuln.severity === Severity.CRITICAL) criticalCount += 1;
    for (const link of vuln.affectedAssets) {
      if (link.asset.deletedAt) continue;
      openRiskScores.push(
        link.riskScore ?? calculateRiskScore(vuln.severity, link.asset.criticality)
      );
    }
    if (vuln.affectedAssets.length === 0) {
      openRiskScores.push(SEVERITY_WEIGHT[vuln.severity] * 3);
    }
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const resolvedLast30d = await prisma.vulnerability.count({
    where: {
      organizationId,
      status: { in: [VulnerabilityStatus.MITIGATED, VulnerabilityStatus.CLOSED] },
      updatedAt: { gte: thirtyDaysAgo },
    },
  });

  const score = calculatePostureScore({
    openRiskScores,
    openCount: openVulns.length,
    criticalCount,
    resolvedLast30d,
  });

  await prisma.postureSnapshot.create({
    data: {
      organizationId,
      score,
      openCount: openVulns.length,
      criticalCount,
      metadata: { resolvedLast30d, totalExposure: openRiskScores.reduce((a, b) => a + b, 0) },
    },
  });

  return { score, openCount: openVulns.length, criticalCount };
}

export async function getPosture(organizationId: string) {
  const latest = await prisma.postureSnapshot.findFirst({
    where: { organizationId },
    orderBy: { capturedAt: 'desc' },
  });
  if (latest) return latest;
  return recalculateOrganizationRisk(organizationId).then((r) => ({
    score: r.score,
    openCount: r.openCount,
    criticalCount: r.criticalCount,
    capturedAt: new Date(),
  }));
}

export async function getRiskMatrix(organizationId: string) {
  const vulns = await prisma.vulnerability.findMany({
    where: {
      organizationId,
      status: { in: OPEN_VULN_STATUSES },
      likelihood: { not: null },
      impact: { not: null },
    },
    select: { likelihood: true, impact: true, severity: true },
  });

  const matrix: Record<string, number> = {};
  for (const v of vulns) {
    const key = `${v.likelihood}-${v.impact}`;
    matrix[key] = (matrix[key] ?? 0) + 1;
  }

  const cells = Object.entries(matrix).map(([key, count]) => {
    const [likelihood, impact] = key.split('-').map(Number);
    return { likelihood, impact, count };
  });

  return { cells, total: vulns.length };
}

export async function getRiskTrends(organizationId: string) {
  const since = new Date();
  since.setMonth(since.getMonth() - 6);

  const snapshots = await prisma.postureSnapshot.findMany({
    where: { organizationId, capturedAt: { gte: since } },
    orderBy: { capturedAt: 'asc' },
  });

  const byMonth = new Map<string, { score: number; openCount: number }>();
  for (const s of snapshots) {
    const key = s.capturedAt.toISOString().slice(0, 7);
    byMonth.set(key, { score: s.score, openCount: s.openCount });
  }

  return Array.from(byMonth.entries()).map(([month, data]) => ({
    month,
    ...data,
  }));
}
