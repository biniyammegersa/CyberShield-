import { Router } from 'express';
import authRoutes from './auth.routes';
import organizationRoutes from './organization.routes';
import userRoutes from './user.routes';
import dashboardRoutes from './dashboard.routes';
import assetRoutes from './asset.routes';
import vulnerabilityRoutes from './vulnerability.routes';
import remediationRoutes from './remediation.routes';
import riskRoutes from './risk.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/assets', assetRoutes);
router.use('/vulnerabilities', vulnerabilityRoutes);
router.use('/remediation', remediationRoutes);
router.use('/risk', riskRoutes);

router.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok', service: 'cybershield-api' } });
});

export default router;
