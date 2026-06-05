import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { setCredentials } from '@/features/auth/authSlice';
import { apiClient, setAccessToken } from '@/lib/api-client';
import type { AuthUser, OrganizationMembership } from '@/types/auth';

function hasRefreshCookie(): boolean {
  return document.cookie.split(';').some((c) => c.trim().startsWith('cybershield_refresh='));
}

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      // Skip refresh call when no session cookie — instant load for login page
      if (!hasRefreshCookie()) {
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const refreshRes = await apiClient.post<{ data: { accessToken: string } }>('/auth/refresh');
        const accessToken = refreshRes.data.data.accessToken;
        setAccessToken(accessToken);

        const meRes = await apiClient.get<{
          data: AuthUser & {
            memberships: Array<{
              organizationId: string;
              role: OrganizationMembership['role'];
              organization: { id: string; name: string };
            }>;
          };
        }>('/auth/me');

        const me = meRes.data.data;
        const memberships: OrganizationMembership[] = me.memberships.map((m) => ({
          organizationId: m.organizationId,
          organizationName: m.organization.name,
          role: m.role,
        }));

        if (!cancelled) {
          dispatch(
            setCredentials({
              accessToken,
              user: {
                id: me.id,
                email: me.email,
                firstName: me.firstName,
                lastName: me.lastName,
                status: me.status,
                platformRole: me.platformRole,
              },
              memberships,
            })
          );
        }
      } catch {
        // Session expired or invalid
        setAccessToken(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
