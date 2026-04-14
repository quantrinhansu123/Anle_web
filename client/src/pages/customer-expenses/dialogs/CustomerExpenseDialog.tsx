import React from 'react';
import { createPortal } from 'react-dom';
import { Receipt, X } from 'lucide-react';
import { clsx } from 'clsx';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DateInput } from '../../../components/ui/DateInput';
import type { CustomerExpenseFormState, CustomerExpenseStatus } from '../types';

const WORKFLOW: CustomerExpenseStatus[] = [
  'draft',
  'submitted',
  'under_validation',
  'approved',
  'completed',
];

const STATUS_LABELS: Record<CustomerExpenseStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_validation: 'Under validation',
  approved: 'Approved',
  completed: 'Completed',
  refused: 'Refused',
};

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isEditMode: boolean;
  isDetailMode?: boolean;
  onClose: () => void;
  onEdit?: () => void;
  formState: CustomerExpenseFormState;
  setFormField: <K extends keyof CustomerExpenseFormState>(
    key: K,
    value: CustomerExpenseFormState[K],
  ) => void;
  employeeOptions: { value: string; label: string }[];
  customerOptions: { value: string; label: string }[];
  jobOptions: { value: string; label: string }[];
  onSave: () => void;
}

function WorkflowStrip({ current }: { current: CustomerExpenseStatus }) {
  if (current === 'refused') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-bold text-red-800">
        This expense was refused.
      </div>
    );
  }
  const idx = WORKFLOW.indexOf(current);
  const activeIdx = idx >= 0 ? idx : 0;
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-3">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Workflow (read-only)</p>
      <div className="flex flex-wrap items-center gap-1">
        {WORKFLOW.map((st, i) => (
          <React.Fragment key={st}>
            <span
              className={clsx(
                'px-2 py-1 rounded-lg text-[10px] font-bold',
                i <= activeIdx ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
              )}
            >
              {STATUS_LABELS[st]}
            </span>
            {i < WORKFLOW.length - 1 && <span className="text-muted-foreground text-[10px]">→</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

const CustomerExpenseDialog: React.FC<Props> = ({
  isOpen,
  isClosing,
  isEditMode,
  isDetailMode = false,
  onClose,
  onEdit,
  formState,
  setFormField,
  employeeOptions,
  customerOptions,
  jobOptions,
  onSave,
}) => {
  if (!isOpen && !isClosing) return null;

  const readOnly = isDetailMode && !isEditMode;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div
        className={clsx(
          'fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-350 ease-out',
          isClosing ? 'opacity-0' : 'animate-in fade-in duration-300',
        )}
        onClick={onClose}
      />
      <div
        className={clsx(
          'relative w-full max-w-5xl bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border transition-transform duration-350 ease-out',
          isClosing ? 'translate-x-full' : 'translate-x-0 animate-in slide-in-from-right duration-350',
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Receipt size={20} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {isDetailMode
                ? 'Customer expense details'
                : isEditMode
                  ? 'Edit customer expense'
                  : 'New customer expense'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isDetailMode && <WorkflowStrip current={formState.status} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
              <p className="text-[11px] font-bold text-primary uppercase tracking-tight">Main</p>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Expense date *</label>
                <DateInput
                  value={formState.expense_date}
                  onChange={(v) => setFormField('expense_date', v)}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Description *</label>
                <textarea
                  value={formState.description}
                  onChange={(e) => setFormField('description', e.target.value)}
                  disabled={readOnly}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-border text-[13px] font-medium resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Amount *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formState.amount || ''}
                    onChange={(e) => setFormField('amount', parseFloat(e.target.value) || 0)}
                    disabled={readOnly}
                    className="w-full px-3 py-2 rounded-xl border border-border text-[13px] font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Tax amount</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formState.tax_amount || ''}
                    onChange={(e) => setFormField('tax_amount', parseFloat(e.target.value) || 0)}
                    disabled={readOnly}
                    className="w-full px-3 py-2 rounded-xl border border-border text-[13px] font-medium"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Currency</label>
                <input
                  type="text"
                  value={formState.currency}
                  onChange={(e) => setFormField('currency', e.target.value)}
                  disabled={readOnly}
                  className="w-full px-3 py-2 rounded-xl border border-border text-[13px] font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Paid by</label>
                  <select
                    value={formState.paid_by}
                    onChange={(e) =>
                      setFormField('paid_by', e.target.value as CustomerExpenseFormState['paid_by'])
                    }
                    disabled={readOnly}
                    className="w-full px-3 py-2 rounded-xl border border-border text-[12px] font-medium"
                  >
                    <option value="employee_reimburse">Employee reimburse</option>
                    <option value="company">Company</option>
                    <option value="third_party">Third party</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Status</label>
                  <select
                    value={formState.status}
                    onChange={(e) =>
                      setFormField('status', e.target.value as CustomerExpenseFormState['status'])
                    }
                    disabled={readOnly}
                    className="w-full px-3 py-2 rounded-xl border border-border text-[12px] font-medium"
                  >
                    {(Object.keys(STATUS_LABELS) as CustomerExpenseStatus[]).map((k) => (
                      <option key={k} value={k}>
                        {STATUS_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Employee *</label>
                <SearchableSelect
                  value={formState.employee_id}
                  onValueChange={(v) => setFormField('employee_id', v)}
                  options={employeeOptions}
                  placeholder="Select employee..."
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Customer</label>
                <SearchableSelect
                  value={formState.customer_id || '__none__'}
                  onValueChange={(v) => {
                    setFormField('customer_id', v === '__none__' ? '' : v);
                    if (v !== '__none__') setFormField('company_name_snapshot', '');
                  }}
                  options={[{ value: '__none__', label: '— None —' }, ...customerOptions]}
                  placeholder="Select customer..."
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Company (if no customer)</label>
                <input
                  type="text"
                  value={formState.company_name_snapshot}
                  onChange={(e) => setFormField('company_name_snapshot', e.target.value)}
                  disabled={readOnly || !!formState.customer_id}
                  className="w-full px-3 py-2 rounded-xl border border-border text-[13px] font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Job</label>
                <SearchableSelect
                  value={formState.job_id || '__none__'}
                  onValueChange={(v) => setFormField('job_id', v === '__none__' ? '' : v)}
                  options={[{ value: '__none__', label: '— None —' }, ...jobOptions]}
                  placeholder="Select job..."
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
              <p className="text-[11px] font-bold text-primary uppercase tracking-tight">Details</p>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Supplier</label>
                <input
                  type="text"
                  value={formState.supplier}
                  onChange={(e) => setFormField('supplier', e.target.value)}
                  disabled={readOnly}
                  className="w-full px-3 py-2 rounded-xl border border-border text-[13px] font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Category</label>
                <input
                  type="text"
                  value={formState.category}
                  onChange={(e) => setFormField('category', e.target.value)}
                  disabled={readOnly}
                  className="w-full px-3 py-2 rounded-xl border border-border text-[13px] font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Bill reference</label>
                <input
                  type="text"
                  value={formState.bill_reference}
                  onChange={(e) => setFormField('bill_reference', e.target.value)}
                  disabled={readOnly}
                  className="w-full px-3 py-2 rounded-xl border border-border text-[13px] font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Account label</label>
                <input
                  type="text"
                  value={formState.account_label}
                  onChange={(e) => setFormField('account_label', e.target.value)}
                  disabled={readOnly}
                  className="w-full px-3 py-2 rounded-xl border border-border text-[13px] font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Pay for</label>
                <input
                  type="text"
                  value={formState.pay_for}
                  onChange={(e) => setFormField('pay_for', e.target.value)}
                  disabled={readOnly}
                  className="w-full px-3 py-2 rounded-xl border border-border text-[13px] font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Service</label>
                <input
                  type="text"
                  value={formState.service}
                  onChange={(e) => setFormField('service', e.target.value)}
                  disabled={readOnly}
                  className="w-full px-3 py-2 rounded-xl border border-border text-[13px] font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Notes</label>
                <textarea
                  value={formState.notes}
                  onChange={(e) => setFormField('notes', e.target.value)}
                  disabled={readOnly}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-border text-[13px] font-medium resize-none"
                />
              </div>
              <label className="flex items-center gap-2 text-[13px] font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.create_invoice}
                  onChange={(e) => setFormField('create_invoice', e.target.checked)}
                  disabled={readOnly}
                  className="rounded border-border"
                />
                Create invoice
              </label>
            </div>
          </div>
        </div>

        {(!readOnly || (readOnly && onEdit)) && (
          <div className="p-4 border-t border-border bg-white flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-[13px] font-bold text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            {readOnly && onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="px-4 py-2 rounded-xl bg-primary text-white text-[13px] font-bold shadow-md shadow-primary/20"
              >
                Edit
              </button>
            ) : (
              !readOnly && (
                <button
                  type="button"
                  onClick={onSave}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-[13px] font-bold shadow-md shadow-primary/20"
                >
                  Save
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default CustomerExpenseDialog;
