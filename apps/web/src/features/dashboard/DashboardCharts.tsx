import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  fetchAssetTypeChart,
  fetchRemediationChart,
  fetchRiskTrends,
  fetchSeverityChart,
  type DashboardRole,
  type ChartPoint,
} from './api';
import { CardHeader, DashboardCard, EmptyState, ErrorBanner, SkeletonBlock } from './dashboard-components';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
  INFORMATIONAL: '#94a3b8',
};

const PIE_COLORS = ['#0891b2', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

function severityHasData(data: ChartPoint[] | undefined) {
  return !!data && data.some((d) => (d.count ?? 0) > 0);
}

function SeverityChart({ data, isLoading }: { data?: ChartPoint[]; isLoading: boolean }) {
  return (
    <DashboardCard>
      <CardHeader title="Severity Distribution" subtitle="Open and confirmed findings by severity" />
      {isLoading ? (
        <SkeletonBlock className="h-[220px] w-full" />
      ) : data && severityHasData(data) ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {(data ?? []).map((entry, i) => (
                <Cell key={i} fill={SEVERITY_COLORS[entry.name] ?? '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState title="No active vulnerabilities" description="Charts populate once findings are confirmed." />
      )}
    </DashboardCard>
  );
}

function AssetTypeChart({ data, isLoading }: { data?: ChartPoint[]; isLoading: boolean }) {
  return (
    <DashboardCard>
      <CardHeader title="Assets by Type" subtitle="Infrastructure coverage across the tenant" />
      {isLoading ? (
        <SkeletonBlock className="h-[220px] w-full" />
      ) : data && data.some((d) => (d.count ?? 0) > 0) ? (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              label={({ name, count }) => `${name}: ${count}`}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState title="No assets found" description="Register assets to track exposure." cta={{ label: 'Manage assets', to: '/assets' }} />
      )}
    </DashboardCard>
  );
}

function RiskTrendChart({ data, isLoading }: { data?: Array<{ month: string; score: number }>; isLoading: boolean }) {
  return (
    <DashboardCard>
      <CardHeader title="Posture Trend" subtitle="Security score over the last 6 months" />
      {isLoading ? (
        <SkeletonBlock className="h-[220px] w-full" />
      ) : data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#0891b2" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState title="No posture history" description="Trends appear after risk snapshots are recorded." />
      )}
    </DashboardCard>
  );
}

function RemediationPerformance({
  data,
  isLoading,
  compact,
}: {
  data?: { resolved: number; inProgress: number; overdue: number };
  isLoading: boolean;
  compact?: boolean;
}) {
  return (
    <DashboardCard className={compact ? '' : 'lg:col-span-2'}>
      <CardHeader title="Remediation Performance" subtitle="Last 30 days throughput and backlog health" />
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-5 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-3xl font-bold text-emerald-700 tabular-nums">{data.resolved ?? 0}</p>
            <p className="text-xs font-medium text-emerald-600 mt-1 uppercase tracking-wide">Resolved</p>
          </div>
          <div className="text-center p-5 bg-cyan-50 rounded-xl border border-cyan-100">
            <p className="text-3xl font-bold text-cyan-700 tabular-nums">{data.inProgress ?? 0}</p>
            <p className="text-xs font-medium text-cyan-600 mt-1 uppercase tracking-wide">In Progress</p>
          </div>
          <div className="text-center p-5 bg-red-50 rounded-xl border border-red-100">
            <p className="text-3xl font-bold text-red-700 tabular-nums">{data.overdue ?? 0}</p>
            <p className="text-xs font-medium text-red-600 mt-1 uppercase tracking-wide">Overdue</p>
          </div>
        </div>
      ) : (
        <EmptyState title="No remediation data" description="Tasks appear when vulnerabilities are assigned." />
      )}
    </DashboardCard>
  );
}

export function RoleDashboardCharts({ role }: { role: DashboardRole }) {
  const queryOpts = { retry: 1, staleTime: 30_000 };

  const severity = useQuery({ queryKey: ['dashboard', 'severity'], queryFn: fetchSeverityChart, ...queryOpts });
  const assetTypes = useQuery({ queryKey: ['dashboard', 'asset-type'], queryFn: fetchAssetTypeChart, ...queryOpts });
  const trends = useQuery({ queryKey: ['dashboard', 'risk-trends'], queryFn: fetchRiskTrends, ...queryOpts });
  const remediation = useQuery({ queryKey: ['dashboard', 'remediation'], queryFn: fetchRemediationChart, ...queryOpts });

  const firstError = severity.error ?? assetTypes.error ?? trends.error ?? remediation.error;
  if (firstError) {
    return (
      <ErrorBanner
        message="Unable to load dashboard charts."
        details={String((firstError as Error)?.message ?? firstError)}
      />
    );
  }

  if (role === 'executive') {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <PostureTrendWide data={trends.data} isLoading={trends.isLoading} />
        <RemediationPerformance data={remediation.data} isLoading={remediation.isLoading} compact />
      </div>
    );
  }

  if (role === 'it') {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <RemediationPerformance data={remediation.data} isLoading={remediation.isLoading} compact />
        <AssetTypeChart data={assetTypes.data} isLoading={assetTypes.isLoading} />
      </div>
    );
  }

  if (role === 'analyst') {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <SeverityChart data={severity.data} isLoading={severity.isLoading} />
        <AssetTypeChart data={assetTypes.data} isLoading={assetTypes.isLoading} />
        <RiskTrendChart data={trends.data} isLoading={trends.isLoading} />
        <RemediationPerformance data={remediation.data} isLoading={remediation.isLoading} compact />
      </div>
    );
  }

  // admin — full operational visibility
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <SeverityChart data={severity.data} isLoading={severity.isLoading} />
      <AssetTypeChart data={assetTypes.data} isLoading={assetTypes.isLoading} />
      <RiskTrendChart data={trends.data} isLoading={trends.isLoading} />
      <RemediationPerformance data={remediation.data} isLoading={remediation.isLoading} />
    </div>
  );
}

function PostureTrendWide({
  data,
  isLoading,
}: {
  data?: Array<{ month: string; score: number; openCount?: number }>;
  isLoading: boolean;
}) {
  return (
    <DashboardCard className="lg:col-span-1">
      <CardHeader title="Executive Risk Trend" subtitle="Board-level posture movement" />
      {isLoading ? (
        <SkeletonBlock className="h-[220px] w-full" />
      ) : data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#0e7490" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState title="No trend data" description="Executive trends require historical posture snapshots." />
      )}
    </DashboardCard>
  );
}
