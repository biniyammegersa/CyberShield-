import { Criticality, Severity, VulnerabilityStatus } from '@prisma/client';

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  CRITICAL: 10,
  HIGH: 7,
  MEDIUM: 4,
  LOW: 2,
  INFORMATIONAL: 1,
};

export const CRITICALITY_MULTIPLIER: Record<Criticality, number> = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 1,
};

export function calculateRiskScore(severity: Severity, criticality: Criticality): number {
  return SEVERITY_WEIGHT[severity] * CRITICALITY_MULTIPLIER[criticality];
}

export interface PostureInput {
  openRiskScores: number[];
  openCount: number;
  criticalCount: number;
  resolvedLast30d: number;
}

export function calculatePostureScore(input: PostureInput): number {
  const { openRiskScores, openCount, resolvedLast30d } = input;
  const totalExposure = openRiskScores.reduce((sum, s) => sum + s, 0);
  const maxPerPair = SEVERITY_WEIGHT.CRITICAL * CRITICALITY_MULTIPLIER.CRITICAL;
  const maxPossible = Math.max(openCount * maxPerPair, 1);
  const exposureRatio = Math.min(totalExposure / maxPossible, 1);

  const remediationFactor =
    resolvedLast30d + openCount > 0 ? resolvedLast30d / (resolvedLast30d + openCount) : 1;

  const score = 100 * (1 - exposureRatio * 0.6) * (0.4 + remediationFactor * 0.6);
  return Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
}

export const OPEN_VULN_STATUSES: VulnerabilityStatus[] = [
  VulnerabilityStatus.OPEN,
  VulnerabilityStatus.CONFIRMED,
];
