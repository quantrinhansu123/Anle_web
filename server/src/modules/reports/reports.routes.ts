import { Router } from 'express';
import { reportsController } from './reports.controller';

const router = Router();

router.get('/job-profit-by-performance-date', reportsController.jobProfitByPerformanceDate);
router.get('/shipment-profit-loss', reportsController.shipmentProfitLoss);

export default router;
