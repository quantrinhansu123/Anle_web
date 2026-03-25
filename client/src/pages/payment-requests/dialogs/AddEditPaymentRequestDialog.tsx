import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText, X, User, Hash, Calendar,
  Plus, ChevronRight, DollarSign, CreditCard,
  Building, Trash2, Info, Receipt
} from 'lucide-react';
import { clsx } from 'clsx';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import type { PaymentRequestFormState } from '../types';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isEditMode: boolean;
  onClose: () => void;
  formState: PaymentRequestFormState;
  setFormField: <K extends keyof PaymentRequestFormState>(key: K, value: PaymentRequestFormState[K]) => void;
  shipmentOptions: { value: string; label: string }[];
  onSave: () => void;
}

const AddEditPaymentRequestDialog: React.FC<Props> = ({
  isOpen,
  isClosing,
  isEditMode,
  onClose,
  formState,
  setFormField,
  shipmentOptions,
  onSave
}) => {
  if (!isOpen && !isClosing) return null;

  const {
    shipment_id, request_date, account_name, account_number, 
    bank_name, invoices
  } = formState;

  const totalAmount = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (inv.payable_amount || 0), 0);
  }, [invoices]);

  const handleAddInvoice = () => {
    setFormField('invoices', [
      ...invoices,
      { no_invoice: '', description: '', date_issue: '', payable_amount: 0 }
    ]);
  };

  const handleRemoveInvoice = (index: number) => {
    setFormField('invoices', invoices.filter((_, i) => i !== index));
  };

  const handleUpdateInvoice = (index: number, field: string, value: any) => {
    const newInvoices = [...invoices];
    (newInvoices[index] as any)[field] = value;
    setFormField('invoices', newInvoices);
  };

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
              <FileText size={20} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {isEditMode ? 'Edit Payment Request' : 'Add New Payment Request'}
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
          
          {/* SECTION 1: GENERAL INFORMATION */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-primary" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">General Information</span>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Hash size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Shipment <span className="text-red-500">*</span></label>
                </div>
                <SearchableSelect
                  options={shipmentOptions}
                  value={shipment_id}
                  onValueChange={(v) => setFormField('shipment_id', v)}
                  placeholder="Select shipment..."
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Request Date <span className="text-red-500">*</span></label>
                </div>
                <input
                  type="date"
                  value={request_date}
                  onChange={e => setFormField('request_date', e.target.value)}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: INVOICE ITEMS */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-primary" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Invoice Items</span>
              </div>
              <button
                onClick={handleAddInvoice}
                className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-lg text-[11px] font-bold hover:bg-primary/20 transition-all"
              >
                <Plus size={14} />
                ADD MORE
              </button>
            </div>
            <div className="p-5 space-y-4">
              {invoices.map((inv, index) => (
                <div key={index} className="p-4 bg-slate-50/50 rounded-xl border border-border/60 relative group">
                  {invoices.length > 1 && (
                    <button
                      onClick={() => handleRemoveInvoice(index)}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-red-100 text-red-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all shadow-sm opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">No Invoice</label>
                      <input
                        type="text"
                        placeholder="Inv-001"
                        value={inv.no_invoice || ''}
                        onChange={e => handleUpdateInvoice(index, 'no_invoice', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Description</label>
                      <input
                        type="text"
                        placeholder="Description of item"
                        value={inv.description || ''}
                        onChange={e => handleUpdateInvoice(index, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Date Issue</label>
                      <input
                        type="date"
                        value={inv.date_issue || ''}
                        onChange={e => handleUpdateInvoice(index, 'date_issue', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Payable Amount</label>
                      <div className="relative">
                        <DollarSign size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={inv.payable_amount || ''}
                          onChange={e => handleUpdateInvoice(index, 'payable_amount', parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-1.5 bg-white border border-border rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2 flex justify-end">
                <div className="flex items-center gap-4 px-6 py-3 bg-primary/5 rounded-2xl border border-primary/20">
                  <span className="text-[13px] font-bold text-primary uppercase tracking-wider">Total Amount:</span>
                  <span className="text-xl font-black text-primary tabular-nums">
                    {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: PAYMENT INFORMATION */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center gap-2">
              <CreditCard size={16} className="text-primary" />
              <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Payment Information</span>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Account Name</label>
                </div>
                <input
                  type="text"
                  placeholder="Receiver account name"
                  value={account_name}
                  onChange={e => setFormField('account_name', e.target.value)}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Hash size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Account Number</label>
                </div>
                <input
                  type="text"
                  placeholder="Bank account number"
                  value={account_number}
                  onChange={e => setFormField('account_number', e.target.value)}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Building size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Bank Name</label>
                </div>
                <input
                  type="text"
                  placeholder="Bank name and branch"
                  value={bank_name}
                  onChange={e => setFormField('bank_name', e.target.value)}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
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
          <button 
            onClick={onSave}
            className="flex items-center gap-2 px-8 py-2 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group active:scale-95"
          >
            <Plus size={18} />
            {isEditMode ? 'Save Changes' : 'Create Payment Request'}
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default AddEditPaymentRequestDialog;
