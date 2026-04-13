import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Phone, MapPin,
  Loader2, AlertCircle,
  Shield, Star,
  Edit2, Check, X as XIcon, Globe, Layers, Clock3, Tag, Fingerprint, Hash,
  Pencil, User, Plus,
} from 'lucide-react';
import {
  customerService,
  CUSTOMER_STATUS_VALUES,
  type CustomerDetails,
  type CustomerStatus,
  type CustomerNote,
  type Shipment
} from '../../services/customerService';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { formatDate } from '../../lib/utils';
import { clsx } from 'clsx';
import { useToastContext } from '../../contexts/ToastContext';
import { WorkflowStepper, type WorkflowStep } from '../../components/ui/WorkflowStepper';
import { Contact, PhoneCall, Mail, Users, XCircle } from 'lucide-react';

const CUSTOMER_STATUS_STEPS: WorkflowStep<CustomerStatus>[] = [
  { id: 'new', label: 'New', icon: Contact },
  { id: 'follow_up', label: 'Follow Up', icon: PhoneCall },
  { id: 'quotation_sent', label: 'Quotation Sent', icon: Mail },
  { id: 'meeting', label: 'Meeting', icon: Users },
  { id: 'lost', label: 'Lost', icon: XCircle, isCancel: true },
];

type LeftTab = 'pic' | 'sales_purchasing' | 'routing' | 'notes' | 'credit';

type InfoFormState = {
  company_name: string;
  local_name: string;
  english_name: string;
  customer_group: string;
  customer_source: string;
  code: string;
  rank: number;
  tax_code: string;
  website: string;
  phone: string;
  customer_class: string;
  country: string;
  state_province: string;
  address: string;
  office_address: string;
  bl_address: string;
  email: string;
  status: CustomerStatus;
};

type SalesFormState = {
  sales_staff: string;
  sales_team: string;
  sales_department: string;
  company_id_number: string;
  industry: string;
};

type ShipmentRoutePreview = Shipment & {
  pol?: string;
  pod?: string;
  commodity?: string;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};



const normalizeStatus = (status: string | undefined): CustomerStatus => {
  if (status && CUSTOMER_STATUS_VALUES.includes(status as CustomerStatus)) {
    return status as CustomerStatus;
  }
  return 'new';
};

/** Header subtitle: prefer customer code, else short id (same idea as quotation Q-… on SalesEditorPage). */
const formatCustomerDocLabel = (code: string | undefined, customerId: string): string => {
  const c = (code || '').trim();
  if (c) return c.toUpperCase();
  return `C-${customerId.slice(0, 8).toUpperCase()}`;
};

const CustomerDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToastContext();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setDynamicTitle } = useBreadcrumb();

  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>('pic');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [_statusSaving, setStatusSaving] = useState(false);
  const [hoverRank, setHoverRank] = useState<number | null>(null);
  const [infoForm, setInfoForm] = useState<InfoFormState>({
    company_name: '', local_name: '', english_name: '', customer_group: '',
    customer_source: '', code: '', rank: 0, tax_code: '', website: '',
    phone: '', customer_class: '', country: '', state_province: '',
    address: '', office_address: '', bl_address: '', email: '', status: 'new'
  });

  const [isEditingSales, setIsEditingSales] = useState(false);
  const [salesForm, setSalesForm] = useState<SalesFormState>({
    sales_staff: '',
    sales_team: '',
    sales_department: '',
    company_id_number: '',
    industry: ''
  });

  useEffect(() => {
    if (customer) {
      setDynamicTitle(customer.company_name);
    }
    return () => setDynamicTitle(null);
  }, [customer, setDynamicTitle]);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await customerService.getCustomerDetails(id!);
      setCustomer(data);
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, 'Failed to fetch customer details'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleStartEditInfo = () => {
    if (!customer) return;
    setInfoForm({
      company_name: customer.company_name || '',
      local_name: customer.local_name || '',
      english_name: customer.english_name || '',
      customer_group: customer.customer_group || '',
      customer_source: customer.customer_source || '',
      code: customer.code || '',
      rank: customer.rank || 0,
      tax_code: customer.tax_code || '',
      website: customer.website || '',
      phone: customer.phone || '',
      customer_class: customer.customer_class || '',
      country: customer.country || '',
      state_province: customer.state_province || '',
      address: customer.address || '',
      office_address: customer.office_address || '',
      bl_address: customer.bl_address || '',
      email: customer.email || '',
      status: normalizeStatus(customer.status)
    });
    setIsEditingInfo(true);
  };

  const handleCancelEditInfo = () => {
    setIsEditingInfo(false);
  };

  const handleSaveInfo = async () => {
    try {
      if (!infoForm.company_name) {
        toastError('Company name is required');
        return;
      }
      if (!customer) return;
      setIsSavingInfo(true);
      await customerService.updateCustomer(customer.id, infoForm);
      setIsEditingInfo(false);
      fetchDetails();
      toastSuccess('Customer updated successfully');
    } catch (err: unknown) {
      toastError(getErrorMessage(err, 'Failed to save customer'));
    } finally {
      setIsSavingInfo(false);
    }
  };

  const updateInfoField = (key: keyof InfoFormState, value: any) => {
    setInfoForm(prev => ({ ...prev, [key]: value }));
  };

  /** Persist a status change to the backend immediately (without needing edit mode). */
  const applyCustomerStatus = useCallback(async (next: CustomerStatus) => {
    if (!customer) return;
    const prev = normalizeStatus(customer.status);
    if (prev === next) return;
    try {
      setStatusSaving(true);
      await customerService.updateCustomer(customer.id, { status: next });
      setCustomer(c => c ? { ...c, status: next } : c);
      const prevLabel = CUSTOMER_STATUS_STEPS.find(s => s.id === prev)?.label || prev;
      const nextLabel = CUSTOMER_STATUS_STEPS.find(s => s.id === next)?.label || next;
      toastSuccess(`Customer status changed from "${prevLabel}" to "${nextLabel}"`);
    } catch (err: unknown) {
      toastError(getErrorMessage(err, 'Failed to update status'));
    } finally {
      setStatusSaving(false);
    }
  }, [customer, toastSuccess, toastError]);

  const handleStartEditSales = () => {
    if (!customer) return;
    setSalesForm({
      sales_staff: customer.sales_staff || '',
      sales_team: customer.sales_team || '',
      sales_department: customer.sales_department || '',
      company_id_number: customer.company_id_number || '',
      industry: customer.industry || ''
    });
    setIsEditingSales(true);
  };

  const handleSaveSalesPurch = async () => {
    try {
      await customerService.updateCustomer(customer!.id, salesForm);
      setIsEditingSales(false);
      fetchDetails();
      toastSuccess('Sales information updated successfully');
    } catch (err: unknown) {
      toastError(getErrorMessage(err, 'Failed to update sales info'));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h3 className="text-xl font-bold">Error Loading Profile</h3>
      </div>
    );
  }

  const LEFT_TABS: { id: LeftTab, label: string }[] = [
    { id: 'pic', label: 'PIC' },
    { id: 'sales_purchasing', label: 'Sales/Purch' },
    { id: 'routing', label: 'Routing' },
    { id: 'notes', label: 'Notes' },
    { id: 'credit', label: 'Credit' }
  ];

  const displayLastUpdated = customer.updated_at || customer.created_at;
  const displayLastUpdatedText = displayLastUpdated
    ? new Date(displayLastUpdated).toLocaleString()
    : '—';
  const customerStatus = normalizeStatus(customer.status);
  const customerDocLabel = formatCustomerDocLabel(customer.code, customer.id);
  const pageHeading = 'Customer details';
  const companySubtitle = customer.company_name?.trim() || '—';

  const desktopStatusRow = (
    <div className="flex w-full items-center justify-end overflow-x-auto">
      <WorkflowStepper steps={CUSTOMER_STATUS_STEPS} currentStep={customerStatus} onStepChange={applyCustomerStatus} variant="desktop" />
    </div>
  );

  const mobileStatusRow = (
    <div className="w-full overflow-x-auto pb-0.5">
      <WorkflowStepper steps={CUSTOMER_STATUS_STEPS} currentStep={customerStatus} onStepChange={applyCustomerStatus} variant="mobile" />
    </div>
  );

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:min-h-0 md:pb-12">
      {/* Mobile header — aligned with SalesEditorPage */}
      <div className="shrink-0 flex items-center gap-3 border-b border-border bg-white px-4 py-3.5 md:hidden">
        <button
          type="button"
          onClick={() => navigate('/customers/directory')}
          className="flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-xl border border-border bg-slate-50 text-slate-600 transition-all touch-manipulation hover:border-primary/20 hover:bg-white hover:text-primary"
          aria-label="Back to list"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-3 self-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-black leading-tight tracking-tight text-slate-900">
              {pageHeading}
            </h2>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-muted-foreground">
              <span className="font-bold text-primary">{customerDocLabel}</span>
              <span className="font-medium text-slate-400"> · {companySubtitle}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm md:hidden">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</div>
        {mobileStatusRow}
      </div>

      <div className="mb-6 hidden shrink-0 px-0 md:block">
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm shadow-slate-200/40">
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-br from-white via-white to-slate-50/40 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/customers/directory')}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-slate-600 shadow-sm transition-all touch-manipulation hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
                aria-label="Back to list"
              >
                <ChevronLeft size={22} />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-black tracking-tight text-slate-900 lg:text-2xl">{pageHeading}</h1>
                <p className="mt-1 truncate text-[13px] font-medium text-muted-foreground">
                  <span className="font-bold text-primary">{customerDocLabel}</span>
                  <span className="text-slate-500"> · {companySubtitle}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2 lg:shrink-0 lg:justify-end">
              {isEditingInfo ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEditInfo}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-[12px] font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.99]"
                  >
                    <XIcon size={15} />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInfo}
                    disabled={isSavingInfo}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-[12px] font-bold text-white shadow-md shadow-primary/25 transition-all hover:bg-primary/90 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45"
                  >
                    {isSavingInfo ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                    {isSavingInfo ? 'Saving…' : 'Save changes'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleStartEditInfo}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-[12px] font-bold text-white shadow-md transition-all hover:bg-slate-800 active:scale-[0.99]"
                >
                  <Pencil size={15} />
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3 lg:px-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</span>
            </div>
            {desktopStatusRow}
          </div>
        </div>
      </div>

      {/* MAIN PROFILE LAYOUT */}
      <div className="w-full px-4 md:px-0">
        <div className="relative flex w-full flex-col overflow-hidden rounded-[2rem] border border-border bg-white p-5 shadow-sm">
          <div className="relative animate-in fade-in zoom-in-95 space-y-3 border-b border-border/60 pb-4 duration-300">
            <div className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
              Info
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              {/* LEFT COLUMN */}
              <div className="grid grid-cols-2 gap-2">
                <div className={clsx('col-span-2 p-3 rounded-xl border bg-slate-50/60', isEditingInfo ? 'border-primary/20 bg-primary/[0.02]' : 'border-border')}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Local Name</div>
                  {isEditingInfo ? (
                    <input type="text" value={infoForm.local_name} onChange={e => updateInfoField('local_name', e.target.value)} className="w-full mt-0.5 px-2 py-1 bg-white border border-border rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                  ) : (
                    <div className="text-[12px] font-black text-slate-800 mt-0.5">{customer.local_name || '—'}</div>
                  )}
                </div>
                <div className={clsx('col-span-2 p-3 rounded-xl border bg-slate-50/60', isEditingInfo ? 'border-primary/20 bg-primary/[0.02]' : 'border-border')}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer English Name</div>
                  {isEditingInfo ? (
                    <input type="text" value={infoForm.english_name} onChange={e => updateInfoField('english_name', e.target.value)} className="w-full mt-0.5 px-2 py-1 bg-white border border-border rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                  ) : (
                    <div className="text-[12px] font-black text-slate-800 mt-0.5">{customer.english_name || '—'}</div>
                  )}
                </div>
                <div className={clsx('p-3 rounded-xl border', isEditingInfo ? 'border-primary/20 bg-primary/[0.02]' : 'border-border bg-white')}>
                  <div className="flex items-center gap-1.5 text-slate-400"><Layers size={12} /><span className="text-[10px] font-bold uppercase tracking-wider">Customer Group</span></div>
                  {isEditingInfo ? (
                    <input type="text" value={infoForm.customer_group} onChange={e => updateInfoField('customer_group', e.target.value)} className="w-full mt-1 px-2 py-1 bg-white border border-border rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                  ) : (
                    <div className="text-[12px] font-black text-slate-800 mt-1">{customer.customer_group || '—'}</div>
                  )}
                </div>
                <div className={clsx('p-3 rounded-xl border', isEditingInfo ? 'border-primary/20 bg-primary/[0.02]' : 'border-border bg-white')}>
                  <div className="flex items-center gap-1.5 text-slate-400"><Tag size={12} /><span className="text-[10px] font-bold uppercase tracking-wider">Customer Source</span></div>
                  {isEditingInfo ? (
                    <input type="text" value={infoForm.customer_source} onChange={e => updateInfoField('customer_source', e.target.value)} className="w-full mt-1 px-2 py-1 bg-white border border-border rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                  ) : (
                    <div className="text-[12px] font-black text-slate-800 mt-1">{customer.customer_source || '—'}</div>
                  )}
                </div>
                <div className={clsx('p-3 rounded-xl border', isEditingInfo ? 'border-primary/20 bg-primary/[0.02]' : 'border-border bg-white')}>
                  <div className="flex items-center gap-1.5 text-slate-400"><Hash size={12} /><span className="text-[10px] font-bold uppercase tracking-wider">Customer Code</span></div>
                  {isEditingInfo ? (
                    <input type="text" value={infoForm.code} onChange={e => updateInfoField('code', e.target.value.toUpperCase().slice(0, 3))} maxLength={3} className="w-full mt-1 px-2 py-1 bg-white border border-border rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all uppercase tracking-widest" />
                  ) : (
                    <div className="text-[12px] font-black text-slate-800 mt-1">{customer.code || '—'}</div>
                  )}
                </div>
                <div className={clsx('p-3 rounded-xl border', isEditingInfo ? 'border-primary/20 bg-primary/[0.02]' : 'border-border bg-white')}>
                  <div className="flex items-center gap-1.5 text-slate-400"><Star size={12} /><span className="text-[10px] font-bold uppercase tracking-wider">Priority</span></div>
                  <div
                    className="flex items-center gap-1.5 mt-1"
                    onMouseLeave={() => setHoverRank(null)}
                  >
                    {[1, 2, 3].map((star) => {
                      const currentRank = isEditingInfo
                        ? (hoverRank !== null ? hoverRank : infoForm.rank)
                        : (hoverRank !== null ? hoverRank : (customer.rank || 0));
                      const isFull = currentRank >= star;
                      const isHalf = currentRank === star - 0.5;
                      return (
                        <button
                          key={star}
                          type="button"
                          disabled={!isEditingInfo}
                          onMouseMove={(e) => {
                            if (!isEditingInfo) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const mid = rect.left + rect.width / 2;
                            setHoverRank(e.clientX < mid ? star - 0.5 : star);
                          }}
                          onClick={() => {
                            if (!isEditingInfo) return;
                            updateInfoField('rank', hoverRank !== null ? hoverRank : star);
                          }}
                          className="flex items-center justify-center focus:outline-none focus:scale-110 transition-transform disabled:hover:scale-100 p-0.5 rounded-md hover:bg-slate-100 relative w-6 h-6"
                        >
                          <div className="relative w-5 h-5">
                            <Star size={20} className="absolute inset-0 fill-slate-200 text-slate-300" />
                            {(isFull || isHalf) && (
                              <div className={clsx('absolute inset-y-0 left-0 overflow-hidden text-left', isHalf ? 'w-[50%]' : 'w-full')}>
                                <Star size={20} className="fill-amber-400 text-amber-400 drop-shadow-sm min-w-[20px]" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="grid grid-cols-2 gap-2">
                <div className={clsx('col-span-2 p-3 rounded-xl border', isEditingInfo ? 'border-primary/20 bg-primary/[0.02]' : 'border-border bg-white')}>
                  <div className="flex items-center gap-1.5 text-slate-400"><Shield size={12} /><span className="text-[10px] font-bold uppercase tracking-wider">Tax Code</span></div>
                  {isEditingInfo ? (
                    <input type="text" value={infoForm.tax_code} onChange={e => updateInfoField('tax_code', e.target.value)} className="w-full mt-1 px-2 py-1 bg-white border border-border rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                  ) : (
                    <div className="text-[12px] font-black text-slate-800 mt-1">{customer.tax_code || '—'}</div>
                  )}
                </div>
                <div className={clsx('p-3 rounded-xl border', isEditingInfo ? 'border-primary/20 bg-primary/[0.02]' : 'border-border bg-white')}>
                  <div className="flex items-center gap-1.5 text-slate-400"><Phone size={12} /><span className="text-[10px] font-bold uppercase tracking-wider">Phone</span></div>
                  {isEditingInfo ? (
                    <input type="text" value={infoForm.phone} onChange={e => updateInfoField('phone', e.target.value)} className="w-full mt-1 px-2 py-1 bg-white border border-border rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                  ) : (
                    <div className="text-[12px] font-black text-slate-800 mt-1">{customer.phone || '—'}</div>
                  )}
                </div>
                <div className={clsx('p-3 rounded-xl border', isEditingInfo ? 'border-primary/20 bg-primary/[0.02]' : 'border-border bg-white')}>
                  <div className="flex items-center gap-1.5 text-slate-400"><Globe size={12} /><span className="text-[10px] font-bold uppercase tracking-wider">Website</span></div>
                  {isEditingInfo ? (
                    <input type="url" value={infoForm.website} onChange={e => updateInfoField('website', e.target.value)} className="w-full mt-1 px-2 py-1 bg-white border border-border rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                  ) : (
                    <div className="text-[12px] font-black text-slate-800 mt-1 truncate">{customer.website || '—'}</div>
                  )}
                </div>
                <div className={clsx('col-span-2 p-3 rounded-xl border', isEditingInfo ? 'border-primary/20 bg-primary/[0.02]' : 'border-border bg-white')}>
                  <div className="flex items-center gap-1.5 text-slate-400"><MapPin size={12} /><span className="text-[10px] font-bold uppercase tracking-wider">Address</span></div>
                  {isEditingInfo ? (
                    <textarea value={infoForm.address} onChange={e => updateInfoField('address', e.target.value)} className="w-full mt-1 px-2 py-1 bg-white border border-border rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none min-h-[60px]" />
                  ) : (
                    <div className="text-[12px] font-black text-slate-800 mt-1">{customer.address || '—'}</div>
                  )}
                </div>
                <div className={clsx('col-span-2 p-3 rounded-xl border', isEditingInfo ? 'border-primary/20 bg-primary/[0.02]' : 'border-border bg-white')}>
                  <div className="flex items-center gap-1.5 text-slate-400"><Fingerprint size={12} /><span className="text-[10px] font-bold uppercase tracking-wider">Office Address</span></div>
                  {isEditingInfo ? (
                    <textarea value={infoForm.office_address} onChange={e => updateInfoField('office_address', e.target.value)} className="w-full mt-1 px-2 py-1 bg-white border border-border rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none min-h-[60px]" />
                  ) : (
                    <div className="text-[12px] font-black text-slate-800 mt-1">{customer.office_address || '—'}</div>
                  )}
                </div>
                <div className={clsx('col-span-2 p-3 rounded-xl border', isEditingInfo ? 'border-primary/20 bg-primary/[0.02]' : 'border-border bg-white')}>
                  <div className="flex items-center gap-1.5 text-slate-400"><Fingerprint size={12} /><span className="text-[10px] font-bold uppercase tracking-wider">B/L Address</span></div>
                  {isEditingInfo ? (
                    <textarea value={infoForm.bl_address} onChange={e => updateInfoField('bl_address', e.target.value)} className="w-full mt-1 px-2 py-1 bg-white border border-border rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none min-h-[60px]" />
                  ) : (
                    <div className="text-[12px] font-black text-slate-800 mt-1">{customer.bl_address || '—'}</div>
                  )}
                </div>
                <div className={clsx('p-3 rounded-xl border', isEditingInfo ? 'border-primary/20 bg-primary/[0.02]' : 'border-border bg-white')}>
                  <div className="flex items-center gap-1.5 text-slate-400"><Globe size={12} /><span className="text-[10px] font-bold uppercase tracking-wider">Country</span></div>
                  {isEditingInfo ? (
                    <input type="text" value={infoForm.country} onChange={e => updateInfoField('country', e.target.value)} className="w-full mt-1 px-2 py-1 bg-white border border-border rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                  ) : (
                    <div className="text-[12px] font-black text-slate-800 mt-1">{customer.country || '—'}</div>
                  )}
                </div>
                <div className={clsx('p-3 rounded-xl border', isEditingInfo ? 'border-primary/20 bg-primary/[0.02]' : 'border-border bg-white')}>
                  <div className="flex items-center gap-1.5 text-slate-400"><MapPin size={12} /><span className="text-[10px] font-bold uppercase tracking-wider">State/Province</span></div>
                  {isEditingInfo ? (
                    <input type="text" value={infoForm.state_province} onChange={e => updateInfoField('state_province', e.target.value)} className="w-full mt-1 px-2 py-1 bg-white border border-border rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                  ) : (
                    <div className="text-[12px] font-black text-slate-800 mt-1">{customer.state_province || '—'}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-white">
              <div className="flex items-center gap-1.5 text-slate-400"><Clock3 size={12} /><span className="text-[10px] font-bold uppercase tracking-wider">Last Updated</span></div>
              <div className="text-[12px] font-black text-slate-800 mt-1">{displayLastUpdatedText}</div>
            </div>
          </div>

          {/* TAB SELECTOR */}
          <div className="flex flex-wrap gap-1.5 py-4 border-b border-border/60">
            {LEFT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveLeftTab(tab.id)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  activeLeftTab === tab.id
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div className="pt-4 flex-1">

            {activeLeftTab === 'pic' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                {customer.contacts && customer.contacts.length > 0 ? (
                  customer.contacts.map(contact => (
                    <div key={contact.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="font-bold text-[12px] text-slate-900">{contact.full_name}</div>
                      <div className="text-[10px] text-primary font-bold">{contact.position || contact.department || 'Contact'}</div>
                      <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                        <div>{contact.phone}</div>
                        <div className="truncate">{contact.email}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-[11px] font-bold text-slate-400 py-4">No PIC data</div>
                )}
              </div>
            )}

            {activeLeftTab === 'sales_purchasing' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-1">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales Information</div>
                    {isEditingSales ? (
                      <div className="flex items-center gap-1">
                        <button onClick={handleSaveSalesPurch} className="p-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"><Check size={14} /></button>
                        <button onClick={() => setIsEditingSales(false)} className="p-1 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><XIcon size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={handleStartEditSales} className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline">
                        <Edit2 size={12} /> Edit
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 text-[12px]">
                    <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Sales Executive</span>
                    {isEditingSales ? (
                      <input type="text" value={salesForm.sales_staff} onChange={e => setSalesForm({ ...salesForm, sales_staff: e.target.value })} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50" />
                    ) : (
                      <span className="font-black text-slate-800">{customer.sales_staff || '—'}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 text-[12px]">
                    <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Sales Team</span>
                    {isEditingSales ? (
                      <input type="text" value={salesForm.sales_team} onChange={e => setSalesForm({ ...salesForm, sales_team: e.target.value })} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50" />
                    ) : (
                      <span className="font-black text-slate-800">{customer.sales_team || '—'}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 text-[12px]">
                    <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Sales Department</span>
                    {isEditingSales ? (
                      <input type="text" value={salesForm.sales_department} onChange={e => setSalesForm({ ...salesForm, sales_department: e.target.value })} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50" />
                    ) : (
                      <span className="font-black text-slate-800">{customer.sales_department || '—'}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-border/60 pb-1">Other Information</div>

                  <div className="flex flex-col gap-1 text-[12px]">
                    <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Company ID</span>
                    {isEditingSales ? (
                      <input type="text" value={salesForm.company_id_number} onChange={e => setSalesForm({ ...salesForm, company_id_number: e.target.value })} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50" />
                    ) : (
                      <span className="font-black text-slate-800">{customer.company_id_number || '—'}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 text-[12px]">
                    <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Industry</span>
                    {isEditingSales ? (
                      <input type="text" value={salesForm.industry} onChange={e => setSalesForm({ ...salesForm, industry: e.target.value })} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-black text-slate-800 outline-none focus:border-primary/50" />
                    ) : (
                      <span className="font-black text-slate-800">{customer.industry || '—'}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeLeftTab === 'routing' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Preferred Routes</div>
                {customer.shipments?.slice(0, 4).map((s: ShipmentRoutePreview) => (
                  <div key={s.id} className="text-[11px] font-bold text-slate-700 bg-slate-50 p-2 rounded-lg truncate">
                    {s.pol && s.pod ? `${s.pol} -> ${s.pod}` : s.commodity || 'General Logistics'}
                  </div>
                )) || <div className="text-[11px] text-slate-400">No data</div>}
              </div>
            )}

            {activeLeftTab === 'notes' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                {customer.notes?.map((n: CustomerNote) => (
                  <div key={n.id} className="p-3 bg-amber-50/30 rounded-xl border border-amber-100/50">
                    <div className="text-[10px] font-black text-amber-600 mb-1">{formatDate(n.created_at)}</div>
                    <div className="text-[11px] text-slate-700 font-medium leading-relaxed">{n.content}</div>
                  </div>
                )) || <div className="text-[11px] text-slate-400">No notes</div>}
              </div>
            )}

            {activeLeftTab === 'credit' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Credit Limit</div>
                  <div className="text-xl font-black text-emerald-900 mt-1">{customer.credit_limit?.toLocaleString() || 0}</div>
                  <div className="text-[10px] text-emerald-700/60 font-bold mt-0.5">VNĐ</div>
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-xl">
                  <span className="text-[11px] font-bold text-slate-500">Payment Terms</span>
                  <span className="text-[12px] font-black text-slate-900">Net {customer.credit_term_days || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(15,23,42,0.07)] backdrop-blur-md md:hidden">
        {!isEditingInfo ? (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate('/customers/directory')}
              className="min-h-[48px] shrink-0 touch-manipulation rounded-xl border border-border bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleStartEditInfo}
              className="inline-flex min-h-[48px] flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-slate-800 active:scale-[0.99]"
            >
              <Pencil size={16} />
              <span className="truncate">Edit</span>
            </button>
          </div>
        ) : (
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              onClick={handleCancelEditInfo}
              className="min-h-[48px] shrink-0 touch-manipulation rounded-xl border border-border bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveInfo}
              disabled={isSavingInfo}
              className="flex min-h-[48px] flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-white shadow-md shadow-primary/20 hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-45"
            >
              {isSavingInfo ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
              {isSavingInfo ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailsPage;
