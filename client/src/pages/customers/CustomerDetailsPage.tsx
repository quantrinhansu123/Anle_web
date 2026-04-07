import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Building2, Mail, Phone, MapPin,
  Ship, Loader2, AlertCircle,
  Plus, Receipt, Shield, ExternalLink, Star,
  Calendar
} from 'lucide-react';
import { customerService, type CustomerDetails } from '../../services/customerService';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { formatDate } from '../../lib/utils';
import { clsx } from 'clsx';
import { useToastContext } from '../../contexts/ToastContext';
import CustomerDialog from './dialogs/CustomerDialog';

type LeftTab = 'info' | 'pic' | 'sales_purchasing' | 'routing' | 'notes' | 'credit';

const CustomerDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToastContext();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setDynamicTitle } = useBreadcrumb();
  
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>('info');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [formState, setFormState] = useState<any>({});

  useEffect(() => {
    if (customer) {
      setDynamicTitle(customer.company_name);
    }
    return () => setDynamicTitle(null);
  }, [customer, setDynamicTitle]);

  useEffect(() => {
    if (!id) return;
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomerDetails(id!);
      setCustomer(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = () => {
    if (!customer) return;
    setFormState(customer);
    setIsDialogOpen(true);
  };

  const handleSaveCustomer = async () => {
    try {
      if (!formState.company_name) {
        toastError('Company name is required');
        return;
      }
      const { id: custId, contacts, notes, shipments, sales, ...dto } = formState;
      await customerService.updateCustomer(custId!, dto);

      setIsClosing(true);
      setTimeout(() => {
        setIsDialogOpen(false);
        setIsClosing(false);
      }, 350);
      fetchDetails();
      toastSuccess('Customer updated successfully');
    } catch (err: any) {
      toastError(err?.message || 'Failed to save customer');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h3 className="text-xl font-bold">Error Loading Profile</h3>
      </div>
    );
  }

  const LEFT_TABS: { id: LeftTab, label: string }[] = [
    { id: 'info', label: 'Info' },
    { id: 'pic', label: 'PIC' },
    { id: 'sales_purchasing', label: 'Sales/Purch' },
    { id: 'routing', label: 'Routing' },
    { id: 'notes', label: 'Notes' },
    { id: 'credit', label: 'Credit' }
  ];

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customers/directory')}
            className="p-2.5 rounded-xl border border-border bg-white text-slate-600 hover:text-primary transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Profile</h1>
            <div className="flex items-center gap-2 text-slate-400 mt-0.5">
              <Shield size={12} className="text-primary/50" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Enterprise Network</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleOpenEdit}
          className="px-5 py-2.5 bg-primary text-white rounded-xl text-[12px] font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
        >
          Manage Customer
        </button>
      </div>

      {/* 3-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* COLUMN 1: LEFT PART WITH TABS (4/12) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] border border-border shadow-sm p-5 overflow-hidden relative flex flex-col">
            <div className="flex flex-col items-center text-center pb-4 border-b border-border/60">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 p-1 mb-3">
                <div className="w-full h-full rounded-xl bg-white border-2 border-white flex items-center justify-center shadow-sm">
                  <Building2 size={28} className="text-primary" />
                </div>
              </div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">{customer.company_name}</h2>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3].map((star) => {
                  const rank = customer.rank || 0;
                  const isHalf = rank === star - 0.5;
                  return (
                    <div key={star} className="relative w-4 h-4 flex items-center justify-center">
                      <Star size={16} className="absolute inset-0 fill-slate-100 text-slate-200" />
                      {(rank >= star || isHalf) && (
                        <div className={clsx("absolute inset-y-0 left-0 overflow-hidden", isHalf ? "w-[50%]" : "w-full")}>
                          <Star size={16} className="fill-amber-400 text-amber-400 min-w-[16px]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TAB SELECTOR (ONLY IN LEFT PART) */}
            <div className="flex flex-wrap gap-1.5 py-4 border-b border-border/60">
              {LEFT_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveLeftTab(tab.id)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                    activeLeftTab === tab.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT (LEFT COLUMN) */}
            <div className="pt-4 flex-1">
              {activeLeftTab === 'info' && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300 relative">
                  <div className="flex items-center gap-3">
                    <Shield size={14} className="text-slate-400 shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tax Code</div>
                      <div className="text-[12px] font-black text-slate-700">{customer.tax_code || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <div className="truncate">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</div>
                      <div className="text-[12px] font-black text-slate-700 truncate">{customer.email || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</div>
                      <div className="text-[12px] font-black text-slate-700">{customer.phone || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-1" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address</div>
                      <div className="text-[12px] font-black text-slate-700 leading-tight">{customer.address || '—'}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeLeftTab === 'pic' && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  {customer.contacts && customer.contacts.length > 0 ? (
                    customer.contacts.map(contact => (
                      <div key={contact.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="font-bold text-[12px] text-slate-900">{contact.full_name}</div>
                        <div className="text-[10px] text-primary font-bold">{contact.position || contact.department || 'Contact'}</div>
                        <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                          <div>{contact.phone}</div>
                          <div className="truncate">{contact.email}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-[11px] font-bold text-slate-400 py-4">No PIC data</div>
                  )}
                </div>
              )}

              {activeLeftTab === 'sales_purchasing' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-3">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-border/60 pb-1">Sales Information</div>
                    
                    <div className="flex flex-col gap-1 text-[12px]">
                      <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Sales Executive</span>
                      <span className="font-black text-slate-800">{customer.sales_staff || '—'}</span>
                    </div>
                    
                    <div className="flex flex-col gap-1 text-[12px]">
                      <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Sales Team</span>
                      <span className="font-black text-slate-800">{customer.sales_team || '—'}</span>
                    </div>

                    <div className="flex flex-col gap-1 text-[12px]">
                      <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Sales Department</span>
                      <span className="font-black text-slate-800">{customer.sales_department || '—'}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-border/60 pb-1">Other Information</div>
                    
                    <div className="flex flex-col gap-1 text-[12px]">
                      <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Company ID</span>
                      <span className="font-black text-slate-800">{customer.company_id_number || '—'}</span>
                    </div>
                    
                    <div className="flex flex-col gap-1 text-[12px]">
                      <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Industry</span>
                      <span className="font-black text-slate-800">{customer.industry || '—'}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeLeftTab === 'routing' && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Preferred Routes</div>
                  {customer.shipments?.slice(0, 4).map((s: any) => (
                    <div key={s.id} className="text-[11px] font-bold text-slate-700 bg-slate-50 p-2 rounded-lg truncate">
                       {s.pol && s.pod ? `${s.pol} -> ${s.pod}` : s.commodity || 'General Logistics'}
                    </div>
                  )) || <div className="text-[11px] text-slate-400">No data</div>}
                </div>
              )}

              {activeLeftTab === 'notes' && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  {customer.notes?.map((n: any) => (
                    <div key={n.id} className="p-3 bg-amber-50/30 rounded-xl border border-amber-100/50">
                      <div className="text-[10px] font-black text-amber-600 mb-1">{formatDate(n.created_at)}</div>
                      <div className="text-[11px] text-slate-700 font-medium leading-relaxed">{n.content}</div>
                    </div>
                  )) || <div className="text-[11px] text-slate-400">No notes</div>}
                </div>
              )}

              {activeLeftTab === 'credit' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Credit Limit</div>
                    <div className="text-xl font-black text-emerald-900 mt-1">{customer.credit_limit?.toLocaleString() || 0}</div>
                    <div className="text-[10px] text-emerald-700/60 font-bold mt-0.5">VNĐ</div>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-xl">
                    <span className="text-[11px] font-bold text-slate-500">Payment Terms</span>
                    <span className="text-[12px] font-black text-slate-900">Net {customer.credit_term_days || 0}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: SHIPMENTS (4/12) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2.5rem] border border-border shadow-sm flex flex-col h-full overflow-hidden min-h-[500px]">
            <div className="p-6 border-b border-border bg-slate-50/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Ship size={20} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-slate-900">Shipments</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Active Logistics</p>
                </div>
              </div>
              <button
                className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {customer.shipments && customer.shipments.length > 0 ? (
                <div className="space-y-3">
                  {customer.shipments.map((shipment: any) => (
                    <div key={shipment.id} className="p-5 rounded-[2rem] bg-blue-50/30 border border-blue-100/50 hover:bg-blue-50/50 transition-all group relative overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-blue-600 px-3 py-1 bg-white border border-blue-100 rounded-full uppercase tracking-widest shadow-sm">
                          {shipment.transport_air ? 'Air' : shipment.transport_sea ? 'Sea' : 'Logistic'}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                          <Calendar size={14} />
                          {formatDate(shipment.created_at)}
                        </div>
                      </div>

                      <h4 className="text-[16px] font-black text-blue-900 mb-1 group-hover:text-primary transition-colors leading-tight">{shipment.commodity || 'General Cargo'}</h4>
                      <p className="text-[12px] text-blue-600/70 font-bold tracking-tight mb-4 flex items-center gap-1.5 opacity-80">
                        {shipment.suppliers?.company_name || 'Individual Supplier'}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-blue-100/50 relative">
                        <div className="flex items-center gap-8">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black text-slate-400 tracking-tight mb-0.5">Quantity</span>
                            <span className="text-[12px] font-black text-slate-700">{shipment.quantity} {shipment.packing || 'Units'}</span>
                          </div>
                          <div className="flex flex-col border-l border-blue-100/50 pl-8">
                            <span className="text-[9px] uppercase font-black text-slate-400 tracking-tight mb-0.5">Vessel</span>
                            <span className="text-[12px] font-black text-slate-700 max-w-[120px] truncate">{shipment.vessel_voyage || '—'}</span>
                          </div>
                        </div>
                        <button className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all">
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
                    <Ship size={32} />
                  </div>
                  <p className="text-[13px] font-bold text-slate-900">No shipments found</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[150px]">No shipments associated with this customer yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 3: FINANCIALS (4/12) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2.5rem] border border-border shadow-sm flex flex-col h-full overflow-hidden max-h-[700px]">
            <div className="p-6 border-b border-border bg-slate-50/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-slate-900">Financials</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Accounting Records</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/10">
               {customer.sales && customer.sales.length > 0 ? (
                  customer.sales.map((sale: any) => (
                    <div key={sale.id} className="p-4 mb-3 bg-white border border-border rounded-2xl shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[12px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">Quotation</span>
                        <span className="text-[11px] text-slate-400 font-bold uppercase">{formatDate(sale.quote_date)}</span>
                      </div>
                      <div className="text-[14px] font-bold text-slate-900 mb-1">{sale.no_doc}</div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
                        <span className="text-[10px] uppercase font-black text-slate-400">Total Value</span>
                        <span className="font-black text-slate-800 text-[13px]">
                          {sale.sales_items?.reduce((a: number, c: any) => a + (Number(c.total) || 0), 0).toLocaleString()} VNĐ
                        </span>
                      </div>
                    </div>
                  ))
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                    <Receipt size={32} className="text-slate-300 mb-3" />
                    <p className="text-[12px] font-bold text-slate-900">No financial records</p>
                 </div>
               )}
            </div>
          </div>
        </div>

      </div>

      {isDialogOpen && (
        <CustomerDialog
          isOpen={isDialogOpen}
          isClosing={isClosing}
          mode="edit"
          onClose={() => {
            setIsClosing(true);
            setTimeout(() => { setIsDialogOpen(false); setIsClosing(false); }, 350);
          }}
          formState={formState}
          setFormField={(key, val) => setFormState((prev: any) => ({ ...prev, [key]: val }))}
          onSave={handleSaveCustomer}
        />
      )}
    </div>
  );
};

export default CustomerDetailsPage;
