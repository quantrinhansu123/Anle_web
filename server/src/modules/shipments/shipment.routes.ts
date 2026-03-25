import { Router } from 'express';
import { ShipmentController } from './shipment.controller';
import { validate } from '../../middlewares/validate.middleware';
import { createShipmentSchema, updateShipmentSchema } from './shipment.schema';

const router = Router();

// router.use(authMiddleware);

router.get('/',        ShipmentController.list);
router.get('/:id',     ShipmentController.getById);
router.post('/',       validate(createShipmentSchema), ShipmentController.create);
router.patch('/:id',   validate(updateShipmentSchema), ShipmentController.update);
router.delete('/:id',  ShipmentController.remove);

export default router;
