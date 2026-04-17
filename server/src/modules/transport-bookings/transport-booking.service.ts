import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type {
  CreateTransportBookingDto,
  TransportBooking,
  TransportBookingStatus,
  UpdateTransportBookingDto,
} from './transport-booking.types';

const STATUS_TRANSITIONS: Record<TransportBookingStatus, TransportBookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['dispatched', 'cancelled'],
  dispatched: ['arrived_pickup', 'cancelled'],
  arrived_pickup: ['in_transit', 'cancelled'],
  in_transit: ['arrived_destination', 'cancelled'],
  arrived_destination: ['completed'],
  completed: [],
  cancelled: [],
};

export class TransportBookingService {
  private assertCanTransition(current: TransportBookingStatus, next: TransportBookingStatus) {
    if (current === next) return;
    const allowed = STATUS_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new AppError(
        `Invalid transport booking status transition: ${current} -> ${next}`,
        400,
      );
    }
  }

  /**
   * Sync the shipment's is_truck_booked flag based on whether
   * at least one booking has status = 'confirmed' or later.
   */
  private async syncShipmentTruckBooked(shipmentId: string): Promise<void> {
    const confirmedStatuses = [
      'confirmed',
      'dispatched',
      'arrived_pickup',
      'in_transit',
      'arrived_destination',
      'completed',
    ];

    const { data, error } = await supabase
      .from('transport_bookings')
      .select('status')
      .eq('shipment_id', shipmentId);

    if (error) throw error;

    const rows = data ?? [];
    const isTruckBooked = rows.some((row) => confirmedStatuses.includes(row.status));

    const { error: updateError } = await supabase
      .from('shipments')
      .update({ is_truck_booked: isTruckBooked })
      .eq('id', shipmentId);

    if (updateError) throw updateError;
  }

  async findAll(
    page = 1,
    limit = 50,
    shipmentId?: string,
  ): Promise<{ data: TransportBooking[]; count: number }> {
    const from = (page - 1) * limit;
    let query = supabase
      .from('transport_bookings')
      .select('*', { count: 'exact' })
      .range(from, from + limit - 1)
      .order('created_at', { ascending: true });

    if (shipmentId) {
      query = query.eq('shipment_id', shipmentId);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  async findById(id: string): Promise<TransportBooking | null> {
    const { data, error } = await supabase
      .from('transport_bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(dto: CreateTransportBookingDto): Promise<TransportBooking> {
    const payload: CreateTransportBookingDto = {
      ...dto,
      status: dto.status ?? 'pending',
      planned_cost: dto.planned_cost ?? 0,
    };

    const { data, error } = await supabase
      .from('transport_bookings')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    await this.syncShipmentTruckBooked(payload.shipment_id);
    return data;
  }

  async update(id: string, dto: UpdateTransportBookingDto): Promise<TransportBooking> {
    const current = await this.findById(id);
    if (!current) {
      throw new AppError('Transport booking not found', 404);
    }

    if (dto.status && dto.status !== current.status) {
      this.assertCanTransition(current.status, dto.status);
    }

    const { data, error } = await supabase
      .from('transport_bookings')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.syncShipmentTruckBooked(data.shipment_id);
    return data;
  }

  async updateStatus(id: string, status: TransportBookingStatus): Promise<TransportBooking> {
    return this.update(id, { status });
  }

  async delete(id: string): Promise<void> {
    const { data: current, error: currentError } = await supabase
      .from('transport_bookings')
      .select('shipment_id')
      .eq('id', id)
      .single();

    if (currentError) throw currentError;

    const { error } = await supabase
      .from('transport_bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.syncShipmentTruckBooked(current.shipment_id);
  }
}
