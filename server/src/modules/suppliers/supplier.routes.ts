import { Router } from 'express';
import { SupplierController } from './supplier.controller';
import { validate } from '@/middlewares/validate.middleware';
import { createSupplierSchema, updateSupplierSchema } from './supplier.schema';

const router = Router();

// router.use(authMiddleware);

router.get('/',        SupplierController.list);
router.get('/:id',     SupplierController.getById);
router.post('/',       validate(createSupplierSchema), SupplierController.create);
router.patch('/:id',   validate(updateSupplierSchema), SupplierController.update);
router.delete('/:id',  SupplierController.remove);

export default router;
