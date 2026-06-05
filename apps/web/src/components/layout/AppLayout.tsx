import { Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { logout } from '@/features/auth/authSlice';
import { logoutApi } from '@/features/auth/api';
import { getEffectiveRole } from '@/lib/authz';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, memberships, currentOrganizationId } = useAppSelector((s) => s.auth);

  const effectiveRole = getEffectiveRole({ user, memberships, currentOrganizationId });

  async function handleLogout() {
    try {
      await logoutApi();
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-app-bg">
      {effectiveRole ? (
        <Sidebar role={effectiveRole} />
      ) : (
        <aside className="w-[17rem] h-screen bg-sidebar shrink-0 border-r border-sidebar-border" />
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-app-bg">
        <AppHeader onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

        <AppFooter />
      </div>
    </div>
  );
}
