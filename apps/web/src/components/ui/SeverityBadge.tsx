import type { Severity } from '@/types/domain';
import { SEVERITY_COLORS } from '@/types/domain';

export function SeverityBadge({ severity }: { severity: Severity | string }) {
  const cls = SEVERITY_COLORS[severity as Severity] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {severity}
    </span>
  );
}
