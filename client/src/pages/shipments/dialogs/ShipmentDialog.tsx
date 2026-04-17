import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Ship, X, User, Mail, Phone, MapPin, Calendar,
  FileText, Plus, Edit, ChevronRight, Hash, Package,
  Anchor, Plane, Tag, Info, Barcode,
  CheckCircle2, XCircle, Loader2, Trash2,
  DollarSign, Truck, Clock, AlertTriangle
} from 'lucide-react';
import CostControlTab from '../tabs/CostControlTab';
import TransportTab from '../tabs/TransportTab';
import TrackingTab from '../tabs/TrackingTab';
import IncidentsTab from '../tabs/IncidentsTab';
import AgentsTab from '../tabs/AgentsTab';
import { clsx } from 'clsx';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DateInput } from '../../../components/ui/DateInput';
import { type Customer } from '../../../services/customerService';
import { type Supplier } from '../../../services/supplierService';
import {
  type CreateShipmentDocumentDto,
  type ShipmentDocument,
} from '../../../services/shipmentDocumentService';
import {
  type CreateCustomsClearanceDto,
  type CustomsClearance,
} from '../../../services/customsClearanceService';
import type { ShipmentFormState, ShipmentReadinessResult } from '../types';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isEditMode: boolean;
  isDetailMode?: boolean;
  onClose: () => void;
  formState: ShipmentFormState;
  setFormField: <K extends keyof ShipmentFormState>(key: K, value: ShipmentFormState[K]) => void;
  customerOptions: (Partial<Customer> & { value: string; label: string })[];
  supplierOptions: (Partial<Supplier> & { value: string; label: string })[];
  onSave: () => void;
  onStaySave?: () => void;
  onEdit?: () => void;
  onConfirmCustomer?: () => void;
  onConfirmSupplier?: () => void;
  readiness?: ShipmentReadinessResult | null;
  readinessLoading?: boolean;
  onRefreshReadiness?: () => void;
  documents?: ShipmentDocument[];
  customsClearances?: CustomsClearance[];
  complianceLoading?: boolean;
  isCreatingDocument?: boolean;
  isCreatingCustoms?: boolean;
  documentActionLoadingId?: string | null;
  customsActionLoadingId?: string | null;
  onRefreshCompliance?: () => void;
  onCreateDocument?: (dto: Omit<CreateShipmentDocumentDto, 'shipment_id'>) => void;
  onCreateCustoms?: (dto: Omit<CreateCustomsClearanceDto, 'shipment_id'>) => void;
  onChangeDocumentStatus?: (id: string, status: ShipmentDocument['status']) => void;
  onDeleteDocument?: (id: string) => void;
  onChangeCustomsStatus?: (id: string, status: CustomsClearance['status']) => void;
  onDeleteCustoms?: (id: string) => void;
  isSavingCustomer?: boolean;
  isSavingSupplier?: boolean;
}

