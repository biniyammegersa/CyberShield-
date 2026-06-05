import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { useAppSelector } from '@/hooks/redux';
import type { Criticality } from '@/types/domain';

export function AttackSurfacePage() {
  const orgId = useAppSelector((s) => s.auth.currentOrganizationId);

  const { data, isLoading } = useQuery({
    queryKey: ['attack-surface', orgId],
    queryFn: async () => {
      const { data: res } = await apiClient.get<{
        data: {
          internetFacingCount: number;
          openPorts: number;
          criticalSystems: number;
          exposedServices: Array<{
            assetName: string;
            ipAddress: string | null;
            port: number;
            service: string | null;
            protocol: string;
          }>;
          assets: Array<{
            id: string;
            name: string;
            ipAddress: string | null;
            criticality: Criticality;
            services: Array<{ port: number; service: string | null }>;
          }>;
        };
      }>('/assets/attack-surface');
      return res.data;
    },
    enabled: !!orgId,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Attack Surface</h2>

      {isLoading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-5">
              <p className="text-sm text-slate-500">Internet-Facing</p>
              <p className="text-3xl font-bold">{data?.internetFacingCount ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-sm text-slate-500">Open Ports</p>
              <p className="text-3xl font-bold">{data?.openPorts ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-sm text-slate-500">Critical Systems</p>
              <p className="text-3xl font-bold text-red-600">{data?.criticalSystems ?? 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <h3 className="font-semibold px-4 py-3 border-b bg-slate-50">Exposed Services</h3>
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Asset</th>
                  <th className="px-4 py-2">IP</th>
                  <th className="px-4 py-2">Port</th>
                  <th className="px-4 py-2">Service</th>
                </tr>
              </thead>
              <tbody>
                {(data?.exposedServices ?? []).map((s, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">{s.assetName}</td>
                    <td className="px-4 py-2 font-mono text-xs">{s.ipAddress ?? '—'}</td>
                    <td className="px-4 py-2">
                      {s.port}/{s.protocol}
                    </td>
                    <td className="px-4 py-2">{s.service ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            {(data?.assets ?? []).map((a) => (
              <div key={a.id} className="bg-white border rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{a.name}</span>
                  <SeverityBadge severity={a.criticality} />
                </div>
                <p className="text-xs text-slate-500 mt-1 font-mono">{a.ipAddress}</p>
                <p className="text-sm mt-2">
                  Ports:{' '}
                  {a.services.map((s) => `${s.port}${s.service ? ` (${s.service})` : ''}`).join(', ') ||
                    'none'}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
