import React, { useState, useEffect } from 'react';
import {
  Truck, Plus, Trash2, Loader2, ChevronRight, Phone, MapPin, Clock, User,
  Ship, Save, ChevronUp, ChevronDown, Upload
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  transportBookingService,
  type TransportBooking,
  type TransportBookingStatus,
  type VehicleType,
  type CreateTransportBookingDto,
} from '../../../services/transportBookingService';
import { useToastContext } from '../../../contexts/ToastContext';
import { shipmentService } from '../../../services/shipmentService';
import { employeeService } from '../../../services/employeeService';
import { apiFetch } from '../../../lib/api';
import { DateInput } from '../../../components/ui/DateInput';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import type { 
  Shipment, 
  JobSeaTabFields, 
  SeaTabTablesState, 
  TruckingTabState,
  SeaBookingRow,
  SeaAttachmentRow,
  SeaContainerVolumeRow,
  SeaCargoRow,
  TruckingTruckRow,
  TruckingQuotationRow,
  TruckingBillingLineRow
} from '../types';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">{children}</label>;
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="shrink-0 border-b border-border bg-slate-50/80 px-4 py-3">
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">{title}</h2>
      </div>
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </div>
  );
}

const textInputClass = () => 'w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-colors';
const cell = 'w-full rounded border border-transparent bg-transparent px-1 py-1 text-[11px] font-medium hover:border-border hover:bg-white focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20';

const emptyJobSeaTabFields = (): JobSeaTabFields => ({
  freight_term: '', load_type: '', service_terms: '', incoterm: '', shipper: '', consignee: '', delivery_agent: '', vendor: '', co_loader: '', sea_internal_remark: '', sea_carrier: '', first_vessel: '', mvvd: '', por: '', pol: '', ts: '', pod: '', pvt: '', warehouse: '', liner_booking_no: '', voy_1: '', voy_2: '', etd: '', eta: '', si_close_at: '', cargo_close_at: '', atd: '', ata: ''
});

const emptySeaBookingRow = (): SeaBookingRow => ({ booking: '', type: '', shipper: '', consignee: '', package: '', num: '', gross: '', measure: '' });
const emptySeaAttachmentRow = (): SeaAttachmentRow => ({ label: '', file_name: '', file_url: '' });
const emptySeaContainerVolumeRow = (): SeaContainerVolumeRow => ({ type: '', size: '', total_quantity: '' });
const emptySeaCargoRow = (): SeaCargoRow => ({ type_of_commodities: '', commodity: '', size: '', type: '', quantity: '', soc: '', package_qty: '', package_type: '', total: '' });

const emptySeaTabTables = (): SeaTabTablesState => ({
  booking_confirmations: [emptySeaBookingRow()],
  sea_attachments: [emptySeaAttachmentRow()],
  container_volumes: [emptySeaContainerVolumeRow()],
  cargo_information: [emptySeaCargoRow()]
});

const jobSeaTabFromJson = (data: any): JobSeaTabFields => ({ ...emptyJobSeaTabFields(), ...(data || {}) });
const parseSeaTables = (data: any): SeaTabTablesState => ({
  booking_confirmations: data?.booking_confirmations?.length ? data.booking_confirmations : [emptySeaBookingRow()],
  sea_attachments: data?.sea_attachments?.length ? data.sea_attachments : [emptySeaAttachmentRow()],
  container_volumes: data?.container_volumes?.length ? data.container_volumes : [emptySeaContainerVolumeRow()],
  cargo_information: data?.cargo_information?.length ? data.cargo_information : [emptySeaCargoRow()]
});
const mergeSeaPersisted = (fields: JobSeaTabFields, tables: SeaTabTablesState) => ({ ...fields, ...tables });

const emptyTruckingTruckRow = (): TruckingTruckRow => ({ house_bl: '', pol: '', pod: '', plate_number: '', customs_declaration: '', salesman: '', load_type: '', service_terms: '', bound: '', incoterm: '', transport_mode: '', area: '', partner: '' });
const emptyTruckingQuotationRow = (): TruckingQuotationRow => ({ quotation: '', customer: '', status: '' });
const emptyTruckingBillingLineRow = (): TruckingBillingLineRow => ({ customer: '', service: '', truck: '', fare: '', fare_name: '', tax: '', fare_type: '', currency: '', exchange_rate: '', unit: '', qty: '', rate: '' });

