import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { useAppSelector } from '@/hooks/redux';
import type { Severity } from '@/types/domain';

interface Vulnerability {
  id: string;
  title: string;
  severity: Severity;
  status: string;
  cveId: string | null;
  cvssScore: number | null;
  _count: { affectedAssets: number };
  remediation?: { status: string; dueDate: string | null };
}

const SEVERITIES: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'];

export function VulnerabilitiesPage() {
  const queryClient = useQueryClient();
  const { user, currentOrganizationId: orgId, memberships } = useAppSelector((s) => s.auth);
  const membership = memberships.find((m) => m.organizationId === orgId);
  const canManage =
    user?.platformRole === 'SUPER_ADMIN' || membership?.role === 'SECURITY_ANALYST';

  const [severityFilter, setSeverityFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'HIGH' as Severity,
    cveId: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['vulnerabilities', orgId, severityFilter],
    queryFn: async () => {
      const { data: res } = await apiClient.get<{ data: Vulnerability[] }>('/vulnerabilities', {
        params: { severity: severityFilter || undefined, limit: 50 },
      });
      return res.data;
    },
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/vulnerabilities', {
        ...form,
        cveId: form.cveId || undefined,
        likelihood: 3,
        impact: 3,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['remediation'] });
      setShowForm(false);
      setForm({ title: '', description: '', severity: 'HIGH', cveId: '' });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Vulnerabilities</h2>
        <div className="flex gap-2">
          <Link to="/risk" className="text-sm text-cyan-600 hover:underline py-2">
            Risk heat map →
          </Link>
          {canManage && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-cyan-700"
            >
              {showForm ? 'Cancel' : 'Report Vulnerability'}
            </button>
          )}
        </div>
      </div>

      <select
        value={severityFilter}
        onChange={(e) => setSeverityFilter(e.target.value)}
        className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
      >
        <option value="">All severities</option>
        {SEVERITIES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {showForm && canManage && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
        >
          <input
            placeholder="Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            required
          />
          <textarea
            placeholder="Description *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm h-24"
            required
          />
          <div className="flex gap-3">
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              placeholder="CVE ID"
              value={form.cveId}
              onChange={(e) => setForm({ ...form, cveId: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm flex-1 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            Create
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((v) => (
            <div
              key={v.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{v.title}</h3>
                  <SeverityBadge severity={v.severity} />
                  {v.cveId && (
                    <span className="text-xs font-mono text-slate-500">{v.cveId}</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {v._count.affectedAssets} affected assets
                  {v.cvssScore != null && ` · CVSS ${v.cvssScore}`}
                  {v.remediation && ` · Remediation: ${v.remediation.status}`}
                </p>
              </div>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded">{v.status}</span>
            </div>
          ))}
          {(!data || data.length === 0) && (
            <p className="text-center text-slate-500 py-8">No vulnerabilities found</p>
          )}
        </div>
      )}
    </div>
  );
}
