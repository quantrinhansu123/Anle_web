import { Router } from 'express';
import { TransportBookingController } from './transport-booking.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  createTransportBookingSchema,
  updateTransportBookingSchema,
  updateTransportBookingStatusSchema,
} from './transport-booking.schema';

const router = Router();

router.get('/', TransportBookingController.list);
router.get('/:id', TransportBookingController.getById);
router.post('/', validate(createTransportBookingSchema), TransportBookingController.create);
router.patch('/:id', validate(updateTransportBookingSchema), TransportBookingController.update);
router.patch('/:id/status', validate(updateTransportBookingStatusSchema), TransportBookingController.updateStatus);
router.delete('/:id', TransportBookingController.remove);

export default router;
