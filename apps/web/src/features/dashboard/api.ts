import { apiClient } from '@/lib/api-client';

export interface DashboardSummary {
  totalAssets: number;
  totalVulnerabilities: number;
  criticalVulnerabilities: number;
  openFindings: number;
  resolvedFindings: number;
  securityPostureScore: number;
}

export type DashboardRole = 'admin' | 'analyst' | 'it' | 'executive';

export interface AdminDashboardSummary extends DashboardSummary {
  orgMembers: number;
}

export interface AnalystDashboardSummary extends DashboardSummary {
  mitigatedLast30d: number;
  openBySeverity: Array<{ severity: string; count: number }>;
}

export interface ItAdminDashboardSummary extends DashboardSummary {
  activeAssets: number;
  remediationQueue: number;
  dueSoonRemediation: number;
  overdueRemediation: number;
}

export interface ExecutiveDashboardSummary extends DashboardSummary {
  resolvedLast30d: number;
  riskTrendDelta: {
    delta: number;
    deltaPct: number;
    from: string | null;
    to: string | null;
  };
}

export interface ChartPoint {
  name: string;
  count: number;
}

export interface VulnerabilityLatestItem {
  id: string;
  title: string;
  severity: string;
  status: string;
  cveId: string | null;
  discoveryDate: string;
  updatedAt: string;
  remediation:
    | {
        status: string;
        dueDate: string | null;
        assignedTo: { firstName: string; lastName: string; email: string } | null;
      }
    | null;
}

export interface RemediationTaskLatestItem {
  id: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  vulnerability: { id: string; title: string; severity: string; cveId: string | null };
  assignedTo: { firstName: string; lastName: string; email: string } | null;
}

export interface AuditLogLatestItem {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  createdAt: string;
  ipAddress: string;
  user: { firstName: string; lastName: string; email: string } | null;
  metadata: unknown;
}

export type RoleLatestItems = {
  vulnerabilities: VulnerabilityLatestItem[];
  remediationTasks: RemediationTaskLatestItem[];
  auditLogs?: AuditLogLatestItem[];
};

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

export async function fetchRoleSummary(role: DashboardRole) {
  const { data } = await apiClient.get<{
    data:
      | AdminDashboardSummary
      | AnalystDashboardSummary
      | ItAdminDashboardSummary
      | ExecutiveDashboardSummary;
  }>(`/dashboard/roles/${role}/summary`);
  return data.data;
}

export async function fetchRoleLatest(role: DashboardRole) {
  const { data } = await apiClient.get<{ data: RoleLatestItems }>(`/dashboard/roles/${role}/latest`);
  return data.data;
}
