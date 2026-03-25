import React from 'react';
import { createPortal } from 'react-dom';
import {
  Ship, X, User, Mail, Phone, MapPin, Calendar,
  FileText, Plus, ChevronRight, Hash, Package,
  Anchor, Plane, Tag, Info, Barcode
} from 'lucide-react';
import { clsx } from 'clsx';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DateInput } from '../../../components/ui/DateInput';
import { type Customer } from '../../../services/customerService';
import { type Supplier } from '../../../services/supplierService';
import type { ShipmentFormState } from '../types';

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
  onStaySave
}) => {
  if (!isOpen && !isClosing) return null;

  const {
    customer_id, supplier_id, commodity, hs_code, quantity,
    packing, vessel_voyage, term, transport_air, transport_sea,
    load_fcl, load_lcl, pol, pod, etd, eta,
    isNewCustomer, newCustomer, isNewSupplier, newSupplier
  } = formState;

  const handleSetNewCustomerField = (key: string, value: string) => {
    setFormField('newCustomer', { ...newCustomer, [key]: value } as any);
  };

  const handleSetNewSupplierField = (key: string, value: string) => {
    setFormField('newSupplier', { ...newSupplier, [key]: value } as any);
  };
  
  const selectedCustomer = customerOptions.find(c => c.value === customer_id);
  const selectedSupplier = supplierOptions.find(s => s.value === supplier_id);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
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
          'relative w-full max-w-[850px] bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border transition-transform duration-350 ease-out',
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

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
                    onChange={e => setFormField('isNewCustomer', e.target.checked)}
                    className="rounded border-blue-200 text-blue-600 focus:ring-blue-500/20"
                  />
                  <span className="text-[11px] font-bold text-blue-600/70 uppercase">Create New Customer</span>
                </label>
              )}
            </div>
            <div className="p-5">
              {!isNewCustomer ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-muted-foreground/70" />
                    <label className="text-[13px] font-bold text-foreground">Select Customer <span className="text-red-500">*</span></label>
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
                        <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><Mail size={12} className="opacity-70" /> Email</label>
                        <input readOnly value={selectedCustomer.email || '—'} className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-medium text-blue-900/70 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><Phone size={12} className="opacity-70" /> Phone</label>
                        <input readOnly value={selectedCustomer.phone || '—'} className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-medium text-blue-900/70 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><Hash size={12} className="opacity-70" /> Tax Code</label>
                        <input readOnly value={selectedCustomer.tax_code || '—'} className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-medium text-blue-900/70 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><MapPin size={12} className="opacity-70" /> Address</label>
                        <input readOnly value={selectedCustomer.address || '—'} className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-medium text-blue-900/70 focus:ring-0 cursor-default" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
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
                      className="w-full px-4 py-2 bg-blue-50/30 border border-blue-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-blue-500/30"
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
                    onChange={e => setFormField('isNewSupplier', e.target.checked)}
                    className="rounded border-emerald-200 text-emerald-600 focus:ring-emerald-500/20"
                  />
                  <span className="text-[11px] font-bold text-emerald-600/70 uppercase">Create New Supplier</span>
                </label>
              )}
            </div>
            <div className="p-5">
              {!isNewSupplier ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Anchor size={16} className="text-muted-foreground/70" />
                    <label className="text-[13px] font-bold text-foreground">Select Supplier <span className="text-red-500">*</span></label>
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
                        <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5"><Mail size={12} className="opacity-70" /> Email</label>
                        <input readOnly value={selectedSupplier.email || '—'} className="w-full bg-emerald-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-medium text-emerald-900/70 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5"><Phone size={12} className="opacity-70" /> Phone</label>
                        <input readOnly value={selectedSupplier.phone || '—'} className="w-full bg-emerald-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-medium text-emerald-900/70 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5"><Hash size={12} className="opacity-70" /> Tax Code</label>
                        <input readOnly value={selectedSupplier.tax_code || '—'} className="w-full bg-emerald-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-medium text-emerald-900/70 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5"><MapPin size={12} className="opacity-70" /> Address</label>
                        <input readOnly value={selectedSupplier.address || '—'} className="w-full bg-emerald-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-medium text-emerald-900/70 focus:ring-0 cursor-default" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
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
                      disabled={isDetailMode}
                      className="w-full px-4 py-2 bg-emerald-50/30 border border-emerald-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-mono font-bold tracking-widest disabled:opacity-70 placeholder:text-emerald-500/30"
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
                      className="w-full px-4 py-2 bg-emerald-50/30 border border-emerald-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-emerald-500/30"
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
                  className="w-full px-4 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-indigo-500/30"
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
                <input
                  type="text"
                  placeholder="E.g. FOB, CIF, EXW"
                  value={term || ''}
                  onChange={e => setFormField('term', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-indigo-500/30"
                />
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
                  className="w-full px-4 py-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium disabled:opacity-70 placeholder:text-indigo-500/30"
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
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-border px-6 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-[13px] font-bold transition-all shadow-sm"
          >
            Cancel
          </button>
          {!isDetailMode && (
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
    document.body,
  );
};

export default ShipmentDialog;
