import { Router } from 'express';
import { ShippingAgentController } from './shipping-agent.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  createShippingAgentSchema,
  updateShippingAgentSchema,
  createAgentBookingSchema,
} from './shipping-agent.schema';

const router = Router();

// Agent directory
router.get('/', ShippingAgentController.listAgents);
router.get('/:id', ShippingAgentController.getAgentById);
router.post('/', validate(createShippingAgentSchema), ShippingAgentController.createAgent);
router.patch('/:id', validate(updateShippingAgentSchema), ShippingAgentController.updateAgent);
router.delete('/:id', ShippingAgentController.deleteAgent);

// Agent bookings (per shipment)
router.get('/bookings/list', ShippingAgentController.listBookings);
router.post('/bookings', validate(createAgentBookingSchema), ShippingAgentController.createBooking);
router.patch('/bookings/:id/pre-alert', ShippingAgentController.sendPreAlert);
router.patch('/bookings/:id/confirm', ShippingAgentController.confirmBooking);
router.delete('/bookings/:id', ShippingAgentController.deleteBooking);

export default router;
