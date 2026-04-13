import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { ShipmentDocumentController } from './shipment-document.controller';
import {
  createShipmentDocumentSchema,
  updateShipmentDocumentSchema,
} from './shipment-document.schema';

const router = Router();

router.get('/', ShipmentDocumentController.list);
router.get('/:id', ShipmentDocumentController.getById);
router.post('/', validate(createShipmentDocumentSchema), ShipmentDocumentController.create);
router.patch('/:id', validate(updateShipmentDocumentSchema), ShipmentDocumentController.update);
router.delete('/:id', ShipmentDocumentController.remove);

export default router;
