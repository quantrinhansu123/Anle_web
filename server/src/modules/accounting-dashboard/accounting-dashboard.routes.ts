import { Router } from 'express';
import { AccountingDashboardController } from './accounting-dashboard.controller';

const router = Router();
const controller = new AccountingDashboardController();

router.get('/summary', controller.getSummary.bind(controller));

export default router;
