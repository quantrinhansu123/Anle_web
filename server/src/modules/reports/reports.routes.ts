import { Router } from 'express';
import { reportsController } from './reports.controller';

const router = Router();

router.get('/job-profit-by-performance-date', reportsController.jobProfitByPerformanceDate);

export default router;
