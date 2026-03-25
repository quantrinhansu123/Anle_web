import React from 'react';
import { createPortal } from 'react-dom';
import {
  X, User, Plus, ChevronRight, FileText, UserCheck, CreditCard, Layout, Truck, ShoppingCart, Upload, Link as LinkIcon
} from 'lucide-react';
import { clsx } from 'clsx';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import type { Contract, CreateContractDto } from '../types';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isEditMode: boolean;
  onClose: () => void;
  formState: Partial<Contract>;
  setFormField: (key: keyof CreateContractDto, value: any) => void;
  entityOptions: { value: string; label: string }[]; // Combined Customer/Supplier
  employeeOptions: { value: string; label: string }[];
  onSave: () => void;
}

const AddEditContractDialog: React.FC<Props> = ({
  isOpen,
  isClosing,
  isEditMode,
  onClose,
  formState,
  setFormField,
  entityOptions,
  employeeOptions,
  onSave
}) => {
  if (!isOpen && !isClosing) return null;

  const {
    customer_id, supplier_id, pic_id, no_contract,
    payment_term, type_logistic, type_trading, file_url
  } = formState;

  // Determine current entity value (C:uuid or S:id)
  const currentEntityValue = customer_id ? `C:${customer_id}` : (supplier_id ? `S:${supplier_id}` : '');

  const handleEntityChange = (value: string) => {
    if (value.startsWith('C:')) {
      setFormField('customer_id', value.substring(2));
      setFormField('supplier_id', null);
    } else if (value.startsWith('S:')) {
      setFormField('supplier_id', value.substring(2));
      setFormField('customer_id', null);
    } else {
      setFormField('customer_id', null);
      setFormField('supplier_id', null);
    }
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
          'relative w-full max-w-[500px] bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border transition-transform duration-350 ease-out',
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
              {isEditMode ? 'Edit Contract' : 'Add New Contract'}
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
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-4">
            
            {/* Entity Selection (Customer/Supplier) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <User size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">ID (Customer/Supplier) <span className="text-red-500">*</span></label>
              </div>
              <SearchableSelect
                options={entityOptions}
                value={currentEntityValue}
                onValueChange={handleEntityChange}
                placeholder="Search customer or supplier..."
              />
            </div>

            {/* PIC Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Person In Charge (PIC) <span className="text-red-500">*</span></label>
              </div>
              <SearchableSelect
                options={employeeOptions}
                value={pic_id || ''}
                onValueChange={(v) => setFormField('pic_id', v)}
                placeholder="Select employee..."
              />
            </div>

            {/* Contract Number */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Layout size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">No Contract <span className="text-red-500">*</span></label>
              </div>
              <input
                type="text"
                placeholder="Enter contract number"
                value={no_contract || ''}
                onChange={e => setFormField('no_contract', e.target.value)}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
              />
            </div>

            {/* Payment Term */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Payment Term</label>
              </div>
              <input
                type="text"
                placeholder="E.g. Net 30, COD"
                value={payment_term || ''}
                onChange={e => setFormField('payment_term', e.target.value)}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
              />
            </div>

            {/* Kind of Contract (Logistic / Trading) */}
            <div className="space-y-3 pt-2">
              <label className="text-[13px] font-bold text-foreground block text-muted-foreground/70 uppercase tracking-wider">Kind of Contract</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={clsx(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                  type_logistic ? "bg-primary/5 border-primary shadow-sm" : "bg-muted/5 border-border hover:border-muted-foreground/30"
                )}>
                  <div className={clsx(
                     "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                     type_logistic ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  )}>
                    <Truck size={20} />
                  </div>
                  <div className="flex-1">
                    <p className={clsx("text-[13px] font-bold", type_logistic ? "text-primary" : "text-foreground")}>Logistic</p>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={type_logistic || false}
                      onChange={e => {
                        setFormField('type_logistic', e.target.checked);
                        if (e.target.checked) setFormField('type_trading', false);
                      }}
                    />
                  </div>
                  <div className={clsx(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                    type_logistic ? "border-primary bg-primary text-white" : "border-muted-foreground/20"
                  )}>
                    {type_logistic && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </label>

                <label className={clsx(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                  type_trading ? "bg-primary/5 border-primary shadow-sm" : "bg-muted/5 border-border hover:border-muted-foreground/30"
                )}>
                  <div className={clsx(
                     "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                     type_trading ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  )}>
                    <ShoppingCart size={20} />
                  </div>
                  <div className="flex-1">
                    <p className={clsx("text-[13px] font-bold", type_trading ? "text-primary" : "text-foreground")}>Trading</p>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={type_trading || false}
                      onChange={e => {
                        setFormField('type_trading', e.target.checked);
                        if (e.target.checked) setFormField('type_logistic', false);
                      }}
                    />
                  </div>
                  <div className={clsx(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                    type_trading ? "border-primary bg-primary text-white" : "border-muted-foreground/20"
                  )}>
                    {type_trading && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </label>
              </div>
            </div>

            {/* File Upload / Link */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Upload size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Contract File</label>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                   <div className="flex-1">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground/50 group-focus-within:text-primary transition-colors">
                        <LinkIcon size={14} />
                      </div>
                      <input
                        type="text"
                        placeholder="Google Drive link or file URL"
                        value={file_url || ''}
                        onChange={e => setFormField('file_url', e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
                <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/5 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                    <Upload size={20} />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-bold text-foreground">Click to upload or drag & drop</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">PDF, DOCX up to 10MB</p>
                  </div>
                </div>
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
            {isEditMode ? 'Save Changes' : 'Create Contract'}
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default AddEditContractDialog;
