import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { resolveOrganization, requireOrganization } from '../middleware/tenant';
import { requirePermission, Permission } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import {
  createUserSchema,
  updateUserSchema,
  updateStatusSchema,
} from '../validators/user.validator';

const router = Router();

router.use(authenticate, resolveOrganization);

router.get('/audit', requirePermission(Permission.VIEW_AUDIT), userController.auditLogs);

router.use(requireOrganization);
router.get('/', requirePermission(Permission.MANAGE_USERS), userController.list);
router.post('/', requirePermission(Permission.MANAGE_USERS), validateBody(createUserSchema), userController.create);
router.get('/:id', requirePermission(Permission.MANAGE_USERS), userController.getOne);
router.patch('/:id', requirePermission(Permission.MANAGE_USERS), validateBody(updateUserSchema), userController.update);
router.patch(
  '/:id/status',
  requirePermission(Permission.MANAGE_USERS),
  validateBody(updateStatusSchema),
  userController.updateStatus
);
router.delete('/:id', requirePermission(Permission.MANAGE_USERS), userController.remove);

export default router;
