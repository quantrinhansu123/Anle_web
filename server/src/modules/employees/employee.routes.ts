import { Router } from 'express';
import { employeeController } from './employee.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', employeeController.getAll);
router.get('/:id', employeeController.getById);
router.get('/:id/details', employeeController.getDetails);
router.post('/', employeeController.create);
router.patch('/:id', employeeController.update);
router.delete('/:id', employeeController.delete);

export default router;
