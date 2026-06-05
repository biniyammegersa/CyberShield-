import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { ExecutiveDashboardSummary, VulnerabilityLatestItem } from '@/features/dashboard/api';
import { fetchRoleLatest, fetchRoleSummary } from '@/features/dashboard/api';
import { RoleDashboardCharts } from '@/features/dashboard/DashboardCharts';
import {
  DashboardCard,
  EmptyState,
  ErrorBanner,
  KpiCard,
  PageHeading,
  PostureScoreHero,
  SkeletonKpiRow,
} from '@/features/dashboard/dashboard-components';
import { LatestRemediationTasksCard, LatestVulnerabilitiesCard } from '@/features/dashboard/LatestItems';
import type { Severity } from '@/types/domain';

const SEVERITIES: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'];

export function ExecutiveDashboardPage() {
  const [severityFilter, setSeverityFilter] = useState<string>('');

  const summary = useQuery({
    queryKey: ['dashboard', 'roles', 'executive', 'summary'],
    queryFn: () => fetchRoleSummary('executive'),
    staleTime: 30_000,
    retry: 1,
  });

  const latest = useQuery({
    queryKey: ['dashboard', 'roles', 'executive', 'latest'],
    queryFn: () => fetchRoleLatest('executive'),
    staleTime: 30_000,
    retry: 1,
  });

  const d = summary.data as ExecutiveDashboardSummary | undefined;
  const deltaPct = d?.riskTrendDelta?.deltaPct ?? 0;
  const deltaSign = deltaPct >= 0 ? '+' : '';

  const headerActions = useMemo(
    () => (
      <Link to="/reports" className="text-sm font-medium px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors">
        Export Reports
      </Link>
    ),
    []
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeading
        breadcrumb={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Executive', to: '/dashboard/executive' },
        ]}
        title="Executive Overview"
        subtitle="Strategic risk posture, compliance signals, and remediation performance at a glance."
        actions={headerActions}
      />

      {(summary.error || latest.error) && (
        <ErrorBanner message="Some dashboard data failed to load." />
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {!summary.isLoading && d && (
          <PostureScoreHero
            score={d.securityPostureScore}
            label="Security Posture"
            subtitle="Board-ready composite score for organizational cyber risk."
          />
        )}

        {summary.isLoading ? (
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonKpiRow key={i} />
            ))}
          </div>
        ) : d ? (
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard label="Critical Open" value={d.criticalVulnerabilities} accentClassName="text-red-600" borderAccent="red" />
            <KpiCard label="Open Findings" value={d.openFindings} borderAccent="amber" />
            <KpiCard label="Resolved (30d)" value={d.resolvedLast30d} accentClassName="text-emerald-600" borderAccent="green" />
            <KpiCard label="Total Assets" value={d.totalAssets} borderAccent="slate" />
            <KpiCard
              label="Posture Δ"
              value={`${deltaSign}${deltaPct.toFixed(1)}%`}
              accentClassName={deltaPct >= 0 ? 'text-emerald-700' : 'text-red-700'}
              borderAccent={deltaPct >= 0 ? 'green' : 'red'}
              hint={d.riskTrendDelta?.to ? `${d.riskTrendDelta.from ?? '—'} → ${d.riskTrendDelta.to}` : undefined}
            />
          </div>
        ) : (
          <div className="lg:col-span-2">
            <EmptyState title="No executive data" description="Select an organization to view leadership metrics." />
          </div>
        )}
      </div>

      <RoleDashboardCharts role="executive" />

      <DashboardCard className="p-4 flex items-center gap-3">
        <p className="text-sm text-slate-600 font-medium">Highlight severity</p>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Critical & High</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </DashboardCard>

      <div className="grid lg:grid-cols-2 gap-6">
        <LatestVulnerabilitiesCard
          title="Critical & High Exposure"
          subtitle="Top items requiring executive awareness"
          items={(latest.data?.vulnerabilities ?? []) as VulnerabilityLatestItem[]}
          isLoading={latest.isLoading}
          error={latest.error}
          severityFilter={severityFilter}
          ctaTo="/vulnerabilities"
        />
        <LatestRemediationTasksCard
          title="Remediation Progress"
          subtitle="Active remediation pipeline"
          items={latest.data?.remediationTasks ?? []}
          isLoading={latest.isLoading}
          error={latest.error}
          ctaTo="/remediation"
        />
      </div>
    </div>
  );
}
