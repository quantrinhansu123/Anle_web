import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Truck, Plus, Trash2, Loader2, ChevronRight, Phone, MapPin, Clock, User,
  Save, ChevronUp, ChevronDown, Pencil, X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { createPortal } from 'react-dom';
import {
  transportBookingService,
  type TransportBooking,
  type TransportBookingStatus,
  type VehicleType,
  type CreateTransportBookingDto,
} from '../../../services/transportBookingService';
import { useToastContext } from '../../../contexts/ToastContext';
import { shipmentService } from '../../../services/shipmentService';
import { supplierService, type Supplier } from '../../../services/supplierService';
import { employeeService, type Employee } from '../../../services/employeeService';
import { DateInput } from '../../../components/ui/DateInput';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import type {
  Shipment,
  TruckingTabState,
  TruckingTruckRow,
  TruckingQuotationRow,
  TruckingBillingLineRow,
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

const cell = 'w-full rounded border border-transparent bg-transparent px-1 py-1 text-[11px] font-medium hover:border-border hover:bg-white focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20';

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

const toLocalDatetimeInput = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
};

const toIsoFromLocalInput = (local: string): string | null => {
  const s = String(local || '').trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

/** VND-style grouping: 1.000.000 */
const formatMoneyVi = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(amount));

const parseDigitsInt = (s: string): number => {
  const d = s.replace(/\D/g, '');
  if (!d) return 0;
  const n = parseInt(d, 10);
  return Number.isFinite(n) ? n : 0;
};

const moneyInputDisplay = (stored: string | undefined | null): string => {
  if (stored == null || stored === '') return '';
  return formatMoneyVi(parseDigitsInt(String(stored)));
};

const formatTime = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
};

function companyLogoSrc(): string {
  if (import.meta.env.DEV) return '/appsheet-brand-logo';
  return 'https://www.appsheet.com/template/gettablefileurl?appName=Appsheet-325045268&tableName=Kho%20%E1%BA%A3nh&fileName=Kho%20%E1%BA%A3nh_Images%2Fe6a56fae.%E1%BA%A2nh.064359.png';
}

const safeHistory = (b: TransportBooking) => {
  const raw = (b as any).status_history;
  return Array.isArray(raw) ? (raw as { status: TransportBookingStatus; at: string; by?: string | null }[]) : [];
};

const REPORT_CSS = `
.tr-root{
  box-sizing:border-box;
  width: 820px;
  max-width: 100%;
  margin: 0 auto;
  background:#fff;
  color:#0f172a;
  padding: 26px 34px 34px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 13px;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
}
.tr-root *, .tr-root *::before, .tr-root *::after{ box-sizing:border-box; }
.tr-header{ display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:14px; }
.tr-logo{ width: 190px; flex-shrink:0; padding-top:2px; }
.tr-logo img{ width:100%; height:auto; display:block; object-fit:contain; }
.tr-co{ text-align:right; font-size:9px; color:#64748b; text-transform:uppercase; letter-spacing:0.18em; line-height:1.55; }
.tr-co .tr-co-name{ color:#0f172a; font-weight:800; }
.tr-titleband{ display:flex; align-items:center; justify-content:space-between; gap:12px; background:#0ea5e9; color:#fff; padding: 10px 14px; border-radius: 10px; margin-bottom: 14px; }
.tr-titleband .tr-title{ font-weight:900; text-transform:uppercase; letter-spacing:0.06em; font-size: 13px; }
.tr-titleband .tr-code{ font-weight:800; font-size:12px; opacity:0.95; }
.tr-grid{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.tr-box{ border:1px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; }
.tr-label{ font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:0.06em; color:#0284c7; margin-bottom:4px; }
.tr-val{ font-size:13px; font-weight:700; color:#0f172a; }
.tr-sub{ font-size:11px; font-weight:700; color:#475569; }
.tr-table{ width:100%; border-collapse:collapse; font-size:12px; margin-top: 8px; }
.tr-table th, .tr-table td{ border:1px solid #e2e8f0; padding: 8px 8px; vertical-align:top; }
.tr-table th{ background:#f1f5f9; color:#0f172a; font-size:10px; text-transform:uppercase; letter-spacing:0.06em; }
.tr-sign{ display:grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 18px; }
.tr-sign .tr-sigbox{ border:1px dashed #cbd5e1; border-radius: 12px; padding: 12px; min-height: 92px; }
.tr-sign .tr-sigtitle{ font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:0.08em; color:#64748b; margin-bottom: 8px; }
.tr-muted{ color:#64748b; font-weight:700; font-size:11px; }
.tr-no-print{}
@media print{
  @page{ margin: 10mm; size: A4; }
  html, body{ margin:0 !important; padding:0 !important; }
  .tr-root{ box-shadow:none; width:100%; padding: 0; }
  .tr-no-print{ display:none !important; }
}
`;

