import { Router } from 'express';
import { BusinessDashboardController } from './business-dashboard.controller';

const router = Router();

router.get('/', BusinessDashboardController.getDashboard);

export default router;
