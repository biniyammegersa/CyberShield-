import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAppDispatch } from '@/hooks/redux';
import { setCredentials } from '@/features/auth/authSlice';
import { login } from '@/features/auth/api';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'admin@cybershield.local' },
  { label: 'Analyst', email: 'analyst@acme.local' },
  { label: 'IT Admin', email: 'itadmin@acme.local' },
  { label: 'Executive', email: 'executive@acme.local' },
] as const;

const DEMO_PASSWORD = 'CyberShield123!';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (data) => {
      dispatch(setCredentials(data));
      navigate('/dashboard');
    },
    onError: () => setError('Invalid email or password'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    mutation.mutate();
  }

  function fillDemo(accountEmail: string) {
    setEmail(accountEmail);
    setPassword(DEMO_PASSWORD);
    setError('');
  }

  return (
    <div className="h-full overflow-y-auto bg-app-bg flex flex-col">
      <header className="shrink-0 h-10 flex items-center justify-between px-4 border-b border-app-border bg-sidebar">
        <span className="text-xs font-semibold text-sidebar-fg">CyberShield</span>
        <ThemeToggle />
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Brand panel */}
        <div className="lg:w-1/2 bg-sidebar border-b lg:border-b-0 lg:border-r border-sidebar-border px-8 py-12 lg:py-0 flex flex-col justify-center">
          <div className="max-w-md mx-auto lg:mx-0 lg:ml-auto lg:mr-16 w-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
                CS
              </div>
              <div>
                <h1 className="text-xl font-bold text-sidebar-fg tracking-tight">CyberShield</h1>
                <p className="text-xs text-sidebar-muted">Vulnerability & Asset Management</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-sidebar-fg leading-tight">
              Secure your organization&apos;s digital footprint
            </h2>
            <p className="text-sidebar-muted mt-4 text-sm leading-relaxed">
              Enterprise-grade vulnerability tracking, asset inventory, risk assessment, and
              role-based remediation workflows for security teams and leadership.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-sidebar-muted">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                Role-specific dashboards for every stakeholder
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                End-to-end vulnerability lifecycle management
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                Audit trails and compliance-ready reporting
              </li>
            </ul>
          </div>
        </div>

        {/* Form panel */}
        <div className="lg:w-1/2 flex flex-col justify-center px-8 py-12">
          <div className="max-w-sm w-full mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-app-fg">Sign in</h2>
              <p className="text-sm text-sidebar-muted mt-1">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2.5 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-app-fg mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full border border-app-border rounded-lg px-3 py-2.5 text-sm bg-sidebar text-app-fg placeholder:text-sidebar-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-app-fg mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-app-border rounded-lg px-3 py-2.5 text-sm bg-sidebar text-app-fg placeholder:text-sidebar-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {mutation.isPending ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="text-center text-sm text-sidebar-muted mt-6">
              No account?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Create one
              </Link>
            </p>

            <div className="mt-8 pt-6 border-t border-app-border">
              <p className="text-xs font-medium text-sidebar-muted uppercase tracking-wide mb-3">
                Demo accounts
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fillDemo(account.email)}
                    className="text-left text-xs px-3 py-2 rounded-lg border border-app-border text-app-fg hover:bg-sidebar-hover hover:border-primary/30 transition-colors"
                  >
                    {account.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-sidebar-muted mt-2">Password: {DEMO_PASSWORD}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
