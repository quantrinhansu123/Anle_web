import { Router } from 'express';
import { purchasingController } from './purchasing.controller';

const router = Router();

router.get('/', purchasingController.getAll);
router.get('/:id', purchasingController.getById);
router.post('/', purchasingController.create);
router.patch('/:id', purchasingController.update);
router.delete('/:id', purchasingController.delete);

export default router;
