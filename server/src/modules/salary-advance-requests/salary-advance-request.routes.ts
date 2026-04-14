import { Router } from 'express';
import { SalaryAdvanceRequestController } from './salary-advance-request.controller';

const router = Router();
const controller = new SalaryAdvanceRequestController();

router.get('/stats', controller.getStats.bind(controller));
router.get('/', controller.getAll.bind(controller));
router.get('/:id', controller.getOne.bind(controller));
router.post('/', controller.create.bind(controller));
router.patch('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export default router;
