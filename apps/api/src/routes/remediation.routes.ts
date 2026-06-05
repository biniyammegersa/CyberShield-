import { Router } from 'express';
import * as remediationController from '../controllers/remediation.controller';
import { authenticate } from '../middleware/auth';
import { resolveOrganization, requireOrganization } from '../middleware/tenant';
import { requirePermission, canViewRemediation, canManageRemediation } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createCommentSchema,
  listRemediationQuerySchema,
  updateRemediationSchema,
} from '../validators/remediation.validator';

const router = Router();

router.use(authenticate, resolveOrganization, requireOrganization);

router.get(
  '/',
  requirePermission(...canViewRemediation),
  validateQuery(listRemediationQuerySchema),
  remediationController.list
);
router.get('/:id', requirePermission(...canViewRemediation), remediationController.getOne);
router.patch(
  '/:id',
  requirePermission(...canManageRemediation),
  validateBody(updateRemediationSchema),
  remediationController.update
);
router.post(
  '/:id/comments',
  requirePermission(...canManageRemediation),
  validateBody(createCommentSchema),
  remediationController.addComment
);

export default router;
