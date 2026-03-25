import { Router } from 'express';
import { salesController } from './sales.controller';

const router = Router();

router.get('/', salesController.getAll);
router.get('/:id', salesController.getById);
router.post('/', salesController.create);
router.patch('/:id', salesController.update);
router.delete('/:id', salesController.delete);

export default router;
