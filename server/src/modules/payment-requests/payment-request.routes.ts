import { Router } from 'express';
import { PaymentRequestController } from './payment-request.controller';

const router = Router();
const controller = new PaymentRequestController();

router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
