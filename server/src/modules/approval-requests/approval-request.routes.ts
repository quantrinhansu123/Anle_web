import { Router } from 'express';
import { approvalRequestController } from './approval-request.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/authorize.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', approvalRequestController.getAll);
router.post('/', approvalRequestController.create);
router.post('/:id/approve', authorize('ceo', 'director', 'manager'), approvalRequestController.approve);
router.post('/:id/reject', authorize('ceo', 'director', 'manager'), approvalRequestController.reject);

export default router;
