import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { PlatformRole } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { resolveOrganization, requireOrganization } from '../middleware/tenant';
import { requirePermission, Permission, requirePlatformRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticate, resolveOrganization, requireOrganization);

router.get('/summary', requirePermission(Permission.VIEW_DASHBOARD), dashboardController.summary);
router.get(
  '/charts/severity',
  requirePermission(Permission.VIEW_DASHBOARD),
  dashboardController.severityChart
);
router.get(
  '/charts/asset-type',
  requirePermission(Permission.VIEW_DASHBOARD),
  dashboardController.assetTypeChart
);
router.get(
  '/charts/risk-trends',
  requirePermission(Permission.VIEW_DASHBOARD),
  dashboardController.riskTrendsChart
);
router.get(
  '/charts/remediation',
  requirePermission(Permission.VIEW_DASHBOARD),
  dashboardController.remediationChart
);

// Role-based dashboard endpoints (tenant-scoped via middleware)
router.get(
  '/roles/admin/summary',
  requirePlatformRoles(PlatformRole.SUPER_ADMIN),
  dashboardController.adminSummary
);
router.get(
  '/roles/admin/latest',
  requirePlatformRoles(PlatformRole.SUPER_ADMIN),
  dashboardController.adminLatest
);

router.get(
  '/roles/analyst/summary',
  requirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.SECURITY_ANALYST),
  dashboardController.analystSummary
);
router.get(
  '/roles/analyst/latest',
  requirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.SECURITY_ANALYST),
  dashboardController.analystLatest
);

router.get(
  '/roles/it/summary',
  requirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.IT_ADMINISTRATOR),
  dashboardController.itAdminSummary
);
router.get(
  '/roles/it/latest',
  requirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.IT_ADMINISTRATOR),
  dashboardController.itAdminLatest
);

router.get(
  '/roles/executive/summary',
  requirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.EXECUTIVE_MANAGER),
  dashboardController.executiveSummary
);
router.get(
  '/roles/executive/latest',
  requirePlatformRoles(PlatformRole.SUPER_ADMIN, PlatformRole.EXECUTIVE_MANAGER),
  dashboardController.executiveLatest
);

export default router;
