import React, { useState, useEffect } from 'react';
import {
  Truck, Plus, Trash2, Loader2, ChevronRight, Phone, MapPin, Clock, User
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  transportBookingService,
  type TransportBooking,
  type TransportBookingStatus,
  type VehicleType,
  type CreateTransportBookingDto,
} from '../../../services/transportBookingService';

interface Props {
  shipmentId: string;
}

const STATUS_CONFIG: Record<TransportBookingStatus, { label: string; color: string; step: number }> = {
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-600 border-slate-200', step: 0 },
  confirmed: { label: 'Confirmed', color: 'bg-blue-50 text-blue-600 border-blue-200', step: 1 },
  dispatched: { label: 'Dispatched', color: 'bg-indigo-50 text-indigo-600 border-indigo-200', step: 2 },
  arrived_pickup: { label: 'At Pickup', color: 'bg-amber-50 text-amber-600 border-amber-200', step: 3 },
  in_transit: { label: 'In Transit', color: 'bg-violet-50 text-violet-600 border-violet-200', step: 4 },
  arrived_destination: { label: 'Arrived', color: 'bg-teal-50 text-teal-600 border-teal-200', step: 5 },
  completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', step: 6 },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600 border-red-200', step: -1 },
};

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: 'truck_20ft', label: 'Truck 20ft' },
  { value: 'truck_40ft', label: 'Truck 40ft' },
  { value: 'container', label: 'Container' },
  { value: 'trailer', label: 'Trailer' },
  { value: 'van', label: 'Van' },
  { value: 'other', label: 'Other' },
];

const STATUS_FLOW: TransportBookingStatus[] = [
  'pending', 'confirmed', 'dispatched', 'arrived_pickup', 'in_transit', 'arrived_destination', 'completed'
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);

const formatTime = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
};

