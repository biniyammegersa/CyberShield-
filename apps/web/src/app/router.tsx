import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleHomeRedirect } from '@/components/auth/RoleHomeRedirect';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { AdminDashboardPage } from '@/pages/dashboards/AdminDashboardPage';
import { AnalystDashboardPage } from '@/pages/dashboards/AnalystDashboardPage';
import { ExecutiveDashboardPage } from '@/pages/dashboards/ExecutiveDashboardPage';
import { ItAdminDashboardPage } from '@/pages/dashboards/ItAdminDashboardPage';
import { EvidencePage } from '@/pages/EvidencePage';
import { ReportsPage } from '@/pages/ReportsPage';
import { TasksPage } from '@/pages/TasksPage';
import { UsersPage } from '@/pages/UsersPage';
import { OrganizationsPage } from '@/pages/OrganizationsPage';
import { AuditPage } from '@/pages/AuditPage';
import { AssetsPage } from '@/pages/AssetsPage';
import { VulnerabilitiesPage } from '@/pages/VulnerabilitiesPage';
import { RemediationPage } from '@/pages/RemediationPage';
import { RiskPage } from '@/pages/RiskPage';
import { AttackSurfacePage } from '@/pages/AttackSurfacePage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<RoleHomeRedirect />} />

          <Route
            path="/dashboard/admin"
            element={
              <RoleProtectedRoute allowed={['SUPER_ADMIN']}>
                <AdminDashboardPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/dashboard/analyst"
            element={
              <RoleProtectedRoute allowed={['SUPER_ADMIN', 'SECURITY_ANALYST']}>
                <AnalystDashboardPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/dashboard/it"
            element={
              <RoleProtectedRoute allowed={['SUPER_ADMIN', 'IT_ADMINISTRATOR']}>
                <ItAdminDashboardPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/dashboard/executive"
            element={
              <RoleProtectedRoute allowed={['SUPER_ADMIN', 'EXECUTIVE_MANAGER']}>
                <ExecutiveDashboardPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/assets"
            element={
              <RoleProtectedRoute allowed={['SUPER_ADMIN', 'SECURITY_ANALYST', 'IT_ADMINISTRATOR', 'EXECUTIVE_MANAGER']}>
                <AssetsPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/vulnerabilities"
            element={
              <RoleProtectedRoute allowed={['SUPER_ADMIN', 'SECURITY_ANALYST', 'IT_ADMINISTRATOR', 'EXECUTIVE_MANAGER']}>
                <VulnerabilitiesPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/remediation"
            element={
              <RoleProtectedRoute allowed={['SUPER_ADMIN', 'SECURITY_ANALYST', 'IT_ADMINISTRATOR', 'EXECUTIVE_MANAGER']}>
                <RemediationPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/risk"
            element={
              <RoleProtectedRoute allowed={['SUPER_ADMIN', 'SECURITY_ANALYST', 'EXECUTIVE_MANAGER']}>
                <RiskPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/attack-surface"
            element={
              <RoleProtectedRoute allowed={['SUPER_ADMIN', 'SECURITY_ANALYST', 'IT_ADMINISTRATOR']}>
                <AttackSurfacePage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <RoleProtectedRoute allowed={['SUPER_ADMIN', 'SECURITY_ANALYST', 'IT_ADMINISTRATOR']}>
                <UsersPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/organizations"
            element={
              <RoleProtectedRoute allowed={['SUPER_ADMIN']}>
                <OrganizationsPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/audit"
            element={
              <RoleProtectedRoute allowed={['SUPER_ADMIN', 'SECURITY_ANALYST']}>
                <AuditPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/tasks"
            element={
              <RoleProtectedRoute allowed={['SUPER_ADMIN', 'IT_ADMINISTRATOR']}>
                <TasksPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/evidence"
            element={
              <RoleProtectedRoute allowed={['SUPER_ADMIN', 'IT_ADMINISTRATOR']}>
                <EvidencePage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <RoleProtectedRoute allowed={['SUPER_ADMIN', 'EXECUTIVE_MANAGER']}>
                <ReportsPage />
              </RoleProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
