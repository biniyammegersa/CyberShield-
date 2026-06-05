import { Link } from 'react-router-dom';

function Tile({ title, description, to }: { title: string; description: string; to: string }) {
  return (
    <Link
      to={to}
      className="block bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-colors"
    >
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </Link>
  );
}

export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Administration</h2>
        <p className="text-slate-500 text-sm mt-1">Platform governance, org management, and audit visibility</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Tile title="Organizations" description="Create and manage organizations and membership" to="/organizations" />
        <Tile title="Users" description="Manage platform and organization users" to="/users" />
        <Tile title="Audit logs" description="Review security and administrative activity" to="/audit" />
        <Tile title="Security overview" description="Organization posture and exposure metrics" to="/dashboard/analyst" />
        <Tile title="Assets" description="Inspect assets and attack surface" to="/assets" />
        <Tile title="Remediation" description="Monitor remediation flow and throughput" to="/remediation" />
      </div>
    </div>
  );
}

