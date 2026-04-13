import React from 'react';
import { createPortal } from 'react-dom';
import {
  X, User, Mail, Phone, MapPin, Hash, Plus, ChevronRight, Building2, Edit, KanbanSquare, Globe, Layers, Tag
} from 'lucide-react';
import { clsx } from 'clsx';
import { ThreeStarRating } from '../../../components/ui/ThreeStarRating';
import {
  CUSTOMER_STATUS_VALUES,
  type Customer,
  type CreateCustomerDto,
  type CustomerStatus
} from '../../../services/customerService';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  mode: 'add' | 'edit' | 'detail';
  onClose: () => void;
  formState: Partial<Customer>;
  setFormField: (key: keyof CreateCustomerDto, value: any) => void;
  onSave: () => void;
  onEdit?: () => void;
}

const CustomerDialog: React.FC<Props> = ({
  isOpen,
  isClosing,
  mode,
  onClose,
  formState,
  setFormField,
  onSave,
  onEdit
}) => {
  if (!isOpen && !isClosing) return null;

  const isDetailMode = mode === 'detail';
  const isEditMode = mode === 'edit';

  const statusLabelMap: Record<CustomerStatus, string> = {
    new: 'New',
    follow_up: 'Follow Up',
    quotation_sent: 'Quotation Sent',
    meeting: 'Meeting',
    lost: 'Lost'
  };

  const {
    company_name,
    local_name,
    english_name,
    customer_group,
    customer_source,
    email,
    phone,
    website,
    address,
    office_address,
    bl_address,
    country,
    state_province,
    customer_class,
    tax_code
  } = formState;

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
              <User size={20} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {mode === 'add' ? 'Add New Customer' : (mode === 'edit' ? 'Edit Customer' : 'Customer Details')}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Hash size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Code <span className="text-red-500">*</span></label>
                </div>
                <input
                  type="text"
                  placeholder="ABC"
                  value={formState.code || ''}
                  onChange={e => setFormField('code', e.target.value.toUpperCase().slice(0, 3))}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black text-center uppercase tracking-widest disabled:bg-muted/5 disabled:text-muted-foreground"
                  maxLength={3}
                />
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Company Name <span className="text-red-500">*</span></label>
                </div>
                <input
                  type="text"
                  placeholder="Enter company name"
                  value={company_name || ''}
                  onChange={e => setFormField('company_name', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Local Name</label>
                </div>
                <input
                  type="text"
                  placeholder="Enter local name"
                  value={local_name || ''}
                  onChange={e => setFormField('local_name', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">English Name</label>
                </div>
                <input
                  type="text"
                  placeholder="Enter English name"
                  value={english_name || ''}
                  onChange={e => setFormField('english_name', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Customer Group</label>
                </div>
                <input
                  type="text"
                  placeholder="Enter customer group"
                  value={customer_group || ''}
                  onChange={e => setFormField('customer_group', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Customer Source</label>
                </div>
                <input
                  type="text"
                  placeholder="Enter source"
                  value={customer_source || ''}
                  onChange={e => setFormField('customer_source', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <KanbanSquare size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Status</label>
              </div>
              <select
                value={formState.status || 'new'}
                onChange={e => setFormField('status', e.target.value as CustomerStatus)}
                disabled={isDetailMode}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
              >
                {CUSTOMER_STATUS_VALUES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabelMap[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Email</label>
              </div>
              <input
                type="email"
                placeholder="customer@email.com"
                value={email || ''}
                onChange={e => setFormField('email', e.target.value)}
                disabled={isDetailMode}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Website</label>
              </div>
              <input
                type="url"
                placeholder="https://example.com"
                value={website || ''}
                onChange={e => setFormField('website', e.target.value)}
                disabled={isDetailMode}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
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
                disabled={isDetailMode}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
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
                disabled={isDetailMode}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ThreeStarRating
                label="Customer Rating"
                showStarInLabel
                value={formState.rank || 0}
                onChange={(v) => setFormField('rank', v)}
                disabled={isDetailMode}
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
                disabled={isDetailMode}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium min-h-[100px] resize-none disabled:bg-muted/5 disabled:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Office Address</label>
              </div>
              <textarea
                placeholder="Enter office address"
                value={office_address || ''}
                onChange={e => setFormField('office_address', e.target.value)}
                disabled={isDetailMode}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium min-h-[100px] resize-none disabled:bg-muted/5 disabled:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">B/L Address</label>
              </div>
              <textarea
                placeholder="Enter B/L address"
                value={bl_address || ''}
                onChange={e => setFormField('bl_address', e.target.value)}
                disabled={isDetailMode}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium min-h-[100px] resize-none disabled:bg-muted/5 disabled:text-muted-foreground"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Country</label>
                </div>
                <input
                  type="text"
                  placeholder="Country"
                  value={country || ''}
                  onChange={e => setFormField('country', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">State/Province</label>
                </div>
                <input
                  type="text"
                  placeholder="State or province"
                  value={state_province || ''}
                  onChange={e => setFormField('state_province', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Class</label>
                </div>
                <input
                  type="text"
                  placeholder="Class"
                  value={customer_class || ''}
                  onChange={e => setFormField('customer_class', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
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
            {isDetailMode ? 'Close' : 'Cancel'}
          </button>

          {isDetailMode ? (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-8 py-2 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group active:scale-95"
            >
              <Edit size={18} />
              Edit Customer
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-8 py-2 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group active:scale-95"
            >
              <Plus size={18} />
              {isEditMode ? 'Save Changes' : 'Create Customer'}
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CustomerDialog;