const emptyTruckingTabState = (): TruckingTabState => ({
  trucks: [emptyTruckingTruckRow()],
  quotations: [emptyTruckingQuotationRow()],
  billing_lines: [emptyTruckingBillingLineRow()],
  exchange_date: '',
  exchange_rate: ''
});

const parseTruckingTab = (data: any): TruckingTabState => ({
  ...emptyTruckingTabState(),
  ...(data || {}),
  trucks: data?.trucks?.length ? data.trucks : [emptyTruckingTruckRow()],
  quotations: data?.quotations?.length ? data.quotations : [emptyTruckingQuotationRow()],
  billing_lines: data?.billing_lines?.length ? data.billing_lines : [emptyTruckingBillingLineRow()]
});
const mergeTruckingPersisted = (trucking: TruckingTabState) => trucking;

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
  const { success, error: toastError } = useToastContext();
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

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
  const [sea, setSea] = useState<JobSeaTabFields>(emptyJobSeaTabFields());
  const [seaTables, setSeaTables] = useState<SeaTabTablesState>(emptySeaTabTables());
  const [trucking, setTrucking] = useState<TruckingTabState>(emptyTruckingTabState());
  const [productPicId, setProductPicId] = useState<string>('');
  const [isSeaExpanded, setIsSeaExpanded] = useState(false);
  const [isTruckingExpanded, setIsTruckingExpanded] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [uploadingAttachmentIdx, setUploadingAttachmentIdx] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsData, shipmentData, employeesData] = await Promise.all([
        transportBookingService.getTransportBookings(shipmentId),
        shipmentService.getShipmentById(shipmentId),
        employeeService.getEmployees()
      ]);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setShipment(shipmentData);
      setEmployees((employeesData || []).map(e => ({ value: e.id, label: e.full_name })));
      
      if (shipmentData?.service_details) {
        setSea(jobSeaTabFromJson(shipmentData.service_details.sea));
        setSeaTables(parseSeaTables(shipmentData.service_details.sea));
        setTrucking(parseTruckingTab(shipmentData.service_details.trucking));
      }
      if (shipmentData?.product_pic_id) {
        setProductPicId(shipmentData.product_pic_id);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [shipmentId]);

  const handleSaveDetails = async () => {
    if (!shipment) return;
    try {
      setIsSavingDetails(true);
      const updatedServiceDetails = {
        ...(shipment.service_details || {}),
        sea: mergeSeaPersisted(sea, seaTables) as unknown as Record<string, unknown>,
        trucking: mergeTruckingPersisted(trucking) as unknown as Record<string, unknown>,
      };
      await shipmentService.updateShipment(shipmentId, {
        service_details: updatedServiceDetails,
        product_pic_id: productPicId || null,
      });
      success('Transport details saved successfully');
      fetchData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to save transport details');
    } finally {
      setIsSavingDetails(false);
    }
  };

  const setSeaField = <K extends keyof JobSeaTabFields>(key: K, value: string) => {
    setSea((prev) => ({ ...prev, [key]: value }));
  };

  const handleAttachmentFile = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setUploadingAttachmentIdx(index);
      const formData = new FormData();
      formData.append('file', file);
      const data = await apiFetch<{ url: string }>('/upload', {
        method: 'POST',
        body: formData,
      });
      setSeaTables((t) => ({
        ...t,
        sea_attachments: t.sea_attachments.map((r, j) =>
          j === index ? { ...r, file_name: file.name, file_url: data.url } : r,
        ),
      }));
      success('File uploaded');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toastError(msg);
    } finally {
      setUploadingAttachmentIdx(null);
    }
  };

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

      {/* Sea Details Section */}
      <div className="mt-8 border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setIsSeaExpanded(!isSeaExpanded)}>
          <div className="flex items-center gap-2">
            <Ship size={18} className="text-primary" />
            <h3 className="text-[14px] font-bold text-slate-800">Sea Details</h3>
          </div>
          <div className="flex items-center gap-3">
            {isSeaExpanded && (
              <button
                onClick={(e) => { e.stopPropagation(); handleSaveDetails(); }}
                disabled={isSavingDetails}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-[12px] font-bold hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50"
              >
                {isSavingDetails ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Details
              </button>
            )}
            {isSeaExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </div>
        </div>

        {isSeaExpanded && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <FieldLabel>Freight Term</FieldLabel>
                <input value={sea.freight_term} onChange={(e) => setSeaField('freight_term', e.target.value)} className={textInputClass()} />
              </div>
              <div>
                <FieldLabel>Load Type</FieldLabel>
                <input value={sea.load_type} onChange={(e) => setSeaField('load_type', e.target.value)} className={textInputClass()} />
              </div>
              <div>
                <FieldLabel>Service Terms</FieldLabel>
                <input value={sea.service_terms} onChange={(e) => setSeaField('service_terms', e.target.value)} className={textInputClass()} />
              </div>
              <div>
                <FieldLabel>Incoterm</FieldLabel>
                <input value={sea.incoterm} onChange={(e) => setSeaField('incoterm', e.target.value)} className={textInputClass()} />
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-4">
              <div className="min-h-0 min-w-0 xl:col-span-2">
                <CardSection title="Party Information">
                  <div className="space-y-3">
                    <div>
                      <FieldLabel>Shipper</FieldLabel>
                      <textarea value={sea.shipper} onChange={(e) => setSeaField('shipper', e.target.value)} rows={2} className={`${textInputClass()} resize-y`} />
                    </div>
                    <div>
                      <FieldLabel>Consignee</FieldLabel>
                      <textarea value={sea.consignee} onChange={(e) => setSeaField('consignee', e.target.value)} rows={2} className={`${textInputClass()} resize-y`} />
                    </div>
                    <div>
                      <FieldLabel>Delivery Agent</FieldLabel>
                      <textarea value={sea.delivery_agent} onChange={(e) => setSeaField('delivery_agent', e.target.value)} rows={2} className={`${textInputClass()} resize-y`} />
                    </div>
                    <div>
                      <FieldLabel>Vendor</FieldLabel>
                      <textarea value={sea.vendor} onChange={(e) => setSeaField('vendor', e.target.value)} rows={2} className={`${textInputClass()} resize-y`} />
                    </div>
                    <div>
                      <FieldLabel>Co-loader</FieldLabel>
                      <textarea value={sea.co_loader} onChange={(e) => setSeaField('co_loader', e.target.value)} rows={2} className={`${textInputClass()} resize-y`} />
                    </div>
                  </div>
                </CardSection>
              </div>

              <div className="min-h-0 min-w-0 xl:col-span-2">
                <CardSection title="Internal Information">
                  <div className="space-y-3">
                    <div>
                      <FieldLabel>Product PIC</FieldLabel>
                      <SearchableSelect
                        options={employees}
                        value={productPicId || undefined}
                        onValueChange={setProductPicId}
                        placeholder="Select"
                      />
                    </div>
                    <div>
                      <FieldLabel>Remark</FieldLabel>
                      <textarea value={sea.sea_internal_remark} onChange={(e) => setSeaField('sea_internal_remark', e.target.value)} rows={4} className={`${textInputClass()} resize-y`} />
                    </div>
                  </div>
                </CardSection>
              </div>
            </div>

            <div className="min-w-0 w-full">
              <CardSection title="Shipping Information">
                <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-3">
                    <div><FieldLabel>Carrier</FieldLabel><input value={sea.sea_carrier} onChange={(e) => setSeaField('sea_carrier', e.target.value)} className={textInputClass()} /></div>
                    <div><FieldLabel>First Vessel</FieldLabel><input value={sea.first_vessel} onChange={(e) => setSeaField('first_vessel', e.target.value)} className={textInputClass()} /></div>
                    <div><FieldLabel>M.VVD</FieldLabel><input value={sea.mvvd} onChange={(e) => setSeaField('mvvd', e.target.value)} className={textInputClass()} /></div>
                    <div><FieldLabel>POR</FieldLabel><input value={sea.por} onChange={(e) => setSeaField('por', e.target.value)} className={textInputClass()} /></div>
                    <div><FieldLabel>POL</FieldLabel><input value={sea.pol} onChange={(e) => setSeaField('pol', e.target.value)} className={textInputClass()} /></div>
                    <div><FieldLabel>T/S</FieldLabel><input value={sea.ts} onChange={(e) => setSeaField('ts', e.target.value)} className={textInputClass()} /></div>
                    <div><FieldLabel>POD</FieldLabel><input value={sea.pod} onChange={(e) => setSeaField('pod', e.target.value)} className={textInputClass()} /></div>
                    <div><FieldLabel>PVT</FieldLabel><input value={sea.pvt} onChange={(e) => setSeaField('pvt', e.target.value)} className={textInputClass()} /></div>
                    <div><FieldLabel>Warehouse</FieldLabel><input value={sea.warehouse} onChange={(e) => setSeaField('warehouse', e.target.value)} className={textInputClass()} /></div>
                  </div>
                  <div className="space-y-3">
                    <div><FieldLabel>Liner Booking No.</FieldLabel><input value={sea.liner_booking_no} onChange={(e) => setSeaField('liner_booking_no', e.target.value)} className={textInputClass()} /></div>
                    <div><FieldLabel>Voy</FieldLabel><input value={sea.voy_1} onChange={(e) => setSeaField('voy_1', e.target.value)} className={textInputClass()} /></div>
                    <div><FieldLabel>Voy 2</FieldLabel><input value={sea.voy_2} onChange={(e) => setSeaField('voy_2', e.target.value)} className={textInputClass()} /></div>
                  </div>
                  <div className="space-y-3">
                    <div><FieldLabel>ETD</FieldLabel><DateInput value={sea.etd} onChange={(v) => setSeaField('etd', v)} className="w-full" /></div>
                    <div><FieldLabel>ETA</FieldLabel><DateInput value={sea.eta} onChange={(v) => setSeaField('eta', v)} className="w-full" /></div>
                    <div><FieldLabel>S/I Close at</FieldLabel><DateInput value={sea.si_close_at} onChange={(v) => setSeaField('si_close_at', v)} className="w-full" /></div>
                    <div><FieldLabel>Cargo close at</FieldLabel><DateInput value={sea.cargo_close_at} onChange={(v) => setSeaField('cargo_close_at', v)} className="w-full" /></div>
                  </div>
                  <div className="space-y-3">
                    <div><FieldLabel>ATD</FieldLabel><DateInput value={sea.atd} onChange={(v) => setSeaField('atd', v)} className="w-full" /></div>
                    <div><FieldLabel>ATA</FieldLabel><DateInput value={sea.ata} onChange={(v) => setSeaField('ata', v)} className="w-full" /></div>
                  </div>
                </div>
              </CardSection>
            </div>

            {/* Booking Confirmation */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-primary">Booking Confirmation</h3>
                <button type="button" onClick={() => setSeaTables((t) => ({ ...t, booking_confirmations: [...t.booking_confirmations, emptySeaBookingRow()] }))} className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"><Plus size={14} />Add row</button>
              </div>
              <div className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-border">
                <table className="w-full text-left text-[11px]">
                  <thead className="border-b border-border bg-slate-50">
                    <tr>{['Booking', 'Type', 'Shipper', 'Consignee', 'Package', 'Num', 'Gross', 'Measure', ''].map((h) => (<th key={h} className="whitespace-nowrap px-2 py-2 font-bold uppercase text-muted-foreground">{h}</th>))}</tr>
                  </thead>
                  <tbody>
                    {seaTables.booking_confirmations.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/60 last:border-0">
                        {(
                          [['booking', row.booking], ['type', row.type], ['shipper', row.shipper], ['consignee', row.consignee], ['package', row.package], ['num', row.num], ['gross', row.gross], ['measure', row.measure]] as const
                        ).map(([k, val]) => (
                          <td key={k} className="p-1 align-middle">
                            <input value={val} onChange={(e) => setSeaTables((t) => ({ ...t, booking_confirmations: t.booking_confirmations.map((r, j) => j === idx ? { ...r, [k]: e.target.value } : r) }))} className={`${cell} w-[100px]`} />
                          </td>
                        ))}
                        <td className="p-1 align-middle">
                          <button type="button" disabled={seaTables.booking_confirmations.length <= 1} onClick={() => setSeaTables((t) => t.booking_confirmations.length <= 1 ? t : { ...t, booking_confirmations: t.booking_confirmations.filter((_, j) => j !== idx) })} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-primary">Attachment</h3>
                <button type="button" onClick={() => setSeaTables((t) => ({ ...t, sea_attachments: [...t.sea_attachments, emptySeaAttachmentRow()] }))} className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"><Plus size={14} />Add row</button>
              </div>
              <div className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-border">
                <table className="w-full text-left text-[11px]">
                  <thead className="border-b border-border bg-slate-50">
                    <tr>{['Attachments', 'File Name', 'Action'].map((h) => (<th key={h} className="whitespace-nowrap px-2 py-2 font-bold uppercase text-muted-foreground">{h}</th>))}</tr>
                  </thead>
                  <tbody>
                    {seaTables.sea_attachments.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/60 last:border-0">
                        <td className="p-1 align-middle">
                          <input value={row.label} onChange={(e) => setSeaTables((t) => ({ ...t, sea_attachments: t.sea_attachments.map((r, j) => j === idx ? { ...r, label: e.target.value } : r) }))} className={`${cell} w-[180px]`} placeholder="Description" />
                        </td>
                        <td className="p-1 align-middle">
                          <span className="block max-w-[220px] truncate px-1 text-[11px] text-muted-foreground" title={row.file_name}>{row.file_name || '—'}</span>
                        </td>
                        <td className="p-1 align-middle">
                          <div className="flex flex-wrap items-center gap-1">
                            <input id={`sea-att-file-${idx}`} type="file" className="sr-only" onChange={(e) => void handleAttachmentFile(idx, e)} />
                            <label htmlFor={`sea-att-file-${idx}`} className="inline-flex h-8 cursor-pointer items-center gap-1 rounded border border-border px-2 text-[11px] font-semibold hover:bg-muted/30">
                              {uploadingAttachmentIdx === idx ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Choose file
                            </label>
                            <button type="button" disabled={seaTables.sea_attachments.length <= 1} onClick={() => setSeaTables((t) => t.sea_attachments.length <= 1 ? t : { ...t, sea_attachments: t.sea_attachments.filter((_, j) => j !== idx) })} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Container volume */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-primary">Total Container volume</h3>
                <button type="button" onClick={() => setSeaTables((t) => ({ ...t, container_volumes: [...t.container_volumes, emptySeaContainerVolumeRow()] }))} className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"><Plus size={14} />Add row</button>
              </div>
              <div className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-border">
                <table className="w-full text-left text-[11px]">
                  <thead className="border-b border-border bg-slate-50">
                    <tr>{['Type', 'Size', 'Total Quantity', ''].map((h) => (<th key={h} className="whitespace-nowrap px-2 py-2 font-bold uppercase text-muted-foreground">{h}</th>))}</tr>
                  </thead>
                  <tbody>
                    {seaTables.container_volumes.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/60 last:border-0">
                        <td className="p-1 align-middle"><input value={row.type} onChange={(e) => setSeaTables((t) => ({ ...t, container_volumes: t.container_volumes.map((r, j) => j === idx ? { ...r, type: e.target.value } : r) }))} className={`${cell} w-[100px]`} /></td>
                        <td className="p-1 align-middle"><input value={row.size} onChange={(e) => setSeaTables((t) => ({ ...t, container_volumes: t.container_volumes.map((r, j) => j === idx ? { ...r, size: e.target.value } : r) }))} className={`${cell} w-[80px]`} /></td>
                        <td className="p-1 align-middle"><input value={row.total_quantity} onChange={(e) => setSeaTables((t) => ({ ...t, container_volumes: t.container_volumes.map((r, j) => j === idx ? { ...r, total_quantity: e.target.value } : r) }))} className={`${cell} w-[100px]`} /></td>
                        <td className="p-1 align-middle">
                          <button type="button" disabled={seaTables.container_volumes.length <= 1} onClick={() => setSeaTables((t) => t.container_volumes.length <= 1 ? t : { ...t, container_volumes: t.container_volumes.filter((_, j) => j !== idx) })} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cargo Information */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-primary">Cargo Information</h3>
                <button type="button" onClick={() => setSeaTables((t) => ({ ...t, cargo_information: [...t.cargo_information, emptySeaCargoRow()] }))} className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"><Plus size={14} />Add row</button>
              </div>
              <div className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-border">
                <table className="w-full text-left text-[11px]">
                  <thead className="border-b border-border bg-slate-50">
                    <tr>{['Type of Commodities', 'Commodity', 'Size', 'Type', 'Quantity', 'SOC', 'Pkg Qty', 'Pkg Type', 'Total', ''].map((h) => (<th key={h} className="whitespace-nowrap px-2 py-2 font-bold uppercase text-muted-foreground">{h}</th>))}</tr>
                  </thead>
                  <tbody>
                    {seaTables.cargo_information.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/60 last:border-0">
                        <td className="p-1 align-middle"><input value={row.type_of_commodities} onChange={(e) => setSeaTables((t) => ({ ...t, cargo_information: t.cargo_information.map((r, j) => j === idx ? { ...r, type_of_commodities: e.target.value } : r) }))} className={`${cell} w-[120px]`} /></td>
                        <td className="p-1 align-middle"><input value={row.commodity} onChange={(e) => setSeaTables((t) => ({ ...t, cargo_information: t.cargo_information.map((r, j) => j === idx ? { ...r, commodity: e.target.value } : r) }))} className={`${cell} w-[100px]`} /></td>
                        <td className="p-1 align-middle"><input value={row.size} onChange={(e) => setSeaTables((t) => ({ ...t, cargo_information: t.cargo_information.map((r, j) => j === idx ? { ...r, size: e.target.value } : r) }))} className={`${cell} w-[72px]`} /></td>
                        <td className="p-1 align-middle"><input value={row.type} onChange={(e) => setSeaTables((t) => ({ ...t, cargo_information: t.cargo_information.map((r, j) => j === idx ? { ...r, type: e.target.value } : r) }))} className={`${cell} w-[72px]`} /></td>
                        <td className="p-1 align-middle"><input value={row.quantity} onChange={(e) => setSeaTables((t) => ({ ...t, cargo_information: t.cargo_information.map((r, j) => j === idx ? { ...r, quantity: e.target.value } : r) }))} className={`${cell} w-[72px]`} /></td>
                        <td className="p-1 align-middle"><input value={row.soc} onChange={(e) => setSeaTables((t) => ({ ...t, cargo_information: t.cargo_information.map((r, j) => j === idx ? { ...r, soc: e.target.value } : r) }))} className={`${cell} w-[56px]`} /></td>
                        <td className="p-1 align-middle"><input value={row.package_qty} onChange={(e) => setSeaTables((t) => ({ ...t, cargo_information: t.cargo_information.map((r, j) => j === idx ? { ...r, package_qty: e.target.value } : r) }))} className={`${cell} w-[72px]`} /></td>
                        <td className="p-1 align-middle"><input value={row.package_type} onChange={(e) => setSeaTables((t) => ({ ...t, cargo_information: t.cargo_information.map((r, j) => j === idx ? { ...r, package_type: e.target.value } : r) }))} className={`${cell} w-[80px]`} /></td>
                        <td className="p-1 align-middle"><input value={row.total} onChange={(e) => setSeaTables((t) => ({ ...t, cargo_information: t.cargo_information.map((r, j) => j === idx ? { ...r, total: e.target.value } : r) }))} className={`${cell} w-[80px]`} /></td>
                        <td className="p-1 align-middle">
                          <button type="button" disabled={seaTables.cargo_information.length <= 1} onClick={() => setSeaTables((t) => t.cargo_information.length <= 1 ? t : { ...t, cargo_information: t.cargo_information.filter((_, j) => j !== idx) })} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trucking Details Section */}
      <div className="mt-6 border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setIsTruckingExpanded(!isTruckingExpanded)}>
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-primary" />
            <h3 className="text-[14px] font-bold text-slate-800">Trucking Details</h3>
          </div>
          <div className="flex items-center gap-3">
            {isTruckingExpanded && (
              <button
                onClick={(e) => { e.stopPropagation(); handleSaveDetails(); }}
                disabled={isSavingDetails}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-[12px] font-bold hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50"
              >
                {isSavingDetails ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Details
              </button>
            )}
            {isTruckingExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </div>
        </div>

        {isTruckingExpanded && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="min-w-0 w-full">
              <CardSection title="Truck">
                <div className="mb-2 flex justify-end">
                  <button type="button" onClick={() => setTrucking((t) => ({ ...t, trucks: [...t.trucks, emptyTruckingTruckRow()] }))} className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"><Plus size={14} />Add row</button>
                </div>
                <div className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-border">
                  <table className="w-full text-left text-[11px]">
                    <thead className="border-b border-border bg-slate-50">
                      <tr>
                        {[{ key: 'house_bl', label: 'House B/L' }, { key: 'pol', label: 'POL' }, { key: 'pod', label: 'POD' }, { key: 'plate_number', label: 'Plate Number' }, { key: 'customs_declaration', label: 'Customs' }, { key: 'salesman', label: 'Salesman' }, { key: 'load_type', label: 'Load Type' }, { key: 'service_terms', label: 'Service terms' }, { key: 'bound', label: 'Bound' }, { key: 'incoterm', label: 'Incoterm' }, { key: 'transport_mode', label: 'Transport' }, { key: 'area', label: 'Area' }, { key: 'partner', label: 'Partner' }].map(({ label }) => (
                          <th key={label} className="whitespace-nowrap px-2 py-2 font-bold uppercase text-muted-foreground">{label}</th>
                        ))}
                        <th className="w-10 px-1" aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {trucking.trucks.map((row, idx) => (
                        <tr key={idx} className="border-b border-border/60 last:border-0">
                          {[{ key: 'house_bl' }, { key: 'pol' }, { key: 'pod' }, { key: 'plate_number' }, { key: 'customs_declaration' }, { key: 'salesman' }, { key: 'load_type' }, { key: 'service_terms' }, { key: 'bound' }, { key: 'incoterm' }, { key: 'transport_mode' }, { key: 'area' }, { key: 'partner' }].map(({ key }) => (
                            <td key={key} className="p-1 align-middle">
                              <input value={(row as any)[key]} onChange={(e) => setTrucking((t) => ({ ...t, trucks: t.trucks.map((r, j) => j === idx ? { ...r, [key]: e.target.value } : r) }))} className={`${cell} w-[88px]`} />
                            </td>
                          ))}
                          <td className="p-1 align-middle">
                            <button type="button" disabled={trucking.trucks.length <= 1} onClick={() => setTrucking((t) => t.trucks.length <= 1 ? t : { ...t, trucks: t.trucks.filter((_, j) => j !== idx) })} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardSection>
            </div>

            <div className="min-w-0 w-full">
              <CardSection title="Billing">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="mb-0 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Quotation</span>
                      <button type="button" onClick={() => setTrucking((t) => ({ ...t, quotations: [...t.quotations, emptyTruckingQuotationRow()] }))} className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"><Plus size={14} />Add row</button>
                    </div>
                    <div className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-border">
                      <table className="w-full text-left text-[11px]">
                        <thead className="border-b border-border bg-slate-50">
                          <tr>
                            {(['Quotation', 'Customer', 'Status'] as const).map((h) => (<th key={h} className="whitespace-nowrap px-2 py-2 font-bold uppercase text-muted-foreground">{h}</th>))}
                            <th className="w-10 px-1" aria-label="Actions" />
                          </tr>
                        </thead>
                        <tbody>
                          {trucking.quotations.map((row, idx) => (
                            <tr key={idx} className="border-b border-border/60 last:border-0">
                              <td className="p-1 align-middle"><input value={row.quotation} onChange={(e) => setTrucking((t) => ({ ...t, quotations: t.quotations.map((r, j) => j === idx ? { ...r, quotation: e.target.value } : r) }))} className={`${cell} w-[120px]`} /></td>
                              <td className="p-1 align-middle"><input value={row.customer} onChange={(e) => setTrucking((t) => ({ ...t, quotations: t.quotations.map((r, j) => j === idx ? { ...r, customer: e.target.value } : r) }))} className={`${cell} w-[140px]`} /></td>
                              <td className="p-1 align-middle"><input value={row.status} onChange={(e) => setTrucking((t) => ({ ...t, quotations: t.quotations.map((r, j) => j === idx ? { ...r, status: e.target.value } : r) }))} className={`${cell} w-[100px]`} /></td>
                              <td className="p-1 align-middle">
                                <button type="button" disabled={trucking.quotations.length <= 1} onClick={() => setTrucking((t) => t.quotations.length <= 1 ? t : { ...t, quotations: t.quotations.filter((_, j) => j !== idx) })} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"><Trash2 size={14} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="min-w-0 flex flex-col gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Exchange rate</p>
                    <div className="rounded-xl border border-border bg-slate-50/50 p-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <FieldLabel>Date</FieldLabel>
                          <DateInput value={trucking.exchange_date} onChange={(v) => setTrucking((t) => ({ ...t, exchange_date: v }))} className="w-full" />
                        </div>
                        <div>
                          <FieldLabel>Rate</FieldLabel>
                          <input value={trucking.exchange_rate} onChange={(e) => setTrucking((t) => ({ ...t, exchange_rate: e.target.value }))} className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium" placeholder="0" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardSection>
            </div>

            <div className="min-w-0 w-full">
              <CardSection title="Selling">
                <div className="mb-2 flex justify-end">
                  <button type="button" onClick={() => setTrucking((t) => ({ ...t, billing_lines: [...t.billing_lines, emptyTruckingBillingLineRow()] }))} className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"><Plus size={14} />Add row</button>
                </div>
                <div className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-border">
                  <table className="w-full text-left text-[11px]">
                    <thead className="border-b border-border bg-slate-50">
                      <tr>
                        {[{ key: 'customer', label: 'Customer' }, { key: 'service', label: 'Service' }, { key: 'truck', label: 'Truck' }, { key: 'fare', label: 'Fare' }, { key: 'fare_name', label: 'Fare Name' }, { key: 'tax', label: 'Tax' }, { key: 'fare_type', label: 'Fare Type' }, { key: 'currency', label: 'Currency' }, { key: 'exchange_rate', label: 'Exch. rate' }, { key: 'unit', label: 'Unit' }, { key: 'qty', label: 'Qty' }, { key: 'rate', label: 'Rate' }].map(({ label }) => (
                          <th key={label} className="whitespace-nowrap px-2 py-2 font-bold uppercase text-muted-foreground">{label}</th>
                        ))}
                        <th className="w-10 px-1" aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {trucking.billing_lines.map((row, idx) => (
                        <tr key={idx} className="border-b border-border/60 last:border-0">
                          {[{ key: 'customer' }, { key: 'service' }, { key: 'truck' }, { key: 'fare' }, { key: 'fare_name' }, { key: 'tax' }, { key: 'fare_type' }, { key: 'currency' }, { key: 'exchange_rate' }, { key: 'unit' }, { key: 'qty' }, { key: 'rate' }].map(({ key }) => (
                            <td key={key} className="p-1 align-middle">
                              <input value={(row as any)[key]} onChange={(e) => setTrucking((t) => ({ ...t, billing_lines: t.billing_lines.map((r, j) => j === idx ? { ...r, [key]: e.target.value } : r) }))} className={`${cell} w-[72px]`} />
                            </td>
                          ))}
                          <td className="p-1 align-middle">
                            <button type="button" disabled={trucking.billing_lines.length <= 1} onClick={() => setTrucking((t) => t.billing_lines.length <= 1 ? t : { ...t, billing_lines: t.billing_lines.filter((_, j) => j !== idx) })} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardSection>
            </div>
          </div>
        )}
      </div>

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
