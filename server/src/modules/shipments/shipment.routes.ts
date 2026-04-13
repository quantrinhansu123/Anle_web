import { Router } from 'express';
import { ShipmentController } from './shipment.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
	createShipmentSchema,
	updateShipmentSchema,
	updateShipmentStatusSchema,
} from './shipment.schema';

const router = Router();

// router.use(authMiddleware);

router.get('/',        ShipmentController.list);
router.get('/next-code', ShipmentController.getNextCode);
router.get('/:id/readiness', ShipmentController.getReadiness);
router.get('/:id',     ShipmentController.getById);
router.post('/',       validate(createShipmentSchema), ShipmentController.create);
router.patch('/:id',   validate(updateShipmentSchema), ShipmentController.update);
router.patch('/:id/status', validate(updateShipmentStatusSchema), ShipmentController.updateStatus);
router.delete('/:id',  ShipmentController.remove);

export default router;
