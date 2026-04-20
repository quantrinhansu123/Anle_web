import React, { useState, useEffect } from 'react';
import { Shield, Trash2, ChevronDown, ChevronUp, Plus, Loader2, Upload, Save } from 'lucide-react';
import type { CustomsClearance, CreateCustomsClearanceDto } from '../../../services/customsClearanceService';
import { shipmentService } from '../../../services/shipmentService';
import { useToastContext } from '../../../contexts/ToastContext';
import { apiFetch } from '../../../lib/api';
import { DateInput } from '../../../components/ui/DateInput';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import type { JobBound } from '../types';

// --- Types and Helpers Ported from JobCustomsTabPanel ---
export interface CustomsContainerRow {
  type: string;
  size: string;
  total_quantity: string;
}

export interface CustomsAttachmentRow {
  label: string;
  file_name: string;
  file_url: string;
}

export interface CustomsScheduleRow {
  from: string;
  etd: string;
  departure_time_to: string;
  eta: string;
  arrival_time: string;
  carrier: string;
  carrier_name: string;
}

export interface CustomsTabState {
  inner_job_no: string;
  area: string;
  bound: string;
  incoterms: string;
  shipper: string;
  consignee: string;
  customer: string;
  co_loader: string;
  pic: string;
  phone: string;
  email: string;
  container_volumes: CustomsContainerRow[];
  commodity: string;
  commodity_vi: string;
  procedure_code: string;
  hs_code: string;
  cds_quantity: string;
  custom_remark: string;
  attachments: CustomsAttachmentRow[];
  schedule_rows: CustomsScheduleRow[];
}

function str(v: unknown): string {
  return v == null ? '' : String(v);
}

export function emptyCustomsContainerRow(): CustomsContainerRow {
  return { type: '', size: '', total_quantity: '' };
}

export function emptyCustomsAttachmentRow(): CustomsAttachmentRow {
  return { label: '', file_name: '', file_url: '' };
}

export function emptyCustomsScheduleRow(): CustomsScheduleRow {
  return {
    from: '',
    etd: '',
    departure_time_to: '',
    eta: '',
    arrival_time: '',
    carrier: '',
    carrier_name: '',
  };
}

export function emptyCustomsTabState(): CustomsTabState {
  return {
    inner_job_no: '',
    area: '',
    bound: '',
    incoterms: '',
    shipper: '',
    consignee: '',
    customer: '',
    co_loader: '',
    pic: '',
    phone: '',
    email: '',
    container_volumes: [emptyCustomsContainerRow()],
    commodity: '',
    commodity_vi: '',
    procedure_code: '',
    hs_code: '',
    cds_quantity: '',
    custom_remark: '',
    attachments: [emptyCustomsAttachmentRow()],
    schedule_rows: [emptyCustomsScheduleRow()],
  };
}

function parseContainerRow(x: unknown): CustomsContainerRow {
  const o = x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
  return {
    type: str(o.type),
    size: str(o.size),
    total_quantity: str(o.total_quantity),
  };
}

function parseAttachmentRow(x: unknown): CustomsAttachmentRow {
  const o = x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
  return {
    label: str(o.label ?? o.attachments),
    file_name: str(o.file_name),
    file_url: str(o.file_url ?? o.url),
  };
}

function parseScheduleRow(x: unknown): CustomsScheduleRow {
  const o = x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
  return {
    from: str(o.from),
    etd: str(o.etd),
    departure_time_to: str(o.departure_time_to),
    eta: str(o.eta),
    arrival_time: str(o.arrival_time),
    carrier: str(o.carrier),
    carrier_name: str(o.carrier_name),
  };
}

function parseTableArray<T>(v: unknown, parseOne: (x: unknown) => T, empty: () => T): T[] {
  if (!Array.isArray(v) || v.length === 0) return [empty()];
  return v.map(parseOne);
}

export function parseCustomsTab(raw: unknown): CustomsTabState {
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    inner_job_no: str(o.inner_job_no),
    area: str(o.area),
    bound: str(o.bound),
    incoterms: str(o.incoterms),
    shipper: str(o.shipper),
    consignee: str(o.consignee),
    customer: str(o.customer),
    co_loader: str(o.co_loader),
    pic: str(o.pic),
    phone: str(o.phone),
    email: str(o.email),
    container_volumes: parseTableArray(o.container_volumes, parseContainerRow, emptyCustomsContainerRow),
    commodity: str(o.commodity),
    commodity_vi: str(o.commodity_vi),
    procedure_code: str(o.procedure_code),
    hs_code: str(o.hs_code),
    cds_quantity: str(o.cds_quantity),
    custom_remark: str(o.custom_remark),
    attachments: parseTableArray(o.attachments, parseAttachmentRow, emptyCustomsAttachmentRow),
    schedule_rows: parseTableArray(o.schedule_rows, parseScheduleRow, emptyCustomsScheduleRow),
  };
}

