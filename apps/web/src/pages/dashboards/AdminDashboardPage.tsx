import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { AdminDashboardSummary, VulnerabilityLatestItem } from '@/features/dashboard/api';
import { fetchRoleLatest, fetchRoleSummary } from '@/features/dashboard/api';
import { RoleDashboardCharts } from '@/features/dashboard/DashboardCharts';
import {
  AlertStrip,
  DashboardCard,
  EmptyState,
  ErrorBanner,
  KpiCard,
  PageHeading,
  PostureScoreHero,
  SkeletonKpiRow,
} from '@/features/dashboard/dashboard-components';
import { LatestAuditLogsCard, LatestRemediationTasksCard, LatestVulnerabilitiesCard } from '@/features/dashboard/LatestItems';
import type { Severity } from '@/types/domain';

const SEVERITIES: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'];

export function AdminDashboardPage() {
  const [severityFilter, setSeverityFilter] = useState<string>('');

  const summary = useQuery({
    queryKey: ['dashboard', 'roles', 'admin', 'summary'],
    queryFn: () => fetchRoleSummary('admin'),
    staleTime: 30_000,
    retry: 1,
  });

  const latest = useQuery({
    queryKey: ['dashboard', 'roles', 'admin', 'latest'],
    queryFn: () => fetchRoleLatest('admin'),
    staleTime: 30_000,
    retry: 1,
  });

  const d = summary.data as AdminDashboardSummary | undefined;

  const headerActions = useMemo(
    () => (
      <div className="flex gap-3 flex-wrap">
        <Link to="/organizations" className="text-sm font-medium px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors">
          Manage Orgs
        </Link>
        <Link to="/users" className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
          Users
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
          { label: 'Admin', to: '/dashboard/admin' },
        ]}
        title="Platform Governance"
        subtitle="Oversee tenant security posture, user access, and operational health across the organization."
        actions={headerActions}
      />

      {(summary.error || latest.error) && (
        <ErrorBanner
          message="Some dashboard data failed to load."
          details={String((summary.error as Error)?.message ?? (latest.error as Error)?.message ?? '')}
        />
      )}

      {d && d.criticalVulnerabilities > 0 && (
        <AlertStrip
          variant="critical"
          title={`${d.criticalVulnerabilities} critical ${d.criticalVulnerabilities === 1 ? 'finding' : 'findings'} require attention`}
          message="Review open critical vulnerabilities and ensure remediation tasks are assigned."
          action={{ label: 'View vulnerabilities', to: '/vulnerabilities' }}
        />
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {summary.isLoading ? (
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonKpiRow key={i} />
            ))}
          </div>
        ) : d ? (
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard label="Org Members" value={d.orgMembers} borderAccent="cyan" />
            <KpiCard label="Total Assets" value={d.totalAssets} borderAccent="slate" />
            <KpiCard label="Vulnerabilities" value={d.totalVulnerabilities} borderAccent="slate" />
            <KpiCard label="Open Findings" value={d.openFindings} borderAccent="amber" />
            <KpiCard label="Critical" value={d.criticalVulnerabilities} accentClassName="text-red-600" borderAccent="red" />
            <KpiCard label="Resolved" value={d.resolvedFindings} accentClassName="text-emerald-600" borderAccent="green" />
          </div>
        ) : (
          <div className="lg:col-span-2">
            <EmptyState title="No KPI data" description="Select an organization to view governance metrics." />
          </div>
        )}

        {!summary.isLoading && d && (
          <PostureScoreHero
            score={d.securityPostureScore}
            subtitle="Composite score derived from open findings, critical exposure, and remediation progress."
          />
        )}
      </div>

      <DashboardCard className="p-4 flex items-center gap-3">
        <p className="text-sm text-slate-600 font-medium whitespace-nowrap">Severity filter</p>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        >
          <option value="">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </DashboardCard>

      <RoleDashboardCharts role="admin" />

      <div className="grid lg:grid-cols-2 gap-6">
        <LatestVulnerabilitiesCard
          title="Latest Exposure"
          subtitle="Most recently updated open vulnerabilities"
          items={(latest.data?.vulnerabilities ?? []) as VulnerabilityLatestItem[]}
          isLoading={latest.isLoading}
          error={latest.error}
          severityFilter={severityFilter}
          ctaTo="/vulnerabilities"
        />
        <LatestRemediationTasksCard
          title="Remediation Queue"
          subtitle="Soonest due items across the tenant"
          items={latest.data?.remediationTasks ?? []}
          isLoading={latest.isLoading}
          error={latest.error}
          ctaTo="/remediation"
        />
      </div>

      <LatestAuditLogsCard
        title="Recent Audit Activity"
        subtitle="Administrative and security-relevant events"
        items={latest.data?.auditLogs ?? []}
        isLoading={latest.isLoading}
        error={latest.error}
      />
    </div>
  );
}
