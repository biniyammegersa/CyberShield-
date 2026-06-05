import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { logout } from '@/features/auth/authSlice';
import { logoutApi } from '@/features/auth/api';
import { setOrganization } from '@/features/auth/authSlice';
import { getEffectiveRole } from '@/lib/authz';
import type { PlatformRole } from '@/types/auth';

type NavItem = { to: string; label: string };
type NavSection = { title: string; items: NavItem[] };

const NAV_BY_ROLE: Record<PlatformRole, NavSection[]> = {
  SUPER_ADMIN: [
    {
      title: 'Admin',
      items: [
        { to: '/dashboard/admin', label: 'Admin Dashboard' },
        { to: '/organizations', label: 'Organizations' },
        { to: '/users', label: 'Users' },
        { to: '/audit', label: 'Audit Logs' },
      ],
    },
    {
      title: 'Security',
      items: [
        { to: '/dashboard/analyst', label: 'Security Overview' },
        { to: '/assets', label: 'Assets' },
        { to: '/attack-surface', label: 'Attack Surface' },
        { to: '/vulnerabilities', label: 'Vulnerabilities' },
        { to: '/risk', label: 'Risk' },
        { to: '/remediation', label: 'Remediation' },
      ],
    },
  ],
  SECURITY_ANALYST: [
    {
      title: 'Analyze',
      items: [
        { to: '/dashboard/analyst', label: 'Analyst Dashboard' },
        { to: '/vulnerabilities', label: 'Vulnerabilities' },
        { to: '/risk', label: 'Risk' },
        { to: '/remediation', label: 'Remediation' },
      ],
    },
    {
      title: 'Investigate',
      items: [
        { to: '/assets', label: 'Assets' },
        { to: '/attack-surface', label: 'Attack Surface' },
        { to: '/audit', label: 'Audit Logs' },
      ],
    },
  ],
  IT_ADMINISTRATOR: [
    {
      title: 'Operate',
      items: [
        { to: '/dashboard/it', label: 'IT Dashboard' },
        { to: '/tasks', label: 'Tasks' },
        { to: '/assets', label: 'Assets' },
        { to: '/attack-surface', label: 'Attack Surface' },
        { to: '/remediation', label: 'Remediation' },
        { to: '/evidence', label: 'Evidence' },
      ],
    },
  ],
  EXECUTIVE_MANAGER: [
    {
      title: 'Leadership',
      items: [
        { to: '/dashboard/executive', label: 'Executive Overview' },
        { to: '/reports', label: 'Reports' },
      ],
    },
  ],
};

export function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, memberships, currentOrganizationId } = useAppSelector((s) => s.auth);

  const effectiveRole = getEffectiveRole({ user, memberships, currentOrganizationId });
  const navSections = effectiveRole ? NAV_BY_ROLE[effectiveRole] : [];

  async function handleLogout() {
    try {
      await logoutApi();
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-tight">CyberShield</h1>
          <p className="text-xs text-slate-400 mt-1">Vulnerability Management</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
              {section.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          {memberships.length > 0 && (
            <select
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              value={currentOrganizationId ?? ''}
              onChange={(e) => dispatch(setOrganization(e.target.value))}
            >
              {memberships.map((m) => (
                <option key={m.organizationId} value={m.organizationId}>
                  {m.organizationName}
                </option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm text-slate-600">
              {user?.firstName} {user?.lastName}
              {effectiveRole && (
                <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded">
                  {effectiveRole.replace(/_/g, ' ')}
                </span>
              )}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
