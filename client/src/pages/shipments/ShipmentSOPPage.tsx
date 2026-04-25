
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Ship, ArrowLeft, Save, Loader2, AlertTriangle, Users, XCircle, CheckCircle2, Circle, Wand2
} from 'lucide-react';
import { clsx } from 'clsx';
import isEqual from 'lodash/isEqual';

import { shipmentService } from '../../services/shipmentService';
import type { AllowedTransitionsResult, RunGatesResult } from '../../services/shipmentService';
import { customerService, type Customer } from '../../services/customerService';
import { supplierService, type Supplier, type CreateSupplierDto } from '../../services/supplierService';
import { contractService } from '../../services/contractService';
import { employeeService } from '../../services/employeeService';
import { salesService } from '../../services/salesService';
import type { Contract } from '../contracts/types';
import type { Sales } from '../sales/types';
import ContractDialog from '../contracts/dialogs/ContractDialog';
import {
  shipmentDocumentService,
  type CreateShipmentDocumentDto,
  type ShipmentDocument,
} from '../../services/shipmentDocumentService';
import {
  customsClearanceService,
  type CreateCustomsClearanceDto,
  type CustomsClearance,
} from '../../services/customsClearanceService';

import type { ShipmentFormState } from './types';
import { useToastContext } from '../../contexts/ToastContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

// Tabs
import OverviewTab from './tabs/OverviewTab';
import SalesBlTab from './tabs/SalesBlTab';
import DocumentsTab from './tabs/DocumentsTab';
import CustomsTab from './tabs/CustomsTab';
import TransportTab from './tabs/TransportTab';
import TrackingTab from './tabs/TrackingTab';
import CostControlTab from './tabs/CostControlTab';
import IncidentsTab from './tabs/IncidentsTab';
import AgentsTab from './tabs/AgentsTab';

// ─── Constants ─────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'sales_bl', label: 'Sales & B/L' },
  { id: 'costs', label: 'Costing' },
  { id: 'documents', label: 'Documents' },
  { id: 'transport', label: 'Transport' },
  { id: 'customs', label: 'Customs' },
  { id: 'tracking', label: 'Tracking' },
] as const;

type TabId = typeof TABS[number]['id'];

type ContractOption = { value: string; label: string; customer_id?: string; supplier_id?: string };
type ChecklistField =
  | 'contract_id'
  | 'is_docs_ready'
  | 'is_hs_confirmed'
  | 'is_phytosanitary_ready'
  | 'is_cost_locked'
  | 'is_truck_booked'
  | 'is_agent_booked';

function contractsMatchingParties(
  all: ContractOption[],
  customerId: string | undefined | null,
  supplierId: string | undefined | null,
): ContractOption[] {
  const cid = customerId || '';
  const sid = supplierId || '';
  if (!cid && !sid) return [];
  return all.filter(
    (c) => (cid && c.customer_id === cid) || (sid && c.supplier_id === sid),
  );
}

const INITIAL_FORM: ShipmentFormState = {
  code: '', customer_id: '', supplier_id: '', commodity: '', hs_code: '',
  quantity: 0, packing: '', vessel_voyage: '', term: '',
  transport_air: false, transport_sea: true, load_fcl: true, load_lcl: false,
  pol: '', pod: '', etd: '', eta: '', status: 'draft',
  is_docs_ready: false, is_hs_confirmed: false, is_phytosanitary_ready: false,
  is_cost_locked: false, is_truck_booked: false, is_agent_booked: false,
  pod_confirmed_at: null, cost_locked_at: null,
  isNewCustomer: false, newCustomer: { company_name: '', code: '', address: '', phone: '', email: '', tax_code: '' },
  isNewSupplier: false, newSupplier: { id: '', company_name: '', address: '', phone: '', email: '', tax_code: '' },
  pic_id: '',
};

