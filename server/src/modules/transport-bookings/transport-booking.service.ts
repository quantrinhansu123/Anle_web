import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type {
  CreateTransportBookingDto,
  TransportBooking,
  TransportBookingStatus,
  UpdateTransportBookingDto,
} from './transport-booking.types';

const isMissingTransportBookingColumnError = (error: unknown, column: string): boolean => {
  const e = error as { code?: string; message?: string } | null;
  const msg = e?.message || '';
  return (
    e?.code === 'PGRST204' ||
    msg.includes(`Could not find the '${column}' column of 'transport_bookings'`) ||
    msg.includes(`Could not find the '${column}' column of 'public.transport_bookings'`)
  );
};

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

    const { data, error } = await supabase.from('transport_bookings').update(dto).eq('id', id).select().single();

    if (error) {
      const hasHistory = Object.prototype.hasOwnProperty.call(dto as any, 'status_history');
      const hasTimeline = Object.prototype.hasOwnProperty.call(dto as any, 'status_timeline');

      const missingHistory = hasHistory && isMissingTransportBookingColumnError(error, 'status_history');
      const missingTimeline = hasTimeline && isMissingTransportBookingColumnError(error, 'status_timeline');

      if (missingHistory || missingTimeline) {
        const retryDto: any = { ...(dto as any) };
        if (missingHistory) delete retryDto.status_history;
        if (missingTimeline) delete retryDto.status_timeline;

        const { data: retryData, error: retryErr } = await supabase
          .from('transport_bookings')
          .update(retryDto)
          .eq('id', id)
          .select()
          .single();

        if (retryErr) throw retryErr;

        throw new AppError(
          `Missing column(s) in PostgREST schema cache (${[
            missingHistory ? 'status_history' : null,
            missingTimeline ? 'status_timeline' : null,
          ]
            .filter(Boolean)
            .join(', ')}). Please apply migrations and reload the PostgREST schema cache.`,
          500,
        );
      }

      throw error;
    }

    await this.syncShipmentTruckBooked(data.shipment_id);
    return data;
  }

  async updateStatus(id: string, status: TransportBookingStatus, userId?: string): Promise<TransportBooking> {
    const current = await this.findById(id);
    if (!current) {
      throw new AppError('Transport booking not found', 404);
    }

    const nowIso = new Date().toISOString();
    const prevTimeline =
      current.status_timeline && typeof current.status_timeline === 'object'
        ? (current.status_timeline as Record<string, string>)
        : {};
    const nextTimeline = { ...prevTimeline, [status]: prevTimeline[status] || nowIso };

    const prevHistory = Array.isArray((current as any).status_history) ? ((current as any).status_history as any[]) : [];
    const nextHistory = [
      ...prevHistory,
      {
        status,
        at: nowIso,
        by: userId || null,
      },
    ];

    return this.update(id, { status, status_timeline: nextTimeline as any, status_history: nextHistory as any });
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
