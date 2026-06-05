export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
export type AssetType =
  | 'SERVER'
  | 'WORKSTATION'
  | 'ROUTER'
  | 'SWITCH'
  | 'FIREWALL'
  | 'DATABASE'
  | 'APPLICATION'
  | 'CLOUD_RESOURCE';
export type Criticality = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RemediationStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'VERIFIED'
  | 'CLOSED';

export const SEVERITY_COLORS: Record<Severity, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-blue-100 text-blue-800',
  INFORMATIONAL: 'bg-slate-100 text-slate-600',
};
