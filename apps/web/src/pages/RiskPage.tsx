import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAppSelector } from '@/hooks/redux';

interface HeatmapCell {
  likelihood: number;
  impact: number;
  count: number;
}

function cellColor(count: number): string {
  if (count === 0) return 'bg-slate-50';
  if (count <= 1) return 'bg-yellow-100';
  if (count <= 2) return 'bg-orange-200';
  return 'bg-red-400 text-white';
}

export function RiskPage() {
  const queryClient = useQueryClient();
  const orgId = useAppSelector((s) => s.auth.currentOrganizationId);
  const { user, memberships } = useAppSelector((s) => s.auth);
  const membership = memberships.find((m) => m.organizationId === orgId);
  const canRecalculate =
    user?.platformRole === 'SUPER_ADMIN' || membership?.role === 'SECURITY_ANALYST';

  const posture = useQuery({
    queryKey: ['risk', 'posture', orgId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { score: number; openCount: number; criticalCount: number } }>(
        '/risk/posture'
      );
      return data.data;
    },
    enabled: !!orgId,
  });

  const heatmap = useQuery({
    queryKey: ['vulnerabilities', 'heatmap', orgId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { grid: HeatmapCell[]; total: number } }>(
        '/vulnerabilities/heatmap'
      );
      return data.data;
    },
    enabled: !!orgId,
  });

  const recalc = useMutation({
    mutationFn: () => apiClient.post('/risk/recalculate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const grid = heatmap.data?.grid ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Risk Assessment</h2>
          <p className="text-slate-500 text-sm mt-1">Likelihood × impact matrix and security posture</p>
        </div>
        {canRecalculate && (
          <button
            onClick={() => recalc.mutate()}
            disabled={recalc.isPending}
            className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-cyan-700"
          >
            Recalculate Risk
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Security Posture</p>
          <p className="text-4xl font-bold text-cyan-600 mt-1">
            {posture.data?.score != null ? Math.round(posture.data.score) : '—'}/100
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Open Vulnerabilities</p>
          <p className="text-4xl font-bold mt-1">{posture.data?.openCount ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Critical Open</p>
          <p className="text-4xl font-bold text-red-600 mt-1">{posture.data?.criticalCount ?? '—'}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold mb-4">Vulnerability Heat Map</h3>
        <p className="text-xs text-slate-500 mb-4">Impact → (columns) · Likelihood ↑ (rows)</p>
        <div className="inline-block">
          <div className="grid grid-cols-6 gap-1 text-xs">
            <div />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="text-center font-medium text-slate-500 p-1">
                {i}
              </div>
            ))}
            {[5, 4, 3, 2, 1].map((likelihood) => [
              <div key={`l-${likelihood}`} className="flex items-center font-medium text-slate-500 pr-2">
                {likelihood}
              </div>,
              ...[1, 2, 3, 4, 5].map((impact) => {
                const cell = grid.find(
                  (c) => c.likelihood === likelihood && c.impact === impact
                );
                const count = cell?.count ?? 0;
                return (
                  <div
                    key={`${likelihood}-${impact}`}
                    className={`w-14 h-14 flex items-center justify-center rounded ${cellColor(count)}`}
                    title={`L${likelihood} × I${impact}: ${count}`}
                  >
                    {count > 0 ? count : ''}
                  </div>
                );
              }),
            ])}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Total mapped vulnerabilities: {heatmap.data?.total ?? 0}
        </p>
      </div>
    </div>
  );
}
