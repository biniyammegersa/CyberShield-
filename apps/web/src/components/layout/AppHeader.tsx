import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { setOrganization } from '@/features/auth/authSlice';
import { ThemeToggle } from './ThemeToggle';

export function AppHeader({ onLogout }: { onLogout: () => void }) {
  const dispatch = useAppDispatch();
  const { user, memberships, currentOrganizationId } = useAppSelector((s) => s.auth);

  return (
    <header className="shrink-0 bg-sidebar border-b border-app-border">
      <div className="h-10 flex items-center justify-between px-4">
        {memberships.length > 0 ? (
          <select
            className="border border-app-border rounded-md px-2 py-1 text-xs text-app-fg bg-app-bg focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={currentOrganizationId ?? ''}
            onChange={(e) => dispatch(setOrganization(e.target.value))}
          >
            {memberships.map((m) => (
              <option key={m.organizationId} value={m.organizationId}>
                {m.organizationName}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-sidebar-muted">CyberShield</span>
        )}

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-xs text-app-fg hidden sm:inline">
            {user?.firstName} {user?.lastName}
          </span>
          <button
            onClick={onLogout}
            className="text-xs text-sidebar-muted hover:text-app-fg"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
