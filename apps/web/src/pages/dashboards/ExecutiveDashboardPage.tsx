import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold mt-1 text-slate-900">{value}</p>
    </div>
  );
}

export function ExecutiveDashboardPage() {
  const summary = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        data: {
          totalAssets: number;
          totalVulnerabilities: number;
          criticalVulnerabilities: number;
          openFindings: number;
          resolvedFindings: number;
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
        <h2 className="text-2xl font-bold text-slate-900">Executive Overview</h2>
        <p className="text-slate-500 text-sm mt-1">KPIs and risk posture for leadership</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Posture Score" value={d?.securityPostureScore != null ? `${Math.round(d.securityPostureScore)}/100` : '—'} />
        <KpiCard label="Open Findings" value={d?.openFindings ?? '—'} />
        <KpiCard label="Critical Open" value={d?.criticalVulnerabilities ?? '—'} />
        <KpiCard label="Resolved" value={d?.resolvedFindings ?? '—'} />
        <KpiCard label="Assets" value={d?.totalAssets ?? '—'} />
        <KpiCard label="Total Vulns" value={d?.totalVulnerabilities ?? '—'} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-semibold mb-2">Reports</h3>
        <p className="text-sm text-slate-500">
          Use reports for board-ready summaries and trend narratives.
        </p>
        <div className="mt-3">
          <Link to="/reports" className="text-sm text-cyan-700 hover:underline">
            View reports →
          </Link>
        </div>
      </div>
    </div>
  );
}