export function mergeCustomsPersisted(state: CustomsTabState): Record<string, unknown> {
  return {
    inner_job_no: state.inner_job_no.trim(),
    area: state.area.trim(),
    bound: state.bound.trim(),
    incoterms: state.incoterms.trim(),
    shipper: state.shipper.trim(),
    consignee: state.consignee.trim(),
    customer: state.customer.trim(),
    co_loader: state.co_loader.trim(),
    pic: state.pic.trim(),
    phone: state.phone.trim(),
    email: state.email.trim(),
    container_volumes: state.container_volumes.map((r) => ({
      type: r.type.trim(),
      size: r.size.trim(),
      total_quantity: r.total_quantity.trim(),
    })),
    commodity: state.commodity.trim(),
    commodity_vi: state.commodity_vi.trim(),
    procedure_code: state.procedure_code.trim(),
    hs_code: state.hs_code.trim(),
    cds_quantity: state.cds_quantity.trim(),
    custom_remark: state.custom_remark.trim(),
    attachments: state.attachments.map((r) => ({
      label: r.label.trim(),
      file_name: r.file_name.trim(),
      file_url: r.file_url.trim(),
    })),
    schedule_rows: state.schedule_rows.map((r) => ({
      from: r.from.trim(),
      etd: r.etd.trim(),
      departure_time_to: r.departure_time_to.trim(),
      eta: r.eta.trim(),
      arrival_time: r.arrival_time.trim(),
      carrier: r.carrier.trim(),
      carrier_name: r.carrier_name.trim(),
    })),
  };
}

// --- UI Components ---
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-bold uppercase tracking-tight text-slate-500">
      {children}
    </label>
  );
}

function textInputClass() {
  return 'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-[12px] font-medium focus:ring-2 focus:ring-teal-500/20';
}

const cell = 'box-border h-8 min-w-0 rounded border border-slate-200 px-1.5 text-[11px] focus:ring-2 focus:ring-teal-500/20';

function CuCardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex h-full min-w-0 flex-col overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{title}</h2>
      </div>
      <div className="flex flex-col space-y-3 p-4">{children}</div>
    </section>
  );
}

// --- Main Component ---
interface CustomsTabProps {
  shipmentId?: string;
  customsClearances: CustomsClearance[];
  newCustomsHsCode: string;
  setNewCustomsHsCode: (val: string) => void;
  newPhytosanitaryStatus: CreateCustomsClearanceDto['phytosanitary_status'];
  setNewPhytosanitaryStatus: (val: CreateCustomsClearanceDto['phytosanitary_status']) => void;
  newHsConfirmed: boolean;
  setNewHsConfirmed: (val: boolean) => void;
  isCreatingCustoms: boolean;
  handleCreateCustoms: () => void;
  handleChangeCustomsStatus: (id: string, status: CustomsClearance['status']) => void;
  handleDeleteCustoms: (id: string) => void;
  customsActionLoadingId: string | null;
}

const BOUND_OPTIONS = [
  { value: 'import', label: 'Import' },
  { value: 'export', label: 'Export' },
  { value: 'domestic', label: 'Domestic' },
  { value: 'transit', label: 'Transit' },
];

