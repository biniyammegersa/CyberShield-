import { Router } from 'express';
import * as assetController from '../controllers/asset.controller';
import { authenticate } from '../middleware/auth';
import { resolveOrganization, requireOrganization } from '../middleware/tenant';
import { requirePermission, canViewAssets, canManageAssets } from '../middleware/rbac';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createAssetSchema,
  createServiceSchema,
  listAssetsQuerySchema,
  updateAssetSchema,
} from '../validators/asset.validator';

const router = Router();

router.use(authenticate, resolveOrganization, requireOrganization);

router.get('/attack-surface', requirePermission(...canViewAssets), assetController.attackSurface);
router.get('/', requirePermission(...canViewAssets), validateQuery(listAssetsQuerySchema), assetController.list);
router.post('/', requirePermission(...canManageAssets), validateBody(createAssetSchema), assetController.create);
router.get('/:id', requirePermission(...canViewAssets), assetController.getOne);
router.patch('/:id', requirePermission(...canManageAssets), validateBody(updateAssetSchema), assetController.update);
router.delete('/:id', requirePermission(...canManageAssets), assetController.remove);
router.get('/:id/vulnerabilities', requirePermission(...canViewAssets), assetController.vulnerabilities);
router.post(
  '/:id/services',
  requirePermission(...canManageAssets),
  validateBody(createServiceSchema),
  assetController.addService
);

export default router;
