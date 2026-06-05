import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function DashboardCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm ${className ?? ''}`}>
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  accentClassName,
  borderAccent,
  delta,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accentClassName?: string;
  borderAccent?: 'cyan' | 'red' | 'green' | 'amber' | 'slate';
  delta?: { value: string; positive?: boolean };
}) {
  const borderMap = {
    cyan: 'border-l-cyan-500',
    red: 'border-l-red-500',
    green: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    slate: 'border-l-slate-400',
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 border-l-4 ${borderAccent ? borderMap[borderAccent] : 'border-l-transparent'} p-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex items-end justify-between gap-2 mt-2">
        <p className={`text-3xl font-bold tabular-nums ${accentClassName ?? 'text-slate-900'}`}>{value}</p>
        {delta && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              delta.positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {delta.value}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-slate-400 mt-2">{hint}</p>}
    </div>
  );
}

export function PostureScoreHero({
  score,
  label = 'Security Posture',
  subtitle,
}: {
  score: number;
  label?: string;
  subtitle?: string;
}) {
  const rounded = Math.round(score);
  const color =
    rounded >= 80 ? 'text-emerald-600' : rounded >= 60 ? 'text-amber-600' : 'text-red-600';
  const ringColor =
    rounded >= 80 ? 'stroke-emerald-500' : rounded >= 60 ? 'stroke-amber-500' : 'stroke-red-500';
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (rounded / 100) * circumference;

  return (
    <DashboardCard className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg width="100" height="100" className="-rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            className={ringColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold tabular-nums ${color}`}>{rounded}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className={`text-4xl font-bold mt-1 tabular-nums ${color}`}>{rounded}/100</p>
        {subtitle && <p className="text-sm text-slate-500 mt-2 max-w-sm">{subtitle}</p>}
      </div>
    </DashboardCard>
  );
}

export function AlertStrip({
  variant,
  title,
  message,
  action,
}: {
  variant: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  action?: { label: string; to: string };
}) {
  const styles = {
    critical: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-cyan-50 border-cyan-200 text-cyan-900',
  };

  return (
    <div className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border ${styles[variant]}`}>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-sm opacity-90 mt-0.5">{message}</p>
      </div>
      {action && (
        <Link to={action.to} className="text-sm font-medium whitespace-nowrap hover:underline shrink-0">
          {action.label} →
        </Link>
      )}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export function ErrorBanner({ message, details }: { message: string; details?: string }) {
  return (
    <div className="bg-red-50 text-red-800 border border-red-200 px-4 py-3 rounded-xl">
      <div className="font-medium">Something went wrong</div>
      <div className="text-sm mt-1">{message}</div>
      {details && <div className="text-xs mt-2 text-red-600 font-mono">{details}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  cta,
}: {
  title: string;
  description: string;
  cta?: { label: string; to: string };
}) {
  return (
    <div className="py-10 text-center">
      <p className="font-medium text-slate-900">{title}</p>
      <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{description}</p>
      {cta && (
        <div className="mt-4">
          <Link to={cta.to} className="text-cyan-700 hover:underline text-sm font-medium">
            {cta.label} →
          </Link>
        </div>
      )}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-slate-100 animate-pulse rounded ${className ?? 'h-4'}`} />;
}

export function SkeletonKpiRow() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="h-10 w-20 mt-3" />
    </div>
  );
}

export function PageHeading({
  breadcrumb,
  title,
  subtitle,
  actions,
}: {
  breadcrumb?: { label: string; to: string }[];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-2">
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="text-sm text-slate-500 mb-2">
          {breadcrumb.map((b, idx) => (
            <span key={b.to} className="inline-flex items-center gap-2">
              {idx > 0 && <span className="text-slate-300">/</span>}
              <Link to={b.to} className="text-slate-500 hover:text-cyan-700 hover:underline">
                {b.label}
              </Link>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-slate-500 text-sm mt-1 max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

export function SeverityBreakdown({
  items,
}: {
  items: Array<{ severity: string; count: number }>;
}) {
  const total = items.reduce((s, i) => s + i.count, 0);
  const colors: Record<string, string> = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-blue-500',
    INFORMATIONAL: 'bg-slate-400',
  };

  if (total === 0) return null;

  return (
    <DashboardCard>
      <CardHeader title="Open by Severity" subtitle="Current exposure breakdown" />
      <div className="flex h-3 rounded-full overflow-hidden mb-4">
        {items
          .filter((i) => i.count > 0)
          .map((i) => (
            <div
              key={i.severity}
              className={colors[i.severity] ?? 'bg-slate-300'}
              style={{ width: `${(i.count / total) * 100}%` }}
              title={`${i.severity}: ${i.count}`}
            />
          ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((i) => (
          <div key={i.severity} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg bg-slate-50">
            <span className="text-slate-600">{i.severity}</span>
            <span className="font-semibold tabular-nums">{i.count}</span>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
