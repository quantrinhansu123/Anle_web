import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { clsx } from 'clsx';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Briefcase, ChevronLeft, HelpCircle, Loader2, Plus, Ship, Trash2 } from 'lucide-react';
import { DateInput } from '../../components/ui/DateInput';
import {
  JOB_SERVICE_TAGS,
  JobServicesTagsSelect,
  parseJobServicesStored,
  serializeJobServices,
  type JobServiceTag,
} from '../../components/ui/JobServicesTagsSelect';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { ThreeStarRating } from '../../components/ui/ThreeStarRating';
import { useToastContext } from '../../contexts/ToastContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { sidebarMenu } from '../../data/sidebarMenu';
import { jobService } from '../../services/jobService';
import { customerService } from '../../services/customerService';
import { employeeService, type Employee } from '../../services/employeeService';
import { salesService } from '../../services/salesService';
import type { Customer } from '../../services/customerService';
import type { Sales } from '../sales/types';
import {
  normalizeJobWorkflowStatus,
  type FmsJob,
  type FmsJobBlLine,
  type FmsJobServiceDetails,
  type JobBound,
  type JobUpsertPayload,
  type JobWorkflowStatus,
} from './types';
import {
  emptyJobSeaTabFields,
  emptySeaTabTables,
  jobSeaTabFromJson,
  mergeSeaPersisted,
  parseSeaTables,
  type JobSeaTabFields,
  type SeaTabTablesState,
} from './jobSeaTabTypes';
import {
  emptyTruckingTabState,
  mergeTruckingPersisted,
  parseTruckingTab,
  type TruckingTabState,
} from './jobTruckingTabTypes';
import {
  emptyCustomsTabState,
  mergeCustomsPersisted,
  parseCustomsTab,
  type CustomsTabState,
} from './jobCustomsTabTypes';
import { JobSeaTabPanel } from './JobSeaTabPanel';
import { JobTruckingTabPanel } from './JobTruckingTabPanel';
import { JobCustomsTabPanel } from './JobCustomsTabPanel';
import { Edit3, CheckCircle2, XCircle } from 'lucide-react';
import { WorkflowStepper, type WorkflowStep } from '../../components/ui/WorkflowStepper';

export const JOB_WORKFLOW_STEPS: WorkflowStep<JobWorkflowStatus>[] = [
  { id: 'draft', label: 'Draft', icon: Edit3 },
  { id: 'closed', label: 'Closed', icon: CheckCircle2 },
  { id: 'cancelled', label: 'Cancelled', icon: XCircle, isCancel: true },
];


const emptyBlLine = (order: number): FmsJobBlLine => ({
  sort_order: order,
  name_1: '',
  sea_customer: '',
  air_customer: '',
  name_2: '',
  package_text: '',
  unit_text: '',
  sea_etd: '',
  sea_eta: '',
  air_etd: '',
  air_eta: '',
});

const BOUNDS: { value: JobBound; label: string }[] = [
  { value: 'import', label: 'Import' },
  { value: 'export', label: 'Export' },
  { value: 'domestic', label: 'Domestic' },
  { value: 'transit', label: 'Transit' },
];

type JobYesNo = 'yes' | 'no';

function normalizeJobYesNo(raw: string | null | undefined): JobYesNo {
  const s = String(raw ?? '').trim().toLowerCase();
  if (s === 'yes' || s === 'y' || s === 'true' || s === '1') return 'yes';
  return 'no';
}