const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  draft:               { label: 'Draft',            classes: 'bg-slate-100 text-slate-600 border-slate-200' },
  feasibility_checked: { label: 'Feasibility Chk',  classes: 'bg-violet-50 text-violet-600 border-violet-200' },
  approved:            { label: 'Approved',         classes: 'bg-amber-50 text-amber-600 border-amber-200' },
  cost_locked:         { label: 'Cost Locked',      classes: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  docs_ready:          { label: 'Docs Ready',       classes: 'bg-blue-50 text-blue-600 border-blue-200' },
  booked:              { label: 'Booked',           classes: 'bg-orange-50 text-orange-600 border-orange-200' },
  customs_cleared:     { label: 'Customs Cleared',  classes: 'bg-teal-50 text-teal-700 border-teal-200' },
  in_transit:          { label: 'In Transit',       classes: 'bg-blue-50 text-blue-600 border-blue-200' },
  delivered:           { label: 'Delivered',        classes: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  completed:           { label: 'Completed',        classes: 'bg-green-50 text-green-700 border-green-200' },
  cancelled:           { label: 'Cancelled',        classes: 'bg-red-50 text-red-600 border-red-200' },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuidOrNullish = (value: unknown) =>
  value == null || value === '' || (typeof value === 'string' && UUID_RE.test(value));
const normalizePriorityRank = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  return Math.min(3, Math.max(1, rounded));
};

const CHECKLIST_GATES: Array<{ key: string; label: string; field: ChecklistField }> = [
  { key: 'contract_ok', label: 'Contract Linked', field: 'contract_id' },
  { key: 'docs_ready', label: 'Documents Ready', field: 'is_docs_ready' },
  { key: 'hs_confirmed', label: 'HS Confirmed', field: 'is_hs_confirmed' },
  { key: 'phytosanitary', label: 'Phytosanitary', field: 'is_phytosanitary_ready' },
  { key: 'cost_locked', label: 'Cost Locked', field: 'is_cost_locked' },
  { key: 'truck_booked', label: 'Truck Booked', field: 'is_truck_booked' },
  { key: 'agent_booked', label: 'Agent Booked', field: 'is_agent_booked' },
];

const DOC_READY_STATUSES = new Set(['verified', 'issued']);

// ─── Component ─────────────────────────────────────────
const ShipmentSOPPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToastContext();
  const { setCustomBreadcrumbs } = useBreadcrumb();
  const isEditMode = Boolean(id);
  const hasValidEditId = !id || UUID_RE.test(id);

  // form + data
  const getTabFromQuery = (): TabId => {
    const tab = new URLSearchParams(location.search).get('tab');
    const found = TABS.find((t) => t.id === tab);
    return (found?.id as TabId) || 'overview';
  };
  const [activeTab, setActiveTab] = useState<TabId>(getTabFromQuery);
  const [form, setForm] = useState<ShipmentFormState>({ ...INITIAL_FORM });
  const [savedForm, setSavedForm] = useState<ShipmentFormState>({ ...INITIAL_FORM });
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<(Partial<Customer> & { value: string; label: string })[]>([]);
  const [suppliers, setSuppliers] = useState<(Partial<Supplier> & { value: string; label: string })[]>([]);
  const [contracts, setContracts] = useState<{ value: string; label: string; customer_id?: string; supplier_id?: string }[]>([]);
  const [quotations, setQuotations] = useState<Sales[]>([]);
  const [documents, setDocuments] = useState<ShipmentDocument[]>([]);
  const [customsClearances, setCustomsClearances] = useState<CustomsClearance[]>([]);
  
  const [showIncidents, setShowIncidents] = useState(false);
  const [showAgents, setShowAgents] = useState(false);

  // API-driven state (no hardcoded logic)
  const [allowedTransitions, setAllowedTransitions] = useState<AllowedTransitionsResult | null>(null);
  const [runGates, setRunGates] = useState<RunGatesResult | null>(null);

  // new doc/customs state
  const [newDocType, setNewDocType] = useState<CreateShipmentDocumentDto['doc_type']>('commercial_invoice');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [documentActionLoadingId, setDocumentActionLoadingId] = useState<string | null>(null);

  const [newCustomsHsCode, setNewCustomsHsCode] = useState('');
  const [newPhytosanitaryStatus, setNewPhytosanitaryStatus] = useState<CreateCustomsClearanceDto['phytosanitary_status']>('pending');
  const [newHsConfirmed, setNewHsConfirmed] = useState(false);
  const [isCreatingCustoms, setIsCreatingCustoms] = useState(false);
  const [customsActionLoadingId, setCustomsActionLoadingId] = useState<string | null>(null);

  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);

  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [isContractDialogClosing, setIsContractDialogClosing] = useState(false);
  const [contractFormState, setContractFormState] = useState<Partial<Contract>>({});
  const [employees, setEmployees] = useState<any[]>([]);

  const setField = <K extends keyof ShipmentFormState>(key: K, value: ShipmentFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Nav Guard
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const hasUnsavedChanges = !isEqual(form, savedForm);

  const handleNavigateAway = (path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowUnsavedDialog(true);
    } else {
      navigate(path);
    }
  };

  const confirmNavigate = () => {
    setShowUnsavedDialog(false);
    if (pendingNavigation) navigate(pendingNavigation);
  };
  const cancelNavigate = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  const handleChecklistToggle = (
    field:
      | 'contract_id'
      | 'is_docs_ready'
      | 'is_hs_confirmed'
      | 'is_phytosanitary_ready'
      | 'is_cost_locked'
      | 'is_truck_booked'
      | 'is_agent_booked',
    checked: boolean,
  ) => {
    if (field === 'contract_id') {
      if (!checked) {
        setField('contract_id', null);
        return;
      }

      if (form.contract_id) return;
      if (overviewContractOptions.length === 1) {
        setField('contract_id', overviewContractOptions[0]!.value);
        return;
      }

      toast.error('Please select or create a valid Contract before linking.');
      return;
    }

    setField(field, checked as ShipmentFormState[typeof field]);
  };

  const autoChecklistPatch = useMemo(() => {
    const hasContract = Boolean(form.contract_id);
    const docsReady = documents.some((d) => DOC_READY_STATUSES.has(String(d.status)));
    const hsConfirmed = customsClearances.some((c) => Boolean(c.hs_confirmed));
    const phytosanitaryReady = customsClearances.some((c) => c.phytosanitary_status === 'passed');
    const plannedCost = (form as any).planned_cost as unknown;
    const hasPlannedCost =
      plannedCost != null &&
      typeof plannedCost === 'object' &&
      Object.keys(plannedCost as Record<string, unknown>).length > 0;
    const costLocked = Boolean(form.cost_locked_at) || hasPlannedCost;
    const patch: Partial<ShipmentFormState> = {};
    if (hasContract) patch.contract_id = form.contract_id;
    if (docsReady) patch.is_docs_ready = true;
    if (hsConfirmed) patch.is_hs_confirmed = true;
    if (phytosanitaryReady) patch.is_phytosanitary_ready = true;
    if (costLocked) patch.is_cost_locked = true;
    return patch;
  }, [form, documents, customsClearances]);

  const applyAutoChecklist = useCallback(() => {
    const updates: Partial<ShipmentFormState> = {};
    if (autoChecklistPatch.contract_id && !form.contract_id) updates.contract_id = autoChecklistPatch.contract_id;
    if (autoChecklistPatch.is_docs_ready && !form.is_docs_ready) updates.is_docs_ready = true;
    if (autoChecklistPatch.is_hs_confirmed && !form.is_hs_confirmed) updates.is_hs_confirmed = true;
    if (autoChecklistPatch.is_phytosanitary_ready && !form.is_phytosanitary_ready) updates.is_phytosanitary_ready = true;
    if (autoChecklistPatch.is_cost_locked && !form.is_cost_locked) updates.is_cost_locked = true;
    if (Object.keys(updates).length === 0) {
      toast.error('No checklist items can be auto-filled from current data.');
      return;
    }
    setForm((prev) => ({ ...prev, ...updates }));
    toast.success('Checklist auto-filled from current shipment data.');
  }, [autoChecklistPatch, form, toast]);

  // ─── Load Data ─────────────────────────────────────
  const loadMasterData = useCallback(async () => {
    try {
      const [custData, suppData, contractData, empData, salesData] = await Promise.all([
        customerService.getCustomers(),
        supplierService.getSuppliers(),
        contractService.getContracts(1, 500),
        employeeService.getEmployees(),
        salesService.getSalesItems(1, 500),
      ]);
      setCustomers((custData || []).map((c: any) => ({
        ...c, value: c.id, label: c.company_name || c.name || c.id,
      })));
      setSuppliers((suppData || []).map((s: any) => ({
        ...s, value: s.id, label: s.company_name || s.name || s.id,
      })));
      setContracts((contractData || []).map((ct: any) => ({
        value: ct.id,
        label: `${ct.no_contract || ct.id.slice(0, 8)} — ${ct.customers?.company_name || ct.suppliers?.company_name || ''}`.trim(),
        customer_id: ct.customer_id,
        supplier_id: ct.supplier_id,
      })));
      setEmployees(empData || []);
      setQuotations(Array.isArray(salesData) ? salesData : []);
    } catch (err) { console.error('Failed to load master data:', err); }
  }, []);

  const loadShipment = useCallback(async () => {
    if (!id || !UUID_RE.test(id)) return;
    try {
      setLoading(true);
      const data = await shipmentService.getShipmentById(id);
      if (data) {
        const loadedData = {
          ...INITIAL_FORM,
          ...data,
          isNewCustomer: false,
          isNewSupplier: false,
          newCustomer: { company_name: '' },
          newSupplier: { id: '', company_name: '' },
        };
        setForm(loadedData);
        setSavedForm(loadedData);
      }
    } catch (err) { console.error('Failed to load shipment:', err); }
    finally { setLoading(false); }
  }, [id]);

  const loadCompliance = useCallback(async () => {
    if (!id || !UUID_RE.test(id)) return;
    try {
      const [docs, customs] = await Promise.all([
        shipmentDocumentService.getShipmentDocuments(1, 1000, id),
        customsClearanceService.getCustomsClearances(1, 1000, id),
      ]);
      setDocuments(Array.isArray(docs) ? docs : []);
      setCustomsClearances(Array.isArray(customs) ? customs : []);
    } catch (err) { console.error(err); }
  }, [id]);

  const loadApiState = useCallback(async () => {
    if (!id || !UUID_RE.test(id)) return;
    try {
      const [trans, gates] = await Promise.all([
        shipmentService.getAllowedTransitions(id),
        shipmentService.getRunGates(id),
      ]);
      setAllowedTransitions(trans);
      setRunGates(gates);
    } catch (err) { console.error('Failed to load API state:', err); }
  }, [id]);

  useEffect(() => { loadMasterData(); }, [loadMasterData]);
  useEffect(() => {
    if (!id) return;
    if (!hasValidEditId) {
      toast.error('Invalid shipment id. Please open shipment from the list.');
      navigate('/shipments/information', { replace: true });
      return;
    }
    loadShipment();
    loadCompliance();
    loadApiState();
  }, [id, hasValidEditId, loadShipment, loadCompliance, loadApiState, navigate, toast]);
  useEffect(() => {
    setActiveTab(getTabFromQuery());
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') !== 'feasibility') return;
    params.delete('tab');
    const q = params.toString();
    navigate({ pathname: location.pathname, search: q ? `?${q}` : '' }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  const autoContractAttemptRef = useRef<string | null>(null);
  const activeShipmentIdRef = useRef<string | undefined>(undefined);
  activeShipmentIdRef.current = id;

  const partyMatchedContracts = useMemo(
    () => contractsMatchingParties(contracts, form.customer_id, form.supplier_id),
    [contracts, form.customer_id, form.supplier_id],
  );

  const overviewContractOptions = useMemo(() => {
    const base = partyMatchedContracts;
    if (form.contract_id && !base.some((c) => c.value === form.contract_id)) {
      const extra = contracts.find((c) => c.value === form.contract_id);
      return extra ? [...base, extra] : base;
    }
    return base;
  }, [partyMatchedContracts, contracts, form.contract_id]);

  const overviewQuotationOptions = useMemo(() => {
    const customerId = (form.customer_id || '').trim();
    const base = quotations
      .filter((q) => {
        if (!customerId) return true;
        const qCustomer = (q.customer_id || q.shipments?.customer_id || '').trim();
        return qCustomer === customerId;
      })
      .map((q) => ({
        value: q.id,
        label: `${q.no_doc || `Q-${q.id.slice(0, 8).toUpperCase()}`} · ${(q.status || 'draft').toUpperCase()}${q.customer_trade_name ? ` · ${q.customer_trade_name}` : ''}`,
      }));

    if (form.quotation_id && !base.some((q) => q.value === form.quotation_id)) {
      const selected = quotations.find((q) => q.id === form.quotation_id);
      if (selected) {
        return [
          {
            value: selected.id,
            label: `${selected.no_doc || `Q-${selected.id.slice(0, 8).toUpperCase()}`} · ${(selected.status || 'draft').toUpperCase()}`,
          },
          ...base,
        ];
      }
    }
    return base;
  }, [quotations, form.customer_id, form.quotation_id]);

  /** When there is exactly one contract for this customer/supplier, link it and persist (no ambiguous multi-match). */
  useEffect(() => {
    if (!id || loading) return;

    const partyKey = `${id}|${form.customer_id || ''}|${form.supplier_id || ''}`;
    const contractsFingerprint = contracts.map((c) => c.value).sort().join(',');

    if (form.contract_id) {
      autoContractAttemptRef.current = `${partyKey}|${contractsFingerprint}|has_contract`;
      return;
    }

    const attemptId = `${partyKey}|${contractsFingerprint}`;
    if (autoContractAttemptRef.current === attemptId) return;

    if (!form.customer_id && !form.supplier_id) {
      autoContractAttemptRef.current = attemptId;
      return;
    }

    if (contracts.length === 0) return;

    const candidates = contractsMatchingParties(contracts, form.customer_id, form.supplier_id);
    if (candidates.length !== 1) {
      autoContractAttemptRef.current = attemptId;
      return;
    }

    autoContractAttemptRef.current = attemptId;
    const only = candidates[0]!;
    const shipmentId = id;

    (async () => {
      try {
        await shipmentService.updateShipment(shipmentId, { contract_id: only.value });
        if (activeShipmentIdRef.current !== shipmentId) return;
        setForm((prev) => ({ ...prev, contract_id: only.value }));
        setSavedForm((prev) => ({ ...prev, contract_id: only.value }));
        toast.success('Contract linked automatically (single match for this customer/supplier).');
        await loadApiState();
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || 'Could not auto-link contract');
      }
    })();
  }, [
    id,
    loading,
    form.contract_id,
    form.customer_id,
    form.supplier_id,
    contracts,
    loadApiState,
    toast,
  ]);

  // Breadcrumbs
  useEffect(() => {
    const shipmentLabel = form.code || (id ? id.slice(0, 8) : 'New');
    setCustomBreadcrumbs([
      { path: '/operations', label: 'Operations' },
      { path: '/shipments/information', label: 'Shipment' },
      { path: window.location.pathname, label: shipmentLabel },
    ]);

    return () => setCustomBreadcrumbs(null);
  }, [form.code, id, setCustomBreadcrumbs]);

  // ─── Save Handler ──────────────────────────────────
  const handleSave = async () => {
    if (!form.customer_id) {
      toast.error('Please select Customer before saving');
      return;
    }
    if (form.etd && form.eta) {
      const etdTs = new Date(form.etd).getTime();
      const etaTs = new Date(form.eta).getTime();
      if (!Number.isNaN(etdTs) && !Number.isNaN(etaTs) && etaTs < etdTs) {
        toast.error('ETA must be greater than or equal to ETD');
        return;
      }
    }
    if (
      !isUuidOrNullish(form.contract_id) ||
      !isUuidOrNullish(form.quotation_id) ||
      !isUuidOrNullish(form.salesperson_id) ||
      !isUuidOrNullish(form.product_pic_id) ||
      !isUuidOrNullish(form.pic_id)
    ) {
      toast.error('One or more linked IDs are invalid. Please re-select linked records.');
      return;
    }
    try {
      setSaving(true);
      const payload: any = {
        customer_id: form.customer_id, supplier_id: form.supplier_id,
        code: form.code || undefined, commodity: form.commodity, hs_code: form.hs_code || null,
        quantity: form.quantity || 0, packing: form.packing || null,
        vessel_voyage: form.vessel_voyage || null, term: form.term || null,
        transport_air: form.transport_air, transport_sea: form.transport_sea,
        load_fcl: form.load_fcl, load_lcl: form.load_lcl,
        pol: form.pol || null, pod: form.pod || null,
        etd: form.etd || null, eta: form.eta || null,
        status: form.status, is_docs_ready: form.is_docs_ready,
        is_hs_confirmed: form.is_hs_confirmed, is_phytosanitary_ready: form.is_phytosanitary_ready,
        is_cost_locked: form.is_cost_locked, is_truck_booked: form.is_truck_booked,
        is_agent_booked: form.is_agent_booked,
        pic_id: form.pic_id || null,
        contract_id: form.contract_id || null,
        quotation_id: form.quotation_id || null,
        salesperson_id: form.salesperson_id || null,
        sales_team: form.sales_team || null,
        sales_department: form.sales_department || null,
        product_pic_id: form.product_pic_id || null,
        operators: form.operators?.trim() ? form.operators.trim() : null,
        bl_status: form.bl_status || null,
        bl_status_detail: form.bl_status_detail || null,
        master_bl_number: form.master_bl_number || null,
        master_bl_carrier: form.master_bl_carrier || null,
        master_bl_remarks: form.master_bl_remarks || null,
        bound: form.bound || null,
        services: form.services || null,
        job_date: form.job_date || null,
        performance_date: form.performance_date || null,
        priority_rank: normalizePriorityRank(form.priority_rank),
      };
      if (isEditMode && id) {
        await shipmentService.updateShipment(id, payload);
        toast.success('Shipment updated successfully!');
        await loadShipment(); 
      } else {
        const created = await shipmentService.createShipment(payload);
        toast.success('New shipment created successfully!');
        setSavedForm(form); 
        if (created?.id) navigate(`/shipments/sop/${created.id}`, { replace: true });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error saving shipment');
    } finally { setSaving(false); }
  };

  // ─── Sub-handlers ──────────────────────────────────
  const handleCreateDocument = async () => {
    if (!id) return;
    try {
      setIsCreatingDocument(true);
      await shipmentDocumentService.createShipmentDocument({ shipment_id: id, doc_type: newDocType, status: 'draft', doc_number: newDocNumber || null });
      setNewDocNumber('');
      loadCompliance();
      toast.success('Added document');
    } catch (err) { console.error(err); } finally { setIsCreatingDocument(false); }
  };
  const handleChangeDocStatus = async (docId: string, status: ShipmentDocument['status']) => {
    try { setDocumentActionLoadingId(docId); await shipmentDocumentService.updateShipmentDocument(docId, { status }); loadCompliance(); }
    catch (err) { console.error(err); } finally { setDocumentActionLoadingId(null); }
  };
  const handleDeleteDoc = async (docId: string) => {
    try { setDocumentActionLoadingId(docId); await shipmentDocumentService.deleteShipmentDocument(docId); loadCompliance(); }
    catch (err) { console.error(err); } finally { setDocumentActionLoadingId(null); }
  };

  const handleCreateCustoms = async () => {
    if (!id || !newCustomsHsCode.trim()) return;
    try {
      setIsCreatingCustoms(true);
      await customsClearanceService.createCustomsClearance({ shipment_id: id, hs_code: newCustomsHsCode.trim(), hs_confirmed: newHsConfirmed, status: 'draft', phytosanitary_status: newPhytosanitaryStatus });
      setNewCustomsHsCode(''); setNewHsConfirmed(false);
      loadCompliance();
      toast.success('Added customs record');
    } catch (err) { console.error(err); } finally { setIsCreatingCustoms(false); }
  };
  const handleChangeCustomsStatus = async (cId: string, status: CustomsClearance['status']) => {
    try { setCustomsActionLoadingId(cId); await customsClearanceService.updateCustomsClearance(cId, { status }); loadCompliance(); }
    catch (err) { console.error(err); } finally { setCustomsActionLoadingId(null); }
  };
  const handleDeleteCustoms = async (cId: string) => {
    try { setCustomsActionLoadingId(cId); await customsClearanceService.deleteCustomsClearance(cId); loadCompliance(); }
    catch (err) { console.error(err); } finally { setCustomsActionLoadingId(null); }
  };

  const handleCreateNewCustomer = async () => {
    if (!form.newCustomer?.company_name) return;
    try {
      setIsSavingCustomer(true);
      const res = await customerService.createCustomer(form.newCustomer as any);
      toast.success('Created new Customer');
      await loadMasterData();
      if (res?.id) { setField('customer_id', res.id); setField('isNewCustomer', false); }
    } catch (err) { console.error(err); toast.error('Failed to create customer'); }
    finally { setIsSavingCustomer(false); }
  };

  const handleCreateNewSupplier = async () => {
    if (!form.newSupplier?.company_name) return;
    try {
      setIsSavingSupplier(true);
      const payload: CreateSupplierDto = {
        id: form.newSupplier.id as string, 
        company_name: form.newSupplier.company_name,
        email: form.newSupplier.email, 
        phone: form.newSupplier.phone,
        address: form.newSupplier.address, 
        tax_code: form.newSupplier.tax_code
      };
      const res = await supplierService.createSupplier(payload);
      toast.success('Created new Supplier');
      await loadMasterData();
      if (res?.id) { setField('supplier_id', res.id); setField('isNewSupplier', false); }
    } catch (err) { console.error(err); toast.error('Failed to create supplier'); }
    finally { setIsSavingSupplier(false); }
  };

  const handleOpenContractDialog = () => {
    setContractFormState({
      customer_id: form.customer_id || undefined,
      supplier_id: form.supplier_id || undefined,
      pic_id: '',
      no_contract: '',
      payment_term: '',
      type_logistic: false,
      type_trading: false,
      file_url: ''
    });
    setIsContractDialogOpen(true);
  };

  const handleCloseContractDialog = () => {
    setIsContractDialogClosing(true);
    setTimeout(() => {
      setIsContractDialogOpen(false);
      setIsContractDialogClosing(false);
    }, 350);
  };

  const handleSaveContract = async () => {
    try {
      if (!contractFormState.no_contract) {
        toast.error('Contract number is required');
        return;
      }
      if (!contractFormState.customer_id && !contractFormState.supplier_id) {
        toast.error('Please select a customer or supplier');
        return;
      }

      const dto = {
        ...contractFormState,
      };

      const created = await contractService.createContract(dto as any);
      handleCloseContractDialog();
      toast.success('Contract created successfully');
      
      await loadMasterData();
      
      if (created?.id) {
        setField('contract_id', created.id);
      }
    } catch (err: any) {
      console.error('Failed to save contract:', err);
      toast.error(err?.message || 'Failed to save contract');
    }
  };

  // ─── Render ────────────────────────────────────────
  const selectedCustomer = customers.find(c => c.value === form.customer_id);
  const selectedSupplier = suppliers.find(s => s.value === form.supplier_id);

  const isReady = runGates?.can_run ?? false;
  const statusMeta = STATUS_MAP[form.status || 'draft'] || STATUS_MAP.draft;
  const checklistState = useMemo(() => {
    const missingByKey = new Map((runGates?.missing || []).map((m) => [m.key, m.message]));
    const localMissing: string[] = [];
    const gates = CHECKLIST_GATES.map((gate) => {
      let checked = false;
      if (gate.field === 'contract_id') {
        checked = Boolean(form.contract_id);
      } else {
        checked = Boolean(form[gate.field]);
      }

      const isRequired =
        gate.key !== 'truck_booked' ||
        (!form.transport_air && !form.transport_sea);
      const isMissing = isRequired && !checked;
      if (isMissing) localMissing.push(gate.key);
      return {
        ...gate,
        checked,
        isRequired,
        isMissing,
        message: missingByKey.get(gate.key),
      };
    });

    return {
      gates,
      missingCount: localMissing.length,
      canRun: localMissing.length === 0,
    };
  }, [form, runGates]);

  if (loading) {
    return <div className="flex items-center justify-center h-[calc(100vh-130px)] bg-white rounded-2xl border border-border"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="relative flex flex-col h-[calc(100vh-130px)] bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
      {/* TOP HEADER */}
      <div className="shrink-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => handleNavigateAway('/shipments/information')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Ship size={20} />
          </div>
          <div>
            <h1 className="text-[16px] font-black text-slate-800">
              {isEditMode ? `SOP — ${form.code || id?.slice(0, 8)}` : 'Create New Shipment (SOP)'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold border', statusMeta.classes)}>
                {statusMeta.label}
              </span>
              <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold border', isReady ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
                {isReady ? '✓ Ready to Run' : `⚠ ${runGates?.missing?.length ?? '?'} gates missing`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <>
              <button onClick={() => setShowIncidents(!showIncidents)}
                className={clsx('flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border transition-all',
                  showIncidents ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-600 border-slate-200 hover:border-red-200 hover:text-red-600')}>
                <AlertTriangle size={14} /> Incidents
              </button>
              <button onClick={() => setShowAgents(!showAgents)}
                className={clsx('flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border transition-all',
                  showAgents ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:text-blue-600')}>
                <Users size={14} /> Agents
              </button>
            </>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[13px] font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200/50 transition-all active:scale-95 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isEditMode ? 'Save' : 'Create Shipment'}
          </button>
        </div>
      </div>

      {/* HORIZONTAL TAB NAVIGATION */}
      <div className="shrink-0 bg-white border-b border-border px-6 flex items-center gap-6 overflow-x-auto select-none">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={clsx('py-3.5 px-1 font-bold text-[13px] border-b-2 transition-all whitespace-nowrap',
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* MAIN BODY */}
        <div className="flex-1 overflow-y-auto">
          <div className={clsx('p-6', (showIncidents || showAgents) ? 'mr-[380px]' : '')}>
             {activeTab === 'overview' && (
               <OverviewTab 
                   form={form} setField={setField}
                   customers={customers} suppliers={suppliers} contracts={overviewContractOptions}
                   quotations={overviewQuotationOptions}
                   selectedCustomer={selectedCustomer} selectedSupplier={selectedSupplier}
                   handleCreateNewCustomer={handleCreateNewCustomer} handleCreateNewSupplier={handleCreateNewSupplier}
                   isSavingCustomer={isSavingCustomer} isSavingSupplier={isSavingSupplier}
                   onOpenContractDialog={handleOpenContractDialog}
                />
             )}
             {activeTab === 'sales_bl' && (
               <SalesBlTab form={form} setField={setField} shipmentId={id} />
             )}
             {activeTab === 'documents' && (
               <DocumentsTab 
                  shipmentId={id} documents={documents}
                  newDocType={newDocType} setNewDocType={setNewDocType}
                  newDocNumber={newDocNumber} setNewDocNumber={setNewDocNumber}
                  isCreatingDocument={isCreatingDocument} handleCreateDocument={handleCreateDocument}
                  handleChangeDocStatus={handleChangeDocStatus} handleDeleteDoc={handleDeleteDoc}
                  documentActionLoadingId={documentActionLoadingId}
                  contractLabel={form.contract_id ? contracts.find(c => c.value === form.contract_id)?.label || form.contract_id : null}
                  quotationLabel={form.quotation_id ? `Q-${form.quotation_id.slice(0, 8)}` : null}
               />
             )}
             {activeTab === 'customs' && (
                <CustomsTab 
                  shipmentId={id} customsClearances={customsClearances}
                  newCustomsHsCode={newCustomsHsCode} setNewCustomsHsCode={setNewCustomsHsCode}
                  newPhytosanitaryStatus={newPhytosanitaryStatus} setNewPhytosanitaryStatus={setNewPhytosanitaryStatus}
                  newHsConfirmed={newHsConfirmed} setNewHsConfirmed={setNewHsConfirmed}
                  isCreatingCustoms={isCreatingCustoms} handleCreateCustoms={handleCreateCustoms}
                  handleChangeCustomsStatus={handleChangeCustomsStatus} handleDeleteCustoms={handleDeleteCustoms}
                  customsActionLoadingId={customsActionLoadingId}
                />
             )}
             {activeTab === 'costs' && (
               <div className="space-y-4">
                  {id ? <CostControlTab shipmentId={id} /> : <p className="text-[13px] text-slate-500">Save shipment before calculating costs.</p>}
               </div>
             )}
             {activeTab === 'transport' && (
               <div className="space-y-4">
                  {id ? <TransportTab shipmentId={id} /> : <p className="text-[13px] text-slate-500">Save shipment before booking transport.</p>}
               </div>
             )}
             {activeTab === 'tracking' && (
               <div className="space-y-4">
                  {id ? <TrackingTab shipmentId={id} /> : <p className="text-[13px] text-slate-500">Save shipment first.</p>}
               </div>
             )}
          </div>
        </div>

        {/* SIDEBAR: Readiness Checklist (API-driven) */}
        <div className="w-[280px] shrink-0 bg-white border-l border-border p-5 overflow-y-auto">
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pre-flight Checklist</p>
            <button
              type="button"
              onClick={applyAutoChecklist}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
              title="Auto-fill checklist items from linked data"
            >
              <Wand2 size={11} />
              Auto-fill
            </button>
          </div>
          
          {/* Run Gates from Backend */}
          {runGates ? (
            <div className="space-y-2">
              {checklistState.gates.map(gate => {
                return (
                  <label key={gate.key} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                    <input type="checkbox" checked={Boolean((form as any)[gate.field])} onChange={e => handleChecklistToggle(gate.field, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {gate.isMissing
                          ? <Circle size={12} className="text-amber-400 shrink-0" />
                          : <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                        }
                        <span className={clsx('text-[12px] font-bold', gate.isMissing ? 'text-slate-600' : 'text-emerald-700')}>
                          {gate.label}
                        </span>
                        {!gate.isRequired && (
                          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">N/A</span>
                        )}
                      </div>
                      {gate.isMissing && gate.message && (
                        <p className="text-[10px] text-amber-600 mt-0.5 pl-5">{gate.message}</p>
                      )}
                    </div>
                  </label>
                );
              })}

              {/* Summary */}
              <div className={clsx('mt-4 p-3 rounded-xl border', checklistState.canRun ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200')}>
                <p className={clsx('text-[11px] font-bold', checklistState.canRun ? 'text-emerald-700' : 'text-amber-700')}>
                  {checklistState.canRun ? '✓ All gates passed — ready to run' : `⚠ ${checklistState.missingCount} gate(s) blocking`}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Fallback for new shipments: simple checkboxes */}
              {[
                { label: 'Contract Linked', field: 'contract_id' as const },
                { label: 'Documents Ready', field: 'is_docs_ready' as const },
                { label: 'HS Confirmed', field: 'is_hs_confirmed' as const },
                { label: 'Phytosanitary', field: 'is_phytosanitary_ready' as const },
                { label: 'Cost Locked', field: 'is_cost_locked' as const },
                { label: 'Truck Booked', field: 'is_truck_booked' as const },
                { label: 'Agent Booked', field: 'is_agent_booked' as const },
              ].map(gate => (
                <label key={gate.field} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                  <input type="checkbox" checked={Boolean((form as any)[gate.field])} onChange={e => handleChecklistToggle(gate.field, e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20" />
                  <span className={clsx('text-[13px] font-medium', (form as any)[gate.field] ? 'text-emerald-700' : 'text-slate-600')}>
                    {gate.label}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Allowed Transitions */}
          {allowedTransitions && allowedTransitions.allowed.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Available Transitions</p>
              <div className="space-y-1.5">
                {allowedTransitions.allowed.map(status => {
                  const meta = STATUS_MAP[status] || STATUS_MAP.draft;
                  return (
                    <button key={status}
                      onClick={async () => {
                        if (!id) return;
                        try {
                          await shipmentService.updateShipmentStatus(id, { status: status as any });
                          toast.success(`Status → ${meta.label}`);
                          loadShipment();
                          loadApiState();
                        } catch (err: any) { toast.error(err?.message || 'Failed'); }
                      }}
                      className={clsx('w-full text-left px-3 py-2 rounded-lg text-[12px] font-bold border transition-all hover:shadow-sm', meta.classes)}
                    >
                      → {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* SLIDE-OVER INCIDENTS / AGENTS */}
        {(showIncidents || showAgents) && id && (
          <div className="absolute right-[280px] top-[125px] bottom-0 w-[400px] border-l border-border bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.03)] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[14px] font-bold text-slate-800">
                  {showIncidents ? '⚠️ Incidents' : '👥 Agents'}
                </span>
                <button onClick={() => { setShowIncidents(false); setShowAgents(false); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><XCircle size={18} /></button>
              </div>
              {showIncidents && <IncidentsTab shipmentId={id} />}
              {showAgents && <AgentsTab shipmentId={id} />}
            </div>
          </div>
        )}
      </div>

      {showUnsavedDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-[400px] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-800">Unsaved Changes</h3>
                <p className="text-[12px] text-slate-500">You have unsaved data</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-slate-700">Any unsaved changes will be lost. Do you want to leave?</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button onClick={cancelNavigate} className="px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-200 transition-colors">Go Back</button>
              <button onClick={confirmNavigate} className="px-4 py-2 rounded-xl text-[13px] font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors">Leave anyway</button>
            </div>
          </div>
        </div>
      )}

      <ContractDialog
        isOpen={isContractDialogOpen}
        isClosing={isContractDialogClosing}
        mode="add"
        onClose={handleCloseContractDialog}
        formState={contractFormState}
        setFormField={(key, value) => setContractFormState(prev => ({ ...prev, [key]: value }))}
        entityOptions={[
          ...customers.map(c => ({ value: `C:${c.id}`, label: `(Customer) ${c.label}` })),
          ...suppliers.map(s => ({ value: `S:${s.id}`, label: `(Supplier) ${s.label}` }))
        ]}
        employeeOptions={employees.map(e => ({ value: e.id, label: e.full_name }))}
        customers={customers as any}
        suppliers={suppliers as any}
        onSave={handleSaveContract}
      />
    </div>
  );
};

export default ShipmentSOPPage;
