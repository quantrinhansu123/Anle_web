import React, { useState, useEffect } from 'react';
import { SearchCheck, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { shipmentService, type FeasibilityApproval } from '../../../services/shipmentService';
import type { ShipmentFormState } from '../types';

interface FeasibilityTabProps {
  form: ShipmentFormState;
  setField: <K extends keyof ShipmentFormState>(key: K, value: ShipmentFormState[K]) => void;
  shipmentId?: string;
}

const DEPARTMENTS = [
  { key: 'logistics', label: 'Logistics Capacity', desc: 'Sufficient operational capacity', color: 'blue' },
  { key: 'procurement', label: 'Procurement Availability', desc: 'Goods are ready', color: 'amber' },
  { key: 'finance', label: 'Finance / Budget', desc: 'Financially approved', color: 'emerald' },
  { key: 'packaging', label: 'Special Packaging', desc: 'Special packaging requirements', color: 'violet' },
] as const;

const STATUS_ICON = {
  pending: <Clock size={16} className="text-slate-400" />,
  approved: <CheckCircle2 size={16} className="text-emerald-500" />,
  rejected: <XCircle size={16} className="text-red-500" />,
};

const STATUS_BADGE = {
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const FeasibilityTab: React.FC<FeasibilityTabProps> = ({ form, shipmentId }) => {
  const [approvals, setApprovals] = useState<FeasibilityApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const fetchApprovals = async () => {
    if (!shipmentId) return;
    try {
      setLoading(true);
      const data = await shipmentService.getFeasibilityApprovals(shipmentId);
      setApprovals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load feasibility approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [shipmentId]);

  const handleAction = async (department: string, status: 'approved' | 'rejected') => {
    if (!shipmentId) return;
    try {
      setActionLoading(department);
      await shipmentService.updateFeasibilityApproval(shipmentId, {
        department,
        status,
        note: noteInputs[department] || undefined,
      });
      setNoteInputs(prev => ({ ...prev, [department]: '' }));
      await fetchApprovals();
    } catch (err: any) {
      alert(err?.message || 'Failed to update approval');
    } finally {
      setActionLoading(null);
    }
  };

  const getApproval = (dept: string) => approvals.find(a => a.department === dept);

  if (!shipmentId) {
    return (
      <section className="bg-white rounded-2xl border border-violet-100 shadow-sm p-8 text-center">
        <SearchCheck size={32} className="mx-auto text-violet-300 mb-3" />
        <p className="text-[13px] text-slate-500 font-medium">Please save shipment before requesting multi-department approval.</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-violet-50 bg-violet-50/50 flex items-center gap-2">
        <SearchCheck size={16} className="text-violet-600" />
        <span className="text-[12px] font-bold text-violet-600 uppercase tracking-wider">Feasibility Approvals</span>
        {loading && <Loader2 size={14} className="animate-spin text-violet-400 ml-2" />}
      </div>

      <div className="p-5 space-y-3">
        {DEPARTMENTS.map(dept => {
          const approval = getApproval(dept.key);
          const status = approval?.status || 'pending';
          const isLoading = actionLoading === dept.key;

          return (
            <div key={dept.key} className={clsx(
              'rounded-xl border p-4 transition-all',
              status === 'approved' && 'border-emerald-200 bg-emerald-50/30',
              status === 'rejected' && 'border-red-200 bg-red-50/30',
              status === 'pending' && 'border-slate-200 bg-slate-50/30',
            )}>
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  {STATUS_ICON[status]}
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">{dept.label}</p>
                    <p className="text-[11px] text-slate-500">{dept.desc}</p>
                  </div>
                </div>
                <span className={clsx('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border', STATUS_BADGE[status])}>
                  {status}
                </span>
              </div>

              {/* Approval Details (if approved/rejected) */}
              {approval && status !== 'pending' && (
                <div className="mt-2 pl-7 grid grid-cols-3 gap-2 text-[11px]">
                  {approval.approved_by && (
                    <div>
                      <span className="text-slate-400 font-bold uppercase">By</span>
                      <p className="text-slate-700 font-medium truncate">{approval.approved_by}</p>
                    </div>
                  )}
                  {approval.approved_at && (
                    <div>
                      <span className="text-slate-400 font-bold uppercase">At</span>
                      <p className="text-slate-700 font-medium">
                        {new Date(approval.approved_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                  {approval.note && (
                    <div>
                      <span className="text-slate-400 font-bold uppercase">Note</span>
                      <p className="text-slate-700 font-medium">{approval.note}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {(form.status === 'draft' || form.status === 'feasibility_checked') && (
                <div className="mt-3 pl-7 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Note (optional)"
                    value={noteInputs[dept.key] || ''}
                    onChange={e => setNoteInputs(prev => ({ ...prev, [dept.key]: e.target.value }))}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] bg-white focus:ring-2 focus:ring-violet-500/20"
                  />
                  <button
                    onClick={() => handleAction(dept.key, 'approved')}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(dept.key, 'rejected')}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50"
                  >
                    <XCircle size={12} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FeasibilityTab;
