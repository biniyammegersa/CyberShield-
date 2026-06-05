import { Link } from 'react-router-dom';
import { type Severity } from '@/types/domain';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import type {
  AuditLogLatestItem,
  RemediationTaskLatestItem,
  VulnerabilityLatestItem,
} from './api';
import { CardHeader, DashboardCard, EmptyState, ErrorBanner, SkeletonBlock } from './dashboard-components';

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
}

function formatAssignee(user: { firstName: string; lastName: string } | null | undefined) {
  if (!user) return 'Unassigned';
  return `${user.firstName} ${user.lastName}`.trim();
}

function SkeletonRow() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <SkeletonBlock className="h-4 w-3/4 mb-2" />
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-5 w-20" />
        <SkeletonBlock className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function severityFilterMatch(severityFilter: string, itemSeverity: string) {
  if (!severityFilter) return true;
  return severityFilter === itemSeverity;
}

export function LatestVulnerabilitiesCard({
  title,
  subtitle,
  items,
  isLoading,
  error,
  severityFilter,
  ctaTo = '/vulnerabilities',
}: {
  title: string;
  subtitle?: string;
  items: VulnerabilityLatestItem[];
  isLoading: boolean;
  error: unknown;
  severityFilter: string;
  ctaTo?: string;
}) {
  const filtered = items.filter((v) => severityFilterMatch(severityFilter, v.severity));

  return (
    <DashboardCard>
      <CardHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Link to={ctaTo} className="text-sm text-cyan-700 hover:underline">
            View all →
          </Link>
        }
      />

      {error ? (
        <ErrorBanner message="Unable to load latest vulnerabilities." details={String((error as any)?.message ?? error)} />
      ) : isLoading ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No vulnerabilities in scope"
          description="Try clearing filters or check back after new vulnerabilities are ingested."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => (
            <Link
              key={v.id}
              to={`/vulnerabilities`}
              className="block bg-slate-50 border border-slate-200/80 rounded-lg p-4 flex items-start justify-between gap-4 hover:border-cyan-300 hover:bg-cyan-50/30 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-900 truncate">{v.title}</p>
                  <SeverityBadge severity={v.severity as Severity | string} />
                  {v.cveId && <span className="text-xs font-mono text-slate-500">{v.cveId}</span>}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Status: {v.status}
                  {v.remediation?.dueDate ? ` · Due ${formatDate(v.remediation.dueDate)}` : ''}
                </p>
              </div>
              {v.remediation?.status && (
                <span className="text-xs bg-slate-100 px-2 py-1 rounded whitespace-nowrap self-start">
                  Remediation: {v.remediation.status}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}

export function LatestRemediationTasksCard({
  title,
  subtitle,
  items,
  isLoading,
  error,
  showSeverityBadge = true,
  statusFilter,
  ctaTo = '/remediation',
}: {
  title: string;
  subtitle?: string;
  items: RemediationTaskLatestItem[];
  isLoading: boolean;
  error: unknown;
  showSeverityBadge?: boolean;
  statusFilter?: string;
  ctaTo?: string;
}) {
  const filtered = statusFilter ? items.filter((t) => t.status === statusFilter) : items;
  return (
    <DashboardCard>
      <CardHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Link to={ctaTo} className="text-sm text-cyan-700 hover:underline">
            Open queue →
          </Link>
        }
      />

      {error ? (
        <ErrorBanner message="Unable to load latest remediation tasks." details={String((error as any)?.message ?? error)} />
      ) : isLoading ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No active remediation tasks" description="Remediation tasks are created when vulnerabilities are assigned." />
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <Link
              key={t.id}
              to="/remediation"
              className="block bg-slate-50 border border-slate-200/80 rounded-lg p-4 hover:border-cyan-300 hover:bg-cyan-50/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-900 truncate">{t.vulnerability.title}</p>
                    {showSeverityBadge && <SeverityBadge severity={t.vulnerability.severity as Severity | string} />}
                    {t.vulnerability.cveId && <span className="text-xs font-mono text-slate-500">{t.vulnerability.cveId}</span>}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Due {formatDate(t.dueDate)} · Assignee: {formatAssignee(t.assignedTo)}
                  </p>
                </div>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded whitespace-nowrap">{t.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}

export function LatestAuditLogsCard({
  title,
  subtitle,
  items,
  isLoading,
  error,
}: {
  title: string;
  subtitle?: string;
  items: AuditLogLatestItem[];
  isLoading: boolean;
  error: unknown;
}) {
  return (
    <DashboardCard>
      <CardHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Link to="/audit" className="text-sm text-cyan-700 hover:underline">
            View audit logs →
          </Link>
        }
      />

      {error ? (
        <ErrorBanner message="Unable to load latest audit logs." details={String((error as any)?.message ?? error)} />
      ) : isLoading ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No audit activity yet"
          description="Audit logs populate when actions occur within your tenant."
        />
      ) : (
        <div className="space-y-3">
          {items.map((l) => (
            <div key={l.id} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{l.action}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {l.user ? `${l.user.firstName} ${l.user.lastName}` : 'System'} · {formatDate(l.createdAt)} · IP {l.ipAddress}
                  </p>
                </div>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded whitespace-nowrap">{l.resourceType}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}

