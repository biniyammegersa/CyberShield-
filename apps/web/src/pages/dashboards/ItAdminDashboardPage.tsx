import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { ItAdminDashboardSummary, RemediationTaskLatestItem, VulnerabilityLatestItem } from '@/features/dashboard/api';
import { fetchRoleLatest, fetchRoleSummary } from '@/features/dashboard/api';
import { RoleDashboardCharts } from '@/features/dashboard/DashboardCharts';
import {
  AlertStrip,
  DashboardCard,
  EmptyState,
  ErrorBanner,
  KpiCard,
  PageHeading,
  SkeletonKpiRow,
} from '@/features/dashboard/dashboard-components';
import { LatestRemediationTasksCard, LatestVulnerabilitiesCard } from '@/features/dashboard/LatestItems';
import type { RemediationStatus, Severity } from '@/types/domain';

const SEVERITIES: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'];

export function ItAdminDashboardPage() {
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const summary = useQuery({
    queryKey: ['dashboard', 'roles', 'it', 'summary'],
    queryFn: () => fetchRoleSummary('it'),
    staleTime: 30_000,
    retry: 1,
  });

  const latest = useQuery({
    queryKey: ['dashboard', 'roles', 'it', 'latest'],
    queryFn: () => fetchRoleLatest('it'),
    staleTime: 30_000,
    retry: 1,
  });

  const d = summary.data as ItAdminDashboardSummary | undefined;

  const headerActions = useMemo(
    () => (
      <div className="flex gap-3 flex-wrap">
        <Link to="/tasks" className="text-sm font-medium px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors">
          My Tasks
        </Link>
        <Link to="/evidence" className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
          Upload Evidence
        </Link>
      </div>
    ),
    []
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeading
        breadcrumb={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'IT Operations', to: '/dashboard/it' },
        ]}
        title="IT Operations Center"
        subtitle="Execute remediation, maintain assets, and submit evidence for verification."
        actions={headerActions}
      />

      {(summary.error || latest.error) && (
        <ErrorBanner message="Some dashboard data failed to load." />
      )}

      {d && d.overdueRemediation > 0 && (
        <AlertStrip
          variant="critical"
          title={`${d.overdueRemediation} overdue remediation ${d.overdueRemediation === 1 ? 'task' : 'tasks'}`}
          message="Overdue items may escalate to security leadership. Prioritize immediate action."
          action={{ label: 'Open queue', to: '/remediation' }}
        />
      )}

      {d && d.dueSoonRemediation > 0 && d.overdueRemediation === 0 && (
        <AlertStrip
          variant="warning"
          title={`${d.dueSoonRemediation} tasks due within 30 days`}
          message="Plan remediation work before deadlines pass."
          action={{ label: 'View tasks', to: '/tasks' }}
        />
      )}

      {summary.isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonKpiRow key={i} />
          ))}
        </div>
      ) : d ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Assigned Queue" value={d.remediationQueue} borderAccent="cyan" />
          <KpiCard
            label="Overdue"
            value={d.overdueRemediation}
            accentClassName={d.overdueRemediation > 0 ? 'text-red-600' : undefined}
            borderAccent="red"
          />
          <KpiCard label="Active Assets" value={d.activeAssets} borderAccent="slate" />
          <KpiCard
            label="Posture Score"
            value={`${Math.round(d.securityPostureScore)}/100`}
            accentClassName="text-cyan-600"
            borderAccent="cyan"
          />
        </div>
      ) : (
        <EmptyState title="No KPI data" description="Select an organization to view operational metrics." />
      )}

      <div className="flex flex-wrap gap-4">
        <DashboardCard className="p-4 flex items-center gap-3">
          <p className="text-sm text-slate-600 font-medium">Status</p>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">All statuses</option>
            {(['OPEN', 'ASSIGNED', 'IN_PROGRESS'] as RemediationStatus[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </DashboardCard>
        <DashboardCard className="p-4 flex items-center gap-3">
          <p className="text-sm text-slate-600 font-medium">Severity</p>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">All severities</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </DashboardCard>
      </div>

      <RoleDashboardCharts role="it" />

      <div className="grid lg:grid-cols-2 gap-6">
        <LatestRemediationTasksCard
          title="Operational Remediation"
          subtitle="Sorted by due date — soonest first"
          items={(latest.data?.remediationTasks ?? []) as RemediationTaskLatestItem[]}
          isLoading={latest.isLoading}
          error={latest.error}
          statusFilter={statusFilter}
          ctaTo="/remediation"
        />
        <LatestVulnerabilitiesCard
          title="Related Findings"
          subtitle="Open vulnerabilities in your operational context"
          items={(latest.data?.vulnerabilities ?? []) as VulnerabilityLatestItem[]}
          isLoading={latest.isLoading}
          error={latest.error}
          severityFilter={severityFilter}
          ctaTo="/vulnerabilities"
        />
      </div>
    </div>
  );
}
