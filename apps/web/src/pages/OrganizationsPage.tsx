import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Org {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  _count?: { members: number };
}

export function OrganizationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data: res } = await apiClient.get<{ data: Org[] }>('/organizations');
      return res.data;
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Organizations</h2>
      {isLoading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data ?? []).map((org) => (
            <div key={org.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-lg">{org.name}</h3>
              <p className="text-sm text-slate-500 mt-1">/{org.slug}</p>
              {org.domain && <p className="text-sm text-slate-400">{org.domain}</p>}
              <p className="text-xs text-slate-400 mt-3">{org._count?.members ?? 0} members</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
