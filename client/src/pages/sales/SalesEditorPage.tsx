import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import {
  Briefcase,
  Calendar,
  ChevronLeft,
  FileText,
  Loader2,
  Package,
  Pencil,
  Plus,
  Printer,
  Ship,
  Tag,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { DateInput } from '../../components/ui/DateInput';
import { DateTimePicker24h } from '../../components/ui/DateTimePicker';
import { ThreeStarRating } from '../../components/ui/ThreeStarRating';
import type { QuotationStatus, Sales, SalesFormState } from './types';
import type { ChargeGroup, SalesChargeItem } from './types';
import type { Shipment } from '../shipments/types';
import type { ExchangeRate } from '../../services/exchangeRateService';
import type { Employee } from '../../services/employeeService';
import { salesService } from '../../services/salesService';
import { shipmentService } from '../../services/shipmentService';
import { exchangeRateService } from '../../services/exchangeRateService';
import { employeeService } from '../../services/employeeService';
import {
  salesChargeCatalogService,
  type SalesChargeCatalog,
} from '../../services/salesChargeCatalogService';
import {
  salesUnitCatalogService,
  type SalesUnitCatalog,
} from '../../services/salesUnitCatalogService';
import { useToastContext } from '../../contexts/ToastContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { SalesChargeCatalogDialog } from './dialogs/SalesChargeCatalogDialog';
import { SalesUnitCatalogDialog } from './dialogs/SalesUnitCatalogDialog';
import { customerService } from '../../services/customerService';
import { jobService } from '../../services/jobService';
import { buildJobCreatePayloadFromQuotation } from '../jobs/quotationToJobPayload';
import { Edit3, Send, CheckCircle2, FileCheck, CheckSquare } from 'lucide-react';
import { WorkflowStepper, type WorkflowStep } from '../../components/ui/WorkflowStepper';

export const QUOTATION_STATUS_STEPS: WorkflowStep<QuotationStatus>[] = [
  { id: 'draft', label: 'Draft', icon: Edit3 },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'converted', label: 'Converted', icon: CheckCircle2 },
  { id: 'confirmed', label: 'Confirmed', icon: CheckSquare },
  { id: 'final', label: 'Final', icon: FileCheck },
];


const INITIAL_FORM_STATE: SalesFormState = {
  shipment_id: '',
  status: 'draft',
  priority_rank: 1,
  quotation_type: 'service_breakdown',
  charge_items: [],
  items: [],
};

interface Props {
  mode: 'add' | 'edit' | 'detail';
}

interface SalesEditorFormProps {
  mode: 'add' | 'edit' | 'detail';
  onClose: () => void;
  onCancelEdit?: () => void;
  formState: SalesFormState;
  setFormField: <K extends keyof SalesFormState>(key: K, value: SalesFormState[K]) => void;
  patchFormState: (patch: Partial<SalesFormState>) => void;
  shipmentOptions: (Shipment & { value: string; label: string })[];
  exchangeRates: ExchangeRate[];
  employees: Employee[];
  chargeCatalog: SalesChargeCatalog[];
  unitCatalog: SalesUnitCatalog[];
  onChargeCatalogCreated: (item: SalesChargeCatalog) => void;
  onUnitCatalogCreated: (item: SalesUnitCatalog) => void;
  onSave: () => void;
  onEdit?: () => void;
  onPersistedStatusChange?: (status: QuotationStatus) => void;
}

/** Breadcrumb / display: prefer server doc no., else same as “Quotation No.” in the form. */
const formatQuotationBreadcrumbLabel = (noDoc: string | undefined, saleId: string | undefined): string | null => {
  const doc = (noDoc || '').trim();
  if (doc) return doc;
  if (saleId) return `Q-${saleId.slice(0, 8).toUpperCase()}`;
  return null;
};

const normalizeQuotationStatus = (s?: string): QuotationStatus => {
  const allowed = QUOTATION_STATUS_STEPS.map((x) => x.id);
  if (s && (allowed as string[]).includes(s)) return s as QuotationStatus;
  return 'draft';
};

