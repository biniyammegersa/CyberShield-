import { useQuery } from '@tanstack/react-query';
import {
  fetchAssetTypeChart,
  fetchDashboardSummary,
  fetchRemediationChart,
  fetchRiskTrends,
  fetchSeverityChart,
} from '@/features/dashboard/api';
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

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
  INFORMATIONAL: '#94a3b8',
};

const PIE_COLORS = ['#0891b2', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

function KpiCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent ?? 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const queryOpts = { retry: 1, staleTime: 30_000 };

  const summary = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
    ...queryOpts,
  });
  const severity = useQuery({
    queryKey: ['dashboard', 'severity'],
    queryFn: fetchSeverityChart,
    ...queryOpts,
  });
  const assetTypes = useQuery({
    queryKey: ['dashboard', 'asset-type'],
    queryFn: fetchAssetTypeChart,
    ...queryOpts,
  });
  const trends = useQuery({
    queryKey: ['dashboard', 'risk-trends'],
    queryFn: fetchRiskTrends,
    ...queryOpts,
  });
  const remediation = useQuery({
    queryKey: ['dashboard', 'remediation'],
    queryFn: fetchRemediationChart,
    ...queryOpts,
  });

  if (summary.isLoading) {
    return <div className="text-slate-500">Loading dashboard...</div>;
  }

  if (summary.error) {
    return (
      <div className="text-amber-700 bg-amber-50 px-4 py-3 rounded-lg">
        Select an organization to view the dashboard.
      </div>
    );
  }

  const d = summary.data!;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Security Overview</h2>
        <p className="text-slate-500 text-sm mt-1">Organization security posture at a glance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard label="Total Assets" value={d.totalAssets} />
        <KpiCard label="Vulnerabilities" value={d.totalVulnerabilities} />
        <KpiCard label="Critical" value={d.criticalVulnerabilities} accent="text-red-600" />
        <KpiCard label="Open Findings" value={d.openFindings} accent="text-orange-600" />
        <KpiCard
          label="Posture Score"
          value={`${Math.round(d.securityPostureScore)}/100`}
          accent="text-cyan-600"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Vulnerabilities by Severity</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={severity.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {(severity.data ?? []).map((entry, i) => (
                  <Cell key={i} fill={SEVERITY_COLORS[entry.name] ?? '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Assets by Type</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={assetTypes.data ?? []}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, count }) => `${name}: ${count}`}
              >
                {(assetTypes.data ?? []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Security Posture Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trends.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#0891b2" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Remediation (30 days)</h3>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{remediation.data?.resolved ?? 0}</p>
              <p className="text-xs text-green-600 mt-1">Resolved</p>
            </div>
            <div className="text-center p-4 bg-cyan-50 rounded-lg">
              <p className="text-2xl font-bold text-cyan-700">{remediation.data?.inProgress ?? 0}</p>
              <p className="text-xs text-cyan-600 mt-1">In Progress</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-700">{remediation.data?.overdue ?? 0}</p>
              <p className="text-xs text-red-600 mt-1">Overdue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
