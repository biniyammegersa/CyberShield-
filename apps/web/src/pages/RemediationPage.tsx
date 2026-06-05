import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { useAppSelector } from '@/hooks/redux';
import type { RemediationStatus, Severity } from '@/types/domain';

interface RemediationTask {
  id: string;
  status: RemediationStatus;
  dueDate: string | null;
  assignedTo: { firstName: string; lastName: string } | null;
  vulnerability: {
    id: string;
    title: string;
    severity: Severity;
    cveId: string | null;
  };
}

const STATUSES: RemediationStatus[] = [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'VERIFIED',
  'CLOSED',
];

const NEXT_STATUS: Partial<Record<RemediationStatus, RemediationStatus>> = {
  OPEN: 'ASSIGNED',
  ASSIGNED: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
  RESOLVED: 'VERIFIED',
  VERIFIED: 'CLOSED',
};

export function RemediationPage() {
  const queryClient = useQueryClient();
  const { user, currentOrganizationId: orgId, memberships } = useAppSelector((s) => s.auth);
  const membership = memberships.find((m) => m.organizationId === orgId);
  const canManage =
    user?.platformRole === 'SUPER_ADMIN' ||
    membership?.role === 'SECURITY_ANALYST' ||
    membership?.role === 'IT_ADMINISTRATOR';

  const { data, isLoading } = useQuery({
    queryKey: ['remediation', orgId],
    queryFn: async () => {
      const { data: res } = await apiClient.get<{ data: RemediationTask[] }>('/remediation', {
        params: { limit: 50 },
      });
      return res.data;
    },
    enabled: !!orgId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RemediationStatus }) =>
      apiClient.patch(`/remediation/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation'] });
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Remediation</h2>
      <p className="text-sm text-slate-500">
        Track vulnerability remediation from Open → Assigned → In Progress → Resolved → Verified → Closed
      </p>

      {isLoading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((task) => {
            const next = NEXT_STATUS[task.status];
            const overdue =
              task.dueDate && new Date(task.dueDate) < new Date() && !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(task.status);

            return (
              <div
                key={task.id}
                className={`bg-white border rounded-xl p-4 ${overdue ? 'border-red-300' : 'border-slate-200'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{task.vulnerability.title}</h3>
                      <SeverityBadge severity={task.vulnerability.severity} />
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Status: <span className="font-medium">{task.status}</span>
                      {task.assignedTo &&
                        ` · Assigned to ${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                      {task.dueDate && ` · Due ${new Date(task.dueDate).toLocaleDateString()}`}
                      {overdue && <span className="text-red-600 ml-2">Overdue</span>}
                    </p>
                  </div>
                  {canManage && next && (
                    <button
                      onClick={() => updateMutation.mutate({ id: task.id, status: next })}
                      disabled={updateMutation.isPending}
                      className="text-sm bg-cyan-600 text-white px-3 py-1.5 rounded-lg hover:bg-cyan-700 whitespace-nowrap"
                    >
                      → {next.replace(/_/g, ' ')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {(!data || data.length === 0) && (
            <p className="text-center text-slate-500 py-8">No remediation tasks</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-6">
        {STATUSES.map((s) => (
          <span key={s} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
