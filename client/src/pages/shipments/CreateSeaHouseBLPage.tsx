import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Anchor,
  ChevronLeft,
  Pencil,
  DollarSign,
  FileText,
  Receipt,
  Ship,
} from 'lucide-react';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { useToastContext } from '../../contexts/ToastContext';
import {
  buildSeaHouseBlBlobV1,
  parseSeaHouseBlV1,
} from './seaHouseBlPersistence';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { shipmentService } from '../../services/shipmentService';
import { salesService } from '../../services/salesService';
import { fmsJobDebitNoteService } from '../../services/fmsJobDebitNoteService';
import { fmsJobPaymentNoteService } from '../../services/fmsJobPaymentNoteService';
import {
  buildSeaHousePrefillFromSales,
  seaHouseBlBlobHasContent,
} from './mapQuotationToSeaHousePrefill';
import { HeaderTab, emptyHeaderState } from './bl-tabs/HeaderTab';
import type { HeaderTabState } from './bl-tabs/HeaderTab';
import { ContainerTab, emptyContainerState } from './bl-tabs/ContainerTab';
import type { ContainerTabState } from './bl-tabs/ContainerTab';
import { MarksDescriptionTab, emptyMarksDescriptionState } from './bl-tabs/MarksDescriptionTab';
import type { MarksDescriptionTabState } from './bl-tabs/MarksDescriptionTab';
import { FreightTab, emptyFreightState } from './bl-tabs/FreightTab';
import type { FreightTabState } from './bl-tabs/FreightTab';
import { FieldLabel, inputClass } from './bl-tabs/blSharedHelpers';

type HBLTab = 'header' | 'container' | 'marks' | 'freight' | 'tracking';

const TABS: { key: HBLTab; label: string }[] = [
  { key: 'header', label: 'Header' },
  { key: 'container', label: 'Container' },
  { key: 'marks', label: 'Marks & Description (Print)' },
  { key: 'freight', label: 'Freight' },
  { key: 'tracking', label: 'Tracking' },
];

const BL_TYPES = [
  { value: 'original', label: 'Original' },
  { value: 'copy', label: 'Copy' },
  { value: 'telex', label: 'Telex Release' },
  { value: 'seawaybill', label: 'Sea Waybill' },
];

const BL_RELEASE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'surrendered', label: 'Surrendered' },
  { value: 'released', label: 'Released' },
  { value: 'hold', label: 'Hold' },
];

const BOUNDS = [
  { value: 'import', label: 'Import' },
  { value: 'export', label: 'Export' },
  { value: 'domestic', label: 'Domestic' },
  { value: 'transit', label: 'Transit' },
];

const LOAD_TYPES = [
  { value: 'fcl', label: 'FCL' },
  { value: 'lcl', label: 'LCL' },
  { value: 'bulk', label: 'Bulk' },
  { value: 'breakbulk', label: 'Break Bulk' },
];

const INCOTERMS = [
  { value: 'fob', label: 'FOB' },
  { value: 'cif', label: 'CIF' },
  { value: 'cfr', label: 'CFR' },
  { value: 'exw', label: 'EXW' },
  { value: 'dap', label: 'DAP' },
  { value: 'ddp', label: 'DDP' },
  { value: 'fas', label: 'FAS' },
  { value: 'fca', label: 'FCA' },
  { value: 'cpt', label: 'CPT' },
  { value: 'cip', label: 'CIP' },
  { value: 'dpu', label: 'DPU' },
];

const SERVICE_TERMS = [
  { value: 'cy-cy', label: 'CY / CY' },
  { value: 'cy-cfs', label: 'CY / CFS' },
  { value: 'cfs-cy', label: 'CFS / CY' },
  { value: 'cfs-cfs', label: 'CFS / CFS' },
  { value: 'door-door', label: 'Door / Door' },
  { value: 'door-cy', label: 'Door / CY' },
  { value: 'cy-door', label: 'CY / Door' },
];

const toDateOnly = (v?: string | null): string => {
  if (!v) return '';
  const s = String(v).trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md">
      <div
        className={clsx(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          color,
        )}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[20px] font-black tracking-tight text-slate-900 leading-tight">
          {value}
        </p>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
          {label}
        </p>
      </div>
    </div>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <FileText size={32} className="mb-3 opacity-30" />
      <p className="text-[13px] font-semibold">{label}</p>
      <p className="mt-1 text-[11px]">This section will be available in a future update.</p>
    </div>
  );
}


const CreateSeaHouseBLPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: shipmentId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isViewMode = searchParams.get('mode') === 'view';
  const fromHouseSeaBlList = searchParams.get('from') === 'house-sea-bl';
  const { success: toastOk, error: toastErr } = useToastContext();
  const { setCustomBreadcrumbs } = useBreadcrumb();

  const [activeTab, setActiveTab] = useState<HBLTab>('header');
  const [hbl, setHbl] = useState('');
  const [blType, setBlType] = useState('');
  const [blReleaseStatus, setBlReleaseStatus] = useState('');
  const [bound, setBound] = useState('');
  const [masterBl, setMasterBl] = useState('');
  const [shipment, setShipment] = useState('');
  const [switchBl, setSwitchBl] = useState('');
  const [loadType, setLoadType] = useState('');
  const [jobNo, setJobNo] = useState('');
  const [incoterm, setIncoterm] = useState('');
  const [serviceTerm, setServiceTerm] = useState('');
  const [shipmentCodeLabel, setShipmentCodeLabel] = useState('');
  const [masterJobLabel, setMasterJobLabel] = useState('');
  const [quotationLink, setQuotationLink] = useState<{ id: string; label: string } | null>(null);
  const [debitNoteCount, setDebitNoteCount] = useState(0);
  const [paymentNoteCount, setPaymentNoteCount] = useState(0);
  const [deliveryNoteCount, setDeliveryNoteCount] = useState(0);
  const skipBlAutosaveRef = useRef(true);
  const skipShipmentLinkAutosaveRef = useRef(true);
  const [blHydrateEpoch, setBlHydrateEpoch] = useState(0);

  const [headerState, setHeaderState] = useState<HeaderTabState>(emptyHeaderState);
  const patchHeader = (patch: Partial<HeaderTabState>) =>
    setHeaderState((prev) => ({ ...prev, ...patch }));

  const [containerState, setContainerState] = useState<ContainerTabState>(emptyContainerState);
  const patchContainer = (patch: Partial<ContainerTabState>) =>
    setContainerState((prev) => ({ ...prev, ...patch }));

  const [marksState, setMarksState] = useState<MarksDescriptionTabState>(emptyMarksDescriptionState);
  const patchMarks = (patch: Partial<MarksDescriptionTabState>) =>
    setMarksState((prev) => ({ ...prev, ...patch }));

  const [freightState, setFreightState] = useState<FreightTabState>(emptyFreightState);
  const patchFreight = (patch: Partial<FreightTabState>) =>
    setFreightState((prev) => ({ ...prev, ...patch }));

  const seaHousePersistKey = useMemo(
    () =>
      JSON.stringify({
        hbl,
        blType,
        blReleaseStatus,
        bound,
        masterBl,
        shipment,
        switchBl,
        loadType,
        jobNo,
        incoterm,
        serviceTerm,
        headerState,
        containerState,
        marksState,
        freightState,
      }),
    [
      hbl,
      blType,
      blReleaseStatus,
      bound,
      masterBl,
      shipment,
      switchBl,
      loadType,
      jobNo,
      incoterm,
      serviceTerm,
      headerState,
      containerState,
      marksState,
      freightState,
    ],
  );

  useEffect(() => {
    if (!shipmentId) return;
    skipBlAutosaveRef.current = true;
    setHbl('');
    setBlType('');
    setBlReleaseStatus('');
    setBound('');
    setMasterBl('');
    setShipment('');
    setSwitchBl('');
    setLoadType('');
    setJobNo('');
    setIncoterm('');
    setServiceTerm('');
    setMasterJobLabel('');
    setQuotationLink(null);
    setHeaderState(emptyHeaderState());
    setContainerState(emptyContainerState());
    setMarksState(emptyMarksDescriptionState());
    setFreightState(emptyFreightState());
    let cancelled = false;
    void (async () => {
      try {
        const [shipmentData, sea] = await Promise.all([
          shipmentService.getShipmentById(shipmentId),
          shipmentService.getSeaHouseBl(shipmentId),
        ]);
        if (cancelled) return;

        const mjn = shipmentData.master_job_no || '';
        const autoFileNo =
          (shipmentData.code || '').trim() ||
          mjn.trim() ||
          (shipmentId ? `HBL-${shipmentId.slice(0, 8).toUpperCase()}` : '');
        setMasterJobLabel(mjn);
        setShipmentCodeLabel(shipmentData.code || '');
        if (shipmentData.master_bl_number) setMasterBl(shipmentData.master_bl_number);
        if (shipmentData.bl_status) setBlReleaseStatus(shipmentData.bl_status);
        if (shipmentData.bl_status_detail) setSwitchBl(shipmentData.bl_status_detail);
        if (shipmentData.bound) setBound(shipmentData.bound);
        if (shipmentData.term) setIncoterm(String(shipmentData.term).toLowerCase());
        if (shipmentData.services) setServiceTerm(shipmentData.services);
        if (shipmentData.load_fcl) setLoadType('fcl');
        else if (shipmentData.load_lcl) setLoadType('lcl');

        if (shipmentData.quotation_id) {
          const qLabel =
            shipmentData.quotation?.no_doc?.trim() ||
            `Q-${shipmentData.quotation_id.slice(0, 8)}`;
          setQuotationLink({ id: shipmentData.quotation_id, label: qLabel });
        } else {
          setQuotationLink(null);
        }

        const shipmentHeaderDefaults: Partial<HeaderTabState> = {
          carrier: (shipmentData.master_bl_carrier || '').trim(),
          firstVessel: (shipmentData.vessel_voyage || '').trim(),
          mvvd: (shipmentData.vessel_voyage || '').trim(),
          etd: toDateOnly(shipmentData.etd),
          eta: toDateOnly(shipmentData.eta),
          ata: toDateOnly(shipmentData.actual_eta),
          onboardDate: toDateOnly(shipmentData.etd),
          performanceDate: toDateOnly(shipmentData.performance_date),
          pol: (shipmentData.pol || '').trim(),
          pod: (shipmentData.pod || '').trim(),
          por: (shipmentData.pol || '').trim(),
          pvy: (shipmentData.pod || '').trim(),
        };
        const mergeHeaderWithShipmentDefaults = (prev: HeaderTabState): HeaderTabState => {
          const next = { ...prev };
          (Object.keys(shipmentHeaderDefaults) as Array<keyof HeaderTabState>).forEach((k) => {
            const current = String(prev[k] || '').trim();
            const fallback = String(shipmentHeaderDefaults[k] || '').trim();
            if (!current && fallback) {
              next[k] = fallback as HeaderTabState[typeof k];
            }
          });
          return next;
        };

        const parsed = parseSeaHouseBlV1(sea);
        if (parsed) {
          const tb = parsed.topBar;
          setHbl(tb.hbl || autoFileNo);
          setBlType(tb.blType);
          setBlReleaseStatus(tb.blReleaseStatus);
          setBound(tb.bound);
          setMasterBl(tb.masterBl);
          setShipment(tb.shipment);
          setSwitchBl(tb.switchBl);
          setLoadType(tb.loadType);
          setJobNo(mjn);
          setIncoterm(tb.incoterm);
          setServiceTerm(tb.serviceTerm);
          setHeaderState(mergeHeaderWithShipmentDefaults(parsed.header));
          setContainerState(parsed.container);
          setMarksState(parsed.marks);
          setFreightState(parsed.freight);
        } else {
          setHbl(autoFileNo);
          setJobNo(mjn);
          if (!seaHouseBlBlobHasContent(sea) && shipmentData.quotation_id) {
            const sales = await salesService.getSalesItemById(shipmentData.quotation_id);
            if (cancelled) return;
            const { headerPatch, topBar } = buildSeaHousePrefillFromSales(sales);
            setHeaderState((prev) => mergeHeaderWithShipmentDefaults({ ...prev, ...headerPatch }));
            if (topBar.masterBl) setMasterBl(topBar.masterBl);
            if (topBar.bound) setBound(topBar.bound);
            if (topBar.incoterm) setIncoterm(topBar.incoterm);
            if (topBar.loadType) setLoadType(topBar.loadType);
            if (topBar.shipmentLabel) setShipment(topBar.shipmentLabel);
            toastOk('Sea House B/L prefilled from quotation.');
          } else {
            setHeaderState((prev) => mergeHeaderWithShipmentDefaults(prev));
          }
        }
      } catch {
        /* ignore – user can fill manually */
      } finally {
        window.setTimeout(() => {
          if (!cancelled) {
            skipBlAutosaveRef.current = false;
            skipShipmentLinkAutosaveRef.current = false;
            setBlHydrateEpoch((n) => n + 1);
          }
        }, 500);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shipmentId, toastOk]);

  useEffect(() => {
    if (!shipmentId || skipBlAutosaveRef.current || isViewMode) return;
    const t = window.setTimeout(() => {
      void shipmentService
        .patchSeaHouseBl(
          shipmentId,
          buildSeaHouseBlBlobV1({
            topBar: {
              hbl,
              blType,
              blReleaseStatus,
              bound,
              masterBl,
              shipment,
              switchBl,
              loadType,
              jobNo,
              incoterm,
              serviceTerm,
            },
            header: headerState,
            container: containerState,
            marks: marksState,
            freight: freightState,
          }),
        )
        .catch((e: unknown) => {
          toastErr(e instanceof Error ? e.message : 'Could not save Sea House B/L');
        });
    }, 1400);
    return () => window.clearTimeout(t);
  }, [blHydrateEpoch, shipmentId, isViewMode, seaHousePersistKey, toastErr]);

  useEffect(() => {
    if (!shipmentId || skipShipmentLinkAutosaveRef.current || isViewMode) return;

    const loadTypeNorm = (loadType || '').trim().toLowerCase();
    const linkedPayload = {
      master_bl_number: masterBl || null,
      bl_status: blReleaseStatus || null,
      bl_status_detail: switchBl || null,
      bound: bound || null,
      term: incoterm || null,
      services: serviceTerm || null,
      master_job_no: jobNo || null,
      load_fcl: loadTypeNorm === 'fcl',
      load_lcl: loadTypeNorm === 'lcl',
    };

    const t = window.setTimeout(() => {
      void shipmentService.updateShipment(shipmentId, linkedPayload).catch((e: unknown) => {
        toastErr(e instanceof Error ? e.message : 'Could not link B/L details to shipment bill form');
      });
    }, 1200);

    return () => window.clearTimeout(t);
  }, [
    shipmentId,
    isViewMode,
    masterBl,
    blReleaseStatus,
    switchBl,
    bound,
    incoterm,
    serviceTerm,
    jobNo,
    loadType,
    toastErr,
  ]);

  useEffect(() => {
    const shipmentLabel = shipmentCodeLabel || masterJobLabel || (shipmentId ? `Shipment ${shipmentId.slice(0, 8)}...` : 'New Shipment');
    const detailQs = new URLSearchParams();
    if (isViewMode) detailQs.set('mode', 'view');
    if (fromHouseSeaBlList) detailQs.set('from', 'house-sea-bl');
    const detailQuery = detailQs.toString();
    const detailPath = `/shipments/sop/${shipmentId || 'new'}/sea-house-bl${detailQuery ? `?${detailQuery}` : ''}`;

    if (fromHouseSeaBlList) {
      const modeSuffix = isViewMode ? ' · View' : ' · Edit';
      const tailBase =
        shipmentCodeLabel.trim() !== ''
          ? shipmentCodeLabel
          : masterJobLabel.trim() !== ''
          ? masterJobLabel
          : shipmentId
            ? `Shipment ${shipmentId.slice(0, 8)}…`
            : 'Sea House B/L';
      const tail = `${tailBase}${modeSuffix}`;
      setCustomBreadcrumbs([
        { path: '/shipping', label: 'Shipping' },
        { path: '/shipping/house-sea-bl', label: 'House Sea B/L' },
        { path: detailPath, label: tail },
      ]);
    } else {
      const blLabel = isViewMode ? 'Sea House B/L (View)' : 'Sea House B/L';
      setCustomBreadcrumbs([
        { path: '/shipments/information', label: 'Shipments' },
        ...(shipmentId ? [{ path: `/shipments/sop/${shipmentId}`, label: shipmentLabel }] : []),
        { path: `/shipments/sop/${shipmentId || 'new'}/sea-house-bl`, label: blLabel },
      ]);
    }

    return () => {
      setCustomBreadcrumbs(null);
    };
  }, [shipmentId, fromHouseSeaBlList, isViewMode, masterJobLabel, shipmentCodeLabel, setCustomBreadcrumbs]);

  useEffect(() => {
    if (!shipmentId) {
      setDebitNoteCount(0);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const dns = await fmsJobDebitNoteService.list(shipmentId);
        if (!cancelled) setDebitNoteCount(dns.length);
      } catch {
        if (!cancelled) setDebitNoteCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shipmentId]);

  useEffect(() => {
    if (!shipmentId) {
      setDeliveryNoteCount(0);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const item = await shipmentService.getDeliveryNote(shipmentId);
        if (!cancelled) setDeliveryNoteCount(item ? 1 : 0);
      } catch {
        if (!cancelled) setDeliveryNoteCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shipmentId]);

  useEffect(() => {
    if (!shipmentId) {
      setPaymentNoteCount(0);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const items = await fmsJobPaymentNoteService.list(shipmentId);
        if (!cancelled) setPaymentNoteCount(items.length);
      } catch {
        if (!cancelled) setPaymentNoteCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shipmentId]);

  const stats = {
    expenses: 0,
    paymentNotes: paymentNoteCount,
    debitNotes: debitNoteCount,
    dcNotes: deliveryNoteCount,
  };

  return (
    <div className="animate-in fade-in duration-300 mx-auto flex w-full flex-col gap-4 px-0 pb-24 sm:px-1 md:pb-6">
      <div className="overflow-visible rounded-2xl border border-border bg-white shadow-sm shadow-slate-200/40">
        <div className="flex flex-col gap-4 bg-gradient-to-br from-white via-white to-slate-50/40 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() =>
                shipmentId
                  ? navigate(`/shipments/sop/${shipmentId}`)
                  : navigate('/shipments/information')
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-slate-600 shadow-sm transition-all hover:border-primary/25 hover:bg-primary/5 hover:text-primary touch-manipulation"
              aria-label="Back"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-black tracking-tight text-slate-900 lg:text-2xl">
                  {isViewMode ? 'Sea House B/L' : 'Create Sea House B/L'}
                </h1>
                {isViewMode ? (
                  <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    View only
                  </span>
                ) : null}
              </div>
              <p className="mt-1 truncate text-[13px] font-medium text-muted-foreground">
                {shipmentCodeLabel ? shipmentCodeLabel : masterJobLabel ? masterJobLabel : shipmentId ? `Shipment ${shipmentId.slice(0, 8)}…` : 'New Sea House Bill of Lading'}
              </p>
              {quotationLink ? (
                <p className="mt-1.5 text-[12px] font-medium text-muted-foreground">
                  From quotation{' '}
                  <Link
                    to={`/financials/sales/${quotationLink.id}`}
                    className="text-primary font-bold hover:underline"
                  >
                    {quotationLink.label}
                  </Link>
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
            {isViewMode && shipmentId ? (
              <button
                type="button"
                onClick={() => navigate(`/shipments/sop/${shipmentId}/sea-house-bl?from=house-sea-bl`)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm transition-all hover:opacity-95"
              >
                <Pencil size={15} />
                Edit
              </button>
            ) : null}
            <button
              type="button"
              disabled={isViewMode}
              onClick={() => toastOk('Create Master — coming soon')}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-teal-300 bg-teal-50 px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-teal-700 shadow-sm transition-all hover:bg-teal-100 hover:border-teal-400 disabled:pointer-events-none disabled:opacity-40"
            >
              <Ship size={15} />
              Create Master
            </button>
            <button
              type="button"
              disabled={!shipmentId}
              onClick={() => navigate(`/shipments/sop/${shipmentId}/arrival-notice`)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-sky-300 bg-sky-50 px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-sky-700 shadow-sm transition-all hover:bg-sky-100 hover:border-sky-400 disabled:pointer-events-none disabled:opacity-40"
            >
              <FileText size={15} />
              Arrival Notice
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Expenses"
          value={stats.expenses}
          color="bg-emerald-100 text-emerald-600"
        />
        <div
          className="cursor-pointer transition-transform hover:scale-[1.02]"
          onClick={() => {
            if (!shipmentId) return;
            navigate(`/shipments/sop/${shipmentId}/sea-house-bl/payment-note`);
          }}
        >
          <StatCard
            icon={FileText}
            label="Payment Notes"
            value={stats.paymentNotes}
            color="bg-blue-100 text-blue-600"
          />
        </div>
        <div
          className="cursor-pointer transition-transform hover:scale-[1.02]"
          onClick={() => navigate(`/shipments/sop/${shipmentId}/sea-house-bl/debit-note`)}
        >
          <StatCard
            icon={Receipt}
            label="Debit Notes"
            value={stats.debitNotes}
            color="bg-amber-100 text-amber-600"
          />
        </div>
        <StatCard
          icon={Anchor}
          label="DC Notes"
          value={stats.dcNotes}
          color="bg-violet-100 text-violet-600"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="shrink-0 border-b border-border bg-slate-50/80 px-4 py-3">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">
            B/L Details
          </h2>
        </div>
        <fieldset disabled={isViewMode} className="min-w-0 border-0 p-0 m-0">
          <div className="p-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <FieldLabel>HBL</FieldLabel>
              <input
                value={hbl}
                onChange={(e) => setHbl(e.target.value)}
                className={inputClass}
                placeholder="House B/L number"
              />
            </div>
            <div>
              <FieldLabel>BL Type</FieldLabel>
              <SearchableSelect
                options={BL_TYPES}
                value={blType || undefined}
                onValueChange={setBlType}
                placeholder="Select type"
                hideSearch
              />
            </div>
            <div>
              <FieldLabel>BL Release Status</FieldLabel>
              <SearchableSelect
                options={BL_RELEASE_STATUSES}
                value={blReleaseStatus || undefined}
                onValueChange={setBlReleaseStatus}
                placeholder="Select status"
                hideSearch
              />
            </div>
            <div>
              <FieldLabel>Bound</FieldLabel>
              <SearchableSelect
                options={BOUNDS}
                value={bound || undefined}
                onValueChange={setBound}
                placeholder="Select bound"
                hideSearch
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <FieldLabel>Master BL</FieldLabel>
              <input
                value={masterBl}
                onChange={(e) => setMasterBl(e.target.value)}
                className={inputClass}
                placeholder="Master B/L number"
              />
            </div>
            <div>
              <FieldLabel>Shipment</FieldLabel>
              <input
                value={shipment}
                onChange={(e) => setShipment(e.target.value)}
                className={inputClass}
                placeholder="Shipment"
              />
            </div>
            <div>
              <FieldLabel>Switch BL</FieldLabel>
              <input
                value={switchBl}
                onChange={(e) => setSwitchBl(e.target.value)}
                className={inputClass}
                placeholder="Switch B/L"
              />
            </div>
            <div>
              <FieldLabel>Load Type</FieldLabel>
              <SearchableSelect
                options={LOAD_TYPES}
                value={loadType || undefined}
                onValueChange={setLoadType}
                placeholder="Select"
                hideSearch
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <FieldLabel>Ref No.</FieldLabel>
              <input
                value={jobNo}
                onChange={(e) => setJobNo(e.target.value)}
                className={inputClass}
                placeholder="Reference number"
              />
            </div>
            <div>
              <FieldLabel>Incoterm</FieldLabel>
              <SearchableSelect
                options={INCOTERMS}
                value={incoterm || undefined}
                onValueChange={setIncoterm}
                placeholder="Select incoterm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <FieldLabel>Service Term</FieldLabel>
              <SearchableSelect
                options={SERVICE_TERMS}
                value={serviceTerm || undefined}
                onValueChange={setServiceTerm}
                placeholder="Select service term"
                hideSearch
              />
            </div>
          </div>
          </div>
        </fieldset>
      </div>

      <div className="overflow-x-clip rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex flex-wrap gap-1 overflow-x-auto overflow-y-hidden border-b border-border bg-slate-50/80 px-2 py-2 sm:px-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={clsx(
                'shrink-0 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors',
                activeTab === t.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white/80',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <fieldset disabled={isViewMode} className="min-w-0 border-0 p-0 m-0">
          <div className="min-h-0 min-w-0">
            {activeTab === 'header' ? (
              <HeaderTab state={headerState} onChange={patchHeader} />
            ) : activeTab === 'container' ? (
              <ContainerTab state={containerState} onChange={patchContainer} />
            ) : activeTab === 'marks' ? (
              <MarksDescriptionTab state={marksState} onChange={patchMarks} />
            ) : activeTab === 'freight' ? (
              <FreightTab state={freightState} onChange={patchFreight} />
            ) : (
              <PlaceholderTab label="Tracking" />
            )}
          </div>
        </fieldset>
      </div>
    </div>
  );
};

export default CreateSeaHouseBLPage;
