import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, CheckCircle2, XCircle, 
  Clock, Banknote, User, ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { apiFetch } from '../lib/api';
import { useToastContext } from '../contexts/ToastContext';

interface ApprovalRequest {
  id: string;
  type: string;
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
  status: string;
  current_step?: string;
  requester: { full_name: string };
  approver?: { full_name: string };
  created_at: string;
}

const ApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const result = await apiFetch<ApprovalRequest[]>('/approval-requests');
      setRequests(result || []);
    } catch (err) {
      console.error(err);
      error('Failed to fetch approval requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await apiFetch(`/approval-requests/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ notes: `Action performed via dashboard` })
      });
      success(`Request ${action}d successfully`);
      fetchRequests();
    } catch (err) {
      console.error(err);
      error(`Failed to ${action} request`);
    }
  };

  const filteredRequests = requests.filter(r => 
    activeTab === 'pending' ? r.status === 'pending' : r.status !== 'pending'
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Approval Workflow</h1>
            <p className="text-[13px] text-muted-foreground">Manage and review cross-department approval requests</p>
          </div>
        </div>
        
        <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={clsx(
              "px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all",
              activeTab === 'pending' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={clsx(
              "px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all",
              activeTab === 'history' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            History
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Clock size={40} className="animate-spin text-primary opacity-20" />
          <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Loading Requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl py-24 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
            <ClipboardList size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium">No {activeTab} requests found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((req) => (
            <div key={req.id} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all group shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Banknote size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                        {req.type}
                      </span>
                      <h3 className="font-bold text-slate-900">{req.title}</h3>
                    </div>
                    <p className="text-[13px] text-muted-foreground mb-3">{req.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                      <div className="flex items-center gap-2 text-[12px] text-slate-600">
                        <User size={14} className="text-slate-400" />
                        <span className="font-medium">Requester:</span>
                        <span className="font-bold">{req.requester?.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-slate-600">
                        <Banknote size={14} className="text-slate-400" />
                        <span className="font-medium">Amount:</span>
                        <span className="text-primary font-black">
                          {req.amount?.toLocaleString()} {req.currency}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-slate-400">
                        <Clock size={14} />
                        <span>{new Date(req.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {req.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => handleAction(req.id, 'reject')}
                      className="p-2.5 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-all shadow-sm"
                      title="Reject"
                    >
                      <XCircle size={20} />
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'approve')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-[13px] shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
                    >
                      <CheckCircle2 size={18} />
                      Approve
                    </button>
                  </div>
                )}
                
                {req.status !== 'pending' && (
                  <div className={clsx(
                    "px-4 py-1.5 rounded-xl text-[12px] font-bold uppercase tracking-wider border",
                    req.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                  )}>
                    {req.status}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;
