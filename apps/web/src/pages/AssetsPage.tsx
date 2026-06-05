import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { useAppSelector } from '@/hooks/redux';
import type { AssetType, Criticality } from '@/types/domain';

interface Asset {
  id: string;
  name: string;
  hostname: string | null;
  ipAddress: string | null;
  assetType: AssetType;
  criticality: Criticality;
  status: string;
  isInternetFacing: boolean;
  _count: { vulnerabilityLinks: number; services: number };
}

const ASSET_TYPES: AssetType[] = [
  'SERVER',
  'WORKSTATION',
  'DATABASE',
  'APPLICATION',
  'FIREWALL',
  'ROUTER',
  'SWITCH',
  'CLOUD_RESOURCE',
];

export function AssetsPage() {
  const queryClient = useQueryClient();
  const { user, currentOrganizationId: orgId, memberships } = useAppSelector((s) => s.auth);
  const membership = memberships.find((m) => m.organizationId === orgId);
  const canManage =
    user?.platformRole === 'SUPER_ADMIN' || membership?.role === 'IT_ADMINISTRATOR';

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    hostname: '',
    ipAddress: '',
    assetType: 'SERVER' as AssetType,
    criticality: 'MEDIUM' as Criticality,
    isInternetFacing: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['assets', orgId, search],
    queryFn: async () => {
      const { data: res } = await apiClient.get<{ data: Asset[] }>('/assets', {
        params: { search: search || undefined, limit: 50 },
      });
      return res.data;
    },
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/assets', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowForm(false);
      setForm({ name: '', hostname: '', ipAddress: '', assetType: 'SERVER', criticality: 'MEDIUM', isInternetFacing: false });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Assets</h2>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-cyan-700"
          >
            {showForm ? 'Cancel' : 'Add Asset'}
          </button>
        )}
      </div>

      <input
        type="search"
        placeholder="Search by name, hostname, IP..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full max-w-md"
      />

      {showForm && canManage && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="bg-white border border-slate-200 rounded-xl p-4 grid md:grid-cols-2 gap-3"
        >
          <input
            placeholder="Asset name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
            required
          />
          <select
            value={form.assetType}
            onChange={(e) => setForm({ ...form, assetType: e.target.value as AssetType })}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            placeholder="Hostname"
            value={form.hostname}
            onChange={(e) => setForm({ ...form, hostname: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="IP Address"
            value={form.ipAddress}
            onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={form.criticality}
            onChange={(e) => setForm({ ...form, criticality: e.target.value as Criticality })}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Criticality[]).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isInternetFacing}
              onChange={(e) => setForm({ ...form, isInternetFacing: e.target.checked })}
            />
            Internet-facing
          </label>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="md:col-span-2 bg-cyan-600 text-white py-2 rounded-lg text-sm hover:bg-cyan-700"
          >
            Create Asset
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-slate-500">Loading assets...</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">Criticality</th>
                <th className="px-4 py-3 font-medium">Vulns</th>
                <th className="px-4 py-3 font-medium">Ports</th>
                {canManage && <th className="px-4 py-3 font-medium" />}
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.name}</div>
                    {a.hostname && <div className="text-xs text-slate-500">{a.hostname}</div>}
                    {a.isInternetFacing && (
                      <span className="text-xs text-red-600">Internet-facing</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.assetType}</td>
                  <td className="px-4 py-3 font-mono text-xs">{a.ipAddress ?? '—'}</td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={a.criticality} />
                  </td>
                  <td className="px-4 py-3">{a._count.vulnerabilityLinks}</td>
                  <td className="px-4 py-3">{a._count.services}</td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (confirm('Delete this asset?')) deleteMutation.mutate(a.id);
                        }}
                        className="text-red-600 text-xs hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {(!data || data.length === 0) && (
            <p className="px-4 py-8 text-center text-slate-500">No assets found</p>
          )}
        </div>
      )}
    </div>
  );
}
