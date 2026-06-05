import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface AuditEntry {
  id: string;
  action: string;
  resourceType: string;
  ipAddress: string;
  createdAt: string;
  user?: { email: string; firstName: string; lastName: string };
}

export function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: async () => {
      const { data: res } = await apiClient.get<{ data: AuditEntry[] }>('/users/audit');
      return res.data;
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Audit Logs</h2>
      {isLoading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((log) => (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                  <td className="px-4 py-3">
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : '—'}
                  </td>
                  <td className="px-4 py-3">{log.resourceType}</td>
                  <td className="px-4 py-3 text-slate-500">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
