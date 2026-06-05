import type { ReactNode } from 'react';
import type { PlatformRole } from '@/types/auth';

export type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  description?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export type RoleSidebarTheme = {
  accent: string;
  accentMuted: string;
  accentBorder: string;
  activeBg: string;
  activeText: string;
  badgeBg: string;
  badgeText: string;
  logoGradient: string;
  tagline: string;
  headerBar: string;
  headerBadge: string;
  headerBadgeText: string;
  headerAvatar: string;
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <span className="w-5 h-5 shrink-0 flex items-center justify-center opacity-90">{children}</span>
  );
}

const icons = {
  dashboard: (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    </Icon>
  ),
  organizations: (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
      </svg>
    </Icon>
  ),
  users: (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M16 11l2 2 4-4" />
      </svg>
    </Icon>
  ),
  audit: (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M9 13h6M9 17h4" />
      </svg>
    </Icon>
  ),
  assets: (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <rect x="2" y="3" width="20" height="6" rx="1" />
        <rect x="2" y="11" width="20" height="6" rx="1" />
        <circle cx="6" cy="6" r="1" fill="currentColor" />
        <circle cx="6" cy="14" r="1" fill="currentColor" />
      </svg>
    </Icon>
  ),
  vulnerabilities: (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    </Icon>
  ),
  risk: (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <path d="M3 20h18M7 20V10M12 20V4M17 20v-7" />
      </svg>
    </Icon>
  ),
  remediation: (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    </Icon>
  ),
  scan: (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35M8 11h6" />
      </svg>
    </Icon>
  ),
  tasks: (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
      </svg>
    </Icon>
  ),
  evidence: (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
      </svg>
    </Icon>
  ),
  reports: (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h2v5M12 11h2v7M16 15h2v3" />
      </svg>
    </Icon>
  ),
  compliance: (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <path d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    </Icon>
  ),
  activity: (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    </Icon>
  ),
  overview: (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <path d="M2 20h20M4 20V10M10 20V4M16 20v-6M22 20V8" />
      </svg>
    </Icon>
  ),
};

export const ROLE_THEMES: Record<PlatformRole, RoleSidebarTheme> = {
  SUPER_ADMIN: {
    accent: 'text-indigo-300',
    accentMuted: 'text-indigo-400/70',
    accentBorder: 'border-indigo-400',
    activeBg: 'bg-indigo-500/15',
    activeText: 'text-indigo-200',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
    logoGradient: 'from-indigo-500 to-violet-600',
    tagline: 'Platform governance & oversight',
    headerBar: 'bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600',
    headerBadge: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    headerBadgeText: 'text-indigo-700',
    headerAvatar: 'bg-gradient-to-br from-indigo-500 to-violet-600',
  },
  SECURITY_ANALYST: {
    accent: 'text-cyan-300',
    accentMuted: 'text-cyan-400/70',
    accentBorder: 'border-cyan-400',
    activeBg: 'bg-cyan-500/15',
    activeText: 'text-cyan-200',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    logoGradient: 'from-cyan-500 to-blue-600',
    tagline: 'Vulnerability analysis & risk ops',
    headerBar: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-600',
    headerBadge: 'bg-cyan-50 text-cyan-800 ring-cyan-200',
    headerBadgeText: 'text-cyan-800',
    headerAvatar: 'bg-gradient-to-br from-cyan-500 to-blue-600',
  },
  IT_ADMINISTRATOR: {
    accent: 'text-emerald-300',
    accentMuted: 'text-emerald-400/70',
    accentBorder: 'border-emerald-400',
    activeBg: 'bg-emerald-500/15',
    activeText: 'text-emerald-200',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    logoGradient: 'from-emerald-500 to-teal-600',
    tagline: 'Remediation & infrastructure ops',
    headerBar: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600',
    headerBadge: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    headerBadgeText: 'text-emerald-800',
    headerAvatar: 'bg-gradient-to-br from-emerald-500 to-teal-600',
  },
  EXECUTIVE_MANAGER: {
    accent: 'text-amber-300',
    accentMuted: 'text-amber-400/70',
    accentBorder: 'border-amber-400',
    activeBg: 'bg-amber-500/15',
    activeText: 'text-amber-200',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    logoGradient: 'from-amber-500 to-orange-600',
    tagline: 'Strategic risk & compliance view',
    headerBar: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600',
    headerBadge: 'bg-amber-50 text-amber-900 ring-amber-200',
    headerBadgeText: 'text-amber-900',
    headerAvatar: 'bg-gradient-to-br from-amber-500 to-orange-600',
  },
};