function printHtmlDocument(title: string, html: string, css: string) {
  const w = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768');
  if (!w) return;
  w.document.open();
  w.document.write(`<!doctype html><html><head><meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>${css}</style>
    </head><body>${html}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
  }, 50);
}

function TransportCompletionReportModal({
  open,
  booking,
  shipment,
  employeeMap,
  onClose,
}: {
  open: boolean;
  booking: TransportBooking | null;
  shipment: Shipment | null;
  employeeMap: Record<string, string>;
  onClose: () => void;
}) {
  if (!open || !booking) return null;

  const history = safeHistory(booking);
  const shipmentCode = (shipment as any)?.code || booking.shipment_id;
  const vendor = booking.vendor_name || '—';
  const plate = booking.license_plate || '—';
  const driver = booking.driver_name || '—';
  const driverPhone = booking.driver_phone || '—';
  const pickup = booking.pickup_location || '—';
  const delivery = booking.delivery_location || '—';

  const content = (
    <div className="tr-root" id="transport-completion-report">
      <style dangerouslySetInnerHTML={{ __html: REPORT_CSS }} />
      <header className="tr-header">
        <div className="tr-logo">
          <img src={companyLogoSrc()} alt="ANLE-SCM Logo" />
        </div>
        <div className="tr-co">
          <div className="tr-co-name">COMPANY LTD ANLE-SCM</div>
          <div>Hotline: 0519055056</div>
          <div>Email: MGM@ANLE-SCM.COM</div>
          <div>Website: ANLE-SCM.COM</div>
        </div>
      </header>

      <div className="tr-titleband">
        <div className="tr-title">Transport Completion Report</div>
        <div className="tr-code">Shipment: {shipmentCode}</div>
      </div>

      <div className="tr-grid">
        <div className="tr-box">
          <div className="tr-label">Vendor</div>
          <div className="tr-val">{vendor}</div>
          <div className="tr-sub">Vehicle: {booking.vehicle_type || '—'} • Plate: {plate}</div>
        </div>
        <div className="tr-box">
          <div className="tr-label">Driver</div>
          <div className="tr-val">{driver}</div>
          <div className="tr-sub">Phone: {driverPhone}</div>
        </div>
        <div className="tr-box">
          <div className="tr-label">Pickup</div>
          <div className="tr-val">{pickup}</div>
          <div className="tr-sub">Planned: {formatTime(booking.pickup_time || null)}</div>
        </div>
        <div className="tr-box">
          <div className="tr-label">Delivery</div>
          <div className="tr-val">{delivery}</div>
          <div className="tr-sub">Planned: {formatTime(booking.delivery_time || null)}</div>
        </div>
      </div>

      <div className="tr-box">
        <div className="tr-label">Status history</div>
        {history.length === 0 ? (
          <div className="tr-muted">No history yet.</div>
        ) : (
          <table className="tr-table">
            <thead>
              <tr>
                <th style={{ width: '34%' }}>Status</th>
                <th style={{ width: '33%' }}>Time</th>
                <th style={{ width: '33%' }}>By</th>
              </tr>
            </thead>
            <tbody>
              {history
                .slice()
                .reverse()
                .map((h, idx) => (
                  <tr key={`${h.at}-${idx}`}>
                    <td><strong>{STATUS_CONFIG[h.status].label}</strong></td>
                    <td>{formatTime(h.at)}</td>
                    <td>{h.by ? (employeeMap[h.by] || h.by) : '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="tr-sign">
        <div className="tr-sigbox">
          <div className="tr-sigtitle">Carrier / Driver signature</div>
          <div className="tr-muted">Full name, signature</div>
        </div>
        <div className="tr-sigbox">
          <div className="tr-sigtitle">Company representative</div>
          <div className="tr-muted">Full name, signature, stamp</div>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
        <div className="tr-no-print flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Print preview</p>
            <p className="text-[14px] font-black text-slate-900 truncate">Transport completion report</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('transport-completion-report');
                if (!el) return;
                printHtmlDocument('Transport Completion Report', el.outerHTML, REPORT_CSS);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[12px] font-black uppercase tracking-wide text-white shadow-sm hover:opacity-95"
            >
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-xl border border-border bg-white text-slate-500 hover:bg-slate-50"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="max-h-[80vh] overflow-auto bg-slate-100 p-4">
          {content}
        </div>
      </div>
    </div>,
    document.body,
  );
}

const TransportTab: React.FC<Props> = ({ shipmentId }) => {
  const { success, error: toastError } = useToastContext();
  const [bookings, setBookings] = useState<TransportBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBookingSupplierId, setNewBookingSupplierId] = useState<string | undefined>(undefined);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [newBooking, setNewBooking] = useState<Partial<CreateTransportBookingDto>>({
    vendor_name: '',
    vehicle_type: 'truck_40ft',
    pickup_location: '',
    delivery_location: '',
    planned_cost: 0,
  });

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [trucking, setTrucking] = useState<TruckingTabState>(emptyTruckingTabState());
  const [isTruckingExpanded, setIsTruckingExpanded] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const employeeMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const e of employees) {
      if (e?.id) map[e.id] = e.full_name || e.id;
    }
    return map;
  }, [employees]);

  const [editingCheckpoint, setEditingCheckpoint] = useState<{
    bookingId: string;
    status: TransportBookingStatus;
    value: string;
  } | null>(null);

  const [printBookingId, setPrintBookingId] = useState<string | null>(null);
  const [printBookingSnapshot, setPrintBookingSnapshot] = useState<TransportBooking | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsData, shipmentData, suppliersData, employeesData] = await Promise.all([
        transportBookingService.getTransportBookings(shipmentId),
        shipmentService.getShipmentById(shipmentId),
        supplierService.getSuppliers(1, 1000),
        employeeService.getEmployees(),
      ]);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setSuppliersList(Array.isArray(suppliersData) ? suppliersData : []);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      setShipment(shipmentData);

      if (shipmentData?.service_details?.trucking) {
        setTrucking(parseTruckingTab(shipmentData.service_details.trucking));
      } else {
        setTrucking(emptyTruckingTabState());
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const supplierOptions = useMemo(
    () =>
      suppliersList.map((s) => ({
        value: s.id,
        label: s.company_name || s.id,
      })),
    [suppliersList],
  );

  const applySupplierToNewBooking = useCallback(
    (supplierId: string | undefined, currentBookings: TransportBooking[]) => {
      if (!supplierId) {
        setNewBookingSupplierId(undefined);
        setNewBooking((p) => ({
          ...p,
          vendor_name: '',
          vendor_phone: '',
          license_plate: '',
        }));
        return;
      }
      const s = suppliersList.find((x) => x.id === supplierId);
      if (!s) return;
      const nameNorm = (s.company_name || '').trim().toLowerCase();
      const latestVendorBooking = [...currentBookings]
        .reverse()
        .find((b) => (b.vendor_name || '').trim().toLowerCase() === nameNorm);
      const prevPlate =
        [...currentBookings]
          .reverse()
          .find(
            (b) =>
              (b.vendor_name || '').trim().toLowerCase() === nameNorm &&
              (b.license_plate || '').trim(),
          )?.license_plate?.trim() || '';
      setNewBookingSupplierId(supplierId);
      setNewBooking((p) => ({
        ...p,
        vendor_name: s.company_name,
        vendor_phone: latestVendorBooking?.vendor_phone || s.phone || '',
        vehicle_type: latestVendorBooking?.vehicle_type || p.vehicle_type || 'truck_40ft',
        license_plate: prevPlate || p.license_plate || '',
        driver_name: latestVendorBooking?.driver_name || p.driver_name || '',
        driver_phone: latestVendorBooking?.driver_phone || p.driver_phone || '',
        pickup_location: latestVendorBooking?.pickup_location || p.pickup_location || '',
        delivery_location: latestVendorBooking?.delivery_location || p.delivery_location || '',
      }));
    },
    [suppliersList],
  );

  useEffect(() => {
    fetchData();
  }, [shipmentId]);

  const handleSaveDetails = async () => {
    if (!shipment) return;
    try {
      setIsSavingDetails(true);
      const prev = { ...(shipment.service_details || {}) } as Record<string, unknown>;
      const updatedServiceDetails = {
        ...prev,
        trucking: mergeTruckingPersisted(trucking) as unknown as Record<string, unknown>,
      };
      await shipmentService.updateShipment(shipmentId, {
        service_details: updatedServiceDetails,
      });
      success('Transport details saved successfully');
      fetchData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to save transport details');
    } finally {
      setIsSavingDetails(false);
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
      setNewBookingSupplierId(undefined);
      setNewBooking({
        vendor_name: '',
        vendor_phone: '',
        license_plate: '',
        driver_name: '',
        driver_phone: '',
        vehicle_type: 'truck_40ft',
        pickup_location: '',
        delivery_location: '',
        planned_cost: 0,
      });
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
      const updated = await transportBookingService.updateTransportBookingStatus(booking.id, nextStatus);
      setPrintBookingSnapshot(updated);
      fetchData();
      if (nextStatus === 'completed') {
        // Show completion report immediately after completing.
        setPrintBookingId(updated.id);
      }
    } catch (err) {
      console.error('Failed to advance status:', err);
      toastError((err as any)?.message || 'Failed to update transport status');
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

  const isPickupOverdue = (b: TransportBooking) => {
    if (!b.pickup_time) return false;
    const due = new Date(b.pickup_time).getTime();
    if (!Number.isFinite(due)) return false;
    const now = Date.now();
    const step = STATUS_CONFIG[b.status]?.step ?? 0;
    return now > due && step < STATUS_CONFIG.arrived_pickup.step;
  };

  const isDeliveryOverdue = (b: TransportBooking) => {
    if (!b.delivery_time) return false;
    const due = new Date(b.delivery_time).getTime();
    if (!Number.isFinite(due)) return false;
    const now = Date.now();
    const step = STATUS_CONFIG[b.status]?.step ?? 0;
    return now > due && step < STATUS_CONFIG.arrived_destination.step;
  };

  const openCheckpointEditor = (b: TransportBooking, s: TransportBookingStatus) => {
    const timeline =
      b.status_timeline && typeof b.status_timeline === 'object' ? (b.status_timeline as Record<string, string>) : {};
    const iso = timeline[s];
    setEditingCheckpoint({
      bookingId: b.id,
      status: s,
      value: toLocalDatetimeInput(iso || null) || toLocalDatetimeInput(new Date().toISOString()),
    });
  };

  const saveCheckpoint = async () => {
    if (!editingCheckpoint) return;
    const { bookingId, status, value } = editingCheckpoint;
    const iso = toIsoFromLocalInput(value);
    if (!iso) {
      toastError('Invalid date/time');
      return;
    }
    try {
      setSavingId(bookingId);
      const booking = bookings.find((b) => b.id === bookingId);
      const prevTimeline =
        booking?.status_timeline && typeof booking.status_timeline === 'object'
          ? (booking.status_timeline as Record<string, string>)
          : {};
      const nextTimeline = { ...prevTimeline, [status]: iso };
      await transportBookingService.updateTransportBooking(bookingId, {
        status,
        status_timeline: nextTimeline,
      });
      setEditingCheckpoint(null);
      fetchData();
      success('Checkpoint updated');
    } catch (err: any) {
      toastError(err?.message || 'Failed to update checkpoint');
    } finally {
      setSavingId(null);
    }
  };

  /** Trucking tables (House B/L, billing, selling) chỉ dùng cho lô có chân vận tải biển (over sea). */
  const showTruckingDetailsSection = Boolean(shipment && (shipment.transport_sea ?? true));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TransportCompletionReportModal
        open={Boolean(printBookingId)}
        booking={
          printBookingId
            ? bookings.find((b) => b.id === printBookingId) || printBookingSnapshot || null
            : null
        }
        shipment={shipment}
        employeeMap={employeeMap}
        onClose={() => {
          setPrintBookingId(null);
          setPrintBookingSnapshot(null);
        }}
      />
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
            const pickupLate = isPickupOverdue(booking);
            const deliveryLate = isDeliveryOverdue(booking);

            return (
              <div key={booking.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:border-slate-300 transition-all">
                {/* Status Stepper Mini */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center gap-0.5">
                    {STATUS_FLOW.map((s, idx) => {
                      const filled = currentStep >= idx;
                      const timeline =
                        booking.status_timeline && typeof booking.status_timeline === 'object'
                          ? (booking.status_timeline as Record<string, string>)
                          : {};
                      const hasTs = Boolean(timeline[s]);
                      const lateRing =
                        (pickupLate && idx <= STATUS_CONFIG.arrived_pickup.step) ||
                        (deliveryLate && idx <= STATUS_CONFIG.arrived_destination.step);
                      return (
                        <React.Fragment key={s}>
                          <button
                            type="button"
                            onClick={() => openCheckpointEditor(booking, s)}
                            className={clsx(
                              'relative w-2.5 h-2.5 rounded-full transition-all',
                              filled ? 'bg-primary' : 'bg-slate-200',
                              currentStep === idx && 'ring-2 ring-primary/20 scale-125',
                              hasTs && 'outline outline-2 outline-emerald-300/70',
                              lateRing && 'outline outline-2 outline-red-300/80',
                            )}
                            title={STATUS_CONFIG[s].label}
                            aria-label={`Update ${STATUS_CONFIG[s].label}`}
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
                      <p className="text-[13px] font-black text-primary tabular-nums">{formatMoneyVi(booking.planned_cost)} <span className="text-[9px]">VND</span></p>
                      {booking.actual_cost != null && (
                        <p className="text-[11px] font-bold text-emerald-600 tabular-nums">Actual: {formatMoneyVi(booking.actual_cost)}</p>
                      )}
                      {(pickupLate || deliveryLate) && (
                        <p className="mt-1 text-[11px] font-bold text-red-600">
                          {pickupLate ? 'Pickup overdue' : 'Delivery overdue'}
                        </p>
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
                    {booking.delivery_time && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock size={10} className="text-slate-400" />
                        <span className="font-medium">{formatTime(booking.delivery_time)}</span>
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

                  {/* History */}
                  {safeHistory(booking).length > 0 && (
                    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">History</p>
                      <div className="mt-1 space-y-1">
                        {safeHistory(booking)
                          .slice()
                          .reverse()
                          .map((h, i) => (
                            <div key={`${h.at}-${i}`} className="flex items-center justify-between gap-3 text-[11px]">
                              <div className="min-w-0">
                                <span className="font-black text-slate-700">{STATUS_CONFIG[h.status].label}</span>
                                <span className="mx-1 text-slate-400">•</span>
                                <span className="font-medium text-slate-600">{formatTime(h.at)}</span>
                              </div>
                              <div className="shrink-0 text-[10px] font-bold text-slate-500">
                                {h.by ? `by ${employeeMap[h.by] || h.by.slice(0, 8)}` : 'by —'}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkpoint editor modal */}
      {editingCheckpoint ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white shadow-xl">
            <div className="border-b border-border px-5 py-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Update checkpoint</p>
                <p className="text-[14px] font-black text-slate-900 truncate">
                  {STATUS_CONFIG[editingCheckpoint.status].label}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCheckpoint(null)}
                className="h-9 w-9 rounded-xl border border-border bg-white text-slate-500 hover:bg-slate-50"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <FieldLabel>Date & time</FieldLabel>
                <input
                  type="datetime-local"
                  value={editingCheckpoint.value}
                  onChange={(e) => setEditingCheckpoint((p) => (p ? { ...p, value: e.target.value } : p))}
                  className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={saveCheckpoint}
                  disabled={savingId === editingCheckpoint.bookingId}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[12px] font-black uppercase tracking-wide text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                >
                  {savingId === editingCheckpoint.bookingId ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={16} />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCheckpoint(null)}
                  className="px-4 py-2.5 rounded-xl border border-border bg-white text-[12px] font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Click any dot on the progress line to set its timestamp.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Trucking Details — chỉ hiện khi lô bật vận tải biển (over sea) */}
      {showTruckingDetailsSection ? (
      <div className="mt-8 border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setIsTruckingExpanded(!isTruckingExpanded)}>
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-primary" />
            <h3 className="text-[14px] font-bold text-slate-800">Trucking Details</h3>
            <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
              Over sea
            </span>
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
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={moneyInputDisplay(trucking.exchange_rate)}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '');
                              setTrucking((t) => ({ ...t, exchange_rate: raw }));
                            }}
                            className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium text-right tabular-nums"
                            placeholder="0"
                          />
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
                          {[{ key: 'customer' }, { key: 'service' }, { key: 'truck' }, { key: 'fare' }, { key: 'fare_name' }, { key: 'tax' }, { key: 'fare_type' }, { key: 'currency' }, { key: 'exchange_rate' }, { key: 'unit' }, { key: 'qty' }, { key: 'rate' }].map(({ key }) => {
                            const moneyKeys = key === 'fare' || key === 'rate' || key === 'exchange_rate';
                            const rawVal = String((row as unknown as Record<string, string>)[key] ?? '');
                            return (
                              <td key={key} className="p-1 align-middle">
                                <input
                                  type="text"
                                  inputMode={moneyKeys ? 'numeric' : undefined}
                                  value={moneyKeys ? moneyInputDisplay(rawVal) : rawVal}
                                  onChange={(e) => {
                                    const next = moneyKeys
                                      ? e.target.value.replace(/\D/g, '')
                                      : e.target.value;
                                    setTrucking((t) => ({
                                      ...t,
                                      billing_lines: t.billing_lines.map((r, j) =>
                                        j === idx ? { ...r, [key]: next } : r,
                                      ),
                                    }));
                                  }}
                                  className={clsx(cell, 'w-[72px]', moneyKeys && 'text-right tabular-nums')}
                                />
                              </td>
                            );
                          })}
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
      ) : (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-[13px] text-slate-600">
            <p className="font-bold text-slate-800">Trucking Details (House B/L, Billing, Selling)</p>
            <p className="mt-1.5 leading-relaxed">
              Chỉ hiển thị cho lô <strong>vận tải biển</strong> (over sea). Lô hiện tại đang tắt Sea — bật{' '}
              <strong>Sea</strong> trong tab Overview nếu cần nhập các bảng này.
            </p>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[11px] font-bold text-primary uppercase tracking-wider">New Transport Booking</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Vendor Name *</label>
              <SearchableSelect
                className="w-full"
                options={supplierOptions}
                value={newBookingSupplierId}
                onValueChange={(id) => applySupplierToNewBooking(id || undefined, bookings)}
                placeholder="Chọn NCC (Supplier)…"
                searchPlaceholder="Tìm vendor…"
              />
              <p className="text-[10px] text-slate-500">
                Tự điền theo booking gần nhất của vendor trong lô này (xe, biển số, tài xế, điểm lấy/giao); fallback SĐT từ master NCC.
              </p>
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
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                value={newBooking.planned_cost ? formatMoneyVi(newBooking.planned_cost) : ''}
                onChange={(e) => {
                  const n = parseDigitsInt(e.target.value);
                  setNewBooking((p) => ({ ...p, planned_cost: n }));
                }}
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
              onClick={() => {
                setNewBookingSupplierId(undefined);
                setNewBooking({
                  vendor_name: '',
                  vendor_phone: '',
                  license_plate: '',
                  driver_name: '',
                  driver_phone: '',
                  vehicle_type: 'truck_40ft',
                  pickup_location: '',
                  delivery_location: '',
                  planned_cost: 0,
                });
                setShowAddForm(false);
              }}
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
