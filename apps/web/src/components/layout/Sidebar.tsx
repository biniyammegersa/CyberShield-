import { NavLink } from 'react-router-dom';
import type { PlatformRole } from '@/types/auth';
import { CyberShieldIcon } from './CyberShieldIcon';
import { getRoleHomePath, NAV_BY_ROLE, ROLE_LABELS, ROLE_THEMES } from './sidebar-config';

export function Sidebar({ role }: { role: PlatformRole }) {
  const theme = ROLE_THEMES[role];
  const sections = NAV_BY_ROLE[role];
  const homePath = getRoleHomePath(role);

  return (
    <aside
      data-role={role}
      className="w-[17rem] h-screen bg-sidebar text-sidebar-fg flex flex-col shrink-0 border-r border-sidebar-border overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.logoGradient} flex items-center justify-center shadow-md text-white p-2`}
          >
            <CyberShieldIcon className="w-full h-full" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight truncate">CyberShield</h1>
            <p className="text-[10px] text-sidebar-muted truncate">Vulnerability Management</p>
          </div>
        </div>
        <p className="text-[11px] text-sidebar-muted mt-3 leading-snug">{theme.tagline}</p>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="sidebar-section-label px-3 mb-2 text-[10px] uppercase tracking-[0.15em] font-semibold">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={`${section.title}-${item.to}-${item.label}`}
                  to={item.to}
                  end={item.to === homePath}
                  className={({ isActive }) =>
                    `sidebar-nav-link ${isActive ? 'sidebar-nav-link--active' : ''}`
                  }
                >
                  <span className="transition-transform">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3">
        <p className="sidebar-role-label text-xs font-semibold text-center">{ROLE_LABELS[role]}</p>
        <p className="text-[10px] text-sidebar-muted text-center mt-1">Secure session active</p>
      </div>
    </aside>
  );
}