/** Workflow stepper + send email action. Status transitions are handled by clicking steps directly. */
const QuotationWorkflowBar: React.FC<{
  variant: 'desktop' | 'mobile';
  currentStatus: QuotationStatus;
  statusSaving: boolean;
  onSendEmail: () => void;
  onStepChange?: (status: QuotationStatus) => void;
}> = ({
  variant,
  currentStatus,
  statusSaving,
  onSendEmail,
  onStepChange,
}) => {
  const stepper = (
    <WorkflowStepper steps={QUOTATION_STATUS_STEPS} currentStep={currentStatus} variant={variant} onStepChange={onStepChange} />
  );

  if (variant === 'mobile') {
    return (
      <div className="md:hidden mx-4 mt-3 rounded-xl border border-border bg-white px-4 py-3 space-y-3 shadow-sm">
        <button
          type="button"
          className="inline-flex items-center justify-center min-h-9 px-4 py-2 rounded-lg bg-primary text-white text-[11px] font-bold uppercase tracking-wide shadow-sm shadow-primary/15 hover:bg-primary/90 transition-colors disabled:opacity-45 disabled:pointer-events-none"
          onClick={onSendEmail}
          disabled={statusSaving}
        >
          Send email
        </button>
        <div className="w-full overflow-x-auto pb-0.5">{stepper}</div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <button
        type="button"
        className="inline-flex items-center justify-center min-h-9 px-4 py-2 rounded-lg bg-primary text-white text-[11px] font-bold uppercase tracking-wide shadow-sm shadow-primary/15 hover:bg-primary/90 transition-colors disabled:opacity-45 disabled:pointer-events-none"
        onClick={onSendEmail}
        disabled={statusSaving}
      >
        Send email
      </button>
      <div className="flex min-w-0 flex-1 items-center justify-end overflow-x-auto md:max-w-[55%] lg:max-w-none lg:flex-initial">
        {stepper}
      </div>
    </div>
  );
};

const CHARGE_GROUPS: Array<{ group: ChargeGroup; title: string }> = [
  { group: 'freight', title: 'Freight Charges' },
  { group: 'other', title: 'Other Charges' },
  { group: 'on_behalf', title: 'On-behalf Charges' },
];

const toDateInput = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const calculateRow = (row: SalesChargeItem) => {
  const quantity = Number(row.quantity || 0);
  const unitPrice = Number(row.unit_price || 0);
  const vatPercent = Number(row.vat_percent || 0);
  const amountExVat = quantity * unitPrice;
  const vatAmount = (amountExVat * vatPercent) / 100;
  return { amountExVat, vatAmount };
};

const normalizeChargeCurrency = (c?: string) => {
  const u = (c || 'VND').trim().toUpperCase();
  return u || 'VND';
};

/** VND per 1 unit of line currency — same semantics as Exchange Rates (1 unit → rate VNĐ). */
const getChargeLineVndMultiplier = (
  currency: string | undefined,
  rateByCode: Map<string, number>,
): number | null => {
  const code = normalizeChargeCurrency(currency);
  if (code === 'VND') return 1;
  const r = rateByCode.get(code);
  if (r == null || !(r > 0)) return null;
  return r;
};

const formatChargeAmountVnd = (amountVnd: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(amountVnd));

const ztrim = (s?: string) => (s || '').replace(/[\u200b-\u200d\ufeff]/g, '').trim();

/** Row with no substantive data (save filter / read-only / totals) */
const isBlankChargeRow = (row: SalesChargeItem) =>
  !ztrim(row.freight_code) &&
  !ztrim(row.charge_name) &&
  !ztrim(row.charge_type) &&
  !ztrim(row.unit) &&
  !ztrim(row.note) &&
  (Number(row.quantity) || 0) === 0 &&
  (Number(row.unit_price) || 0) === 0 &&
  (Number(row.vat_percent) || 0) === 0;

const isPureTrailingBlankRow = (row: SalesChargeItem) =>
  isBlankChargeRow(row) && !row._mobileNewSlot;

const newBlankChargeRow = (group: ChargeGroup, currency: string): SalesChargeItem => ({
  charge_group: group,
  freight_code: '',
  charge_name: '',
  charge_type: '',
  currency: currency || 'VND',
  unit: '',
  quantity: 0,
  unit_price: 0,
  vat_percent: 0,
  note: '',
});

/** Keep exactly one trailing blank row per group while editing */
const finalizeChargeGroupRows = (
  group: ChargeGroup,
  items: SalesChargeItem[],
  defaultCurrency: string,
): SalesChargeItem[] => {
  const rows = items.map((r) => ({ ...r }));
  if (rows.length === 0) {
    return [newBlankChargeRow(group, defaultCurrency)];
  }
  while (
    rows.length > 1 &&
    isPureTrailingBlankRow(rows[rows.length - 1]!) &&
    isPureTrailingBlankRow(rows[rows.length - 2]!)
  ) {
    rows.pop();
  }
  const last = rows[rows.length - 1]!;
  if (!(isBlankChargeRow(last) && !last._mobileNewSlot)) {
    rows.push(newBlankChargeRow(group, defaultCurrency));
  }
  return rows;
};

const normalizeAllEditableChargeGroups = (
  items: SalesChargeItem[],
  defaultCurrency: string,
): SalesChargeItem[] => {
  const groups: ChargeGroup[] = ['freight', 'other', 'on_behalf'];
  const out: SalesChargeItem[] = [];
  for (const g of groups) {
    const groupRows = items.filter((i) => i.charge_group === g);
    const finalized = finalizeChargeGroupRows(g, groupRows, defaultCurrency);
    finalized.forEach((item, index) => {
      out.push({ ...item, charge_group: g, display_order: index });
    });
  }
  return out;
};

const serializeChargeItemsForCompare = (items: SalesChargeItem[]) =>
  JSON.stringify(
    items.map((r) => ({
      g: r.charge_group,
      o: r.display_order,
      fc: ztrim(r.freight_code),
      cn: ztrim(r.charge_name),
      ct: ztrim(r.charge_type),
      u: ztrim(r.unit),
      n: ztrim(r.note),
      q: Number(r.quantity) || 0,
      p: Number(r.unit_price) || 0,
      v: Number(r.vat_percent) || 0,
      c: r.currency || '',
      ms: !!r._mobileNewSlot,
    })),
  );

const filterNonBlankChargeItems = (items: SalesChargeItem[]) =>
  items.filter((r) => !isBlankChargeRow(r));

const cloneFormState = (state: SalesFormState): SalesFormState => JSON.parse(JSON.stringify(state));

const pickCustomerTradeName = (c?: {
  local_name?: string;
  english_name?: string;
  company_name?: string;
}) => {
  const v = [c?.local_name, c?.english_name, c?.company_name].find((x) => x && String(x).trim());
  return v ? String(v).trim() : '';
};

type MobileSectionTone = 'blue' | 'emerald' | 'violet' | 'indigo';

const MOBILE_TONE: Record<
  MobileSectionTone,
  { border: string; headBg: string; headBorder: string; icon: string; title: string; field: string; ro: string }
> = {
  blue: {
    border: 'border-blue-100',
    headBg: 'bg-blue-50/50',
    headBorder: 'border-blue-50',
    icon: 'text-blue-600',
    title: 'text-blue-600',
    field:
      'w-full px-4 py-2.5 bg-blue-50/30 border border-blue-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/15 font-medium disabled:opacity-60 placeholder:text-blue-500/35',
    ro: 'w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700',
  },
  emerald: {
    border: 'border-emerald-100',
    headBg: 'bg-emerald-50/50',
    headBorder: 'border-emerald-50',
    icon: 'text-emerald-600',
    title: 'text-emerald-600',
    field:
      'w-full px-4 py-2.5 bg-emerald-50/30 border border-emerald-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/15 font-medium disabled:opacity-60 placeholder:text-emerald-500/35',
    ro: 'w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700',
  },
  violet: {
    border: 'border-violet-100',
    headBg: 'bg-violet-50/50',
    headBorder: 'border-violet-50',
    icon: 'text-violet-600',
    title: 'text-violet-600',
    field:
      'w-full px-4 py-2.5 bg-violet-50/30 border border-violet-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500/15 font-medium disabled:opacity-60 placeholder:text-violet-500/35',
    ro: 'w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700',
  },
  indigo: {
    border: 'border-indigo-100',
    headBg: 'bg-indigo-50/50',
    headBorder: 'border-indigo-50',
    icon: 'text-indigo-600',
    title: 'text-indigo-600',
    field:
      'w-full px-4 py-2.5 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/15 font-medium disabled:opacity-60 placeholder:text-indigo-500/35',
    ro: 'w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700',
  },
};

const MobileFormSection: React.FC<{
  tone: MobileSectionTone;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}> = ({ tone, title, icon: Icon, children }) => {
  const t = MOBILE_TONE[tone];
  return (
    <div className={clsx('bg-white rounded-2xl border shadow-sm overflow-hidden', t.border)}>
      <div className={clsx('px-4 py-2.5 border-b flex items-center gap-2', t.headBorder, t.headBg)}>
        <Icon size={16} className={t.icon} />
        <span className={clsx('text-[11px] font-bold uppercase tracking-wider', t.title)}>{title}</span>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
};

const mobileLabelClass = 'text-[13px] font-bold text-foreground flex items-center gap-2';

const CHARGE_GROUP_MOBILE: Record<
  ChargeGroup,
  { tone: MobileSectionTone; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  freight: { tone: 'blue', icon: Package },
  other: { tone: 'emerald', icon: Tag },
  on_behalf: { tone: 'violet', icon: Users },
};

const SalesEditorPage: React.FC<Props> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { success: toastSuccess, error: toastError } = useToastContext();
  const { setDynamicTitle } = useBreadcrumb();

  const [loading, setLoading] = useState(mode !== 'add');
  const [saving, setSaving] = useState(false);
  const [isInlineEditing, setIsInlineEditing] = useState(mode === 'edit');
  const [formState, setFormState] = useState<SalesFormState>(INITIAL_FORM_STATE);
  const [loadedFormState, setLoadedFormState] = useState<SalesFormState | null>(null);
  const effectiveMode: 'add' | 'edit' | 'detail' = mode === 'detail'
    ? (isInlineEditing ? 'edit' : 'detail')
    : mode;

  useEffect(() => {
    setIsInlineEditing(mode === 'edit');
  }, [mode]);

  useEffect(() => {
    if (mode === 'add') {
      setDynamicTitle('New quotation');
      return () => setDynamicTitle(null);
    }
    const label = formatQuotationBreadcrumbLabel(formState.no_doc, formState.id ?? id);
    setDynamicTitle(label);
    return () => setDynamicTitle(null);
  }, [mode, formState.no_doc, formState.id, id, setDynamicTitle]);

  const [shipments, setShipments] = useState<(Shipment & { value: string; label: string })[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [chargeCatalog, setChargeCatalog] = useState<SalesChargeCatalog[]>([]);
  const [unitCatalog, setUnitCatalog] = useState<SalesUnitCatalog[]>([]);

  const setFormField = <K extends keyof SalesFormState>(key: K, value: SalesFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const patchFormState = useCallback((patch: Partial<SalesFormState>) => {
    setFormState((prev) => ({ ...prev, ...patch }));
  }, []);

  const logisticsPrefillShipmentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (mode !== 'add') return;
    if (!formState.shipment_id) {
      logisticsPrefillShipmentIdRef.current = null;
      return;
    }
    const ship = shipments.find((s) => s.value === formState.shipment_id);
    if (!ship) return;
    if (logisticsPrefillShipmentIdRef.current === formState.shipment_id) return;
    logisticsPrefillShipmentIdRef.current = formState.shipment_id;
    setFormState((prev) => ({
      ...prev,
      bill_no: ship.bill_no || '',
      customs_declaration_no: ship.customs_declaration_no || '',
      incoterms: ship.term || '',
    }));
  }, [mode, formState.shipment_id, shipments]);

  const setFormStateFromItem = (item: Sales) => {
    const mapped: SalesFormState = {
      id: item.id,
      no_doc: item.no_doc,
      shipment_id: item.shipment_id,
      quote_date: item.quote_date,
      status: item.status,
      priority_rank: item.priority_rank,
      quotation_type: item.quotation_type,
      due_date: item.due_date,
      validity_from: item.validity_from,
      validity_to: item.validity_to,
      sales_person_id: item.sales_person_id,
      customer_trade_name: item.customer_trade_name,
      customer_contact_name: item.customer_contact_name,
      customer_contact_email: item.customer_contact_email,
      customer_contact_tel: item.customer_contact_tel,
      pickup: item.pickup,
      final_destination: item.final_destination,
      cargo_volume: item.cargo_volume,
      business_team: item.business_team,
      business_department: item.business_department,
      goods: item.goods,
      transit_time: item.transit_time,
      service_mode: item.service_mode,
      direction: item.direction,
      currency_code: item.currency_code,
      job_no: item.job_no,
      sales_inquiry_no: item.sales_inquiry_no,
      bill_no: item.bill_no ?? item.shipments?.bill_no ?? '',
      customs_declaration_no: item.customs_declaration_no ?? item.shipments?.customs_declaration_no ?? '',
      incoterms: item.incoterms ?? item.shipments?.term ?? '',
      notes: item.notes,
      exchange_rate: item.exchange_rate,
      exchange_rate_date: item.exchange_rate_date,
      items:
        item.sales_items?.map((si) => ({
          id: si.id,
          description: si.description,
          rate: si.rate,
          quantity: si.quantity,
          unit: si.unit,
          currency: si.currency,
          exchange_rate: si.exchange_rate,
          tax_percent: si.tax_percent,
        })) || [],
      charge_items: item.sales_charge_items || [],
      relatedShipment: item.shipments,
    };
    setFormState(cloneFormState(mapped));
    setLoadedFormState(cloneFormState(mapped));
  };

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [shipmentsData, ratesData, employeesData, chargeCatalogData, unitCatalogData] =
          await Promise.all([
            shipmentService.getShipments(1, 100),
            exchangeRateService.getAll(),
            employeeService.getEmployees(),
            salesChargeCatalogService.getAll().catch(() => [] as SalesChargeCatalog[]),
            salesUnitCatalogService.getAll().catch(() => [] as SalesUnitCatalog[]),
          ]);

        const shipmentList = Array.isArray(shipmentsData)
          ? shipmentsData
          : (shipmentsData as { data?: Shipment[] }).data || [];

        setShipments(
          shipmentList.map((shipment: Shipment) => ({
            ...shipment,
            value: shipment.id,
            label: `${shipment.code || `#${shipment.id.slice(0, 8)}`} - ${shipment.customers?.company_name || 'No Customer'}`,
          })),
        );
        setExchangeRates(ratesData || []);
        setEmployees(employeesData || []);
        setChargeCatalog(Array.isArray(chargeCatalogData) ? chargeCatalogData : []);
        setUnitCatalog(Array.isArray(unitCatalogData) ? unitCatalogData : []);
      } catch (err) {
        console.error('Failed to fetch editor static data:', err);
      }
    };

    fetchStaticData();
  }, []);

  useEffect(() => {
    if (mode === 'add') {
      setFormState(INITIAL_FORM_STATE);
      setLoading(false);
      return;
    }

    if (!id) {
      navigate('/financials/sales', { replace: true });
      return;
    }

    const fetchItem = async () => {
      try {
        setLoading(true);
        const item = await salesService.getSalesItemById(id);
        setFormStateFromItem(item);
      } catch (err: any) {
        console.error('Failed to fetch sales item:', err);
        toastError(err?.message || 'Failed to load quotation');
        navigate('/financials/sales', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [mode, id, navigate, toastError]);

  const handleSave = async () => {
    try {
      if (!formState.shipment_id) {
        toastError('Please select a shipment');
        return;
      }

      const payload: SalesFormState = {
        ...formState,
        charge_items: filterNonBlankChargeItems(
          (formState.charge_items || []).map(({ _mobileNewSlot: _ms, ...r }) => r),
        ),
      };

      setSaving(true);
      if (effectiveMode === 'edit' && formState.id) {
        await salesService.updateSalesItem(formState.id, payload);
        toastSuccess('Sales item updated successfully');

        // Keep detail users on the same page and switch back to read-only view.
        if (mode === 'detail') {
          setIsInlineEditing(false);
          return;
        }
      } else {
        await salesService.createSalesItem(payload);
        toastSuccess('Sales item created successfully');
      }

      navigate('/financials/sales', { replace: true });
    } catch (err: any) {
      console.error('Failed to save sales item:', err);
      toastError(err?.message || 'Failed to save sales item. Please check your data.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (loadedFormState) {
      setFormState(cloneFormState(loadedFormState));
    }

    if (mode === 'detail') {
      setIsInlineEditing(false);
      return;
    }

    if (mode === 'edit' && id) {
      navigate(`/financials/sales/${id}`, { replace: true });
      return;
    }

    navigate('/financials/sales');
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground text-[13px] font-bold">
          <Loader2 size={18} className="animate-spin" />
          Loading quotation...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 h-full">
      <SalesEditorForm
        mode={effectiveMode}
        onClose={() => navigate('/financials/sales')}
        onCancelEdit={handleCancelEdit}
        formState={formState}
        setFormField={setFormField}
        patchFormState={patchFormState}
        shipmentOptions={shipments}
        exchangeRates={exchangeRates}
        employees={employees}
        chargeCatalog={chargeCatalog}
        unitCatalog={unitCatalog}
        onChargeCatalogCreated={(item) => {
          setChargeCatalog((prev) => {
            const next = prev.filter((x) => x.freight_code !== item.freight_code);
            next.push(item);
            next.sort((a, b) => a.freight_code.localeCompare(b.freight_code));
            return next;
          });
        }}
        onUnitCatalogCreated={(item) => {
          setUnitCatalog((prev) => {
            const next = prev.filter((x) => x.id !== item.id);
            next.push(item);
            next.sort((a, b) => a.code.localeCompare(b.code));
            return next;
          });
        }}
        onSave={handleSave}
        onEdit={() => {
          setIsInlineEditing(true);
        }}
        onPersistedStatusChange={(status) => {
          setLoadedFormState((prev) => (prev ? { ...prev, status } : prev));
        }}
      />

      {saving && (
        <div className="fixed bottom-6 right-6 px-4 py-2 rounded-xl bg-slate-900 text-white text-[12px] font-bold shadow-lg z-50">
          Saving...
        </div>
      )}
    </div>
  );
};

const SalesEditorForm: React.FC<SalesEditorFormProps> = ({
  mode,
  onClose,
  onCancelEdit,
  formState,
  setFormField,
  patchFormState,
  shipmentOptions,
  exchangeRates,
  employees,
  chargeCatalog,
  unitCatalog,
  onChargeCatalogCreated,
  onUnitCatalogCreated,
  onSave,
  onEdit,
  onPersistedStatusChange,
}) => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToastContext();
  const [statusSaving, setStatusSaving] = useState(false);
  const [catalogBrowserOpen, setCatalogBrowserOpen] = useState(false);
  const [catalogBrowserTarget, setCatalogBrowserTarget] = useState<{
    group: ChargeGroup;
    index: number;
  } | null>(null);
  const [unitCatalogBrowserOpen, setUnitCatalogBrowserOpen] = useState(false);
  const [unitCatalogBrowserTarget, setUnitCatalogBrowserTarget] = useState<{
    group: ChargeGroup;
    index: number;
  } | null>(null);
  const [creatingJob, setCreatingJob] = useState(false);

  const exchangeRateByCode = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of exchangeRates) {
      m.set(r.currency_code.trim().toUpperCase(), r.rate);
    }
    return m;
  }, [exchangeRates]);

  const isReadOnly = mode === 'detail';
  const canPrintQuotation = mode === 'detail' && !!formState.id;
  const handlePrintQuotation = () => {
    if (!formState.id) return;
    navigate(`/financials/sales/quotation/${formState.id}`);
  };

  const handleCreateJobFromQuotation = useCallback(async () => {
    if (!formState.id || !formState.shipment_id) return;
    setCreatingJob(true);
    try {
      const ship =
        formState.relatedShipment || shipmentOptions.find((s) => s.value === formState.shipment_id);
      const payload = await buildJobCreatePayloadFromQuotation({ ...formState, relatedShipment: ship });
      const created = await jobService.createJob(payload);
      toastSuccess('Job created from quotation');
      navigate(`/shipping/jobs/${created.id}/edit`, {
        state: {
          jobCreatedFromQuotation: true,
          quotationBreadcrumb: {
            quotationId: formState.id,
            quotationLabel:
              formatQuotationBreadcrumbLabel(formState.no_doc, formState.id) ||
              `Q-${formState.id.slice(0, 8).toUpperCase()}`,
          },
        },
      });
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: unknown }).message ?? '')
          : '';
      toastError(msg || 'Could not create job');
    } finally {
      setCreatingJob(false);
    }
  }, [formState, shipmentOptions, navigate, toastSuccess, toastError]);
  const selectedShipment = formState.relatedShipment || shipmentOptions.find((s) => s.value === formState.shipment_id);
  const salesPersonOptions = employees.map((employee) => ({
    value: employee.id,
    label: employee.full_name,
  }));
  const selectedEmployee = employees.find((employee) => employee.id === formState.sales_person_id);

  const quotationStatus = normalizeQuotationStatus(formState.status);
  const canCreateJobFromQuotation =
    isReadOnly && quotationStatus === 'sent' && !!formState.id && !!formState.shipment_id;

  const quotationDocLabel = formatQuotationBreadcrumbLabel(formState.no_doc, formState.id);
  const pageHeading =
    mode === 'add' ? 'Create quotation' : mode === 'edit' ? 'Edit quotation' : 'Quotation details';

  const applyQuotationStatus = useCallback(
    async (next: QuotationStatus) => {
      const prev = normalizeQuotationStatus(formState.status);
      if (prev === next) return;
      setFormField('status', next);
      const id = formState.id;
      if (!id) return;
      try {
        setStatusSaving(true);
        await salesService.updateSalesItem(id, { status: next });
        onPersistedStatusChange?.(next);
        const prevLabel = QUOTATION_STATUS_STEPS.find(s => s.id === prev)?.label || prev;
        const nextLabel = QUOTATION_STATUS_STEPS.find(s => s.id === next)?.label || next;
        toastSuccess(`Quotation status changed from "${prevLabel}" to "${nextLabel}"`);
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'message' in e
            ? String((e as { message?: unknown }).message ?? '')
            : '';
        setFormField('status', prev);
        toastError(msg || 'Failed to update status');
      } finally {
        setStatusSaving(false);
      }
    },
    [
      formState.status,
      formState.id,
      setFormField,
      onPersistedStatusChange,
      toastSuccess,
      toastError,
    ],
  );

  const handleSendQuotationEmail = useCallback(() => {
    toastInfo('This feature is under development.');
  }, [toastInfo]);

  useEffect(() => {
    if (!formState.sales_person_id || !selectedEmployee || isReadOnly) return;

    if (formState.business_team !== (selectedEmployee.team || '')) {
      setFormField('business_team', selectedEmployee.team || '');
    }
    if (formState.business_department !== (selectedEmployee.department || '')) {
      setFormField('business_department', selectedEmployee.department || '');
    }
  }, [
    formState.sales_person_id,
    formState.business_team,
    formState.business_department,
    selectedEmployee,
    setFormField,
    isReadOnly,
  ]);

  useEffect(() => {
    if (!formState.currency_code || isReadOnly) return;

    if (formState.currency_code === 'VND') {
      if ((formState.exchange_rate || 0) !== 1) {
        setFormField('exchange_rate', 1);
      }
      if (!formState.exchange_rate_date) {
        setFormField('exchange_rate_date', new Date().toISOString());
      }
      return;
    }

    const rateObj = exchangeRates.find((rate) => rate.currency_code === formState.currency_code);
    if (!rateObj) return;

    if ((formState.exchange_rate || 0) !== rateObj.rate) {
      setFormField('exchange_rate', rateObj.rate);
    }
    if (formState.exchange_rate_date !== rateObj.updated_at) {
      setFormField('exchange_rate_date', rateObj.updated_at);
    }
  }, [
    formState.currency_code,
    formState.exchange_rate,
    formState.exchange_rate_date,
    exchangeRates,
    isReadOnly,
    setFormField,
  ]);

  useEffect(() => {
    if (mode !== 'add' || isReadOnly || !formState.shipment_id) return;

    const ship = shipmentOptions.find((s) => s.value === formState.shipment_id);
    if (!ship?.customer_id) return;

    let cancelled = false;

    const applyFromNestedOnly = () => {
      const c = ship.customers;
      patchFormState({
        relatedShipment: ship,
        customer_trade_name: pickCustomerTradeName(c),
        customer_contact_name: c?.sales_staff?.trim() || '',
        customer_contact_email: c?.email?.trim() || '',
        customer_contact_tel: c?.phone?.trim() || '',
      });
    };

    (async () => {
      try {
        const details = await customerService.getCustomerDetails(ship.customer_id);
        if (cancelled) return;

        const primary = details.contacts?.[0];
        patchFormState({
          relatedShipment: ship,
          customer_trade_name: pickCustomerTradeName(details),
          customer_contact_name:
            primary?.full_name?.trim() || details.sales_staff?.trim() || '',
          customer_contact_email: primary?.email?.trim() || details.email?.trim() || '',
          customer_contact_tel: primary?.phone?.trim() || details.phone?.trim() || '',
        });
      } catch {
        if (!cancelled) applyFromNestedOnly();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, isReadOnly, formState.shipment_id, shipmentOptions, patchFormState]);

  useLayoutEffect(() => {
    if (isReadOnly) return;
    const cur = formState.charge_items || [];
    const norm = normalizeAllEditableChargeGroups(cur, formState.currency_code || 'VND');
    if (serializeChargeItemsForCompare(cur) !== serializeChargeItemsForCompare(norm)) {
      setFormField('charge_items', norm);
    }
  }, [isReadOnly, formState.charge_items, formState.currency_code, setFormField]);

  const chargeItems = formState.charge_items || [];

  const getGroupItems = (group: ChargeGroup) => chargeItems.filter((item) => item.charge_group === group);

  const setGroupItems = (group: ChargeGroup, nextItems: SalesChargeItem[]) => {
    const otherItems = chargeItems.filter((item) => item.charge_group !== group);
    const currency = formState.currency_code || 'VND';
    const finalized = isReadOnly
      ? nextItems
      : finalizeChargeGroupRows(group, nextItems, currency);
    const normalized = finalized.map((item, index) => ({
      ...item,
      charge_group: group,
      display_order: index,
    }));
    setFormField('charge_items', [...otherItems, ...normalized]);
  };

  const handleRemoveChargeRow = (group: ChargeGroup, index: number) => {
    const groupItems = [...getGroupItems(group)];
    groupItems.splice(index, 1);
    setGroupItems(group, groupItems);
  };

  const updateChargeRow = (group: ChargeGroup, index: number, key: keyof SalesChargeItem, value: string | number) => {
    const groupItems = [...getGroupItems(group)];
    const prev = groupItems[index];
    if (!prev) return;
    const { _mobileNewSlot: _ms, ...rest } = prev;
    groupItems[index] = { ...rest, [key]: value };
    setGroupItems(group, groupItems);
  };

  const applyCatalogToChargeRow = (
    group: ChargeGroup,
    index: number,
    cat: { freight_code: string; charge_name: string; charge_type: string },
  ) => {
    const groupItems = [...getGroupItems(group)];
    const row = groupItems[index];
    if (!row) return;
    const { _mobileNewSlot: _ms, ...rest } = row;
    groupItems[index] = {
      ...rest,
      freight_code: cat.freight_code,
      charge_name: cat.charge_name,
      charge_type: cat.charge_type,
    };
    setGroupItems(group, groupItems);
  };

  const handleMobileAddChargeLine = (group: ChargeGroup) => {
    const groupItems = [...getGroupItems(group)];
    const currency = formState.currency_code || 'VND';
    const newRow: SalesChargeItem = { ...newBlankChargeRow(group, currency), _mobileNewSlot: true };
    if (groupItems.length === 0) {
      setGroupItems(group, [newRow]);
      return;
    }
    const insertAt = Math.max(0, groupItems.length - 1);
    groupItems.splice(insertAt, 0, newRow);
    setGroupItems(group, groupItems);
  };

  const handleFreightSelectChange = (group: ChargeGroup, index: number, code: string) => {
    if (!code) {
      applyCatalogToChargeRow(group, index, { freight_code: '', charge_name: '', charge_type: '' });
      return;
    }
    const found = chargeCatalog.find((c) => c.freight_code === code);
    if (found) {
      applyCatalogToChargeRow(group, index, found);
    } else {
      updateChargeRow(group, index, 'freight_code', code);
    }
  };

  const applyUnitCatalogToChargeRow = (group: ChargeGroup, index: number, item: SalesUnitCatalog) => {
    updateChargeRow(group, index, 'unit', item.code);
  };

  const buildFreightSelectOptions = (row: SalesChargeItem) => {
    const base = chargeCatalog.map((c) => ({
      value: c.freight_code,
      label: `[${c.freight_code}] ${c.charge_name}`,
    }));
    const code = (row.freight_code || '').trim();
    if (code && !base.some((o) => o.value === code)) {
      return [{ value: code, label: `[${code}] ${row.charge_name || '—'}` }, ...base];
    }
    return base;
  };

  const buildUnitSelectOptions = (row: SalesChargeItem) => {
    const base = unitCatalog
      .filter((u) => u.active)
      .map((u) => ({ value: u.code, label: `[${u.code}] ${u.name}` }));
    const code = (row.unit || '').trim();
    if (code && !base.some((o) => o.value === code)) {
      const known = unitCatalog.find((u) => u.code === code);
      const label = known
        ? `[${code}] ${known.name}${known.active ? '' : ' (inactive)'}`
        : `[${code}]`;
      return [{ value: code, label }, ...base];
    }
    return base;
  };

  const renderChargeTable = (group: ChargeGroup, title: string) => {
    const rows = isReadOnly
      ? getGroupItems(group).filter((r) => !isBlankChargeRow(r))
      : getGroupItems(group);

    const currencyOptions = [
      { value: 'VND', label: 'VND' },
      ...exchangeRates.map((rate) => ({ value: rate.currency_code, label: rate.currency_code })),
    ];

    const cg = CHARGE_GROUP_MOBILE[group];
    const toneCharge = MOBILE_TONE[cg.tone];
    const ChargeHeadIcon = cg.icon;

    const fieldClassMobile =
      'w-full min-h-[38px] px-2 py-1.5 border border-border rounded-lg text-[12px] bg-white touch-manipulation';
    const selectClassMobile = 'h-9 min-h-[38px] text-[12px] touch-manipulation';
    const labelMobile = 'text-[9px] font-bold uppercase tracking-wide text-muted-foreground leading-tight';

    const emptyMsg = (
      <div className="px-4 py-8 text-center text-[12px] text-muted-foreground italic">No charge lines.</div>
    );

    return (
      <>
        <div
          className={clsx(
            'md:hidden bg-white rounded-2xl border shadow-sm overflow-hidden',
            toneCharge.border,
          )}
        >
          <div
            className={clsx(
              'px-4 py-2.5 border-b flex items-center gap-2',
              toneCharge.headBorder,
              toneCharge.headBg,
            )}
          >
            <ChargeHeadIcon size={16} className={toneCharge.icon} />
            <span className={clsx('text-[11px] font-bold uppercase tracking-wider', toneCharge.title)}>{title}</span>
          </div>
          {rows.length === 0 ? (
            emptyMsg
          ) : (
            <div>
              {rows.map((row, index) => {
                const { amountExVat, vatAmount } = calculateRow(row);
                const vndMult = getChargeLineVndMultiplier(row.currency, exchangeRateByCode);
                const amountExVnd =
                  vndMult != null ? formatChargeAmountVnd(amountExVat * vndMult) : '—';
                const vatVnd = vndMult != null ? formatChargeAmountVnd(vatAmount * vndMult) : '—';
                const hideRemove =
                  isReadOnly || (index === rows.length - 1 && isPureTrailingBlankRow(row));
                return (
                  <div
                    key={`${group}-m-${row.id || index}`}
                    className="border-b border-border/60 last:border-b-0 p-2 space-y-2 bg-slate-50/40"
                  >
                    <div className="space-y-1 min-w-0">
                      <span className={labelMobile}>Freight code</span>
                      <SearchableSelect
                        options={buildFreightSelectOptions(row)}
                        value={row.freight_code || ''}
                        onValueChange={(value) => handleFreightSelectChange(group, index, value)}
                        disabled={isReadOnly}
                        placeholder="Select freight code…"
                        searchPlaceholder="Search code or name…"
                        emptyMessage="No results."
                        className={selectClassMobile}
                        footerAction={
                          !isReadOnly
                            ? {
                                label: 'Browse catalog',
                                onClick: () => {
                                  setCatalogBrowserTarget({ group, index });
                                  setCatalogBrowserOpen(true);
                                },
                              }
                            : undefined
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 min-w-0">
                      <div className="space-y-1 min-w-0">
                        <span className={labelMobile}>Charge name</span>
                        <input
                          value={row.charge_name || ''}
                          onChange={(e) => updateChargeRow(group, index, 'charge_name', e.target.value)}
                          disabled={isReadOnly}
                          className={fieldClassMobile}
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <span className={labelMobile}>Charge type</span>
                        <input
                          value={row.charge_type || ''}
                          onChange={(e) => updateChargeRow(group, index, 'charge_type', e.target.value)}
                          disabled={isReadOnly}
                          className={fieldClassMobile}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 min-w-0">
                      <div className="space-y-1 min-w-0">
                        <span className={labelMobile}>Currency</span>
                        <SearchableSelect
                          options={currencyOptions}
                          value={row.currency || 'VND'}
                          onValueChange={(value) => updateChargeRow(group, index, 'currency', value)}
                          disabled={isReadOnly}
                          hideSearch
                          hideClearIcon
                          className={selectClassMobile}
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <span className={labelMobile}>Unit</span>
                        <SearchableSelect
                          options={buildUnitSelectOptions(row)}
                          value={row.unit || ''}
                          onValueChange={(value) => updateChargeRow(group, index, 'unit', value)}
                          disabled={isReadOnly}
                          placeholder="Select unit…"
                          searchPlaceholder="Search code or name…"
                          emptyMessage="No units in catalog."
                          className={selectClassMobile}
                          footerAction={
                            !isReadOnly
                              ? {
                                  label: 'Browse catalog',
                                  onClick: () => {
                                    setUnitCatalogBrowserTarget({ group, index });
                                    setUnitCatalogBrowserOpen(true);
                                  },
                                }
                              : undefined
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 min-w-0">
                      <div className="space-y-1 min-w-0">
                        <span className={labelMobile}>Qty</span>
                        <input
                          type="number"
                          step="0.01"
                          value={row.quantity || 0}
                          onChange={(e) => updateChargeRow(group, index, 'quantity', Number(e.target.value) || 0)}
                          disabled={isReadOnly}
                          className={`${fieldClassMobile} text-right`}
                          inputMode="decimal"
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <span className={labelMobile}>Price</span>
                        <input
                          type="number"
                          step="0.01"
                          value={row.unit_price || 0}
                          onChange={(e) => updateChargeRow(group, index, 'unit_price', Number(e.target.value) || 0)}
                          disabled={isReadOnly}
                          className={`${fieldClassMobile} text-right`}
                          inputMode="decimal"
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <span className={labelMobile}>VAT %</span>
                        <input
                          type="number"
                          step="0.1"
                          value={row.vat_percent || 0}
                          onChange={(e) => updateChargeRow(group, index, 'vat_percent', Number(e.target.value) || 0)}
                          disabled={isReadOnly}
                          className={`${fieldClassMobile} text-right`}
                          inputMode="decimal"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-white border border-border/70 px-2 py-1.5">
                      <div>
                        <span className={`${labelMobile} block`}>Amt ex. VAT (VNĐ)</span>
                        <span className="text-[12px] font-bold tabular-nums">{amountExVnd}</span>
                      </div>
                      <div className="text-right">
                        <span className={`${labelMobile} block`}>VAT amt (VNĐ)</span>
                        <span className="text-[12px] font-bold tabular-nums">{vatVnd}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className={labelMobile}>Notes</span>
                      <textarea
                        rows={2}
                        value={row.note || ''}
                        onChange={(e) => updateChargeRow(group, index, 'note', e.target.value)}
                        disabled={isReadOnly}
                        className={`${fieldClassMobile} resize-none leading-snug`}
                      />
                    </div>
                    {!hideRemove && (
                      <div className="flex justify-end pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleRemoveChargeRow(group, index)}
                          className="inline-flex items-center gap-1 min-h-9 px-2 py-1 rounded-lg text-red-600 bg-red-50 border border-red-100 text-[11px] font-bold touch-manipulation active:scale-[0.98]"
                        >
                          <Trash2 size={14} />
                          Remove line
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {!isReadOnly && (
                <div className="p-2 pt-1 border-b border-border/60 last:border-b-0 bg-slate-50/30">
                  <button
                    type="button"
                    onClick={() => handleMobileAddChargeLine(group)}
                    className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-full border border-dashed border-primary/40 bg-primary/5 text-primary text-[12px] font-bold touch-manipulation active:scale-[0.99]"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                    Add line
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden md:block bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-3 py-3 sm:px-5 border-b border-border bg-muted/10">
            <h3 className="text-[13px] font-bold text-slate-900">{title}</h3>
          </div>
          {rows.length === 0 ? (
            emptyMsg
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-left border-separate border-spacing-0">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase border-b border-border">Freight Code</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase border-b border-border">Charge Name</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase border-b border-border">Charge Type</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase border-b border-border">Currency</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase border-b border-border">Unit</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase border-b border-border text-right">Quantity</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase border-b border-border text-right">Unit Price</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase border-b border-border text-right">VAT (%)</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase border-b border-border text-right">
                      Amount Excl. VAT (VNĐ)
                    </th>
                    <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase border-b border-border text-right">
                      VAT Amount (VNĐ)
                    </th>
                    <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase border-b border-border">Notes</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase border-b border-border text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const { amountExVat, vatAmount } = calculateRow(row);
                    const vndMult = getChargeLineVndMultiplier(row.currency, exchangeRateByCode);
                    const amountExVnd =
                      vndMult != null ? formatChargeAmountVnd(amountExVat * vndMult) : '—';
                    const vatVnd = vndMult != null ? formatChargeAmountVnd(vatAmount * vndMult) : '—';
                    return (
                      <tr key={`${group}-${row.id || index}`} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2 border-b border-border/60 min-w-[200px]">
                          <SearchableSelect
                            options={buildFreightSelectOptions(row)}
                            value={row.freight_code || ''}
                            onValueChange={(value) => handleFreightSelectChange(group, index, value)}
                            disabled={isReadOnly}
                            placeholder="Select freight code…"
                            searchPlaceholder="Search code or name…"
                            emptyMessage="No results."
                            className="h-8 text-[12px]"
                            footerAction={
                              !isReadOnly
                                ? {
                                    label: 'Browse catalog',
                                    onClick: () => {
                                      setCatalogBrowserTarget({ group, index });
                                      setCatalogBrowserOpen(true);
                                    },
                                  }
                                : undefined
                            }
                          />
                        </td>
                        <td className="px-3 py-2 border-b border-border/60">
                          <input value={row.charge_name || ''} onChange={(e) => updateChargeRow(group, index, 'charge_name', e.target.value)} disabled={isReadOnly} className="w-full px-2 py-1 border border-border rounded-md text-[12px]" />
                        </td>
                        <td className="px-3 py-2 border-b border-border/60">
                          <input value={row.charge_type || ''} onChange={(e) => updateChargeRow(group, index, 'charge_type', e.target.value)} disabled={isReadOnly} className="w-full px-2 py-1 border border-border rounded-md text-[12px]" />
                        </td>
                        <td className="px-3 py-2 border-b border-border/60">
                          <SearchableSelect
                            options={currencyOptions}
                            value={row.currency || 'VND'}
                            onValueChange={(value) => updateChargeRow(group, index, 'currency', value)}
                            disabled={isReadOnly}
                            hideSearch
                            hideClearIcon
                            className="h-8 text-[12px]"
                          />
                        </td>
                        <td className="px-3 py-2 border-b border-border/60 min-w-[140px]">
                          <SearchableSelect
                            options={buildUnitSelectOptions(row)}
                            value={row.unit || ''}
                            onValueChange={(value) => updateChargeRow(group, index, 'unit', value)}
                            disabled={isReadOnly}
                            placeholder="Select unit…"
                            searchPlaceholder="Search code or name…"
                            emptyMessage="No units in catalog."
                            className="h-8 text-[12px]"
                            footerAction={
                              !isReadOnly
                                ? {
                                    label: 'Browse catalog',
                                    onClick: () => {
                                      setUnitCatalogBrowserTarget({ group, index });
                                      setUnitCatalogBrowserOpen(true);
                                    },
                                  }
                                : undefined
                            }
                          />
                        </td>
                        <td className="px-3 py-2 border-b border-border/60">
                          <input type="number" step="0.01" value={row.quantity || 0} onChange={(e) => updateChargeRow(group, index, 'quantity', Number(e.target.value) || 0)} disabled={isReadOnly} className="w-full px-2 py-1 border border-border rounded-md text-[12px] text-right" />
                        </td>
                        <td className="px-3 py-2 border-b border-border/60">
                          <input type="number" step="0.01" value={row.unit_price || 0} onChange={(e) => updateChargeRow(group, index, 'unit_price', Number(e.target.value) || 0)} disabled={isReadOnly} className="w-full px-2 py-1 border border-border rounded-md text-[12px] text-right" />
                        </td>
                        <td className="px-3 py-2 border-b border-border/60">
                          <input type="number" step="0.1" value={row.vat_percent || 0} onChange={(e) => updateChargeRow(group, index, 'vat_percent', Number(e.target.value) || 0)} disabled={isReadOnly} className="w-full px-2 py-1 border border-border rounded-md text-[12px] text-right" />
                        </td>
                        <td className="px-3 py-2 border-b border-border/60 text-[12px] font-bold text-right tabular-nums">
                          {amountExVnd}
                        </td>
                        <td className="px-3 py-2 border-b border-border/60 text-[12px] font-bold text-right tabular-nums">
                          {vatVnd}
                        </td>
                        <td className="px-3 py-2 border-b border-border/60">
                          <input value={row.note || ''} onChange={(e) => updateChargeRow(group, index, 'note', e.target.value)} disabled={isReadOnly} className="w-full px-2 py-1 border border-border rounded-md text-[12px]" />
                        </td>
                        <td className="px-3 py-2 border-b border-border/60 text-center w-16">
                          <button
                            type="button"
                            onClick={() => handleRemoveChargeRow(group, index)}
                            disabled={isReadOnly}
                            aria-hidden={isReadOnly}
                            className={clsx(
                              'p-1 rounded-md text-red-600 hover:bg-red-50 transition-opacity touch-manipulation',
                              isReadOnly && 'opacity-0 pointer-events-none',
                            )}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  const mf = (tone: MobileSectionTone, readOnly: boolean) =>
    readOnly ? MOBILE_TONE[tone].ro : MOBILE_TONE[tone].field;

  return (
    <div className="relative w-full flex flex-1 flex-col min-h-0 h-full bg-[#f8fafc] md:bg-transparent md:flex-none md:min-h-screen md:h-auto shadow-none overflow-hidden md:overflow-visible">
      <div className="md:hidden shrink-0 flex items-center gap-3 px-4 py-3.5 bg-white border-b border-border">
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 flex h-10 w-10 items-center justify-center self-center rounded-xl border border-border bg-slate-50 text-slate-600 hover:bg-white hover:text-primary hover:border-primary/20 transition-all touch-manipulation"
          aria-label="Back to list"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-3 self-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-black text-slate-900 tracking-tight leading-tight truncate">
              {pageHeading}
            </h2>
            <p className="text-[11px] font-semibold text-muted-foreground truncate mt-0.5">
              {quotationDocLabel ? (
                <>
                  <span className="text-primary font-bold">{quotationDocLabel}</span>
                  {selectedShipment?.customers?.company_name ? (
                    <span className="text-slate-400 font-medium"> · {selectedShipment.customers.company_name}</span>
                  ) : null}
                </>
              ) : (
                selectedShipment?.customers?.company_name || 'New quotation'
              )}
            </p>
          </div>
        </div>
      </div>

      {mode !== 'add' ? (
        <QuotationWorkflowBar
          variant="mobile"
          currentStatus={quotationStatus}
          statusSaving={statusSaving}
          onSendEmail={handleSendQuotationEmail}
          onStepChange={applyQuotationStatus}
        />
      ) : null}

      <div className="hidden md:block shrink-0 mb-6 px-0">
        <div className="rounded-2xl border border-border bg-white shadow-sm shadow-slate-200/40 overflow-hidden">
          <div
            className={clsx(
              'flex flex-col gap-4 bg-gradient-to-br from-white via-white to-slate-50/40 px-5 py-4 lg:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6',
              mode !== 'add' && 'border-b border-slate-100',
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white text-slate-600 shadow-sm hover:border-primary/25 hover:text-primary hover:bg-primary/5 transition-all touch-manipulation"
                aria-label="Back to list"
              >
                <ChevronLeft size={22} />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-black tracking-tight text-slate-900 lg:text-2xl truncate">
                  {pageHeading}
                </h1>
                <p className="mt-1 text-[13px] font-medium text-muted-foreground truncate">
                  {quotationDocLabel ? (
                    <>
                      <span className="font-bold text-primary">{quotationDocLabel}</span>
                      {selectedShipment?.customers?.company_name ? (
                        <span className="text-slate-500"> · {selectedShipment.customers.company_name}</span>
                      ) : null}
                    </>
                  ) : mode === 'add' ? (
                    'Select a shipment and fill in the quotation'
                  ) : (
                    selectedShipment?.customers?.company_name || '—'
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end lg:shrink-0">
              {isReadOnly ? (
                <>
                  {canCreateJobFromQuotation ? (
                    <button
                      type="button"
                      onClick={() => void handleCreateJobFromQuotation()}
                      disabled={creatingJob}
                      className="inline-flex items-center justify-center gap-2 min-h-10 rounded-xl border border-border bg-white px-4 py-2 text-[12px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45"
                    >
                      {creatingJob ? <Loader2 size={15} className="animate-spin" /> : <Briefcase size={15} />}
                      Create Job
                    </button>
                  ) : null}
                  {canPrintQuotation ? (
                    <button
                      type="button"
                      onClick={handlePrintQuotation}
                      className="inline-flex items-center justify-center gap-2 min-h-10 rounded-xl border border-border bg-white px-4 py-2 text-[12px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all active:scale-[0.99]"
                    >
                      <Printer size={15} />
                      Print
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center justify-center gap-2 min-h-10 rounded-xl bg-slate-900 px-5 py-2 text-[12px] font-bold text-white shadow-md hover:bg-slate-800 transition-all active:scale-[0.99]"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>
                </>
              ) : (
                <>
                  {mode === 'edit' && onCancelEdit ? (
                    <button
                      type="button"
                      onClick={onCancelEdit}
                      className="inline-flex items-center justify-center gap-2 min-h-10 rounded-xl border border-border bg-white px-4 py-2 text-[12px] font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all active:scale-[0.99]"
                    >
                      <X size={15} />
                      Cancel
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={!formState.shipment_id}
                    className="inline-flex items-center justify-center gap-2 min-h-10 rounded-xl bg-primary px-5 py-2 text-[12px] font-bold text-white shadow-md shadow-primary/25 hover:bg-primary/90 transition-all active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45"
                  >
                    <Plus size={15} />
                    {mode === 'edit' ? 'Save changes' : 'Save draft'}
                  </button>
                </>
              )}
            </div>
          </div>

          {mode !== 'add' ? (
            <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3 lg:px-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Workflow</span>
              </div>
              <QuotationWorkflowBar
                variant="desktop"
                currentStatus={quotationStatus}
                statusSaving={statusSaving}
                onSendEmail={handleSendQuotationEmail}
                onStepChange={applyQuotationStatus}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col min-h-0 md:min-h-0">
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:px-0 md:py-0 md:pb-6 md:space-y-6">
          <div className="md:hidden space-y-6">
            <MobileFormSection tone="indigo" title="Quotation & shipment" icon={Ship}>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Ship size={16} className="text-indigo-600/80 shrink-0" />
                  <label className={mobileLabelClass}>
                    Shipment <span className="text-red-500">*</span>
                  </label>
                </div>
                <SearchableSelect
                  options={shipmentOptions}
                  value={formState.shipment_id}
                  onValueChange={(value) => setFormField('shipment_id', value)}
                  disabled={isReadOnly || mode === 'edit'}
                  placeholder="Search shipment…"
                  className="min-h-[44px] rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Quotation No.</label>
                <input
                  value={formState.id ? `Q-${formState.id.slice(0, 8).toUpperCase()}` : 'Auto-generated'}
                  readOnly
                  className={mf('indigo', true)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Quotation Type</label>
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold flex items-center gap-2 min-h-[44px] touch-manipulation">
                    <input
                      type="radio"
                      name="quotation_type_m"
                      checked={formState.quotation_type === 'service_breakdown'}
                      onChange={() => setFormField('quotation_type', 'service_breakdown')}
                      disabled={isReadOnly}
                      className="size-4"
                    />
                    Service Breakdown
                  </label>
                  <label className="text-[12px] font-bold flex items-center gap-2 min-h-[44px] touch-manipulation">
                    <input
                      type="radio"
                      name="quotation_type_m"
                      checked={formState.quotation_type === 'option_based'}
                      onChange={() => setFormField('quotation_type', 'option_based')}
                      disabled={isReadOnly}
                      className="size-4"
                    />
                    Option-based
                  </label>
                </div>
              </div>
            </MobileFormSection>

            <MobileFormSection tone="blue" title="Customer information" icon={User}>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Customer</label>
                <input
                  value={selectedShipment?.customers?.company_name || ''}
                  readOnly
                  className={mf('blue', true)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Customer Name</label>
                <input
                  value={formState.customer_trade_name || ''}
                  onChange={(e) => setFormField('customer_trade_name', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('blue', isReadOnly)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Person in Charge</label>
                <input
                  value={formState.customer_contact_name || ''}
                  onChange={(e) => setFormField('customer_contact_name', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('blue', isReadOnly)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Email</label>
                <input
                  value={formState.customer_contact_email || ''}
                  onChange={(e) => setFormField('customer_contact_email', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('blue', isReadOnly)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Tel</label>
                <input
                  value={formState.customer_contact_tel || ''}
                  onChange={(e) => setFormField('customer_contact_tel', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('blue', isReadOnly)}
                />
              </div>
            </MobileFormSection>

            <MobileFormSection tone="emerald" title="Schedule & cargo" icon={Calendar}>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Issue Date</label>
                <DateInput
                  value={toDateInput(formState.quote_date)}
                  onChange={(v) => setFormField('quote_date', v)}
                  disabled={isReadOnly}
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Due Date</label>
                <DateInput
                  value={toDateInput(formState.due_date)}
                  onChange={(v) => setFormField('due_date', v)}
                  disabled={isReadOnly}
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Port of Loading</label>
                <input value={selectedShipment?.pol || ''} readOnly className={mf('emerald', true)} />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Port of Discharge</label>
                <input value={selectedShipment?.pod || ''} readOnly className={mf('emerald', true)} />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Pickup</label>
                <input
                  value={formState.pickup || ''}
                  onChange={(e) => setFormField('pickup', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('emerald', isReadOnly)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Final Destination</label>
                <input
                  value={formState.final_destination || ''}
                  onChange={(e) => setFormField('final_destination', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('emerald', isReadOnly)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Cargo Volume</label>
                <input
                  value={formState.cargo_volume || ''}
                  onChange={(e) => setFormField('cargo_volume', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('emerald', isReadOnly)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>BILL#</label>
                <input
                  value={formState.bill_no || ''}
                  onChange={(e) => setFormField('bill_no', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('emerald', isReadOnly)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>CD#</label>
                <input
                  value={formState.customs_declaration_no || ''}
                  onChange={(e) => setFormField('customs_declaration_no', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('emerald', isReadOnly)}
                />
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-amber-600 shrink-0" />
                  <span className="text-[12px] font-bold text-amber-900">Validity</span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-amber-800">From</span>
                    <DateTimePicker24h
                      value={formState.validity_from || ''}
                      onChange={(v) => setFormField('validity_from', v)}
                      disabled={isReadOnly}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-amber-800">To</span>
                    <DateTimePicker24h
                      value={formState.validity_to || ''}
                      onChange={(v) => setFormField('validity_to', v)}
                      disabled={isReadOnly}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </MobileFormSection>

            <MobileFormSection tone="violet" title="Sales & commercial" icon={Tag}>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Sales Person</label>
                <SearchableSelect
                  options={salesPersonOptions}
                  value={formState.sales_person_id || ''}
                  onValueChange={(value) => setFormField('sales_person_id', value)}
                  disabled={isReadOnly}
                  placeholder="Search sales person…"
                  className="min-h-[44px] rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Sales Team</label>
                <input
                  value={formState.business_team || ''}
                  onChange={(e) => setFormField('business_team', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('violet', isReadOnly)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Sales Department</label>
                <input
                  value={formState.business_department || ''}
                  onChange={(e) => setFormField('business_department', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('violet', isReadOnly)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Goods</label>
                <input
                  value={formState.goods || selectedShipment?.commodity || ''}
                  onChange={(e) => setFormField('goods', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('violet', isReadOnly)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Incoterms</label>
                <input
                  value={formState.incoterms || ''}
                  onChange={(e) => setFormField('incoterms', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('violet', isReadOnly)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Transit Time</label>
                <input
                  value={formState.transit_time || ''}
                  onChange={(e) => setFormField('transit_time', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('violet', isReadOnly)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Services</label>
                <input
                  value={formState.service_mode || ''}
                  onChange={(e) => setFormField('service_mode', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('violet', isReadOnly)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Direction</label>
                <input
                  value={formState.direction || ''}
                  onChange={(e) => setFormField('direction', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('violet', isReadOnly)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Currency</label>
                <SearchableSelect
                  options={[
                    { value: 'VND', label: 'VND' },
                    ...exchangeRates.map((rate) => ({ value: rate.currency_code, label: rate.currency_code })),
                  ]}
                  value={formState.currency_code || 'VND'}
                  onValueChange={(value) => setFormField('currency_code', value)}
                  disabled={isReadOnly}
                  hideSearch
                  hideClearIcon
                  className="min-h-[44px] rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Job No.</label>
                <input
                  value={formState.job_no || ''}
                  onChange={(e) => setFormField('job_no', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('violet', isReadOnly)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Sales Inquiry No.</label>
                <input
                  value={formState.sales_inquiry_no || ''}
                  onChange={(e) => setFormField('sales_inquiry_no', e.target.value)}
                  disabled={isReadOnly}
                  className={mf('violet', isReadOnly)}
                />
              </div>
              <ThreeStarRating
                label="Priority"
                labelClassName="text-[13px] font-bold text-foreground"
                value={formState.priority_rank ?? 1}
                onChange={(v) => setFormField('priority_rank', v)}
                disabled={isReadOnly}
                variant="framed"
              />
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Notes</label>
                <textarea
                  value={formState.notes || ''}
                  onChange={(e) => setFormField('notes', e.target.value)}
                  disabled={isReadOnly}
                  className={clsx(mf('violet', isReadOnly), 'min-h-[88px] resize-none')}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Exchange Rate</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formState.exchange_rate || 0}
                  onChange={(e) => setFormField('exchange_rate', Number(e.target.value) || 0)}
                  disabled={isReadOnly}
                  className={mf('violet', isReadOnly)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={mobileLabelClass}>Exchange Rate Date</label>
                <DateTimePicker24h
                  value={formState.exchange_rate_date || ''}
                  onChange={(v) => setFormField('exchange_rate_date', v)}
                  disabled={isReadOnly}
                  className="w-full"
                />
              </div>
            </MobileFormSection>
          </div>

          <div className="hidden md:block space-y-4 sm:space-y-6">
        <div className="bg-white rounded-2xl border border-border p-3 sm:p-5 space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <div className="space-y-3">
              <label className="text-[12px] font-bold text-slate-600">Shipment</label>
              <SearchableSelect options={shipmentOptions} value={formState.shipment_id} onValueChange={(value) => setFormField('shipment_id', value)} disabled={isReadOnly || mode === 'edit'} placeholder="Select shipment" />
              <label className="text-[12px] font-bold text-slate-600">Quotation No.</label>
              <input value={formState.id ? `Q-${formState.id.slice(0, 8).toUpperCase()}` : 'Auto-generated'} readOnly className="w-full px-3 py-2 bg-slate-100 border border-border rounded-xl text-[13px] font-bold" />
              <label className="text-[12px] font-bold text-slate-600">Quotation Type</label>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <label className="text-[12px] font-bold flex items-center gap-2 min-h-[44px] sm:min-h-0 touch-manipulation">
                  <input type="radio" name="quotation_type" checked={formState.quotation_type === 'service_breakdown'} onChange={() => setFormField('quotation_type', 'service_breakdown')} disabled={isReadOnly} className="size-4" />
                  Service Breakdown
                </label>
                <label className="text-[12px] font-bold flex items-center gap-2 min-h-[44px] sm:min-h-0 touch-manipulation">
                  <input type="radio" name="quotation_type" checked={formState.quotation_type === 'option_based'} onChange={() => setFormField('quotation_type', 'option_based')} disabled={isReadOnly} className="size-4" />
                  Option-based
                </label>
              </div>
              <label className="text-[12px] font-bold text-slate-600">Customer</label>
              <input value={selectedShipment?.customers?.company_name || ''} readOnly className="w-full px-3 py-2 bg-slate-100 border border-border rounded-xl text-[13px]" />
              <label className="text-[12px] font-bold text-slate-600">Customer Name</label>
              <input value={formState.customer_trade_name || ''} onChange={(e) => setFormField('customer_trade_name', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 bg-white border border-border rounded-xl text-[13px]" />
              <label className="text-[12px] font-bold text-slate-600">Person in Charge</label>
              <input value={formState.customer_contact_name || ''} onChange={(e) => setFormField('customer_contact_name', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 bg-white border border-border rounded-xl text-[13px]" />
              <label className="text-[12px] font-bold text-slate-600">Email</label>
              <input value={formState.customer_contact_email || ''} onChange={(e) => setFormField('customer_contact_email', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 bg-white border border-border rounded-xl text-[13px]" />
              <label className="text-[12px] font-bold text-slate-600">Tel</label>
              <input value={formState.customer_contact_tel || ''} onChange={(e) => setFormField('customer_contact_tel', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 bg-white border border-border rounded-xl text-[13px]" />
            </div>

            <div className="space-y-3">
              <label className="text-[12px] font-bold text-slate-600">Issue Date</label>
              <DateInput
                value={toDateInput(formState.quote_date)}
                onChange={(v) => setFormField('quote_date', v)}
                disabled={isReadOnly}
                className="w-full"
              />
              <label className="text-[12px] font-bold text-slate-600">Due Date</label>
              <DateInput
                value={toDateInput(formState.due_date)}
                onChange={(v) => setFormField('due_date', v)}
                disabled={isReadOnly}
                className="w-full"
              />
              <label className="text-[12px] font-bold text-slate-600">Port of Loading</label>
              <input value={selectedShipment?.pol || ''} readOnly className="w-full px-3 py-2 bg-slate-100 border border-border rounded-xl text-[13px]" />
              <label className="text-[12px] font-bold text-slate-600">Port of Discharge</label>
              <input value={selectedShipment?.pod || ''} readOnly className="w-full px-3 py-2 bg-slate-100 border border-border rounded-xl text-[13px]" />
              <label className="text-[12px] font-bold text-slate-600">Pickup</label>
              <input value={formState.pickup || ''} onChange={(e) => setFormField('pickup', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-xl text-[13px]" />
              <label className="text-[12px] font-bold text-slate-600">Final Destination</label>
              <input value={formState.final_destination || ''} onChange={(e) => setFormField('final_destination', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-xl text-[13px]" />
              <label className="text-[12px] font-bold text-slate-600">Cargo Volume</label>
              <input value={formState.cargo_volume || ''} onChange={(e) => setFormField('cargo_volume', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-xl text-[13px]" />
              <label className="text-[12px] font-bold text-slate-600">BILL#</label>
              <input
                value={formState.bill_no || ''}
                onChange={(e) => setFormField('bill_no', e.target.value)}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-border rounded-xl text-[13px]"
              />
              <label className="text-[12px] font-bold text-slate-600">CD#</label>
              <input
                value={formState.customs_declaration_no || ''}
                onChange={(e) => setFormField('customs_declaration_no', e.target.value)}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-border rounded-xl text-[13px]"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[12px] font-bold text-slate-600">Sales Person</label>
              <SearchableSelect options={salesPersonOptions} value={formState.sales_person_id || ''} onValueChange={(value) => setFormField('sales_person_id', value)} disabled={isReadOnly} placeholder="Select sales person" />
              <label className="text-[12px] font-bold text-slate-600">Sales Team</label>
              <input value={formState.business_team || ''} onChange={(e) => setFormField('business_team', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-xl text-[13px]" />
              <label className="text-[12px] font-bold text-slate-600">Sales Department</label>
              <input value={formState.business_department || ''} onChange={(e) => setFormField('business_department', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-xl text-[13px]" />
              <label className="text-[12px] font-bold text-slate-600">Goods</label>
              <input value={formState.goods || selectedShipment?.commodity || ''} onChange={(e) => setFormField('goods', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-xl text-[13px]" />
              <label className="text-[12px] font-bold text-slate-600">Incoterms</label>
              <input
                value={formState.incoterms || ''}
                onChange={(e) => setFormField('incoterms', e.target.value)}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-border rounded-xl text-[13px]"
              />
              <label className="text-[12px] font-bold text-slate-600">Transit Time</label>
              <input value={formState.transit_time || ''} onChange={(e) => setFormField('transit_time', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-xl text-[13px]" />
            </div>

            <div className="space-y-3">
              <label className="text-[12px] font-bold text-slate-600">Services</label>
              <input value={formState.service_mode || ''} onChange={(e) => setFormField('service_mode', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-xl text-[13px]" />
              <label className="text-[12px] font-bold text-slate-600">Direction</label>
              <input value={formState.direction || ''} onChange={(e) => setFormField('direction', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-xl text-[13px]" />
              <label className="text-[12px] font-bold text-slate-600">Currency</label>
              <SearchableSelect options={[{ value: 'VND', label: 'VND' }, ...exchangeRates.map((rate) => ({ value: rate.currency_code, label: rate.currency_code }))]} value={formState.currency_code || 'VND'} onValueChange={(value) => setFormField('currency_code', value)} disabled={isReadOnly} hideSearch hideClearIcon />
              <label className="text-[12px] font-bold text-slate-600">Job No.</label>
              <input value={formState.job_no || ''} onChange={(e) => setFormField('job_no', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-xl text-[13px]" />
              <label className="text-[12px] font-bold text-slate-600">Sales Inquiry No.</label>
              <input value={formState.sales_inquiry_no || ''} onChange={(e) => setFormField('sales_inquiry_no', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-xl text-[13px]" />
              <ThreeStarRating
                label="Priority"
                labelClassName="text-[12px] font-bold text-slate-600"
                value={formState.priority_rank ?? 1}
                onChange={(v) => setFormField('priority_rank', v)}
                disabled={isReadOnly}
                variant="framed"
              />
              <label className="text-[12px] font-bold text-slate-600">Notes</label>
              <textarea value={formState.notes || ''} onChange={(e) => setFormField('notes', e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-xl text-[13px] min-h-[78px]" />
              <label className="text-[12px] font-bold text-slate-600">Exchange Rate</label>
              <input type="number" step="0.0001" value={formState.exchange_rate || 0} onChange={(e) => setFormField('exchange_rate', Number(e.target.value) || 0)} disabled={isReadOnly} className="w-full px-3 py-2 border border-border rounded-xl text-[13px]" />
              <label className="text-[12px] font-bold text-slate-600">Exchange Rate Date</label>
              <DateTimePicker24h
                value={formState.exchange_rate_date || ''}
                onChange={(v) => setFormField('exchange_rate_date', v)}
                disabled={isReadOnly}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center border-t border-border pt-4">
            <div className="flex items-center gap-2 shrink-0">
              <Calendar size={16} className="text-primary shrink-0" />
              <span className="text-[12px] font-bold text-slate-700 leading-none">Validity</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-[13.5rem] shrink-0">
                <DateTimePicker24h
                  value={formState.validity_from || ''}
                  onChange={(v) => setFormField('validity_from', v)}
                  disabled={isReadOnly}
                  className="w-full"
                />
              </div>
              <span
                className="text-[12px] font-bold text-slate-500 text-center hidden sm:inline-flex shrink-0 px-1 leading-none items-center self-center"
                aria-hidden
              >
                →
              </span>
              <div className="w-full sm:w-[13.5rem] shrink-0">
                <DateTimePicker24h
                  value={formState.validity_to || ''}
                  onChange={(v) => setFormField('validity_to', v)}
                  disabled={isReadOnly}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
          </div>

        {CHARGE_GROUPS.map(({ group, title }) => renderChargeTable(group, title))}
      </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 backdrop-blur-md px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(15,23,42,0.07)]">
        {isReadOnly ? (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-border bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all touch-manipulation min-h-[48px]"
            >
              Back
            </button>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              {canCreateJobFromQuotation ? (
                <button
                  type="button"
                  onClick={() => void handleCreateJobFromQuotation()}
                  disabled={creatingJob}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 min-h-[48px] rounded-xl border border-border bg-white px-3.5 py-2.5 text-[12px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.99] touch-manipulation disabled:pointer-events-none disabled:opacity-45"
                >
                  {creatingJob ? <Loader2 size={16} className="animate-spin" /> : <Briefcase size={16} />}
                  Create Job
                </button>
              ) : null}
              {canPrintQuotation ? (
                <button
                  type="button"
                  onClick={handlePrintQuotation}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 min-h-[48px] rounded-xl border border-border bg-white px-3.5 py-2.5 text-[12px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.99] touch-manipulation"
                >
                  <Printer size={16} />
                  Print
                </button>
              ) : null}
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex min-h-[48px] max-w-[min(100%,12rem)] shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-slate-800 active:scale-[0.99] touch-manipulation"
              >
                <Pencil size={16} />
                <span className="truncate">Edit</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              onClick={mode === 'edit' && onCancelEdit ? onCancelEdit : onClose}
              className="shrink-0 rounded-xl border border-border bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 touch-manipulation min-h-[48px]"
            >
              {mode === 'edit' ? 'Cancel' : 'Close'}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!formState.shipment_id}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-white shadow-md shadow-primary/20 hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-45 touch-manipulation"
            >
              <Plus size={17} />
              {mode === 'edit' ? 'Save changes' : 'Save draft'}
            </button>
          </div>
        )}
      </div>

      <SalesChargeCatalogDialog
        isOpen={catalogBrowserOpen}
        onClose={() => {
          setCatalogBrowserOpen(false);
          setCatalogBrowserTarget(null);
        }}
        onPick={(item) => {
          if (catalogBrowserTarget) {
            applyCatalogToChargeRow(catalogBrowserTarget.group, catalogBrowserTarget.index, item);
          }
        }}
        allowCreate={!isReadOnly}
        onCreated={onChargeCatalogCreated}
      />

      <SalesUnitCatalogDialog
        isOpen={unitCatalogBrowserOpen}
        onClose={() => {
          setUnitCatalogBrowserOpen(false);
          setUnitCatalogBrowserTarget(null);
        }}
        onPick={(item) => {
          if (unitCatalogBrowserTarget) {
            applyUnitCatalogToChargeRow(unitCatalogBrowserTarget.group, unitCatalogBrowserTarget.index, item);
          }
        }}
        allowCreate={!isReadOnly}
        onCreated={onUnitCatalogCreated}
      />
    </div>
  );
};

export default SalesEditorPage;
