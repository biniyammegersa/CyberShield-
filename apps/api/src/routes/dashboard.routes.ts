import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { resolveOrganization, requireOrganization } from '../middleware/tenant';
import { requirePermission, Permission } from '../middleware/rbac';

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

export default router;
