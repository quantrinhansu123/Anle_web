import { Router } from 'express';
import { CustomerController } from './customer.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCustomerSchema, updateCustomerSchema } from './customer.schema';

const router = Router();

// Uncomment to enable authentication as per backend.md
// router.use(authMiddleware);

router.get('/',        CustomerController.list);
router.get('/:id',     CustomerController.getById);
router.post('/',       validate(createCustomerSchema), CustomerController.create);
router.patch('/:id',   validate(updateCustomerSchema), CustomerController.update);
router.delete('/:id',  CustomerController.remove);

export default router;
