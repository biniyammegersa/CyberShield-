import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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
  SeverityBreakdown,
  SkeletonKpiRow,
} from '@/features/dashboard/dashboard-components';
import { LatestRemediationTasksCard, LatestVulnerabilitiesCard } from '@/features/dashboard/LatestItems';
import type { AnalystDashboardSummary } from '@/features/dashboard/api';
import type { Severity } from '@/types/domain';

const SEVERITIES: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'];

export function AnalystDashboardPage() {
  const [severityFilter, setSeverityFilter] = useState<string>('');

  const summary = useQuery({
    queryKey: ['dashboard', 'roles', 'analyst', 'summary'],
    queryFn: () => fetchRoleSummary('analyst'),
    staleTime: 30_000,
    retry: 1,
  });

  const latest = useQuery({
    queryKey: ['dashboard', 'roles', 'analyst', 'latest'],
    queryFn: () => fetchRoleLatest('analyst'),
    staleTime: 30_000,
    retry: 1,
  });

  const d = summary.data as AnalystDashboardSummary | undefined;

  const headerActions = useMemo(
    () => (
      <div className="flex gap-3 flex-wrap">
        <Link to="/vulnerabilities" className="text-sm font-medium px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors">
          Triage Findings
        </Link>
        <Link to="/risk" className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
          Risk Assessment
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
          { label: 'Security Analyst', to: '/dashboard/analyst' },
        ]}
        title="Security Operations Center"
        subtitle="Investigate exposure, assess risk, assign remediation, and verify resolution."
        actions={headerActions}
      />

      {(summary.error || latest.error) && (
        <ErrorBanner message="Some dashboard data failed to load." />
      )}

      {d && d.criticalVulnerabilities > 0 && (
        <AlertStrip
          variant="critical"
          title={`${d.criticalVulnerabilities} critical findings in queue`}
          message="Prioritize triage and assign remediation to IT operations."
          action={{ label: 'Open vulnerabilities', to: '/vulnerabilities' }}
        />
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {summary.isLoading ? (
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonKpiRow key={i} />
            ))}
          </div>
        ) : d ? (
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard label="Open Findings" value={d.openFindings} borderAccent="amber" />
            <KpiCard label="Critical" value={d.criticalVulnerabilities} accentClassName="text-red-600" borderAccent="red" />
            <KpiCard label="Resolved (30d)" value={d.mitigatedLast30d} accentClassName="text-emerald-600" borderAccent="green" />
            <KpiCard label="Total Resolved" value={d.resolvedFindings} borderAccent="green" />
            <KpiCard label="Assets" value={d.totalAssets} borderAccent="slate" />
          </div>
        ) : (
          <div className="lg:col-span-2">
            <EmptyState title="No KPI data" description="Select an organization to begin analysis." />
          </div>
        )}

        {!summary.isLoading && d && (
          <PostureScoreHero score={d.securityPostureScore} subtitle="Current organizational security posture snapshot." />
        )}
      </div>

      {d && d.openBySeverity && d.openBySeverity.length > 0 && (
        <SeverityBreakdown items={d.openBySeverity} />
      )}

      <DashboardCard className="p-4 flex items-center gap-3">
        <p className="text-sm text-slate-600 font-medium">Severity focus</p>
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

      <RoleDashboardCharts role="analyst" />

      <div className="grid lg:grid-cols-2 gap-6">
        <LatestVulnerabilitiesCard
          title="Latest Vulnerabilities"
          subtitle="Most recently updated open findings"
          items={latest.data?.vulnerabilities ?? []}
          isLoading={latest.isLoading}
          error={latest.error}
          severityFilter={severityFilter}
          ctaTo="/vulnerabilities"
        />
        <LatestRemediationTasksCard
          title="Remediation Queue"
          subtitle="Tasks awaiting analysis or verification"
          items={latest.data?.remediationTasks ?? []}
          isLoading={latest.isLoading}
          error={latest.error}
          ctaTo="/remediation"
        />
      </div>
    </div>
  );
}