export const ROLE_LABELS: Record<PlatformRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  SECURITY_ANALYST: 'Security Analyst',
  IT_ADMINISTRATOR: 'IT Administrator',
  EXECUTIVE_MANAGER: 'Executive Manager',
};

export const NAV_BY_ROLE: Record<PlatformRole, NavSection[]> = {
  SUPER_ADMIN: [
    {
      title: 'Dashboard',
      items: [
        { to: '/dashboard/admin', label: 'Dashboard', icon: icons.dashboard, description: 'Platform overview' },
      ],
    },
    {
      title: 'Governance',
      items: [
        { to: '/organizations', label: 'Organizations', icon: icons.organizations },
        { to: '/users', label: 'Users', icon: icons.users },
        { to: '/audit', label: 'Audit Logs', icon: icons.audit },
        { to: '/reports', label: 'Reports', icon: icons.reports },
      ],
    },
    {
      title: 'Security (Read-only)',
      items: [
        { to: '/assets', label: 'Assets', icon: icons.assets },
        { to: '/vulnerabilities', label: 'Vulnerabilities', icon: icons.vulnerabilities },
        { to: '/risk', label: 'Risk Assessment', icon: icons.risk },
        { to: '/remediation', label: 'Remediation', icon: icons.remediation },
      ],
    },
  ],
  SECURITY_ANALYST: [
    {
      title: 'Dashboard',
      items: [
        { to: '/dashboard/analyst', label: 'Dashboard', icon: icons.dashboard, description: 'SOC command center' },
      ],
    },
    {
      title: 'Vulnerability Management',
      items: [
        { to: '/vulnerabilities', label: 'Vulnerabilities', icon: icons.vulnerabilities },
        { to: '/risk', label: 'Risk Assessment', icon: icons.risk },
        { to: '/remediation', label: 'Remediation', icon: icons.remediation },
        { to: '/attack-surface', label: 'Scan Reports', icon: icons.scan },
      ],
    },
    {
      title: 'Investigate',
      items: [
        { to: '/assets', label: 'Assets', icon: icons.assets },
        { to: '/audit', label: 'Audit Logs', icon: icons.audit },
      ],
    },
  ],
  IT_ADMINISTRATOR: [
    {
      title: 'Dashboard',
      items: [
        { to: '/dashboard/it', label: 'Dashboard', icon: icons.dashboard, description: 'Operations console' },
      ],
    },
    {
      title: 'Remediation',
      items: [
        { to: '/tasks', label: 'Remediation Tasks', icon: icons.tasks },
        { to: '/remediation', label: 'Remediation Queue', icon: icons.remediation },
        { to: '/evidence', label: 'Evidence', icon: icons.evidence },
      ],
    },
    {
      title: 'Infrastructure',
      items: [
        { to: '/assets', label: 'Assets', icon: icons.assets },
        { to: '/attack-surface', label: 'Scan Reports', icon: icons.scan },
      ],
    },
  ],
  EXECUTIVE_MANAGER: [
    {
      title: 'Dashboard',
      items: [
        {
          to: '/dashboard/executive',
          label: 'Executive Dashboard',
          icon: icons.dashboard,
          description: 'Leadership overview',
        },
      ],
    },
    {
      title: 'Oversight',
      items: [
        { to: '/risk', label: 'Risk Overview', icon: icons.risk },
        { to: '/reports', label: 'Compliance & Reports', icon: icons.reports },
      ],
    },
  ],
};

export function getRoleHomePath(role: PlatformRole): string {
  const paths: Record<PlatformRole, string> = {
    SUPER_ADMIN: '/dashboard/admin',
    SECURITY_ANALYST: '/dashboard/analyst',
    IT_ADMINISTRATOR: '/dashboard/it',
    EXECUTIVE_MANAGER: '/dashboard/executive',
  };
  return paths[role];
}
