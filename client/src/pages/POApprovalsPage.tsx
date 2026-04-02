import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Search, RefreshCcw,
  CheckCircle, XCircle, Package, Truck, 
  User, CheckCircle2, X
} from 'lucide-react';
import { purchasingService, type PurchasingItem } from '../services/purchasingService';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';

const POApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToastContext();
  
  const [items, setItems] = useState<PurchasingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isManager = user?.position?.toLowerCase().includes('admin') || 
                    user?.position?.toLowerCase().includes('manager') || 
                    user?.position?.toLowerCase().includes('director') || 
                    user?.department === 'Admin' ||
                    user?.department === 'Management';

  useEffect(() => {
    if (isManager) fetchPendingValues();
    else setLoading(false);
  }, [isManager]);

  const fetchPendingValues = async () => {
    try {
      setLoading(true);
      const data = await purchasingService.getPurchasingItems(1, 1000);
      // Wait, getPurchasingItems can accept status, but our function signature in UI 
      // is only getPurchasingItems(page, limit). Let's filter locally for now.
      const pendingItems = data.filter(i => i.status === 'pending' || !i.status);
      setItems(pendingItems);
    } catch (err) {
      console.error('Fetch pending failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (item: PurchasingItem, action: 'approve' | 'reject') => {
    try {
      setActionLoading(item.id);
      
      const payload = {
        status: (action === 'approve' ? 'approved' : 'rejected') as 'approved' | 'rejected',
        approved_by_id: user?.id
      };
      
      await purchasingService.updatePurchasingItem(item.id, payload);
      
      toastSuccess(`Purchase Order ${item.shipments?.code || '#' + item.shipment_id.slice(0, 8)} ${action === 'approve' ? 'approved' : 'rejected'}`);
      setItems(prev => prev.filter(i => i.id !== item.id));
      
    } catch (err) {
      console.error(`Failed to ${action} PO:`, err);
      toastError(`Failed to ${action} Purchase Order`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredItems = items.filter(item => {
    const search = searchText.toLowerCase();
    return (
      item.description.toLowerCase().includes(search) ||
      item.suppliers?.company_name?.toLowerCase().includes(search) ||
      item.shipment_id.toLowerCase().includes(search)
    );
  });

  if (!isManager && !loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-border shadow-sm flex-1">
        <XCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-muted-foreground mt-2 text-center max-w-sm">
          You do not have the required administrative or managerial permissions to view pending purchase orders.
        </p>
        <button onClick={() => navigate('/order')} className="mt-6 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-md">
          Return to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col -mt-2 min-h-0 space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <CheckCircle2 className="text-primary" size={24} /> 
          Pending Purchase Approvals
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[13px] ml-2">
            {items.length} Pending
          </span>
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 flex items-center justify-between gap-4 border-b border-border">
          <div className="flex items-center gap-2 flex-1">
            <button onClick={() => navigate('/order')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0 active:scale-95">
              <ChevronLeft size={16} />Back
            </button>
            <div className="relative flex-1 max-w-sm group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search description, supplier, or shipment ID..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-8 py-1.5 bg-muted/10 border border-border rounded-xl text-[13px] font-medium focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all outline-none"
              />
              {searchText && (
                <button 
                  onClick={() => setSearchText('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-800"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          
          <button onClick={fetchPendingValues} className="px-3 py-1.5 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all shadow-sm">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/20 p-4">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-40 space-y-4">
               <RefreshCcw size={24} className="animate-spin text-primary" />
               <span className="text-sm font-medium text-muted-foreground">Loading pending orders...</span>
             </div>
          ) : filteredItems.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-40 space-y-3">
               <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                 <CheckCircle2 size={32} />
               </div>
               <span className="text-sm font-bold text-slate-700">All caught up!</span>
               <span className="text-xs font-medium text-muted-foreground">No pending purchase orders to approve.</span>
             </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                  {/* Card Header */}
                  <div className="px-5 py-4 border-b border-border bg-slate-50/50 flex flex-col gap-1 relative">
                    <div className="flex justify-between items-start">
                      <span className="text-[12px] font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                        Shipment: {item.shipments?.code || `#${item.shipment_id.slice(0, 8)}`}
                      </span>
                      <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        Pending
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1 line-clamp-1">
                      {item.description}
                    </h3>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 grid grid-cols-2 gap-y-4 gap-x-2 text-[13px]">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5"><Truck size={13} className="opacity-70" /> Supplier</span>
                      <span className="font-bold text-slate-700">{item.suppliers?.company_name || 'N/A'}</span>
                    </div>
                    
                    <div className="flex flex-col gap-1 items-end text-right">
                      <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5 justify-end"><Package size={13} className="opacity-70" /> Quantity / Unit</span>
                      <span className="font-bold text-slate-700">{item.quantity} {item.unit}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5"><User size={13} className="opacity-70" /> Creator (Drafted By)</span>
                      <span className="font-medium text-slate-700">{item.creator?.full_name || 'System / Auto'}</span>
                    </div>

                    <div className="flex flex-col gap-1 items-end text-right">
                      <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Total Value</span>
                      <span className="font-black text-[15px] text-primary">
                        {item.total?.toLocaleString()} <span className="text-[10px] uppercase font-normal opacity-70">VND</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="px-5 py-4 border-t border-border flex items-center gap-3 bg-slate-50">
                    <button 
                      onClick={() => handleAction(item, 'reject')}
                      disabled={actionLoading === item.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 bg-white text-red-600 font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <XCircle size={18} /> Reject
                    </button>
                    
                    <button 
                      onClick={() => handleAction(item, 'approve')}
                      disabled={actionLoading === item.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-600 bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
                    >
                      <CheckCircle size={18} /> Approve PO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POApprovalsPage;
