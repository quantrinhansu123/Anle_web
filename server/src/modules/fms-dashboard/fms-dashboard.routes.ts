import { Router } from 'express';
import { FmsDashboardController } from './fms-dashboard.controller';

const router = Router();

router.get('/', FmsDashboardController.getDashboard);

export default router;
