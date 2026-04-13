import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { CustomsClearanceController } from './customs-clearance.controller';
import {
  createCustomsClearanceSchema,
  updateCustomsClearanceSchema,
} from './customs-clearance.schema';

const router = Router();

router.get('/', CustomsClearanceController.list);
router.get('/:id', CustomsClearanceController.getById);
router.post('/', validate(createCustomsClearanceSchema), CustomsClearanceController.create);
router.patch('/:id', validate(updateCustomsClearanceSchema), CustomsClearanceController.update);
router.delete('/:id', CustomsClearanceController.remove);

export default router;
