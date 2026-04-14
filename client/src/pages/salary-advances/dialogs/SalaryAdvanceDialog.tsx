import React from 'react';
import { createPortal } from 'react-dom';
import { Banknote, X, User, Calendar, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DateInput } from '../../../components/ui/DateInput';
import type { SalaryAdvanceFormState } from '../types';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isEditMode: boolean;
  isDetailMode?: boolean;
  onClose: () => void;
  onEdit?: () => void;
  formState: SalaryAdvanceFormState;
  setFormField: <K extends keyof SalaryAdvanceFormState>(key: K, value: SalaryAdvanceFormState[K]) => void;
  employeeOptions: { value: string; label: string }[];
  onSave: () => void;
}

const SalaryAdvanceDialog: React.FC<Props> = ({
  isOpen,
  isClosing,
  isEditMode,
  isDetailMode = false,
  onClose,
  onEdit,
  formState,
  setFormField,
  employeeOptions,
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
          'relative w-full max-w-lg bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border transition-transform duration-350 ease-out',
          isClosing ? 'translate-x-full' : 'translate-x-0 animate-in slide-in-from-right duration-350',
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Banknote size={20} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {isDetailMode
                ? 'Salary advance details'
                : isEditMode
                  ? 'Edit salary advance'
                  : 'New salary advance'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <User size={12} /> Employee
              </label>
              <SearchableSelect
                value={formState.employee_id}
                onValueChange={(v) => setFormField('employee_id', v)}
                options={employeeOptions}
                placeholder="Select employee..."
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Calendar size={12} /> Advance date
              </label>
              <DateInput
                value={formState.advance_date}
                onChange={(v) => setFormField('advance_date', v)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Amount</label>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Approval</label>
                <select
                  value={formState.approval_status}
                  onChange={(e) =>
                    setFormField('approval_status', e.target.value as SalaryAdvanceFormState['approval_status'])
                  }
                  disabled={readOnly}
                  className="w-full px-3 py-2 rounded-xl border border-border text-[12px] font-medium"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="reconciled">Reconciled</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Payment</label>
                <select
                  value={formState.payment_status}
                  onChange={(e) =>
                    setFormField('payment_status', e.target.value as SalaryAdvanceFormState['payment_status'])
                  }
                  disabled={readOnly}
                  className="w-full px-3 py-2 rounded-xl border border-border text-[12px] font-medium"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <FileText size={12} /> Notes
              </label>
              <textarea
                value={formState.notes}
                onChange={(e) => setFormField('notes', e.target.value)}
                disabled={readOnly}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-border text-[13px] font-medium resize-none"
              />
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

export default SalaryAdvanceDialog;