const TransportTab: React.FC<Props> = ({ shipmentId }) => {
  const [bookings, setBookings] = useState<TransportBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBooking, setNewBooking] = useState<Partial<CreateTransportBookingDto>>({
    vendor_name: '',
    vehicle_type: 'truck_40ft',
    pickup_location: '',
    delivery_location: '',
    planned_cost: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await transportBookingService.getTransportBookings(shipmentId);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [shipmentId]);

  const handleAdd = async () => {
    if (!newBooking.vendor_name) return;
    try {
      setIsAdding(true);
      const dto: CreateTransportBookingDto = {
        shipment_id: shipmentId,
        vendor_name: newBooking.vendor_name!,
        vendor_phone: newBooking.vendor_phone || null,
        vehicle_type: (newBooking.vehicle_type as VehicleType) || null,
        license_plate: newBooking.license_plate || null,
        driver_name: newBooking.driver_name || null,
        driver_phone: newBooking.driver_phone || null,
        pickup_location: newBooking.pickup_location || null,
        delivery_location: newBooking.delivery_location || null,
        planned_cost: newBooking.planned_cost || 0,
      };
      await transportBookingService.createTransportBooking(dto);
      setNewBooking({ vendor_name: '', vehicle_type: 'truck_40ft', pickup_location: '', delivery_location: '', planned_cost: 0 });
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to add booking:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleAdvanceStatus = async (booking: TransportBooking) => {
    const currentIdx = STATUS_FLOW.indexOf(booking.status);
    if (currentIdx < 0 || currentIdx >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[currentIdx + 1];
    try {
      setSavingId(booking.id);
      await transportBookingService.updateTransportBookingStatus(booking.id, nextStatus);
      fetchData();
    } catch (err) {
      console.error('Failed to advance status:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setSavingId(id);
      await transportBookingService.updateTransportBookingStatus(id, 'cancelled');
      fetchData();
    } catch (err) {
      console.error('Failed to cancel:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setSavingId(id);
      await transportBookingService.deleteTransportBooking(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Transport Bookings ({bookings.length})
        </span>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-[12px] font-bold hover:bg-primary/90 shadow-sm transition-all active:scale-95"
        >
          <Plus size={14} />
          New Booking
        </button>
      </div>

      {/* Booking Cards */}
      {bookings.length === 0 && !showAddForm ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center">
          <Truck size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-[13px] text-slate-400 font-medium">No transport bookings yet</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-3 text-[12px] font-bold text-primary hover:text-primary/80 transition-colors"
          >
            + Create First Booking
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const statusMeta = STATUS_CONFIG[booking.status];
            const currentStep = statusMeta.step;
            const isTerminal = booking.status === 'completed' || booking.status === 'cancelled';

            return (
              <div key={booking.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:border-slate-300 transition-all">
                {/* Status Stepper Mini */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center gap-0.5">
                    {STATUS_FLOW.map((s, idx) => {
                      const filled = currentStep >= idx;
                      return (
                        <React.Fragment key={s}>
                          <div
                            className={clsx(
                              'w-2 h-2 rounded-full transition-all',
                              filled ? 'bg-primary scale-110' : 'bg-slate-200',
                              currentStep === idx && 'ring-2 ring-primary/20 scale-125'
                            )}
                            title={STATUS_CONFIG[s].label}
                          />
                          {idx < STATUS_FLOW.length - 1 && (
                            <div className={clsx('flex-1 h-0.5', filled ? 'bg-primary/60' : 'bg-slate-100')} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Body */}
                <div className="px-4 pb-3">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold border', statusMeta.color)}>
                          {statusMeta.label}
                        </span>
                        {booking.vehicle_type && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {VEHICLE_TYPES.find(v => v.value === booking.vehicle_type)?.label || booking.vehicle_type}
                          </span>
                        )}
                      </div>
                      <p className="text-[14px] font-bold text-slate-800">{booking.vendor_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-black text-primary tabular-nums">{formatCurrency(booking.planned_cost)} <span className="text-[9px]">VND</span></p>
                      {booking.actual_cost != null && (
                        <p className="text-[11px] font-bold text-emerald-600 tabular-nums">Actual: {formatCurrency(booking.actual_cost)}</p>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                    {booking.driver_name && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <User size={10} className="text-slate-400" />
                        <span className="font-medium truncate">{booking.driver_name}</span>
                      </div>
                    )}
                    {booking.driver_phone && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone size={10} className="text-slate-400" />
                        <span className="font-medium">{booking.driver_phone}</span>
                      </div>
                    )}
                    {booking.license_plate && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Truck size={10} className="text-slate-400" />
                        <span className="font-bold text-slate-700">{booking.license_plate}</span>
                      </div>
                    )}
                    {booking.pickup_location && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin size={10} className="text-emerald-400" />
                        <span className="font-medium truncate">{booking.pickup_location}</span>
                      </div>
                    )}
                    {booking.delivery_location && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin size={10} className="text-red-400" />
                        <span className="font-medium truncate">{booking.delivery_location}</span>
                      </div>
                    )}
                    {booking.pickup_time && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock size={10} className="text-slate-400" />
                        <span className="font-medium">{formatTime(booking.pickup_time)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-100">
                    {!isTerminal && (
                      <>
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={savingId === booking.id}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-all disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAdvanceStatus(booking)}
                          disabled={savingId === booking.id}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold text-white bg-primary hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50 active:scale-95"
                        >
                          {savingId === booking.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <>
                              Next: {STATUS_CONFIG[STATUS_FLOW[Math.min(STATUS_FLOW.indexOf(booking.status) + 1, STATUS_FLOW.length - 1)]]?.label}
                              <ChevronRight size={12} />
                            </>
                          )}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(booking.id)}
                      disabled={savingId === booking.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[11px] font-bold text-primary uppercase tracking-wider">New Transport Booking</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Vendor Name *</label>
              <input
                type="text" placeholder="e.g. Hai Dang Logistics"
                value={newBooking.vendor_name || ''}
                onChange={(e) => setNewBooking((p) => ({ ...p, vendor_name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-bold bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Vendor Phone</label>
              <input
                type="text" placeholder="Phone"
                value={newBooking.vendor_phone || ''}
                onChange={(e) => setNewBooking((p) => ({ ...p, vendor_phone: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-medium bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Vehicle Type</label>
              <select
                value={newBooking.vehicle_type || 'truck_40ft'}
                onChange={(e) => setNewBooking((p) => ({ ...p, vehicle_type: e.target.value as VehicleType }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-bold bg-white"
              >
                {VEHICLE_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">License Plate</label>
              <input
                type="text" placeholder="e.g. 51C-12345"
                value={newBooking.license_plate || ''}
                onChange={(e) => setNewBooking((p) => ({ ...p, license_plate: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-bold bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Driver Name</label>
              <input
                type="text" placeholder="Driver name"
                value={newBooking.driver_name || ''}
                onChange={(e) => setNewBooking((p) => ({ ...p, driver_name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-medium bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Driver Phone</label>
              <input
                type="text" placeholder="Driver phone"
                value={newBooking.driver_phone || ''}
                onChange={(e) => setNewBooking((p) => ({ ...p, driver_phone: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-medium bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Pickup Location</label>
              <input
                type="text" placeholder="Origin address"
                value={newBooking.pickup_location || ''}
                onChange={(e) => setNewBooking((p) => ({ ...p, pickup_location: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-medium bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Delivery Location</label>
              <input
                type="text" placeholder="Destination address"
                value={newBooking.delivery_location || ''}
                onChange={(e) => setNewBooking((p) => ({ ...p, delivery_location: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-medium bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Planned Cost (VND)</label>
              <input
                type="number" placeholder="0"
                value={newBooking.planned_cost || ''}
                onChange={(e) => setNewBooking((p) => ({ ...p, planned_cost: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-bold bg-white text-right tabular-nums"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleAdd}
              disabled={isAdding || !newBooking.vendor_name}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-[12px] font-bold hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50 active:scale-95"
            >
              {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create Booking
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportTab;
