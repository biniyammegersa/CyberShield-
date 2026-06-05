import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  department: string | null;
}

export function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: res } = await apiClient.get<{ data: UserRow[] }>('/users');
      return res.data;
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Users</h2>
      {isLoading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Department</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{u.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.department ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data || data.length === 0) && (
            <p className="px-4 py-8 text-center text-slate-500">No users found</p>
          )}
        </div>
      )}
    </div>
  );
}
