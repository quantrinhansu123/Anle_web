import type { Request, Response, NextFunction } from 'express';
import { ShippingAgentService } from './shipping-agent.service';
import { successResponse } from '../../utils/response';

const service = new ShippingAgentService();

export const ShippingAgentController = {
  // Agents
  async listAgents(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.active !== 'false';
      const agents = await service.findAllAgents(activeOnly);
      res.json(successResponse(agents));
    } catch (err) { next(err); }
  },
  async getAgentById(req: Request, res: Response, next: NextFunction) {
    try {
      const agent = await service.findAgentById(req.params.id);
      if (!agent) return res.status(404).json({ message: 'Agent not found' });
      res.json(successResponse(agent));
    } catch (err) { next(err); }
  },
  async createAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const agent = await service.createAgent(req.body);
      res.status(201).json(successResponse(agent, 'Agent created'));
    } catch (err) { next(err); }
  },
  async updateAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const agent = await service.updateAgent(req.params.id, req.body);
      res.json(successResponse(agent, 'Agent updated'));
    } catch (err) { next(err); }
  },
  async deleteAgent(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteAgent(req.params.id);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  // Bookings
  async listBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const shipmentId = req.query.shipmentId as string;
      if (!shipmentId) return res.status(400).json({ message: 'shipmentId is required' });
      const bookings = await service.findBookingsByShipment(shipmentId);
      res.json(successResponse(bookings));
    } catch (err) { next(err); }
  },
  async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await service.createBooking(req.body);
      res.status(201).json(successResponse(booking, 'Agent booking created'));
    } catch (err) { next(err); }
  },
  async sendPreAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await service.sendPreAlert(req.params.id);
      res.json(successResponse(booking, 'Pre-alert sent'));
    } catch (err) { next(err); }
  },
  async confirmBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await service.confirmBooking(req.params.id);
      res.json(successResponse(booking, 'Agent booking confirmed'));
    } catch (err) { next(err); }
  },
  async deleteBooking(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteBooking(req.params.id);
      res.status(204).send();
    } catch (err) { next(err); }
  },
};