const YES_NO_OPTIONS: { value: JobYesNo; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

/** Workflow stepper + B/L creation actions. Status transitions are handled by clicking steps directly. */
const JobWorkflowBar: React.FC<{
  variant: 'desktop' | 'mobile';
  currentStatus: JobWorkflowStatus;
  workflowSaving: boolean;
  onCreateSeaHouseBL: () => void;
  onCreateSeaMasterBL: () => void;
  onStepChange?: (status: JobWorkflowStatus) => void;
}> = ({
  variant,
  currentStatus,
  workflowSaving,
  onCreateSeaHouseBL,
  onCreateSeaMasterBL,
  onStepChange,
}) => {
  const blAction =
    'inline-flex items-center justify-center gap-1.5 min-h-9 px-4 py-2 rounded-lg border border-teal-300 bg-teal-50 text-teal-700 text-[11px] font-bold uppercase tracking-wide shadow-sm hover:bg-teal-100 hover:border-teal-400 transition-colors disabled:opacity-45 disabled:pointer-events-none';

  const stepper = <WorkflowStepper steps={JOB_WORKFLOW_STEPS} currentStep={currentStatus} variant={variant} onStepChange={onStepChange} />;

  const blButtons = (
    <div
      className={clsx(
        'flex shrink-0 flex-wrap items-center gap-2',
        variant === 'mobile' && 'w-full',
      )}
    >
      <button type="button" className={blAction} onClick={onCreateSeaHouseBL} disabled={workflowSaving}>
        <Ship size={13} />
        Create Sea House B/L
      </button>
      <button type="button" className={blAction} onClick={onCreateSeaMasterBL} disabled={workflowSaving}>
        <Ship size={13} />
        Create Sea Master B/L
      </button>
    </div>
  );

  if (variant === 'mobile') {
    return (
      <div className="mx-4 mt-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm md:hidden">
        {blButtons}
        <div className="mt-3 w-full overflow-x-auto pb-0.5">{stepper}</div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3">
      {blButtons}
      <div className="flex min-w-0 flex-1 items-center justify-end overflow-x-auto md:max-w-[55%] lg:max-w-none lg:flex-initial">
        {stepper}
      </div>
    </div>
  );
};

function Section({
  title,
  children,
  /** false = natural height (e.g. B/L table); avoids h-full + overflow-hidden clipping in grid */
  fillHeight = true,
}: {
  title: string;
  children: React.ReactNode;
  fillHeight?: boolean;
}) {
  return (
    <section
      className={
        fillHeight
          ? 'flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm'
          : 'flex w-full flex-col overflow-visible rounded-2xl border border-border bg-white shadow-sm'
      }
    >
      <div className="shrink-0 border-b border-border bg-slate-50/80 px-4 py-3">
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">{title}</h2>
      </div>
      <div
        className={
          fillHeight
            ? 'flex min-h-min flex-1 flex-col space-y-3 p-4'
            : 'flex flex-col space-y-3 p-4'
        }
      >
        {children}
      </div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight block mb-1">{children}</label>;
}

type EditorMainTab = 'header' | JobServiceTag;

function splitPersistedServiceDetails(raw: FmsJobServiceDetails | null | undefined): {
  nonSea: Record<string, Record<string, unknown>>;
  sea: JobSeaTabFields;
  seaTables: SeaTabTablesState;
  trucking: TruckingTabState;
  customs: CustomsTabState;
} {
  const full = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};
  const { sea, trucking, customs, ...rest } = full as Record<string, unknown>;
  return {
    nonSea: rest as Record<string, Record<string, unknown>>,
    sea: jobSeaTabFromJson(sea),
    seaTables: parseSeaTables(sea),
    trucking: parseTruckingTab(trucking),
    customs: parseCustomsTab(customs),
  };
}

const JobEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const isCreate = location.pathname.endsWith('/new');
  const jobId = params.id;
  const jobLocationState = location.state as {
    jobCreatedFromQuotation?: boolean;
    quotationBreadcrumb?: { quotationId: string; quotationLabel: string };
  } | null;
  const fromQuotationJob = jobLocationState?.jobCreatedFromQuotation === true;
  const quotationBreadcrumbMeta = jobLocationState?.quotationBreadcrumb;
  const quotationCrumbId = quotationBreadcrumbMeta?.quotationId;
  const quotationCrumbLabel = quotationBreadcrumbMeta?.quotationLabel;

  const { success: toastOk, error: toastErr } = useToastContext();
  const { setCustomBreadcrumbs, setDynamicTitle } = useBreadcrumb();

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [workflowSaving, setWorkflowSaving] = useState(false);
  const [prioritySaving, setPrioritySaving] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [quotations, setQuotations] = useState<Sales[]>([]);

  const [master_job_no, setMasterJobNo] = useState('');
  const [job_date, setJobDate] = useState('');
  const [serviceTags, setServiceTags] = useState<JobServiceTag[]>([]);
  const [bound, setBound] = useState<JobBound | ''>('');

  const [customer_id, setCustomerId] = useState('');
  const [customer_pic, setCustomerPic] = useState('');
  const [customer_phone, setCustomerPhone] = useState('');
  const [customer_email, setCustomerEmail] = useState('');

  const [quotation_id, setQuotationId] = useState('');
  const [performance_date, setPerformanceDate] = useState('');
  const [internalCreatedByLabel, setInternalCreatedByLabel] = useState('—');
  const [internalCreatedOnLabel, setInternalCreatedOnLabel] = useState('—');

  const [product_pic_id, setProductPicId] = useState('');
  const [operators, setOperators] = useState('');
  const [salesperson_id, setSalespersonId] = useState('');
  const [sales_team, setSalesTeam] = useState('');
  const [sales_department, setSalesDepartment] = useState('');
  const [customer_com, setCustomerCom] = useState<JobYesNo>('no');
  const [liner_com, setLinerCom] = useState<JobYesNo>('no');

  const [bl_status, setBlStatus] = useState('');
  const [bl_status_detail, setBlStatusDetail] = useState('');
  const [bl_lines, setBlLines] = useState<FmsJobBlLine[]>([emptyBlLine(0)]);

  const [master_bl_number, setMasterBlNumber] = useState('');
  const [master_bl_carrier, setMasterBlCarrier] = useState('');
  const [master_bl_remarks, setMasterBlRemarks] = useState('');

  const [workflow_status, setWorkflowStatus] = useState<JobWorkflowStatus>('draft');
  const [priority_rank, setPriorityRank] = useState(1);

  const [lastPersistedServiceTags, setLastPersistedServiceTags] = useState<JobServiceTag[]>([]);
  const [nonSeaServiceDetails, setNonSeaServiceDetails] = useState<Record<string, Record<string, unknown>>>({});
  const [seaTabFields, setSeaTabFields] = useState<JobSeaTabFields>(() => emptyJobSeaTabFields());
  const [seaTabTables, setSeaTabTables] = useState<SeaTabTablesState>(() => emptySeaTabTables());
  const [truckingTabState, setTruckingTabState] = useState<TruckingTabState>(() => emptyTruckingTabState());
  const [customsTabState, setCustomsTabState] = useState<CustomsTabState>(() => emptyCustomsTabState());
  const [activeEditorTab, setActiveEditorTab] = useState<EditorMainTab>('header');

  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: e.full_name })),
    [employees],
  );

  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: c.id, label: c.company_name })),
    [customers],
  );

  const boundOptions = useMemo(
    () => BOUNDS.map((b) => ({ value: b.value, label: b.label })),
    [],
  );

  const quotationOptions = useMemo(
    () =>
      quotations.map((q) => ({
        value: q.id,
        label: q.no_doc || `Q-${q.id.slice(0, 8)}`,
      })),
    [quotations],
  );

  const customerCompany = useMemo(
    () => customers.find((c) => c.id === customer_id)?.company_name,
    [customers, customer_id],
  );

  const visiblePersistedServiceTabs = useMemo(
    () => JOB_SERVICE_TAGS.filter((t) => lastPersistedServiceTags.includes(t)),
    [lastPersistedServiceTags],
  );

  const showServiceTabs = !isCreate && !!jobId;

  useEffect(() => {
    if (activeEditorTab === 'header') return;
    if (!visiblePersistedServiceTabs.includes(activeEditorTab as JobServiceTag)) {
      setActiveEditorTab('header');
    }
  }, [activeEditorTab, visiblePersistedServiceTabs]);

  const applyJobToForm = useCallback((job: FmsJob) => {
    setMasterJobNo(job.master_job_no || '');
    setJobDate(job.job_date ? String(job.job_date).slice(0, 10) : '');
    setServiceTags(parseJobServicesStored(job.services));
    setLastPersistedServiceTags(parseJobServicesStored(job.services));
    const { nonSea, sea, seaTables, trucking, customs } = splitPersistedServiceDetails(job.service_details);
    setNonSeaServiceDetails(nonSea);
    setSeaTabFields(sea);
    setSeaTabTables(seaTables);
    setTruckingTabState(trucking);
    setCustomsTabState(customs);
    setBound((job.bound as JobBound) || '');
    setCustomerId(job.customer_id || '');
    setCustomerPic(job.customer_pic || '');
    setCustomerPhone(job.customer_phone || '');
    setCustomerEmail(job.customer_email || '');
    setQuotationId(job.quotation_id || '');
    setPerformanceDate(job.performance_date ? String(job.performance_date).slice(0, 10) : '');
    setProductPicId(job.product_pic_id || '');
    setOperators(job.operators || '');
    setSalespersonId(job.salesperson_id || '');
    setSalesTeam(job.sales_team || '');
    setSalesDepartment(job.sales_department || '');
    setCustomerCom(normalizeJobYesNo(job.customer_com));
    setLinerCom(normalizeJobYesNo(job.liner_com));
    setBlStatus(job.bl_status || '');
    setBlStatusDetail(job.bl_status_detail || '');
    setMasterBlNumber(job.master_bl_number || '');
    setMasterBlCarrier(job.master_bl_carrier || '');
    setMasterBlRemarks(job.master_bl_remarks || '');
    setWorkflowStatus(normalizeJobWorkflowStatus(job.workflow_status));
    setPriorityRank(job.priority_rank ?? 1);

    if (job.quotation) {
      setInternalCreatedByLabel(job.quotation.sales_person?.full_name || '—');
      setInternalCreatedOnLabel(
        job.quotation.created_at ? new Date(job.quotation.created_at).toLocaleString('en-GB') : '—',
      );
    } else {
      setInternalCreatedByLabel(job.created_by?.full_name || '—');
      setInternalCreatedOnLabel(job.created_on ? new Date(job.created_on).toLocaleString('en-GB') : '—');
    }

    const lines = job.bl_lines?.length
      ? job.bl_lines.map((l, i) => ({
          ...l,
          sort_order: l.sort_order ?? i,
          name_1: l.name_1 ?? '',
          sea_customer: l.sea_customer ?? '',
          air_customer: l.air_customer ?? '',
          name_2: l.name_2 ?? '',
          package_text: l.package_text ?? '',
          unit_text: l.unit_text ?? '',
          sea_etd: l.sea_etd ? String(l.sea_etd).slice(0, 10) : '',
          sea_eta: l.sea_eta ? String(l.sea_eta).slice(0, 10) : '',
          air_etd: l.air_etd ? String(l.air_etd).slice(0, 10) : '',
          air_eta: l.air_eta ? String(l.air_eta).slice(0, 10) : '',
        }))
      : [emptyBlLine(0)];
    setBlLines(lines);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const [cust, emp, sales] = await Promise.all([
          customerService.getCustomers(),
          employeeService.getEmployees(),
          salesService.getSalesItems(1, 150),
        ]);
        setCustomers(cust || []);
        setEmployees(emp || []);
        setQuotations(Array.isArray(sales) ? sales : []);
      } catch (e) {
        console.error(e);
        toastErr('Could not load lookup data');
      }
    })();
  }, [toastErr]);

  useEffect(() => {
    if (isCreate || !jobId) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        setLoading(true);
        const job = await jobService.getJob(jobId);
        applyJobToForm(job);
      } catch (e: unknown) {
        toastErr(e instanceof Error ? e.message : 'Failed to load job');
        navigate('/shipping/jobs');
      } finally {
        setLoading(false);
      }
    })();
  }, [isCreate, jobId, navigate, toastErr, applyJobToForm]);

  useEffect(
    () => () => {
      setCustomBreadcrumbs(null);
      setDynamicTitle(null);
    },
    [setCustomBreadcrumbs, setDynamicTitle],
  );

  useEffect(() => {
    if (isCreate) {
      setDynamicTitle('New job');
      return;
    }
    if (jobId) {
      setDynamicTitle(master_job_no.trim() || 'Job');
    } else {
      setDynamicTitle(null);
    }
  }, [isCreate, jobId, master_job_no, setDynamicTitle]);

  useEffect(() => {
    if (
      isCreate ||
      !jobId ||
      !fromQuotationJob ||
      !quotationCrumbId ||
      !quotationCrumbLabel
    ) {
      setCustomBreadcrumbs(null);
      return;
    }
    const shippingMod = sidebarMenu.find((m) => m.path === '/shipping');
    setCustomBreadcrumbs([
      { path: '/shipping', label: shippingMod?.label ?? 'Shipping' },
      { path: '/financials/sales', label: 'Sales' },
      { path: `/financials/sales/${quotationCrumbId}`, label: quotationCrumbLabel },
      { path: `/shipping/jobs/${jobId}`, label: master_job_no.trim() || 'Job' },
      { path: `/shipping/jobs/${jobId}/edit`, label: 'Edit' },
    ]);
  }, [
    isCreate,
    jobId,
    fromQuotationJob,
    quotationCrumbId,
    quotationCrumbLabel,
    master_job_no,
    setCustomBreadcrumbs,
  ]);

  const buildPayload = (): JobUpsertPayload => ({
    master_job_no: master_job_no.trim() || null,
    job_date: job_date || null,
    services: serializeJobServices(serviceTags) || null,
    bound: bound || null,
    customer_id: customer_id || null,
    customer_pic: customer_pic.trim() || null,
    customer_phone: customer_phone.trim() || null,
    customer_email: customer_email.trim() || null,
    quotation_id: quotation_id || null,
    performance_date: performance_date || null,
    product_pic_id: product_pic_id || null,
    operators: operators.trim() || null,
    salesperson_id: salesperson_id || null,
    sales_team: sales_team.trim() || null,
    sales_department: sales_department.trim() || null,
    customer_com: customer_com,
    liner_com: liner_com,
    bl_status: bl_status.trim() || null,
    bl_status_detail: bl_status_detail.trim() || null,
    master_bl_number: master_bl_number.trim() || null,
    master_bl_carrier: master_bl_carrier.trim() || null,
    master_bl_remarks: master_bl_remarks.trim() || null,
    workflow_status,
    priority_rank,
    bl_lines: bl_lines.map((l, i) => ({
      sort_order: i,
      name_1: l.name_1 || null,
      sea_customer: l.sea_customer || null,
      air_customer: l.air_customer || null,
      name_2: l.name_2 || null,
      package_text: l.package_text || null,
      unit_text: l.unit_text || null,
      sea_etd: l.sea_etd || null,
      sea_eta: l.sea_eta || null,
      air_etd: l.air_etd || null,
      air_eta: l.air_eta || null,
    })),
    service_details: {
      ...nonSeaServiceDetails,
      sea: mergeSeaPersisted(seaTabFields, seaTabTables),
      trucking: mergeTruckingPersisted(truckingTabState),
      customs: mergeCustomsPersisted(customsTabState),
    } as FmsJobServiceDetails,
  });

  const quotationSyncBaselineRef = useRef<string | null>(null);
  const prevJobLoadingRef = useRef<boolean | undefined>(undefined);

  const currentPayloadJson = useMemo(
    () => JSON.stringify(buildPayload()),
    [
      master_job_no,
      job_date,
      serviceTags,
      bound,
      customer_id,
      customer_pic,
      customer_phone,
      customer_email,
      quotation_id,
      performance_date,
      product_pic_id,
      operators,
      salesperson_id,
      sales_team,
      sales_department,
      customer_com,
      liner_com,
      bl_status,
      bl_status_detail,
      master_bl_number,
      master_bl_carrier,
      master_bl_remarks,
      workflow_status,
      priority_rank,
      bl_lines,
      nonSeaServiceDetails,
      seaTabFields,
      seaTabTables,
      truckingTabState,
      customsTabState,
    ],
  );

  useEffect(() => {
    if (isCreate || !jobId) {
      quotationSyncBaselineRef.current = null;
      prevJobLoadingRef.current = loading;
      return;
    }
    if (!fromQuotationJob) {
      quotationSyncBaselineRef.current = null;
      prevJobLoadingRef.current = loading;
      return;
    }
    if (prevJobLoadingRef.current === true && loading === false) {
      quotationSyncBaselineRef.current = JSON.stringify(buildPayload());
    }
    prevJobLoadingRef.current = loading;
  }, [isCreate, jobId, loading, fromQuotationJob]);

  const primarySaveLabel = useMemo(() => {
    if (isCreate) return 'Save draft';
    if (
      fromQuotationJob &&
      quotationSyncBaselineRef.current !== null &&
      currentPayloadJson !== quotationSyncBaselineRef.current
    ) {
      return 'Sync';
    }
    return 'Save changes';
  }, [isCreate, fromQuotationJob, currentPayloadJson]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isCreate) {
        const created = await jobService.createJob(payload);
        toastOk('Job created');
        navigate(`/shipping/jobs/${created.id}/edit`, { replace: true });
      } else if (jobId) {
        const hadPendingSync =
          fromQuotationJob &&
          quotationSyncBaselineRef.current !== null &&
          currentPayloadJson !== quotationSyncBaselineRef.current;
        await jobService.updateJob(jobId, payload);
        toastOk(hadPendingSync ? 'Synced' : 'Job saved');
        const refreshed = await jobService.getJob(jobId);
        flushSync(() => applyJobToForm(refreshed));
        if (fromQuotationJob) {
          quotationSyncBaselineRef.current = JSON.stringify(buildPayload());
        }
      }
    } catch (e: unknown) {
      toastErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCustomerChange = async (id: string) => {
    setCustomerId(id);
    if (!id) {
      setCustomerPic('');
      setCustomerPhone('');
      setCustomerEmail('');
      return;
    }
    try {
      const det = await customerService.getCustomerDetails(id);
      const c0 = det.contacts?.[0];
      setCustomerPhone(det.phone || c0?.phone || '');
      setCustomerEmail(det.email || c0?.email || '');
      setCustomerPic(c0?.full_name || det.sales_staff || '');
    } catch {
      toastErr('Could not load customer details');
    }
  };

  const handleQuotationChange = async (id: string) => {
    setQuotationId(id);
    if (!id) {
      setInternalCreatedByLabel('—');
      setInternalCreatedOnLabel('—');
      return;
    }
    try {
      const sale = await salesService.getSalesItemById(id);
      const perf = sale.due_date?.slice(0, 10) || sale.quote_date?.slice(0, 10) || '';
      if (perf) setPerformanceDate(perf);
      setSalespersonId(sale.sales_person_id || '');
      setSalesTeam(sale.sales_person?.team || sale.business_team || '');
      setSalesDepartment(sale.business_department || '');
      setInternalCreatedByLabel(sale.sales_person?.full_name || '—');
      setInternalCreatedOnLabel(sale.created_at ? new Date(sale.created_at).toLocaleString('en-GB') : '—');

      const ship = sale.shipments;
      const custId = (ship?.customer_id || '').trim();
      const qPic = (sale.customer_contact_name || '').trim();
      const qPhone = (sale.customer_contact_tel || '').trim();
      const qEmail = (sale.customer_contact_email || '').trim();
      const sc = ship?.customers;

      if (custId) {
        setCustomerId(custId);
        let pic = qPic || sc?.sales_staff || '';
        let phone = qPhone || sc?.phone || '';
        let email = qEmail || sc?.email || '';
        if (!pic || !phone || !email) {
          try {
            const det = await customerService.getCustomerDetails(custId);
            const c0 = det.contacts?.[0];
            if (!pic) pic = c0?.full_name || det.sales_staff || '';
            if (!phone) phone = det.phone || c0?.phone || '';
            if (!email) email = det.email || c0?.email || '';
          } catch {
            /* keep partial fill from quotation / shipment */
          }
        }
        setCustomerPic(pic || '');
        setCustomerPhone(phone || '');
        setCustomerEmail(email || '');
      } else {
        setCustomerId('');
        setCustomerPic(qPic);
        setCustomerPhone(qPhone);
        setCustomerEmail(qEmail);
      }
    } catch {
      toastErr('Could not load quotation');
    }
  };

  const patchWorkflow = async (next: JobWorkflowStatus) => {
    if (!jobId) {
      toastErr('Save the job first');
      return;
    }
    const prev = workflow_status;
    if (prev === next) return;
    setWorkflowSaving(true);
    try {
      const job = await jobService.patchWorkflow(jobId, next);
      setWorkflowStatus(job.workflow_status);
      const prevLabel = JOB_WORKFLOW_STEPS.find(s => s.id === prev)?.label || prev;
      const nextLabel = JOB_WORKFLOW_STEPS.find(s => s.id === next)?.label || next;
      toastOk(`Job status changed from "${prevLabel}" to "${nextLabel}"`);
    } catch (e: unknown) {
      toastErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setWorkflowSaving(false);
    }
  };

  const patchPriorityRank = async (raw: number) => {
    if (!jobId || isCreate) return;
    const rank = Math.min(3, Math.max(1, Math.round(raw)));
    if (rank === priority_rank) return;
    setPrioritySaving(true);
    try {
      await jobService.updateJob(jobId, { priority_rank: rank });
      setPriorityRank(rank);
      toastOk('Priority updated');
    } catch (e: unknown) {
      toastErr(e instanceof Error ? e.message : 'Could not update priority');
    } finally {
      setPrioritySaving(false);
    }
  };

  const updateBlLine = (index: number, patch: Partial<FmsJobBlLine>) => {
    setBlLines((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addBlLine = () => setBlLines((rows) => [...rows, emptyBlLine(rows.length)]);
  const removeBlLine = (index: number) =>
    setBlLines((rows) => (rows.length <= 1 ? rows : rows.filter((_, i) => i !== index)));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted-foreground">
        <Loader2 className="animate-spin" size={28} />
        <span className="text-[13px] font-medium">Loading job…</span>
      </div>
    );
  }

  const pageHeading = isCreate ? 'New job' : master_job_no || 'Edit job';
  const pageSubtitle =
    isCreate ? (
      'Fill in job details, B/L lines, and workflow'
    ) : customerCompany ? (
      <>
        {master_job_no ? <span className="font-bold text-primary">{master_job_no}</span> : null}
        {master_job_no ? <span className="text-slate-500"> · </span> : null}
        <span className="text-slate-500">{customerCompany}</span>
      </>
    ) : (
      master_job_no || 'Edit saved job'
    );

  return (
    <div className="animate-in fade-in duration-300 mx-auto flex w-full flex-col gap-4 px-0 pb-24 sm:px-1 md:pb-6">
      <div className="md:hidden shrink-0 flex items-center gap-3 border-b border-border bg-white px-4 py-3.5">
        <button
          type="button"
          onClick={() => navigate('/shipping/jobs')}
          className="flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-xl border border-border bg-slate-50 text-slate-600 transition-all hover:border-primary/20 hover:bg-white hover:text-primary touch-manipulation"
          aria-label="Back to jobs"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-3 self-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Briefcase size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-black leading-tight tracking-tight text-slate-900">{pageHeading}</h2>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-muted-foreground">{pageSubtitle}</p>
          </div>
        </div>
      </div>

      {!isCreate && jobId ? (
        <div className="mx-4 flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-2.5 shadow-sm md:hidden">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">Priority</span>
          <ThreeStarRating
            variant="inline"
            value={priority_rank}
            onChange={(v) => void patchPriorityRank(v)}
            disabled={prioritySaving || saving}
          />
        </div>
      ) : null}

      {!isCreate ? (
        <JobWorkflowBar
          variant="mobile"
          currentStatus={workflow_status}
          workflowSaving={workflowSaving}
          onCreateSeaHouseBL={() => jobId && navigate(`/shipping/jobs/${jobId}/sea-house-bl`)}
          onCreateSeaMasterBL={() => toastOk('Create Sea Master B/L — coming soon')}
          onStepChange={patchWorkflow}
        />
      ) : null}

      <div className="mb-0 hidden shrink-0 md:mb-6 md:block md:px-0">
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm shadow-slate-200/40">
          <div
            className={clsx(
              'flex flex-col gap-4 bg-gradient-to-br from-white via-white to-slate-50/40 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-6',
              !isCreate && 'border-b border-slate-100',
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/shipping/jobs')}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-slate-600 shadow-sm transition-all hover:border-primary/25 hover:bg-primary/5 hover:text-primary touch-manipulation"
                aria-label="Back to jobs"
              >
                <ChevronLeft size={22} />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-black tracking-tight text-slate-900 lg:text-2xl">{pageHeading}</h1>
                <p className="mt-1 truncate text-[13px] font-medium text-muted-foreground">{pageSubtitle}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-start gap-3 lg:shrink-0 lg:justify-end">
              {!isCreate && jobId ? (
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Priority</span>
                  <ThreeStarRating
                    variant="inline"
                    value={priority_rank}
                    onChange={(v) => void patchPriorityRank(v)}
                    disabled={prioritySaving || saving}
                  />
                </div>
              ) : null}
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-[12px] font-bold text-white shadow-md shadow-primary/25 transition-all hover:bg-primary/90 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {primarySaveLabel}
              </button>
            </div>
          </div>

          {!isCreate ? (
            <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3 lg:px-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Workflow</span>
              </div>
              <JobWorkflowBar
                variant="desktop"
                currentStatus={workflow_status}
                workflowSaving={workflowSaving}
                onCreateSeaHouseBL={() => jobId && navigate(`/shipping/jobs/${jobId}/sea-house-bl`)}
                onCreateSeaMasterBL={() => toastOk('Create Sea Master B/L — coming soon')}
                onStepChange={patchWorkflow}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-4 lg:gap-5">
        <div className="min-w-0 w-full">
          <Section fillHeight={false} title="Job">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="min-w-0">
                <FieldLabel>Master Job No.</FieldLabel>
                <input
                  value={master_job_no}
                  onChange={(e) => setMasterJobNo(e.target.value)}
                  placeholder="Leave blank to auto-generate"
                  className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
                />
              </div>
              <div className="min-w-0">
                <FieldLabel>Date</FieldLabel>
                <DateInput value={job_date} onChange={setJobDate} className="w-full" />
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                    Services
                  </span>
                  <span
                    className="inline-flex cursor-help text-muted-foreground"
                    title="Select one or more service types: SEA, AIR, Trucking, Customs, Others."
                  >
                    <HelpCircle size={12} strokeWidth={2.5} aria-label="About services" />
                  </span>
                </div>
                <JobServicesTagsSelect value={serviceTags} onChange={setServiceTags} />
              </div>
              <div className="min-w-0">
                <FieldLabel>Bound</FieldLabel>
                <SearchableSelect
                  options={boundOptions}
                  value={bound || undefined}
                  onValueChange={(v) => setBound((v as JobBound) || '')}
                  placeholder="Select bound"
                  searchPlaceholder="Search bound…"
                  hideSearch
                />
              </div>
            </div>
          </Section>
        </div>

        {/* overflow-hidden + inner overflow-x-auto can force overflow-y:auto and nested scrollbars on Sea. */}
        <div className="overflow-x-clip rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex flex-wrap gap-1 overflow-x-auto overflow-y-hidden border-b border-border bg-slate-50/80 px-2 py-2 sm:px-3">
            <button
              type="button"
              onClick={() => setActiveEditorTab('header')}
              className={clsx(
                'shrink-0 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors',
                activeEditorTab === 'header'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white/80',
              )}
            >
              Header
            </button>
            {showServiceTabs
              ? visiblePersistedServiceTabs.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveEditorTab(tag)}
                    className={clsx(
                      'shrink-0 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors',
                      activeEditorTab === tag
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white/80',
                    )}
                  >
                    {tag}
                  </button>
                ))
              : null}
          </div>
          <div className="min-h-0 min-w-0">
            {activeEditorTab === 'header' ? (
              <div className="flex flex-col gap-4 p-2 sm:p-3">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch lg:gap-5">
          <div className="min-h-0 min-w-0 lg:h-full">
            <Section title="Internal information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <FieldLabel>Quotation</FieldLabel>
                  <SearchableSelect
                    options={quotationOptions}
                    value={quotation_id || undefined}
                    onValueChange={(v) => void handleQuotationChange(v)}
                    placeholder="Select quotation"
                    searchPlaceholder="Search quotations…"
                  />
                </div>
                <div>
                  <FieldLabel>Performance date</FieldLabel>
                  <DateInput value={performance_date} onChange={setPerformanceDate} className="w-full" />
                </div>
                <div>
                  <FieldLabel>Created by</FieldLabel>
                  <div className="flex min-h-[42px] items-center rounded-xl border border-dashed border-border bg-slate-50/80 px-3 py-2 text-[13px] font-semibold text-slate-700">
                    {internalCreatedByLabel}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Created on</FieldLabel>
                  <div className="flex min-h-[42px] items-center rounded-xl border border-dashed border-border bg-slate-50/80 px-3 py-2 text-[13px] font-semibold text-slate-700">
                    {internalCreatedOnLabel}
                  </div>
                </div>
              </div>
            </Section>
          </div>

          <div className="min-h-0 min-w-0 lg:h-full">
            <Section title="Customer information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <FieldLabel>Customer</FieldLabel>
                  <SearchableSelect
                    options={customerOptions}
                    value={customer_id || undefined}
                    onValueChange={(v) => void handleCustomerChange(v)}
                    placeholder="Select customer"
                    searchPlaceholder="Search customers…"
                  />
                </div>
                <div>
                  <FieldLabel>PIC</FieldLabel>
                  <input
                    value={customer_pic}
                    onChange={(e) => setCustomerPic(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
                  />
                </div>
                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <input
                    value={customer_phone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Email</FieldLabel>
                  <input
                    type="email"
                    value={customer_email}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
                  />
                </div>
              </div>
            </Section>
          </div>
        </div>

        <div className="min-w-0 w-full">
          <Section fillHeight={false} title="Sales information">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start md:gap-6">
              <div className="flex min-w-0 flex-col gap-3">
                <div>
                  <FieldLabel>Product PIC</FieldLabel>
                  <SearchableSelect
                    options={employeeOptions}
                    value={product_pic_id || undefined}
                    onValueChange={setProductPicId}
                    placeholder="Select"
                  />
                </div>
                <div>
                  <FieldLabel>Operators</FieldLabel>
                  <input
                    value={operators}
                    onChange={(e) => setOperators(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
                  />
                </div>
                <div>
                  <FieldLabel>Salesperson</FieldLabel>
                  <SearchableSelect
                    options={employeeOptions}
                    value={salesperson_id || undefined}
                    onValueChange={setSalespersonId}
                    placeholder="Select"
                  />
                </div>
                <div>
                  <FieldLabel>Sales team</FieldLabel>
                  <input
                    value={sales_team}
                    onChange={(e) => setSalesTeam(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
                  />
                </div>
                <div>
                  <FieldLabel>Sales department</FieldLabel>
                  <input
                    value={sales_department}
                    onChange={(e) => setSalesDepartment(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
                  />
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-3">
                <div>
                  <FieldLabel>Customer&apos;s COM</FieldLabel>
                  <SearchableSelect
                    options={YES_NO_OPTIONS}
                    value={customer_com}
                    onValueChange={(v) => setCustomerCom((v as JobYesNo) || 'no')}
                    placeholder="Select"
                    searchPlaceholder="Search…"
                    hideSearch
                  />
                </div>
                <div>
                  <FieldLabel>Liner&apos;s COM</FieldLabel>
                  <SearchableSelect
                    options={YES_NO_OPTIONS}
                    value={liner_com}
                    onValueChange={(v) => setLinerCom((v as JobYesNo) || 'no')}
                    placeholder="Select"
                    searchPlaceholder="Search…"
                    hideSearch
                  />
                </div>
              </div>
            </div>
          </Section>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-4">
          <Section fillHeight={false} title="B/L information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Status</FieldLabel>
                <input
                  value={bl_status}
                  onChange={(e) => setBlStatus(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
                />
              </div>
              <div>
                <FieldLabel>Status detail</FieldLabel>
                <input
                  value={bl_status_detail}
                  onChange={(e) => setBlStatusDetail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
                />
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">B/L lines</span>
              <button
                type="button"
                onClick={addBlLine}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
              >
                <Plus size={14} />
                Add row
              </button>
            </div>
            <div className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-border">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 border-b border-border">
                  <tr>
                    {['Name', 'Sea customer', 'Air customer', 'Name', 'Package', 'Unit', 'Sea ETD', 'Sea ETA', 'Air ETD', 'Air ETA', ''].map((h) => (
                      <th key={h} className="px-2 py-2 font-bold text-muted-foreground uppercase whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bl_lines.map((row, idx) => (
                    <tr key={idx} className="border-b border-border/60 last:border-0">
                      <td className="p-1 align-middle">
                        <input
                          value={row.name_1 || ''}
                          onChange={(e) => updateBlLine(idx, { name_1: e.target.value })}
                          className="box-border h-8 w-[100px] min-w-0 rounded border border-border px-1.5 text-[11px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <input
                          value={row.sea_customer || ''}
                          onChange={(e) => updateBlLine(idx, { sea_customer: e.target.value })}
                          className="box-border h-8 w-[100px] min-w-0 rounded border border-border px-1.5 text-[11px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <input
                          value={row.air_customer || ''}
                          onChange={(e) => updateBlLine(idx, { air_customer: e.target.value })}
                          className="box-border h-8 w-[100px] min-w-0 rounded border border-border px-1.5 text-[11px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <input
                          value={row.name_2 || ''}
                          onChange={(e) => updateBlLine(idx, { name_2: e.target.value })}
                          className="box-border h-8 w-[100px] min-w-0 rounded border border-border px-1.5 text-[11px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <input
                          value={row.package_text || ''}
                          onChange={(e) => updateBlLine(idx, { package_text: e.target.value })}
                          className="box-border h-8 w-[72px] min-w-0 rounded border border-border px-1.5 text-[11px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <input
                          value={row.unit_text || ''}
                          onChange={(e) => updateBlLine(idx, { unit_text: e.target.value })}
                          className="box-border h-8 w-[56px] min-w-0 rounded border border-border px-1.5 text-[11px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <DateInput
                          dense
                          value={row.sea_etd || ''}
                          onChange={(v) => updateBlLine(idx, { sea_etd: v })}
                          className="min-w-[108px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <DateInput
                          dense
                          value={row.sea_eta || ''}
                          onChange={(v) => updateBlLine(idx, { sea_eta: v })}
                          className="min-w-[108px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <DateInput
                          dense
                          value={row.air_etd || ''}
                          onChange={(v) => updateBlLine(idx, { air_etd: v })}
                          className="min-w-[108px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <DateInput
                          dense
                          value={row.air_eta || ''}
                          onChange={(v) => updateBlLine(idx, { air_eta: v })}
                          className="min-w-[108px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <button
                          type="button"
                          onClick={() => removeBlLine(idx)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section fillHeight={false} title="Master B/L information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Master B/L no.</FieldLabel>
                <input
                  value={master_bl_number}
                  onChange={(e) => setMasterBlNumber(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
                />
              </div>
              <div>
                <FieldLabel>Carrier</FieldLabel>
                <input
                  value={master_bl_carrier}
                  onChange={(e) => setMasterBlCarrier(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Remarks</FieldLabel>
                <textarea
                  value={master_bl_remarks}
                  onChange={(e) => setMasterBlRemarks(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium resize-y"
                />
              </div>
            </div>
          </Section>
        </div>
        </div>
            ) : activeEditorTab === 'SEA' ? (
              <JobSeaTabPanel
                sea={seaTabFields}
                setSea={setSeaTabFields}
                seaTables={seaTabTables}
                setSeaTables={setSeaTabTables}
                productPicId={product_pic_id}
                onProductPicChange={setProductPicId}
                employeeOptions={employeeOptions}
              />
            ) : activeEditorTab === 'Trucking' ? (
              <JobTruckingTabPanel trucking={truckingTabState} setTrucking={setTruckingTabState} />
            ) : activeEditorTab === 'Customs' ? (
              <JobCustomsTabPanel
                customs={customsTabState}
                setCustoms={setCustomsTabState}
                boundOptions={boundOptions}
              />
            ) : (
              <div className="p-6 text-center text-[13px] text-muted-foreground">
                This section will be available in a future update.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 px-4 py-3 shadow-[0_-12px_40px_rgba(15,23,42,0.07)] backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-white shadow-md shadow-primary/20 hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-45"
        >
          {saving ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
          {primarySaveLabel}
        </button>
      </div>
    </div>
  );
};

export default JobEditorPage;
