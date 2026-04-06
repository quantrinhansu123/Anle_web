import React from 'react';
import { createPortal } from 'react-dom';
import {
  X, Mail, Phone, MapPin, Hash, Plus, ChevronRight, Building2, Barcode
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Supplier, CreateSupplierDto } from '../../../services/supplierService';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isEditMode: boolean;
  onClose: () => void;
  formState: Partial<Supplier>;
  setFormField: (key: keyof CreateSupplierDto | 'id', value: any) => void;
  onSave: () => void;
}

const AddEditSupplierDialog: React.FC<Props> = ({
  isOpen,
  isClosing,
  isEditMode,
  onClose,
  formState,
  setFormField,
  onSave
}) => {
  if (!isOpen && !isClosing) return null;

  const { id, company_name, email, phone, address, tax_code } = formState;

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
              <Building2 size={20} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {isEditMode ? 'Edit Supplier' : 'Add New Supplier'}
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
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Barcode size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Supplier Code (3 Chars) <span className="text-red-500">*</span></label>
              </div>
              <input
                type="text"
                maxLength={3}
                disabled={isEditMode}
                placeholder="E.g. MSC, ONE, MAE"
                value={id || ''}
                onChange={e => setFormField('id', e.target.value.toUpperCase())}
                className={clsx(
                  "w-full px-4 py-2 border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold tracking-widest",
                  isEditMode ? "bg-slate-50 border-border text-slate-400" : "bg-muted/10 border-border"
                )}
              />
              {!isEditMode && <p className="text-[10px] text-muted-foreground italic">Must be exactly 3 characters (uppercase).</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Company Name <span className="text-red-500">*</span></label>
              </div>
              <input
                type="text"
                placeholder="Enter supplier company name"
                value={company_name || ''}
                onChange={e => setFormField('company_name', e.target.value)}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Email</label>
              </div>
              <input
                type="email"
                placeholder="supplier@email.com"
                value={email || ''}
                onChange={e => setFormField('email', e.target.value)}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Phone</label>
              </div>
              <input
                type="text"
                placeholder="Phone number"
                value={phone || ''}
                onChange={e => setFormField('phone', e.target.value)}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Tax Code</label>
              </div>
              <input
                type="text"
                placeholder="Tax identification number"
                value={tax_code || ''}
                onChange={e => setFormField('tax_code', e.target.value)}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Address</label>
              </div>
              <textarea
                placeholder="Company address"
                value={address || ''}
                onChange={e => setFormField('address', e.target.value)}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium min-h-[100px] resize-none"
              />
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
            {isEditMode ? 'Save Changes' : 'Create Supplier'}
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default AddEditSupplierDialog;
