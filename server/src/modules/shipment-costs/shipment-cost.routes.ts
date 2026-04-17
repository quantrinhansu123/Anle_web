import { Router } from 'express';
import { ShipmentCostController } from './shipment-cost.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  createShipmentCostSchema,
  updateShipmentCostSchema,
} from './shipment-cost.schema';

const router = Router();

router.get('/', ShipmentCostController.list);
router.get('/summary/:shipmentId', ShipmentCostController.getSummary);
router.get('/:id', ShipmentCostController.getById);
router.post('/', validate(createShipmentCostSchema), ShipmentCostController.create);
router.patch('/:id', validate(updateShipmentCostSchema), ShipmentCostController.update);
router.delete('/:id', ShipmentCostController.remove);

export default router;
