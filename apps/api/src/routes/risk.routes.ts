import { Router } from 'express';
import * as riskController from '../controllers/risk.controller';
import { authenticate } from '../middleware/auth';
import { resolveOrganization, requireOrganization } from '../middleware/tenant';
import { requirePermission, canViewRisk, canManageRisk } from '../middleware/rbac';

const router = Router();

router.use(authenticate, resolveOrganization, requireOrganization);

router.get('/posture', requirePermission(...canViewRisk), riskController.posture);
router.get('/matrix', requirePermission(...canViewRisk), riskController.matrix);
router.get('/trends', requirePermission(...canViewRisk), riskController.trends);
router.post('/recalculate', requirePermission(...canManageRisk), riskController.recalculate);

export default router;
