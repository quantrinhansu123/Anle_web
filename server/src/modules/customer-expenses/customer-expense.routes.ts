import { Router } from 'express';
import { CustomerExpenseController } from './customer-expense.controller';

const router = Router();
const controller = new CustomerExpenseController();

router.get('/stats', controller.getStats.bind(controller));
router.get('/', controller.getAll.bind(controller));
router.get('/:id', controller.getOne.bind(controller));
router.post('/', controller.create.bind(controller));
router.patch('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export default router;
