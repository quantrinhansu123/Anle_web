import { Router } from 'express';
import { ShipmentTrackingController } from './shipment-tracking.controller';
import { validate } from '../../middlewares/validate.middleware';
import { createTrackingEventSchema } from './shipment-tracking.schema';

const router = Router();

router.get('/', ShipmentTrackingController.listByShipment);
router.get('/sla-info', ShipmentTrackingController.getSlaInfo);
router.get('/:id', ShipmentTrackingController.getById);
router.post('/', validate(createTrackingEventSchema), ShipmentTrackingController.create);
router.delete('/:id', ShipmentTrackingController.remove);

export default router;
