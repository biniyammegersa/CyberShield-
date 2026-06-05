import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';

function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold mt-1 text-slate-900">{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-2">{hint}</p>}
    </div>
  );
}

export function ItAdminDashboardPage() {
  const summary = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        data: {
          totalAssets: number;
          criticalVulnerabilities: number;
          openFindings: number;
          securityPostureScore: number;
        };
      }>('/dashboard/summary');
      return data.data;
    },
    retry: 1,
    staleTime: 30_000,
  });

  const d = summary.data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">IT Operations</h2>
        <p className="text-slate-500 text-sm mt-1">Asset hygiene, remediation execution, evidence capture</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Assets" value={d?.totalAssets ?? '—'} />
        <KpiCard label="Open Findings" value={d?.openFindings ?? '—'} />
        <KpiCard label="Critical Open" value={d?.criticalVulnerabilities ?? '—'} />
        <KpiCard
          label="Posture Score"
          value={d?.securityPostureScore != null ? `${Math.round(d.securityPostureScore)}/100` : '—'}
          hint="Derived from current risk posture"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-semibold mb-2">Quick actions</h3>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link className="text-cyan-700 hover:underline" to="/assets">
            Manage assets →
          </Link>
          <Link className="text-cyan-700 hover:underline" to="/remediation">
            Work remediation queue →
          </Link>
          <Link className="text-cyan-700 hover:underline" to="/tasks">
            Tasks →
          </Link>
          <Link className="text-cyan-700 hover:underline" to="/evidence">
            Evidence →
          </Link>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          This dashboard is intentionally ops-focused (execution and proof), not analysis-heavy.
        </p>
      </div>
    </div>
  );
}

