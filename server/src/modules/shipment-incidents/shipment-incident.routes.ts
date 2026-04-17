import { Router } from 'express';
import { ShipmentIncidentController } from './shipment-incident.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  createShipmentIncidentSchema,
  updateShipmentIncidentSchema,
} from './shipment-incident.schema';

const router = Router();

router.get('/', ShipmentIncidentController.listByShipment);
router.get('/:id', ShipmentIncidentController.getById);
router.post('/', validate(createShipmentIncidentSchema), ShipmentIncidentController.create);
router.patch('/:id', validate(updateShipmentIncidentSchema), ShipmentIncidentController.update);
router.delete('/:id', ShipmentIncidentController.remove);

export default router;
