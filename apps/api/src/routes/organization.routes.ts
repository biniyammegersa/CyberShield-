import { Router } from 'express';
import * as orgController from '../controllers/organization.controller';
import { authenticate } from '../middleware/auth';
import { resolveOrganization } from '../middleware/tenant';
import { requirePermission, Permission, requireSuperAdmin } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import {
  createOrgSchema,
  updateOrgSchema,
  addMemberSchema,
  updateMemberRoleSchema,
} from '../validators/organization.validator';

const router = Router();

router.use(authenticate);

router.get('/', orgController.list);
router.post('/', requireSuperAdmin(), validateBody(createOrgSchema), orgController.create);
router.get('/:id', orgController.getOne);
router.patch('/:id', validateBody(updateOrgSchema), orgController.update);
router.get(
  '/:id/members',
  requirePermission(Permission.MANAGE_ORG_MEMBERS),
  orgController.listMembers
);
router.post(
  '/:id/members',
  requirePermission(Permission.MANAGE_ORG_MEMBERS),
  validateBody(addMemberSchema),
  orgController.addMember
);
router.patch(
  '/:id/members/:memberId',
  requirePermission(Permission.MANAGE_ORG_MEMBERS),
  validateBody(updateMemberRoleSchema),
  orgController.updateMember
);
router.delete(
  '/:id/members/:memberId',
  requirePermission(Permission.MANAGE_ORG_MEMBERS),
  orgController.removeMember
);

export default router;