const CustomsTab: React.FC<CustomsTabProps> = ({
  shipmentId, customsClearances, newCustomsHsCode, setNewCustomsHsCode,
  newPhytosanitaryStatus, setNewPhytosanitaryStatus, newHsConfirmed, setNewHsConfirmed,
  isCreatingCustoms, handleCreateCustoms, handleChangeCustomsStatus, handleDeleteCustoms,
  customsActionLoadingId
}) => {
  const { success, error: toastError } = useToastContext();
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [customsState, setCustomsState] = useState<CustomsTabState>(emptyCustomsTabState());
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [uploadingAttachmentIdx, setUploadingAttachmentIdx] = useState<number | null>(null);

  useEffect(() => {
    if (shipmentId && isDetailsExpanded) {
      loadCustomsDetails();
    }
  }, [shipmentId, isDetailsExpanded]);

  const loadCustomsDetails = async () => {
    if (!shipmentId) return;
    try {
      setIsLoadingDetails(true);
      const shipment = await shipmentService.getShipmentById(shipmentId);
      if (shipment?.service_details?.customs) {
        setCustomsState(parseCustomsTab(shipment.service_details.customs));
      }
    } catch (err) {
      console.error('Failed to load customs details:', err);
      toastError('Failed to load customs details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!shipmentId) return;
    try {
      setIsSavingDetails(true);
      const shipment = await shipmentService.getShipmentById(shipmentId);
      const currentServiceDetails = shipment?.service_details || {};
      
      await shipmentService.updateShipment(shipmentId, {
        service_details: {
          ...currentServiceDetails,
          customs: mergeCustomsPersisted(customsState)
        }
      });
      success('Customs details saved successfully');
    } catch (err) {
      console.error('Failed to save customs details:', err);
      toastError('Failed to save customs details');
    } finally {
      setIsSavingDetails(false);
    }
  };

  const setField = <K extends keyof CustomsTabState>(key: K, value: CustomsTabState[K]) => {
    setCustomsState((prev) => ({ ...prev, [key]: value }));
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
      setCustomsState((t) => ({
        ...t,
        attachments: t.attachments.map((r, j) =>
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

  const scheduleHeaders = [
    { key: 'from' as const, label: 'From' },
    { key: 'etd' as const, label: 'ETD', date: true },
    { key: 'departure_time_to' as const, label: 'Departure Time to' },
    { key: 'eta' as const, label: 'ETA', date: true },
    { key: 'arrival_time' as const, label: 'Arrival Time' },
    { key: 'carrier' as const, label: 'Carrier' },
    { key: 'carrier_name' as const, label: 'Carrier Name' },
  ];

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-teal-50 bg-teal-50/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-teal-600" />
            <span className="text-[12px] font-bold text-teal-600 uppercase tracking-wider">Customs & Phytosanitary</span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">Customs Records ({customsClearances.length})</p>
            {customsClearances.length === 0 ? (
              <p className="text-[12px] text-slate-400">No customs declaration available.</p>
            ) : (
              <div className="space-y-1.5">
                {customsClearances.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="font-bold text-slate-700">{item.declaration_no || item.hs_code}</span>
                    <div className="flex items-center gap-1.5">
                      <select value={item.status} onChange={e => handleChangeCustomsStatus(item.id, e.target.value as CustomsClearance['status'])}
                        disabled={customsActionLoadingId === item.id}
                        className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-bold uppercase">
                        <option value="draft">draft</option><option value="submitted">submitted</option>
                        <option value="inspecting">inspecting</option><option value="released">released</option>
                        <option value="on_hold">on_hold</option><option value="rejected">rejected</option>
                      </select>
                      <button onClick={() => handleDeleteCustoms(item.id)} disabled={customsActionLoadingId === item.id}
                        className="p-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={11} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {shipmentId ? (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
              <p className="text-[11px] font-bold text-slate-600 uppercase">Add New Declaration</p>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={newCustomsHsCode} onChange={e => setNewCustomsHsCode(e.target.value)} placeholder="HS Code"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[12px] focus:ring-2 focus:ring-teal-500/20" />
                <select value={newPhytosanitaryStatus} onChange={e => setNewPhytosanitaryStatus(e.target.value as CreateCustomsClearanceDto['phytosanitary_status'])}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[12px] focus:ring-2 focus:ring-teal-500/20">
                  <option value="pending">Phytosanitary: Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-[12px] text-slate-700 cursor-pointer">
                <input type="checkbox" checked={newHsConfirmed} onChange={e => setNewHsConfirmed(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500/20" />
                HS code confirmed
              </label>
              <button onClick={handleCreateCustoms} disabled={isCreatingCustoms || !newCustomsHsCode.trim()}
                className="w-full py-2 rounded-lg bg-teal-600 text-white text-[12px] font-bold disabled:opacity-50 hover:bg-teal-700 transition-colors shadow-sm border border-teal-700">
                {isCreatingCustoms ? 'Uploading...' : 'Add Customs'}
              </button>
            </div>
          ) : (
            <p className="text-[12px] text-red-500 italic">Save Shipment before adding declaration.</p>
          )}

          <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100">
            <p className="text-[11px] font-bold text-teal-500 uppercase mb-2">Lane Type</p>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[11px] font-bold border border-green-200">🟢 Green</span>
              <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-[11px] font-bold border border-yellow-200">🟡 Yellow</span>
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-bold border border-red-200">🔴 Red</span>
            </div>
          </div>
        </div>
      </section>

      {/* Customs Details Section */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div 
          className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
        >
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-slate-600" />
            <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Customs Details</span>
          </div>
          {isDetailsExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
        
        {isDetailsExpanded && (
          <div className="p-5">
            {!shipmentId ? (
              <p className="text-[12px] text-slate-500 italic">Save Shipment before editing customs details.</p>
            ) : isLoadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-teal-600" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button 
                    onClick={handleSaveDetails} 
                    disabled={isSavingDetails}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-[12px] font-bold hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {isSavingDetails ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Details
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="min-w-0">
                    <FieldLabel>Inner Ref No.</FieldLabel>
                    <input
                      value={customsState.inner_job_no}
                      onChange={(e) => setField('inner_job_no', e.target.value)}
                      className={textInputClass()}
                    />
                  </div>
                  <div className="min-w-0">
                    <FieldLabel>Area</FieldLabel>
                    <input value={customsState.area} onChange={(e) => setField('area', e.target.value)} className={textInputClass()} />
                  </div>
                  <div className="min-w-0">
                    <FieldLabel>Bound</FieldLabel>
                    <SearchableSelect
                      options={BOUND_OPTIONS}
                      value={customsState.bound || undefined}
                      onValueChange={(v) => setField('bound', (v as JobBound) || '')}
                      placeholder="Select bound"
                      searchPlaceholder="Search bound…"
                      hideSearch
                    />
                  </div>
                  <div className="min-w-0">
                    <FieldLabel>Incoterms</FieldLabel>
                    <input
                      value={customsState.incoterms}
                      onChange={(e) => setField('incoterms', e.target.value)}
                      className={textInputClass()}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-4 xl:items-stretch">
                  <div className="min-h-0 min-w-0 xl:col-span-2">
                    <CuCardSection title="Party information">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <FieldLabel>Shipper</FieldLabel>
                          <textarea
                            value={customsState.shipper}
                            onChange={(e) => setField('shipper', e.target.value)}
                            rows={2}
                            className={`${textInputClass()} resize-y`}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <FieldLabel>Consignee</FieldLabel>
                          <textarea
                            value={customsState.consignee}
                            onChange={(e) => setField('consignee', e.target.value)}
                            rows={2}
                            className={`${textInputClass()} resize-y`}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <FieldLabel>Customer</FieldLabel>
                          <textarea
                            value={customsState.customer}
                            onChange={(e) => setField('customer', e.target.value)}
                            rows={2}
                            className={`${textInputClass()} resize-y`}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <FieldLabel>Co-loader</FieldLabel>
                          <input
                            value={customsState.co_loader}
                            onChange={(e) => setField('co_loader', e.target.value)}
                            className={textInputClass()}
                          />
                        </div>
                        <div>
                          <FieldLabel>PIC</FieldLabel>
                          <input value={customsState.pic} onChange={(e) => setField('pic', e.target.value)} className={textInputClass()} />
                        </div>
                        <div>
                          <FieldLabel>Phone</FieldLabel>
                          <input
                            value={customsState.phone}
                            onChange={(e) => setField('phone', e.target.value)}
                            className={textInputClass()}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <FieldLabel>Email</FieldLabel>
                          <input
                            type="email"
                            value={customsState.email}
                            onChange={(e) => setField('email', e.target.value)}
                            className={textInputClass()}
                          />
                        </div>
                      </div>
                    </CuCardSection>
                  </div>

                  <div className="min-h-0 min-w-0 xl:col-span-2">
                    <CuCardSection title="Total Container Volume">
                      <div className="mb-0 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setCustomsState((t) => ({
                              ...t,
                              container_volumes: [...t.container_volumes, emptyCustomsContainerRow()],
                            }))
                          }
                          className="inline-flex items-center gap-1 text-[12px] font-bold text-teal-600 hover:underline"
                        >
                          <Plus size={14} />
                          Add row
                        </button>
                      </div>
                      <div className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-left text-[11px]">
                          <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                              {(['Type', 'Size', 'Total Quantity'] as const).map((h) => (
                                <th
                                  key={h}
                                  className="whitespace-nowrap px-2 py-2 font-bold uppercase text-slate-500"
                                >
                                  {h}
                                </th>
                              ))}
                              <th className="w-10 px-1" aria-label="Actions" />
                            </tr>
                          </thead>
                          <tbody>
                            {customsState.container_volumes.map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-100 last:border-0">
                                <td className="p-1 align-middle">
                                  <input
                                    value={row.type}
                                    onChange={(e) =>
                                      setCustomsState((t) => ({
                                        ...t,
                                        container_volumes: t.container_volumes.map((r, j) =>
                                          j === idx ? { ...r, type: e.target.value } : r,
                                        ),
                                      }))
                                    }
                                    className={`${cell} w-[100px]`}
                                  />
                                </td>
                                <td className="p-1 align-middle">
                                  <input
                                    value={row.size}
                                    onChange={(e) =>
                                      setCustomsState((t) => ({
                                        ...t,
                                        container_volumes: t.container_volumes.map((r, j) =>
                                          j === idx ? { ...r, size: e.target.value } : r,
                                        ),
                                      }))
                                    }
                                    className={`${cell} w-[80px]`}
                                  />
                                </td>
                                <td className="p-1 align-middle">
                                  <input
                                    value={row.total_quantity}
                                    onChange={(e) =>
                                      setCustomsState((t) => ({
                                        ...t,
                                        container_volumes: t.container_volumes.map((r, j) =>
                                          j === idx ? { ...r, total_quantity: e.target.value } : r,
                                        ),
                                      }))
                                    }
                                    className={`${cell} w-[100px]`}
                                  />
                                </td>
                                <td className="p-1 align-middle">
                                  <button
                                    type="button"
                                    disabled={customsState.container_volumes.length <= 1}
                                    onClick={() =>
                                      setCustomsState((t) =>
                                        t.container_volumes.length <= 1
                                          ? t
                                          : { ...t, container_volumes: t.container_volumes.filter((_, j) => j !== idx) },
                                      )
                                    }
                                    className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-100 disabled:opacity-40"
                                    aria-label="Remove row"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CuCardSection>
                  </div>

                  <div className="min-h-0 min-w-0 xl:col-span-2">
                    <CuCardSection title="Cargo Information">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <FieldLabel>Commodity</FieldLabel>
                          <input
                            value={customsState.commodity}
                            onChange={(e) => setField('commodity', e.target.value)}
                            className={textInputClass()}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <FieldLabel>Commodity in Vietnamese</FieldLabel>
                          <input
                            value={customsState.commodity_vi}
                            onChange={(e) => setField('commodity_vi', e.target.value)}
                            className={textInputClass()}
                          />
                        </div>
                        <div>
                          <FieldLabel>Procedure Code</FieldLabel>
                          <input
                            value={customsState.procedure_code}
                            onChange={(e) => setField('procedure_code', e.target.value)}
                            className={textInputClass()}
                          />
                        </div>
                        <div>
                          <FieldLabel>CDs Quantity</FieldLabel>
                          <input
                            value={customsState.cds_quantity}
                            onChange={(e) => setField('cds_quantity', e.target.value)}
                            className={textInputClass()}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <FieldLabel>Custom Remark</FieldLabel>
                          <textarea
                            value={customsState.custom_remark}
                            onChange={(e) => setField('custom_remark', e.target.value)}
                            rows={3}
                            className={`${textInputClass()} resize-y`}
                          />
                        </div>
                      </div>
                    </CuCardSection>
                  </div>

                  <div className="min-h-0 min-w-0 xl:col-span-2">
                    <CuCardSection title="Attachment">
                      <div className="mb-0 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setCustomsState((t) => ({
                              ...t,
                              attachments: [...t.attachments, emptyCustomsAttachmentRow()],
                            }))
                          }
                          className="inline-flex items-center gap-1 text-[12px] font-bold text-teal-600 hover:underline"
                        >
                          <Plus size={14} />
                          Add row
                        </button>
                      </div>
                      <div className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-left text-[11px]">
                          <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                              {(['Attachments', 'File Name', 'Action'] as const).map((h) => (
                                <th
                                  key={h}
                                  className="whitespace-nowrap px-2 py-2 font-bold uppercase text-slate-500"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {customsState.attachments.map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-100 last:border-0">
                                <td className="p-1 align-middle">
                                  <input
                                    value={row.label}
                                    onChange={(e) =>
                                      setCustomsState((t) => ({
                                        ...t,
                                        attachments: t.attachments.map((r, j) =>
                                          j === idx ? { ...r, label: e.target.value } : r,
                                        ),
                                      }))
                                    }
                                    className={`${cell} w-[180px]`}
                                    placeholder="Description"
                                  />
                                </td>
                                <td className="p-1 align-middle">
                                  <span
                                    className="block max-w-[220px] truncate px-1 text-[11px] text-slate-500"
                                    title={row.file_name}
                                  >
                                    {row.file_name || '—'}
                                  </span>
                                </td>
                                <td className="p-1 align-middle">
                                  <div className="flex flex-wrap items-center gap-1">
                                    <input
                                      id={`customs-att-file-${idx}`}
                                      type="file"
                                      className="sr-only"
                                      onChange={(e) => void handleAttachmentFile(idx, e)}
                                    />
                                    <label
                                      htmlFor={`customs-att-file-${idx}`}
                                      className="inline-flex h-8 cursor-pointer items-center gap-1 rounded border border-slate-200 px-2 text-[11px] font-semibold hover:bg-slate-50"
                                    >
                                      {uploadingAttachmentIdx === idx ? (
                                        <Loader2 size={14} className="animate-spin" />
                                      ) : (
                                        <Upload size={14} />
                                      )}
                                      Choose file
                                    </label>
                                    <button
                                      type="button"
                                      disabled={customsState.attachments.length <= 1}
                                      onClick={() =>
                                        setCustomsState((t) =>
                                          t.attachments.length <= 1
                                            ? t
                                            : { ...t, attachments: t.attachments.filter((_, j) => j !== idx) },
                                        )
                                      }
                                      className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-100 disabled:opacity-40"
                                      aria-label="Remove row"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CuCardSection>
                  </div>

                  <div className="min-h-0 min-w-0 xl:col-span-4">
                    <CuCardSection title="Schedule">
                      <div className="mb-0 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setCustomsState((t) => ({
                              ...t,
                              schedule_rows: [...t.schedule_rows, emptyCustomsScheduleRow()],
                            }))
                          }
                          className="inline-flex items-center gap-1 text-[12px] font-bold text-teal-600 hover:underline"
                        >
                          <Plus size={14} />
                          Add row
                        </button>
                      </div>
                      <div className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-left text-[11px]">
                          <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                              {scheduleHeaders.map(({ label }) => (
                                <th
                                  key={label}
                                  className="whitespace-nowrap px-2 py-2 font-bold uppercase text-slate-500"
                                >
                                  {label}
                                </th>
                              ))}
                              <th className="w-10 px-1" aria-label="Actions" />
                            </tr>
                          </thead>
                          <tbody>
                            {customsState.schedule_rows.map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-100 last:border-0">
                                {scheduleHeaders.map(({ key, date }) => (
                                  <td key={key} className="p-1 align-middle">
                                    {date ? (
                                      <DateInput
                                        dense
                                        value={row[key] as string}
                                        onChange={(v) =>
                                          setCustomsState((t) => ({
                                            ...t,
                                            schedule_rows: t.schedule_rows.map((r, j) =>
                                              j === idx ? { ...r, [key]: v } : r,
                                            ),
                                          }))
                                        }
                                        className="min-w-[108px]"
                                      />
                                    ) : (
                                      <input
                                        value={row[key]}
                                        onChange={(e) =>
                                          setCustomsState((t) => ({
                                            ...t,
                                            schedule_rows: t.schedule_rows.map((r, j) =>
                                              j === idx ? { ...r, [key]: e.target.value } : r,
                                            ),
                                          }))
                                        }
                                        className={`${cell} min-w-[88px]`}
                                      />
                                    )}
                                  </td>
                                ))}
                                <td className="p-1 align-middle">
                                  <button
                                    type="button"
                                    disabled={customsState.schedule_rows.length <= 1}
                                    onClick={() =>
                                      setCustomsState((t) =>
                                        t.schedule_rows.length <= 1
                                          ? t
                                          : { ...t, schedule_rows: t.schedule_rows.filter((_, j) => j !== idx) },
                                      )
                                    }
                                    className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-100 disabled:opacity-40"
                                    aria-label="Remove row"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CuCardSection>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomsTab;