const ShipmentDialog: React.FC<Props> = ({
  isOpen,
  isClosing,
  isEditMode,
  isDetailMode = false,
  onClose,
  formState,
  setFormField,
  customerOptions,
  supplierOptions,
  onSave,
  onStaySave,
  onEdit,
  onConfirmCustomer,
  onConfirmSupplier,
  readiness,
  readinessLoading = false,
  onRefreshReadiness,
  documents = [],
  customsClearances = [],
  complianceLoading = false,
  isCreatingDocument = false,
  isCreatingCustoms = false,
  documentActionLoadingId = null,
  customsActionLoadingId = null,
  onRefreshCompliance,
  onCreateDocument,
  onCreateCustoms,
  onChangeDocumentStatus,
  onDeleteDocument,
  onChangeCustomsStatus,
  onDeleteCustoms,
  isSavingCustomer = false,
  isSavingSupplier = false
}) => {
  if (!isOpen && !isClosing) return null;

  const {
    customer_id, supplier_id, code, commodity, hs_code, quantity,
    packing, vessel_voyage, term, transport_air, transport_sea,
    load_fcl, load_lcl, pol, pod, etd, eta, status,
    is_docs_ready, is_hs_confirmed, is_phytosanitary_ready,
    is_cost_locked, is_truck_booked, is_agent_booked,
    isNewCustomer, isEditingCustomer, newCustomer, isNewSupplier, isEditingSupplier, newSupplier
  } = formState;

  const localReadiness = Boolean(
    is_docs_ready
    && is_hs_confirmed
    && is_phytosanitary_ready
    && is_cost_locked
    && is_truck_booked
    && is_agent_booked,
  );

  type DialogTab = 'info' | 'cost' | 'transport' | 'tracking' | 'incidents' | 'agents';
  const [dialogTab, setDialogTab] = useState<DialogTab>('info');

  const [newDocType, setNewDocType] = useState<CreateShipmentDocumentDto['doc_type']>('commercial_invoice');
  const [newDocStatus, setNewDocStatus] = useState<CreateShipmentDocumentDto['status']>('draft');
  const [newDocNumber, setNewDocNumber] = useState('');

  const [newCustomsHsCode, setNewCustomsHsCode] = useState('');
  const [newCustomsStatus, setNewCustomsStatus] = useState<CreateCustomsClearanceDto['status']>('draft');
  const [newPhytosanitaryStatus, setNewPhytosanitaryStatus] = useState<CreateCustomsClearanceDto['phytosanitary_status']>('pending');
  const [newHsConfirmed, setNewHsConfirmed] = useState(false);

  const handleCreateDocumentClick = () => {
    if (!onCreateDocument) return;
    onCreateDocument({
      doc_type: newDocType,
      status: newDocStatus,
      doc_number: newDocNumber || null,
    });
    setNewDocNumber('');
  };

  const handleCreateCustomsClick = () => {
    if (!onCreateCustoms || !newCustomsHsCode.trim()) return;
    onCreateCustoms({
      hs_code: newCustomsHsCode.trim(),
      hs_confirmed: newHsConfirmed,
      status: newCustomsStatus,
      phytosanitary_status: newPhytosanitaryStatus,
    });
    setNewCustomsHsCode('');
    setNewHsConfirmed(false);
  };

  const handleSetNewCustomerField = (key: string, value: string) => {
    setFormField('newCustomer', { ...newCustomer, [key]: value } as any);
  };

  const handleSetNewSupplierField = (key: string, value: string) => {
    setFormField('newSupplier', { ...newSupplier, [key]: value } as any);
  };

  const selectedCustomer = customerOptions.find(c => c.value === customer_id);
  const selectedSupplier = supplierOptions.find(s => s.value === supplier_id);

  return createPortal(
    <div className="fixed inset-0 z-9999 flex justify-end">
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-350 ease-out',
          isClosing ? 'opacity-0' : 'animate-in fade-in duration-300',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={clsx(
          'relative w-full max-w-212.5 bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border transition-transform duration-350 ease-out',
          isClosing ? 'translate-x-full' : 'translate-x-0 animate-in slide-in-from-right duration-350',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Ship size={20} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {isDetailMode ? 'Shipment Details' : isEditMode ? 'Edit Shipment' : 'Add New Shipment'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation — only for existing shipments in detail  */}
        {isDetailMode && formState.id && (
          <div className="flex items-center gap-1 px-6 py-2 bg-white border-b border-border shrink-0">
            <button
              onClick={() => setDialogTab('info')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all',
                dialogTab === 'info'
                  ? 'bg-primary/5 text-primary ring-1 ring-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Info size={14} />
              Info & Compliance
            </button>
            <button
              onClick={() => setDialogTab('cost')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all',
                dialogTab === 'cost'
                  ? 'bg-primary/5 text-primary ring-1 ring-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <DollarSign size={14} />
              Cost Control
            </button>
            <button
              onClick={() => setDialogTab('transport')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all',
                dialogTab === 'transport'
                  ? 'bg-primary/5 text-primary ring-1 ring-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Truck size={14} />
              Transport
            </button>
            <button
              onClick={() => setDialogTab('tracking')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all',
                dialogTab === 'tracking'
                  ? 'bg-primary/5 text-primary ring-1 ring-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Clock size={14} />
              Timeline
            </button>
            <button
              onClick={() => setDialogTab('incidents')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all',
                dialogTab === 'incidents'
                  ? 'bg-primary/5 text-primary ring-1 ring-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <AlertTriangle size={14} />
              Incidents
            </button>
            <button
              onClick={() => setDialogTab('agents')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all',
                dialogTab === 'agents'
                  ? 'bg-primary/5 text-primary ring-1 ring-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <User size={14} />
              Agents
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Tab: Cost Control */}
        {dialogTab === 'cost' && isDetailMode && formState.id && (
          <CostControlTab shipmentId={formState.id} />
        )}

        {/* Tab: Transport */}
        {dialogTab === 'transport' && isDetailMode && formState.id && (
          <TransportTab shipmentId={formState.id} />
        )}

        {/* Tab: Tracking Timeline */}
        {dialogTab === 'tracking' && isDetailMode && formState.id && (
          <TrackingTab shipmentId={formState.id} />
        )}

        {/* Tab: Incidents */}
        {dialogTab === 'incidents' && isDetailMode && formState.id && (
          <IncidentsTab shipmentId={formState.id} />
        )}

        {/* Tab: Agents */}
        {dialogTab === 'agents' && isDetailMode && formState.id && (
          <AgentsTab shipmentId={formState.id} />
        )}

        {dialogTab === 'info' && (<>

          {/* SECTION 1: CUSTOMER INFORMATION */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-blue-50 bg-blue-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                <span className="text-[12px] font-bold text-blue-600 uppercase tracking-wider">Customer Information</span>
              </div>
              {!isDetailMode && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewCustomer}
                    onChange={e => {
                      setFormField('isNewCustomer', e.target.checked);
                      if (e.target.checked) setFormField('isEditingCustomer', false);
                    }}
                    className="rounded border-blue-200 text-blue-600 focus:ring-blue-500/20"
                  />
                  <span className="text-[11px] font-bold text-blue-600/70 uppercase">Create New Customer</span>
                </label>
              )}
            </div>
            <div className="p-5">
              {!isNewCustomer && !isEditingCustomer ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-muted-foreground/70" />
                      <label className="text-[13px] font-bold text-foreground">Select Customer <span className="text-red-500">*</span></label>
                    </div>
                    {selectedCustomer && !isDetailMode && (
                      <button
                        onClick={() => {
                          setFormField('isEditingCustomer', true);
                          setFormField('newCustomer', { ...selectedCustomer } as any);
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline"
                      >
                        Edit Info
                      </button>
                    )}
                  </div>
                  <SearchableSelect
                    options={customerOptions}
                    value={customer_id}
                    onValueChange={(v) => setFormField('customer_id', v)}
                    placeholder="Search existing customer..."
                    disabled={isDetailMode}
                  />

                  {/* Read-only info below selector */}
                  {!isNewCustomer && selectedCustomer && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-blue-50 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><Barcode size={12} className="opacity-70" /> Customer Code</label>
                        <input readOnly value={selectedCustomer.code || '—'} className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-blue-900 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><Mail size={12} className="opacity-70" /> Email</label>
                        <input readOnly value={selectedCustomer.email || '—'} className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-blue-900 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><Phone size={12} className="opacity-70" /> Phone</label>
                        <input readOnly value={selectedCustomer.phone || '—'} className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-blue-900 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><Hash size={12} className="opacity-70" /> Tax Code</label>
                        <input readOnly value={selectedCustomer.tax_code || '—'} className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-blue-900 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><MapPin size={12} className="opacity-70" /> Address</label>
                        <input readOnly value={selectedCustomer.address || '—'} className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-blue-900 focus:ring-0 cursor-default" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {isEditingCustomer && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 mb-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-black text-blue-400 tracking-wider leading-none mb-0.5">Editing Existing</span>
                          <span className="text-[12px] font-bold text-blue-800">{selectedCustomer?.label || selectedCustomer?.company_name}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormField('isEditingCustomer', false);
                          setFormField('newCustomer', { company_name: '' } as any);
                        }}
                        className="text-[10px] font-extrabold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-blue-100 transition-all active:scale-95 uppercase tracking-wider"
                      >
                        Change Customer
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-1">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-blue-600/70" />
                        <label className="text-[13px] font-bold text-foreground">Company Name <span className="text-red-500">*</span></label>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter company name"
                        value={newCustomer?.company_name || ''}
                        onChange={e => handleSetNewCustomerField('company_name', e.target.value)}
                        disabled={isDetailMode}
                        className="w-full px-4 py-2 bg-blue-50/30 border border-blue-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-bold disabled:opacity-70 placeholder:text-blue-500/30"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                      <div className="flex items-center gap-2">
                        <Barcode size={16} className="text-blue-600/70" />
                        <label className="text-[13px] font-bold text-foreground">Customer Code (3 Chars) <span className="text-red-500">*</span></label>
                      </div>
                      <input
                        type="text"
                        maxLength={3}
                        placeholder="E.g. TDS"
                        value={newCustomer?.code || ''}
                        onChange={e => handleSetNewCustomerField('code', e.target.value.toUpperCase())}
                        disabled={isDetailMode || isEditingCustomer}
                        className="w-full px-4 py-2 bg-blue-50/30 border border-blue-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-bold tracking-widest disabled:opacity-70 placeholder:text-blue-500/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-blue-600/70" />
                        <label className="text-[13px] font-bold text-foreground">Email</label>
                      </div>
                      <input
                        type="email"
                        placeholder="customer@email.com"
                        value={newCustomer?.email || ''}
                        onChange={e => handleSetNewCustomerField('email', e.target.value)}
                        disabled={isDetailMode}
                        className="w-full px-4 py-2 bg-blue-50/30 border border-blue-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-blue-500/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-blue-600/70" />
                        <label className="text-[13px] font-bold text-foreground">Phone</label>
                      </div>
                      <input
                        type="text"
                        placeholder="Phone number"
                        value={newCustomer?.phone || ''}
                        onChange={e => handleSetNewCustomerField('phone', e.target.value)}
                        disabled={isDetailMode}
                        className="w-full px-4 py-2 bg-blue-50/30 border border-blue-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-blue-500/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Hash size={16} className="text-blue-600/70" />
                        <label className="text-[13px] font-bold text-foreground">Tax Code</label>
                      </div>
                      <input
                        type="text"
                        placeholder="Tax identification number"
                        value={newCustomer?.tax_code || ''}
                        onChange={e => handleSetNewCustomerField('tax_code', e.target.value)}
                        disabled={isDetailMode}
                        className="w-full px-4 py-2 bg-blue-50/30 border border-blue-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-blue-500/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-blue-600/70" />
                        <label className="text-[13px] font-bold text-foreground">Address</label>
                      </div>
                      <input
                        type="text"
                        placeholder="Address"
                        value={newCustomer?.address || ''}
                        onChange={e => handleSetNewCustomerField('address', e.target.value)}
                        disabled={isDetailMode}
                        className="w-full px-4 py-2 bg-blue-50/30 border border-blue-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-blue-500/30"
                      />
                    </div>
                  </div>

                  {/* CONFIRMATION BUTTONS SECTION FOR CUSTOMER */}
                  {!isDetailMode && (isNewCustomer || isEditingCustomer) && (
                    <div className="flex items-center gap-3 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <button
                        type="button"
                        disabled={isSavingCustomer || !newCustomer?.company_name || (!isEditingCustomer && (!newCustomer?.code || newCustomer.code.length !== 3))}
                        onClick={onConfirmCustomer}
                        className={clsx(
                          "flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold transition-all shadow-md active:scale-[0.98]",
                          isSavingCustomer || !newCustomer?.company_name || (!isEditingCustomer && (!newCustomer?.code || newCustomer.code.length !== 3))
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
                        )}
                      >
                        {isSavingCustomer ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={18} />
                        )}
                        Confirm & Save Customer
                      </button>
                      <button
                        type="button"
                        disabled={isSavingCustomer}
                        onClick={() => {
                          setFormField('isNewCustomer', false);
                          setFormField('isEditingCustomer', false);
                          setFormField('newCustomer', { company_name: '' } as any);
                        }}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold text-slate-500 hover:text-slate-700 hover:bg-white bg-white/50 transition-all border border-slate-200 shadow-sm"
                      >
                        <XCircle size={18} />
                        Discard
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: SUPPLIER INFORMATION */}
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-emerald-50 bg-emerald-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Anchor size={16} className="text-emerald-600" />
                <span className="text-[12px] font-bold text-emerald-600 uppercase tracking-wider">Supplier Information</span>
              </div>
              {!isDetailMode && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewSupplier}
                    onChange={e => {
                      setFormField('isNewSupplier', e.target.checked);
                      if (e.target.checked) setFormField('isEditingSupplier', false);
                    }}
                    className="rounded border-emerald-200 text-emerald-600 focus:ring-emerald-500/20"
                  />
                  <span className="text-[11px] font-bold text-emerald-600/70 uppercase">Create New Supplier</span>
                </label>
              )}
            </div>
            <div className="p-5">
              {!isNewSupplier && !isEditingSupplier ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Anchor size={16} className="text-muted-foreground/70" />
                      <label className="text-[13px] font-bold text-foreground">Select Supplier <span className="text-red-500">*</span></label>
                    </div>
                    {selectedSupplier && !isDetailMode && (
                      <button
                        onClick={() => {
                          setFormField('isEditingSupplier', true);
                          setFormField('newSupplier', { ...selectedSupplier } as any);
                        }}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline transition-colors"
                      >
                        Edit Info
                      </button>
                    )}
                  </div>
                  <SearchableSelect
                    options={supplierOptions}
                    value={supplier_id}
                    onValueChange={(v) => setFormField('supplier_id', v)}
                    placeholder="Search existing supplier..."
                    disabled={isDetailMode}
                  />

                  {/* Read-only info below selector */}
                  {!isNewSupplier && selectedSupplier && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-emerald-50 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5"><Barcode size={12} className="opacity-70" /> Supplier Code</label>
                        <input readOnly value={selectedSupplier.value || '—'} className="w-full bg-emerald-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-emerald-900 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5"><Mail size={12} className="opacity-70" /> Email</label>
                        <input readOnly value={selectedSupplier.email || '—'} className="w-full bg-emerald-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-emerald-900 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5"><Phone size={12} className="opacity-70" /> Phone</label>
                        <input readOnly value={selectedSupplier.phone || '—'} className="w-full bg-emerald-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-emerald-900 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5"><Hash size={12} className="opacity-70" /> Tax Code</label>
                        <input readOnly value={selectedSupplier.tax_code || '—'} className="w-full bg-emerald-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-emerald-900 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5"><MapPin size={12} className="opacity-70" /> Address</label>
                        <input readOnly value={selectedSupplier.address || '—'} className="w-full bg-emerald-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-emerald-900 focus:ring-0 cursor-default" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {isEditingSupplier && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 mb-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                          <Anchor size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider leading-none mb-0.5">Editing Existing</span>
                          <span className="text-[12px] font-bold text-emerald-800">{selectedSupplier?.label || selectedSupplier?.company_name}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormField('isEditingSupplier', false);
                          setFormField('newSupplier', { id: '', company_name: '' } as any);
                        }}
                        className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-emerald-100 transition-all active:scale-95 uppercase tracking-wider"
                      >
                        Change Supplier
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-1">
                      <div className="flex items-center gap-2">
                        <Barcode size={16} className="text-emerald-600/70" />
                        <label className="text-[13px] font-bold text-foreground">Supplier Code (3 Chars) <span className="text-red-500">*</span></label>
                      </div>
                      <input
                        type="text"
                        maxLength={3}
                        placeholder="E.g. MSC"
                        value={newSupplier?.id || ''}
                        onChange={e => handleSetNewSupplierField('id', e.target.value.toUpperCase())}
                        disabled={isDetailMode || isEditingSupplier}
                        className="w-full px-4 py-2 bg-emerald-50/30 border border-emerald-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-bold tracking-widest disabled:opacity-70 placeholder:text-emerald-500/30"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-emerald-600/70" />
                        <label className="text-[13px] font-bold text-foreground">Company Name <span className="text-red-500">*</span></label>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter supplier company name"
                        value={newSupplier?.company_name || ''}
                        onChange={e => handleSetNewSupplierField('company_name', e.target.value)}
                        disabled={isDetailMode}
                        className="w-full px-4 py-2 bg-emerald-50/30 border border-emerald-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-bold disabled:opacity-70 placeholder:text-emerald-500/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-emerald-600/70" />
                        <label className="text-[13px] font-bold text-foreground">Email</label>
                      </div>
                      <input
                        type="email"
                        placeholder="supplier@email.com"
                        value={newSupplier?.email || ''}
                        onChange={e => handleSetNewSupplierField('email', e.target.value)}
                        disabled={isDetailMode}
                        className="w-full px-4 py-2 bg-emerald-50/30 border border-emerald-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-emerald-500/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-emerald-600/70" />
                        <label className="text-[13px] font-bold text-foreground">Phone</label>
                      </div>
                      <input
                        type="text"
                        placeholder="Phone number"
                        value={newSupplier?.phone || ''}
                        onChange={e => handleSetNewSupplierField('phone', e.target.value)}
                        disabled={isDetailMode}
                        className="w-full px-4 py-2 bg-emerald-50/30 border border-emerald-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-emerald-500/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Hash size={16} className="text-emerald-600/70" />
                        <label className="text-[13px] font-bold text-foreground">Tax Code</label>
                      </div>
                      <input
                        type="text"
                        placeholder="Tax identification number"
                        value={newSupplier?.tax_code || ''}
                        onChange={e => handleSetNewSupplierField('tax_code', e.target.value)}
                        disabled={isDetailMode}
                        className="w-full px-4 py-2 bg-emerald-50/30 border border-emerald-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-emerald-500/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-emerald-600/70" />
                        <label className="text-[13px] font-bold text-foreground">Address</label>
                      </div>
                      <input
                        type="text"
                        placeholder="Address"
                        value={newSupplier?.address || ''}
                        onChange={e => handleSetNewSupplierField('address', e.target.value)}
                        disabled={isDetailMode}
                        className="w-full px-4 py-2 bg-emerald-50/30 border border-emerald-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-emerald-500/30"
                      />
                    </div>
                  </div>

                  {/* CONFIRMATION BUTTONS SECTION FOR SUPPLIER */}
                  {!isDetailMode && (isNewSupplier || isEditingSupplier) && (
                    <div className="flex items-center gap-3 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <button
                        type="button"
                        disabled={isSavingSupplier || !newSupplier?.company_name || (!isEditingSupplier && (!newSupplier?.id || newSupplier.id.length !== 3))}
                        onClick={onConfirmSupplier}
                        className={clsx(
                          "flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold transition-all shadow-md active:scale-[0.98]",
                          isSavingSupplier || !newSupplier?.company_name || (!isEditingSupplier && (!newSupplier?.id || newSupplier.id.length !== 3))
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
                        )}
                      >
                        {isSavingSupplier ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={18} />
                        )}
                        Confirm & Save Supplier
                      </button>
                      <button
                        type="button"
                        disabled={isSavingSupplier}
                        onClick={() => {
                          setFormField('isNewSupplier', false);
                          setFormField('isEditingSupplier', false);
                          setFormField('newSupplier', { id: '', company_name: '' } as any);
                        }}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold text-slate-500 hover:text-slate-700 hover:bg-white bg-white/50 transition-all border border-slate-200 shadow-sm"
                      >
                        <XCircle size={18} />
                        Discard
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: SHIPMENT INFORMATION */}
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-indigo-50 bg-indigo-50/50 flex items-center gap-2">
              <FileText size={16} className="text-indigo-600" />
              <span className="text-[12px] font-bold text-indigo-600 uppercase tracking-wider">Shipment Details</span>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center gap-2">
                  <Barcode size={16} className="text-indigo-600/70" />
                  <label className="text-[13px] font-bold text-foreground">Shipment Code</label>
                </div>
                <input
                  type="text"
                  placeholder="Auto-generated if left empty"
                  value={code || ''}
                  onChange={e => setFormField('code', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-bold disabled:opacity-70 placeholder:text-indigo-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-indigo-600/70" />
                  <label className="text-[13px] font-bold text-foreground">Commodity <span className="text-red-500">*</span></label>
                </div>
                <input
                  type="text"
                  placeholder="E.g. Electronic components"
                  value={commodity || ''}
                  onChange={e => setFormField('commodity', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-bold disabled:opacity-70 placeholder:text-indigo-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-indigo-600/70" />
                  <label className="text-[13px] font-bold text-foreground">HS Code</label>
                </div>
                <input
                  type="text"
                  placeholder="HS Code (optional)"
                  value={hs_code || ''}
                  onChange={e => setFormField('hs_code', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-indigo-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-indigo-600/70" />
                  <label className="text-[13px] font-bold text-foreground">Quantity <span className="text-red-500">*</span></label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={quantity || ''}
                  onChange={e => setFormField('quantity', parseFloat(e.target.value) || 0)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-indigo-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-indigo-600/70" />
                  <label className="text-[13px] font-bold text-foreground">Packing</label>
                </div>
                <input
                  type="text"
                  placeholder="E.g. 20 Cartons"
                  value={packing || ''}
                  onChange={e => setFormField('packing', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-indigo-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Ship size={16} className="text-indigo-600/70" />
                  <label className="text-[13px] font-bold text-foreground">Vessel & Voyage</label>
                </div>
                <input
                  type="text"
                  placeholder="Vessel Name / Voyage No."
                  value={vessel_voyage || ''}
                  onChange={e => setFormField('vessel_voyage', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-indigo-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600/70" />
                  <label className="text-[13px] font-bold text-foreground">Term</label>
                </div>
                <select
                  value={term || ''}
                  onChange={e => setFormField('term', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium disabled:opacity-70"
                >
                  <option value="">Select Incoterm</option>
                  <option value="EXW">EXW</option>
                  <option value="FCA">FCA</option>
                  <option value="CPT">CPT</option>
                  <option value="CIP">CIP</option>
                  <option value="DAP">DAP</option>
                  <option value="DPU">DPU</option>
                  <option value="DDP">DDP</option>
                  <option value="FAS">FAS</option>
                  <option value="FOB">FOB</option>
                  <option value="CFR">CFR</option>
                  <option value="CIF">CIF</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600/70" />
                  <label className="text-[13px] font-bold text-foreground">Workflow Status</label>
                </div>
                <select
                  value={status || 'draft'}
                  onChange={e => setFormField('status', e.target.value as ShipmentFormState['status'])}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium disabled:opacity-70"
                >
                  <option value="draft">Draft</option>
                  <option value="feasibility_checked">Feasibility Checked</option>
                  <option value="planned">Planned</option>
                  <option value="docs_ready">Docs Ready</option>
                  <option value="booked">Booked</option>
                  <option value="customs_ready">Customs Ready</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cost_closed">Cost Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-foreground block">Run Checklist (SOP Gates)</label>
                  <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold border', localReadiness ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
                    {localReadiness ? 'Ready to Run' : 'Blocked'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 p-3 rounded-xl border border-indigo-100 bg-indigo-50/20">
                  <label className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(is_docs_ready)}
                      onChange={e => setFormField('is_docs_ready', e.target.checked)}
                      disabled={isDetailMode}
                      className="w-4 h-4 rounded border-indigo-200 text-indigo-600"
                    />
                    Documents Ready
                  </label>
                  <label className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(is_hs_confirmed)}
                      onChange={e => setFormField('is_hs_confirmed', e.target.checked)}
                      disabled={isDetailMode}
                      className="w-4 h-4 rounded border-indigo-200 text-indigo-600"
                    />
                    HS Confirmed
                  </label>
                  <label className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(is_phytosanitary_ready)}
                      onChange={e => setFormField('is_phytosanitary_ready', e.target.checked)}
                      disabled={isDetailMode}
                      className="w-4 h-4 rounded border-indigo-200 text-indigo-600"
                    />
                    Phytosanitary Ready
                  </label>
                  <label className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(is_cost_locked)}
                      onChange={e => setFormField('is_cost_locked', e.target.checked)}
                      disabled={isDetailMode}
                      className="w-4 h-4 rounded border-indigo-200 text-indigo-600"
                    />
                    Cost Locked
                  </label>
                  <label className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(is_truck_booked)}
                      onChange={e => setFormField('is_truck_booked', e.target.checked)}
                      disabled={isDetailMode}
                      className="w-4 h-4 rounded border-indigo-200 text-indigo-600"
                    />
                    Truck Booked
                  </label>
                  <label className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(is_agent_booked)}
                      onChange={e => setFormField('is_agent_booked', e.target.checked)}
                      disabled={isDetailMode}
                      className="w-4 h-4 rounded border-indigo-200 text-indigo-600"
                    />
                    Agent Booked
                  </label>
                </div>
                {isDetailMode && (
                  <div className="mt-2 rounded-xl border border-indigo-100 bg-white p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Backend Gate Check</span>
                      <button
                        type="button"
                        onClick={onRefreshReadiness}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                        disabled={readinessLoading}
                      >
                        {readinessLoading ? 'Checking...' : 'Refresh'}
                      </button>
                    </div>
                    {readiness ? (
                      readiness.ready ? (
                        <p className="text-[12px] font-medium text-emerald-700">All mandatory run gates are satisfied.</p>
                      ) : (
                        <p className="text-[12px] font-medium text-amber-700">
                          Missing gates: {readiness.missing.join(', ')}
                        </p>
                      )
                    ) : (
                      <p className="text-[12px] font-medium text-slate-500">No readiness data loaded yet.</p>
                    )}
                  </div>
                )}

                {isDetailMode && (
                  <div className="mt-2 rounded-xl border border-indigo-100 bg-white p-3">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Documentation & Customs</span>
                      <button
                        type="button"
                        onClick={onRefreshCompliance}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                        disabled={complianceLoading}
                      >
                        {complianceLoading ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg border border-slate-200 p-2.5">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Documents ({documents.length})</p>
                        {documents.length === 0 ? (
                          <p className="text-[12px] text-slate-500">No document records yet.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-28 overflow-auto pr-1">
                            {documents.slice(0, 8).map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between gap-2 text-[12px]">
                                <span className="font-medium text-slate-700 truncate">{doc.doc_type}</span>
                                <div className="flex items-center gap-1.5">
                                  <select
                                    value={doc.status}
                                    onChange={(e) => onChangeDocumentStatus?.(doc.id, e.target.value as ShipmentDocument['status'])}
                                    disabled={documentActionLoadingId === doc.id || !onChangeDocumentStatus}
                                    className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-bold uppercase"
                                  >
                                    <option value="draft">draft</option>
                                    <option value="verified">verified</option>
                                    <option value="rejected">rejected</option>
                                    <option value="issued">issued</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteDocument?.(doc.id)}
                                    disabled={documentActionLoadingId === doc.id || !onDeleteDocument}
                                    className="p-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="rounded-lg border border-slate-200 p-2.5">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Customs ({customsClearances.length})</p>
                        {customsClearances.length === 0 ? (
                          <p className="text-[12px] text-slate-500">No customs clearance records yet.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-28 overflow-auto pr-1">
                            {customsClearances.slice(0, 8).map((item) => (
                              <div key={item.id} className="flex items-center justify-between gap-2 text-[12px]">
                                <span className="font-medium text-slate-700 truncate">{item.declaration_no || item.hs_code}</span>
                                <div className="flex items-center gap-1.5">
                                  <select
                                    value={item.status}
                                    onChange={(e) => onChangeCustomsStatus?.(item.id, e.target.value as CustomsClearance['status'])}
                                    disabled={customsActionLoadingId === item.id || !onChangeCustomsStatus}
                                    className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-bold uppercase"
                                  >
                                    <option value="draft">draft</option>
                                    <option value="submitted">submitted</option>
                                    <option value="inspecting">inspecting</option>
                                    <option value="released">released</option>
                                    <option value="on_hold">on_hold</option>
                                    <option value="rejected">rejected</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteCustoms?.(item.id)}
                                    disabled={customsActionLoadingId === item.id || !onDeleteCustoms}
                                    className="p-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200">
                      <div className="rounded-lg border border-slate-200 p-2.5">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Add Document</p>
                        <div className="space-y-2">
                          <select
                            value={newDocType}
                            onChange={(e) => setNewDocType(e.target.value as CreateShipmentDocumentDto['doc_type'])}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[12px]"
                          >
                            <option value="commercial_invoice">commercial_invoice</option>
                            <option value="packing_list">packing_list</option>
                            <option value="sales_contract">sales_contract</option>
                            <option value="co_form_e">co_form_e</option>
                            <option value="phytosanitary">phytosanitary</option>
                            <option value="bill_of_lading">bill_of_lading</option>
                            <option value="import_document">import_document</option>
                          </select>
                          <select
                            value={newDocStatus}
                            onChange={(e) => setNewDocStatus(e.target.value as CreateShipmentDocumentDto['status'])}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[12px]"
                          >
                            <option value="draft">draft</option>
                            <option value="verified">verified</option>
                            <option value="rejected">rejected</option>
                            <option value="issued">issued</option>
                          </select>
                          <input
                            type="text"
                            value={newDocNumber}
                            onChange={(e) => setNewDocNumber(e.target.value)}
                            placeholder="Document number (optional)"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[12px]"
                          />
                          <button
                            type="button"
                            onClick={handleCreateDocumentClick}
                            disabled={isCreatingDocument || !onCreateDocument}
                            className="w-full py-1.5 rounded-lg bg-indigo-600 text-white text-[12px] font-bold disabled:opacity-50"
                          >
                            {isCreatingDocument ? 'Adding...' : 'Add Document'}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 p-2.5">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Add Customs</p>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={newCustomsHsCode}
                            onChange={(e) => setNewCustomsHsCode(e.target.value)}
                            placeholder="HS code"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[12px]"
                          />
                          <select
                            value={newCustomsStatus}
                            onChange={(e) => setNewCustomsStatus(e.target.value as CreateCustomsClearanceDto['status'])}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[12px]"
                          >
                            <option value="draft">draft</option>
                            <option value="submitted">submitted</option>
                            <option value="inspecting">inspecting</option>
                            <option value="released">released</option>
                            <option value="on_hold">on_hold</option>
                            <option value="rejected">rejected</option>
                          </select>
                          <select
                            value={newPhytosanitaryStatus}
                            onChange={(e) => setNewPhytosanitaryStatus(e.target.value as CreateCustomsClearanceDto['phytosanitary_status'])}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[12px]"
                          >
                            <option value="pending">pending</option>
                            <option value="in_progress">in_progress</option>
                            <option value="passed">passed</option>
                            <option value="failed">failed</option>
                          </select>
                          <label className="flex items-center gap-2 text-[12px] text-slate-700">
                            <input
                              type="checkbox"
                              checked={newHsConfirmed}
                              onChange={(e) => setNewHsConfirmed(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-200"
                            />
                            HS confirmed
                          </label>
                          <button
                            type="button"
                            onClick={handleCreateCustomsClick}
                            disabled={isCreatingCustoms || !newCustomsHsCode.trim() || !onCreateCustoms}
                            className="w-full py-1.5 rounded-lg bg-cyan-600 text-white text-[12px] font-bold disabled:opacity-50"
                          >
                            {isCreatingCustoms ? 'Adding...' : 'Add Customs'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-foreground block">Transportation</label>
                <div className="flex items-center gap-6 py-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={transport_air}
                      onChange={e => {
                        setFormField('transport_air', e.target.checked);
                        if (e.target.checked) setFormField('transport_sea', false);
                      }}
                      disabled={isDetailMode}
                      className="w-4 h-4 rounded border-indigo-200 text-indigo-600 focus:ring-indigo-500/20 disabled:opacity-50"
                    />
                    <div className="flex items-center gap-1.5">
                      <Plane size={16} className={clsx('transition-colors', transport_air ? 'text-indigo-600' : 'text-muted-foreground/50 group-hover:text-muted-foreground')} />
                      <span className={clsx('text-[13px] font-medium transition-colors', transport_air ? 'text-foreground font-bold' : 'text-muted-foreground')}>Air Freight</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={transport_sea}
                      onChange={e => {
                        setFormField('transport_sea', e.target.checked);
                        if (e.target.checked) setFormField('transport_air', false);
                      }}
                      disabled={isDetailMode}
                      className="w-4 h-4 rounded border-indigo-200 text-indigo-600 focus:ring-indigo-500/20 disabled:opacity-50"
                    />
                    <div className="flex items-center gap-1.5">
                      <Ship size={16} className={clsx('transition-colors', transport_sea ? 'text-indigo-600' : 'text-muted-foreground/50 group-hover:text-muted-foreground')} />
                      <span className={clsx('text-[13px] font-medium transition-colors', transport_sea ? 'text-foreground font-bold' : 'text-muted-foreground')}>Sea Freight</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-foreground block">Load Type</label>
                <div className="flex items-center gap-6 py-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={load_fcl}
                      onChange={e => {
                        setFormField('load_fcl', e.target.checked);
                        if (e.target.checked) setFormField('load_lcl', false);
                      }}
                      disabled={isDetailMode}
                      className="w-4 h-4 rounded border-indigo-200 text-indigo-600 focus:ring-indigo-500/20 disabled:opacity-50"
                    />
                    <span className={clsx('text-[13px] font-medium', load_fcl ? 'text-foreground font-bold' : 'text-muted-foreground')}>FCL (Full Container)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={load_lcl}
                      onChange={e => {
                        setFormField('load_lcl', e.target.checked);
                        if (e.target.checked) setFormField('load_fcl', false);
                      }}
                      disabled={isDetailMode}
                      className="w-4 h-4 rounded border-indigo-200 text-indigo-600 focus:ring-indigo-500/20 disabled:opacity-50"
                    />
                    <span className={clsx('text-[13px] font-medium', load_lcl ? 'text-foreground font-bold' : 'text-muted-foreground')}>LCL (Less than Load)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-indigo-600/70" />
                  <label className="text-[13px] font-bold text-foreground">POL (Port of Loading)</label>
                </div>
                <input
                  type="text"
                  placeholder="Origin port"
                  value={pol || ''}
                  onChange={e => setFormField('pol', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-indigo-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-indigo-600/70" />
                  <label className="text-[13px] font-bold text-foreground">POD (Port of Discharge)</label>
                </div>
                <input
                  type="text"
                  placeholder="Destination port"
                  value={pod || ''}
                  onChange={e => setFormField('pod', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-bold disabled:opacity-70 placeholder:text-indigo-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-600/70" />
                  <label className="text-[13px] font-bold text-foreground">ETD (Estimated Time of Departure)</label>
                </div>
                <DateInput
                  value={etd || ''}
                  onChange={v => setFormField('etd', v)}
                  disabled={isDetailMode}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-600/70" />
                  <label className="text-[13px] font-bold text-foreground">ETA (Estimated Time of Arrival)</label>
                </div>
                <DateInput
                  value={eta || ''}
                  onChange={v => setFormField('eta', v)}
                  disabled={isDetailMode}
                />
              </div>
            </div>
          </div>
        </>)}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-border px-6 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-[13px] font-bold transition-all shadow-sm"
          >
            {isDetailMode ? 'Close' : 'Cancel'}
          </button>
          {isDetailMode ? (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-8 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all group active:scale-95"
            >
              <Edit size={18} />
              Edit Shipment
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <button
              onClick={onStaySave ? onStaySave : onSave}
              className="flex items-center gap-2 px-8 py-2 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group active:scale-95"
            >
              <Plus size={18} />
              {isEditMode ? 'Save Changes' : 'Create Shipment'}
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ShipmentDialog;
