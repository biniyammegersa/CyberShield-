import { apiClient } from '@/lib/api-client';

export interface DashboardSummary {
  totalAssets: number;
  totalVulnerabilities: number;
  criticalVulnerabilities: number;
  openFindings: number;
  resolvedFindings: number;
  securityPostureScore: number;
}

export interface ChartPoint {
  name: string;
  count: number;
}

export async function fetchDashboardSummary() {
  const { data } = await apiClient.get<{ data: DashboardSummary }>('/dashboard/summary');
  return data.data;
}

export async function fetchSeverityChart() {
  const { data } = await apiClient.get<{ data: ChartPoint[] }>('/dashboard/charts/severity');
  return data.data;
}

export async function fetchAssetTypeChart() {
  const { data } = await apiClient.get<{ data: ChartPoint[] }>('/dashboard/charts/asset-type');
  return data.data;
}

export async function fetchRiskTrends() {
  const { data } = await apiClient.get<{
    data: Array<{ month: string; score: number; openCount: number }>;
  }>('/dashboard/charts/risk-trends');
  return data.data;
}

export async function fetchRemediationChart() {
  const { data } = await apiClient.get<{
    data: { resolved: number; inProgress: number; overdue: number };
  }>('/dashboard/charts/remediation');
  return data.data;
}
