import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Building2, Mail, Phone, MapPin,
  Calendar, Ship, ExternalLink, Loader2,
  AlertCircle, TrendingUp, Clock, Shield, Plus,
  CreditCard, Receipt
} from 'lucide-react';
import { supplierService, type Supplier } from '../../services/supplierService';
import { shipmentService } from '../../services/shipmentService';
import { type Shipment } from '../shipments/types';
import { customerService, type Customer } from '../../services/customerService';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';

import type { ShipmentFormState } from '../shipments/types';
import ShipmentDialog from '../shipments/dialogs/ShipmentDialog';
import type { DebitNoteFormState } from '../debit-notes/types';
import DebitNoteDialog from '../debit-notes/dialogs/DebitNoteDialog';
import type { PaymentRequestFormState } from '../payment-requests/types';
import PaymentRequestDialog from '../payment-requests/dialogs/PaymentRequestDialog';
import { debitNoteService } from '../../services/debitNoteService';
import { paymentRequestService } from '../../services/paymentRequestService';
import { exchangeRateService, type ExchangeRate } from '../../services/exchangeRateService';
import AddEditSupplierDialog from './dialogs/AddEditSupplierDialog';
import { useToastContext } from '../../contexts/ToastContext';

const INITIAL_SHIPMENT_FORM: ShipmentFormState = {
  customer_id: '',
  supplier_id: '',
  commodity: '',
  hs_code: '',
  quantity: 0,
  packing: '',
  vessel_voyage: '',
  term: '',
  transport_air: false,
  transport_sea: true,
  load_fcl: true,
  load_lcl: false,
  pol: '',
  pod: '',
  etd: '',
  eta: '',
  isNewCustomer: false,
  newCustomer: { company_name: '' },
  isNewSupplier: false,
  newSupplier: { id: '', company_name: '' },
  pic_id: ''
};

const INITIAL_DEBIT_FORM: DebitNoteFormState = {
  shipment_id: '',
  note_date: new Date().toISOString().split('T')[0],
  invoice_items: [],
  chi_ho_items: []
};

const INITIAL_PAYMENT_FORM: PaymentRequestFormState = {
  shipment_id: '',
  request_date: new Date().toISOString().split('T')[0],
  account_name: '',
  account_number: '',
  bank_name: '',
  invoices: []
};

const SupplierDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToastContext();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setDynamicTitle } = useBreadcrumb();
  const [activeFinancialTab, setActiveFinancialTab] = useState<'payments' | 'debits'>('payments');

  // Dialog Options State
  const [customerOptions, setCustomerOptions] = useState<(Customer & { value: string, label: string })[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<(Supplier & { value: string, label: string })[]>([]);

  // Shipment Dialog State
  const [isShipmentOpen, setIsShipmentOpen] = useState(false);
  const [isShipmentClosing, setIsShipmentClosing] = useState(false);
  const [isShipmentEdit, setIsShipmentEdit] = useState(false);
  const [isShipmentDetail, setIsShipmentDetail] = useState(false);
  const [shipmentForm, setShipmentForm] = useState<ShipmentFormState>(INITIAL_SHIPMENT_FORM);

  // Debit Note Dialog State
  const [isDebitOpen, setIsDebitOpen] = useState(false);
  const [isDebitClosing, setIsDebitClosing] = useState(false);
  const [isDebitDetail, setIsDebitDetail] = useState(false);
  const [isDebitEdit, setIsDebitEdit] = useState(false);
  const [debitForm, setDebitForm] = useState<DebitNoteFormState>(INITIAL_DEBIT_FORM);

  // Payment Request Dialog State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPaymentClosing, setIsPaymentClosing] = useState(false);
  const [isPaymentDetail, setIsPaymentDetail] = useState(false);
  const [isPaymentEdit, setIsPaymentEdit] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentRequestFormState>(INITIAL_PAYMENT_FORM);

  // Shipment Options for Dialogs
  const [shipmentOptions, setShipmentOptions] = useState<(Shipment & { value: string, label: string })[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);

  // Supplier Edit Dialog State
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isSupplierClosing, setIsSupplierClosing] = useState(false);
  const [supplierFormState, setSupplierFormState] = useState<Partial<Supplier>>({});

  useEffect(() => {
    if (supplier) {
      setDynamicTitle(supplier.company_name);
    }
    return () => setDynamicTitle(null);
  }, [supplier, setDynamicTitle]);

  useEffect(() => {
    if (!id) return;
    fetchDetails();
    fetchOptions();
  }, [id]);

  const fetchOptions = async () => {
    try {
      const [customers, suppliers, shipments, rates] = await Promise.all([
        customerService.getCustomers(),
        supplierService.getSuppliers(),
        shipmentService.getShipments(1, 1000),
        exchangeRateService.getAll()
      ]);
      setCustomerOptions(customers.map(c => ({ ...c, value: c.id, label: c.company_name })));
      setSupplierOptions(suppliers.map(s => ({ ...s, value: s.id, label: s.company_name })));
      setShipmentOptions(shipments.map(s => ({ ...s, value: s.id, label: `Shipment ${s.code || '#' + s.id.slice(0, 8)} - ${s.customers?.company_name || 'N/A'}` })));
      setExchangeRates(rates);
    } catch (err: any) {
      console.error('Failed to fetch options', err);
    }
  };

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getSupplierDetails(id!);
      setSupplier(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch supplier details');
    } finally {
      setLoading(false);
    }
  };

  // HANDLERS FOR SHIPMENT
  const handleAddShipment = () => {
    setShipmentForm({
      ...INITIAL_SHIPMENT_FORM,
      supplier_id: id || '',
      pic_id: user?.id || ''
    });
    setIsShipmentEdit(false);
    setIsShipmentDetail(false);
    setIsShipmentOpen(true);
  };

  const handleViewShipment = (shipment: any) => {
    setShipmentForm({
      ...shipment,
      isNewCustomer: false,
      isNewSupplier: false,
      newCustomer: { company_name: '' },
      newSupplier: { id: '', company_name: '' }
    });
    setIsShipmentEdit(false);
    setIsShipmentDetail(true);
    setIsShipmentOpen(true);
  };

  const handleOpenDebitDetail = async (id: string) => {
    try {
      const data = await debitNoteService.getDebitNoteById(id);
      if (data) {
        setDebitForm({
          id: data.id,
          shipment_id: data.shipment_id,
          note_date: data.note_date,
          invoice_items: data.invoice_items || [],
          chi_ho_items: data.chi_ho_items || []
        });
        setIsDebitDetail(true);
        setIsDebitEdit(false);
        setIsDebitOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPaymentDetail = async (id: string) => {
    try {
      const data = await paymentRequestService.getPaymentRequestById(id);
      if (data) {
        setPaymentForm({
          id: data.id,
          shipment_id: data.shipment_id,
          request_date: data.request_date,
          account_name: data.account_name || '',
          account_number: data.account_number || '',
          bank_name: data.bank_name || '',
          relatedShipment: data.shipments,
          invoices: data.invoices?.length ? data.invoices.map((inv: any) => ({
            no_invoice: inv.no_invoice,
            description: inv.description,
            date_issue: inv.date_issue,
            payable_amount: inv.payable_amount || 0
          })) : []
        });
        setIsPaymentDetail(true);
        setIsPaymentEdit(false);
        setIsPaymentOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // HANDLERS FOR SUPPLIER
  const handleOpenEditSupplier = () => {
    if (!supplier) return;
    setSupplierFormState(supplier);
    setIsSupplierDialogOpen(true);
  };

  const handleCloseSupplierDialog = () => {
    setIsSupplierClosing(true);
    setTimeout(() => {
      setIsSupplierDialogOpen(false);
      setIsSupplierClosing(false);
    }, 350);
  };

  const handleSaveSupplier = async () => {
    try {
      if (!supplierFormState.company_name) {
        toastError('Company name is required');
        return;
      }

      const { id: supplierId, ...dto } = supplierFormState;
      await supplierService.updateSupplier(supplierId!, dto);

      handleCloseSupplierDialog();
      fetchDetails(); // Refresh page data
      toastSuccess('Supplier saved successfully');
    } catch (err: any) {
      console.error('Failed to save supplier:', err);
      toastError(err instanceof Error ? err.message : (err?.message || 'Failed to save supplier'));
    }
  };

  const handleShipmentClose = () => {
    setIsShipmentClosing(true);
    setTimeout(() => {
      setIsShipmentOpen(false);
      setIsShipmentClosing(false);
    }, 350);
  };

  const handleSaveShipment = async () => {
    try {
      let finalCustomerId = shipmentForm.customer_id;
      let finalSupplierId = shipmentForm.supplier_id;

      // Handle Customer (New or Edit Existing)
      if (shipmentForm.isNewCustomer && shipmentForm.newCustomer?.company_name) {
        const newCust = await customerService.createCustomer({
          company_name: shipmentForm.newCustomer.company_name,
          email: shipmentForm.newCustomer.email,
          phone: shipmentForm.newCustomer.phone,
          address: shipmentForm.newCustomer.address,
          tax_code: shipmentForm.newCustomer.tax_code
        });
        finalCustomerId = newCust.id;
      } else if (shipmentForm.isEditingCustomer && shipmentForm.customer_id && shipmentForm.newCustomer) {
        await customerService.updateCustomer(shipmentForm.customer_id, {
          company_name: shipmentForm.newCustomer.company_name,
          email: shipmentForm.newCustomer.email,
          phone: shipmentForm.newCustomer.phone,
          address: shipmentForm.newCustomer.address,
          tax_code: shipmentForm.newCustomer.tax_code
        });
      }

      // Handle Supplier (New or Edit Existing)
      if (shipmentForm.isNewSupplier && shipmentForm.newSupplier?.company_name) {
        if (!shipmentForm.newSupplier.id || shipmentForm.newSupplier.id.length !== 3) {
          toastError('Supplier Code must be exactly 3 characters');
          return;
        }
        const newSupp = await supplierService.createSupplier({
          id: shipmentForm.newSupplier.id,
          company_name: shipmentForm.newSupplier.company_name,
          email: shipmentForm.newSupplier.email,
          phone: shipmentForm.newSupplier.phone,
          address: shipmentForm.newSupplier.address,
          tax_code: shipmentForm.newSupplier.tax_code
        });
        finalSupplierId = newSupp.id;
      } else if (shipmentForm.isEditingSupplier && shipmentForm.supplier_id && shipmentForm.newSupplier) {
        await supplierService.updateSupplier(shipmentForm.supplier_id, {
          company_name: shipmentForm.newSupplier.company_name,
          email: shipmentForm.newSupplier.email,
          phone: shipmentForm.newSupplier.phone,
          address: shipmentForm.newSupplier.address,
          tax_code: shipmentForm.newSupplier.tax_code
        });
      }

      const { id: _id, isNewCustomer, isEditingCustomer, newCustomer, isNewSupplier, isEditingSupplier, newSupplier, ...dto } = shipmentForm;
      const finalDto = {
        ...dto,
        customer_id: finalCustomerId,
        supplier_id: finalSupplierId,
      };

      if (isShipmentEdit && shipmentForm.id) {
        await shipmentService.updateShipment(shipmentForm.id, finalDto);
      } else {
        await shipmentService.createShipment(finalDto);
      }
      handleShipmentClose();
      fetchDetails(); // Refresh list
      toastSuccess(isShipmentEdit ? 'Shipment updated successfully' : 'Shipment created successfully');
    } catch (err: any) {
      console.error(err);
      toastError(err instanceof Error ? err.message : (err?.message || 'Failed to save shipment'));
    }
  };

  const setShipmentField = <K extends keyof ShipmentFormState>(key: K, value: ShipmentFormState[K]) => {
    setShipmentForm(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="mt-4 text-slate-500 font-bold animate-pulse uppercase tracking-widest text-[11px]">Loading Details...</p>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-red-50/20 rounded-3xl border border-red-100">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">Error Loading Profile</h3>
        <p className="text-slate-500 mb-6 text-center max-w-sm">{error || "Supplier not found."}</p>
        <button
          onClick={() => navigate('/suppliers/directory')}
          className="px-6 py-2.5 bg-white border border-border rounded-xl text-[13px] font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* HEADER / NAVIGATION */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/suppliers/directory')}
            className="p-2.5 rounded-xl border border-border bg-white text-slate-600 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Supplier Profile</h1>
            <div className="flex items-center gap-2 text-slate-400 mt-0.5">
              <Shield size={12} className="text-primary/50" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Global Partner Network</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl bg-white border border-border text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <Clock size={16} />
            Activity Log
          </button>
          <button
            onClick={handleOpenEditSupplier}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-[12px] font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
          >
            Manage Supplier
          </button>
        </div>
      </div>

      {/* 3-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* COLUMN 1: PROFILE INFO (3/12) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] border border-border shadow-sm p-6 flex flex-col items-center text-center overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/5 to-transparent -z-1" />

            <div className="w-24 h-24 rounded-3xl bg-slate-100 p-1 mb-4 z-10">
              <div className="w-full h-full rounded-2xl bg-white border-2 border-white shadow-lg overflow-hidden flex items-center justify-center">
                <Building2 size={32} className="text-primary" />
              </div>
            </div>

            <h2 className="text-lg font-black text-slate-900 leading-tight mb-1">{supplier.company_name}</h2>
            <p className="text-[13px] font-bold text-primary mb-4">#{supplier.id}</p>

            <div className="w-full space-y-4 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Shield size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tax Code</span>
                  <span className="text-[12px] font-bold text-slate-700">{supplier.tax_code || '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Mail size={14} />
                </div>
                <div className="flex flex-col truncate min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email</span>
                  <span className="text-[12px] font-bold text-slate-700 truncate">{supplier.email || '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Phone size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone</span>
                  <span className="text-[12px] font-bold text-slate-700">{supplier.phone || '—'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 mt-1">
                  <MapPin size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Address</span>
                  <span className="text-[12px] font-bold text-slate-700 leading-tight">{supplier.address || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-border shadow-sm p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-primary" />
              <span className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">Business Stats</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-400">Total Orders</span>
                <span className="text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md">{supplier.shipments?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-400">Financial Records</span>
                <span className="text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md">{(supplier.payment_requests?.length || 0) + (supplier.debit_notes?.length || 0)}</span>
              </div>
              <div className="pt-2">
                <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Reliability: <span className="text-primary font-black">7.2/10</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: SHIPMENTS (5/12) */}
        <div className="lg:col-span-5">
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
                onClick={handleAddShipment}
                className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {supplier.shipments && supplier.shipments.length > 0 ? (
                <div className="space-y-3">
                  {supplier.shipments.map((shipment: any) => (
                    <div key={shipment.id} className="p-5 rounded-[2rem] bg-blue-50/30 border border-blue-100/50 hover:bg-blue-50/50 transition-all group relative overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-blue-600 px-3 py-1 bg-white border border-blue-100 rounded-full uppercase tracking-widest shadow-sm">
                          {shipment.transport_air ? 'Air' : shipment.transport_sea ? 'Sea' : 'Logistic'}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                          <Calendar size={14} />
                          {formatDate(shipment.etd)}
                        </div>
                      </div>

                      <h4 className="text-[16px] font-black text-blue-900 mb-1 group-hover:text-primary transition-colors leading-tight">{shipment.commodity || 'No Commodity Info'}</h4>
                      <p className="text-[12px] text-blue-600/70 font-bold tracking-tight mb-4 flex items-center gap-1.5 opacity-80">
                        {shipment.customers?.company_name || 'Individual Customer'}
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
                        <button
                          onClick={() => handleViewShipment(shipment)}
                          className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
                        >
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
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[150px]">No shipments associated with this supplier yet.</p>
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

              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setActiveFinancialTab('payments')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeFinancialTab === 'payments' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <CreditCard size={14} />
                  Payments
                </button>
                <button
                  onClick={() => setActiveFinancialTab('debits')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeFinancialTab === 'debits' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Receipt size={14} />
                  Debits
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {activeFinancialTab === 'payments' ? (
                supplier.payment_requests && supplier.payment_requests.length > 0 ? (
                  <div className="space-y-4">
                    {supplier.payment_requests.map((pr: any) => (
                      <div key={pr.id} className="p-5 rounded-[2rem] bg-indigo-50/30 border border-indigo-100/50 hover:bg-indigo-50/50 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white text-indigo-500 shadow-sm flex items-center justify-center text-[10px] font-black">
                              PR
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Request ID</span>
                              <span className="text-[13px] font-bold text-slate-900 uppercase">#{pr.no_doc || 'PENDING'}</span>
                            </div>
                          </div>
                          <span className="text-[13px] font-black text-indigo-600">
                            {pr.total_amount?.toLocaleString()} VNĐ
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-indigo-100/50">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black text-slate-400 tracking-tight">Date</span>
                            <span className="text-[11px] font-bold text-slate-700">{formatDate(pr.request_date)}</span>
                          </div>
                          <button
                            onClick={() => handleOpenPaymentDetail(pr.id)}
                            className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 hover:scale-110 active:scale-95 transition-all"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
                    <p className="text-[13px] font-bold text-slate-900">No payment requests</p>
                  </div>
                )
              ) : (
                supplier.debit_notes && supplier.debit_notes.length > 0 ? (
                  <div className="space-y-4">
                    {supplier.debit_notes.map((dn: any) => (
                      <div key={dn.id} className="p-5 rounded-[2rem] bg-amber-50/30 border border-amber-100/50 hover:bg-amber-50/50 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white text-amber-500 shadow-sm flex items-center justify-center text-[10px] font-black">
                              DN
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Debit Note ID</span>
                              <span className="text-[13px] font-bold text-slate-900 uppercase">#{dn.no_doc || 'PENDING'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-amber-100/50">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black text-slate-400 tracking-tight">Date</span>
                            <span className="text-[11px] font-bold text-slate-700">{formatDate(dn.note_date)}</span>
                          </div>
                          <button
                            onClick={() => handleOpenDebitDetail(dn.id)}
                            className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-200 hover:scale-110 active:scale-95 transition-all"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
                    <p className="text-[13px] font-bold text-slate-900">No debit notes</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

      </div>

      <ShipmentDialog
        isOpen={isShipmentOpen}
        isClosing={isShipmentClosing}
        isEditMode={isShipmentEdit}
        isDetailMode={isShipmentDetail}
        onClose={handleShipmentClose}
        formState={shipmentForm}
        setFormField={setShipmentField}
        customerOptions={customerOptions}
        supplierOptions={supplierOptions}
        onSave={handleSaveShipment}
        onEdit={() => {
          setIsShipmentEdit(true);
          setIsShipmentDetail(false);
        }}
      />

      <DebitNoteDialog
        isOpen={isDebitOpen}
        isClosing={isDebitClosing}
        formState={debitForm}
        setFormField={(key, val) => setDebitForm(prev => ({ ...prev, [key]: val }))}
        isEditMode={isDebitEdit}
        isDetailMode={isDebitDetail}
        onClose={() => {
          setIsDebitClosing(true);
          setTimeout(() => { setIsDebitOpen(false); setIsDebitClosing(false); }, 350);
        }}
        onEdit={() => {
          setIsDebitEdit(true);
          setIsDebitDetail(false);
        }}
        shipmentOptions={shipmentOptions}
        exchangeRates={exchangeRates}
        onSave={async () => {
          try {
            if (!debitForm.id) return;
            await debitNoteService.updateDebitNote(debitForm.id, debitForm);
            setIsDebitOpen(false);
            fetchDetails();
            toastSuccess('Debit note updated successfully');
          } catch (err: any) {
            console.error(err);
            toastError(err instanceof Error ? err.message : (err?.message || 'Failed to save debit note'));
          }
        }}
      />

      <PaymentRequestDialog
        isOpen={isPaymentOpen}
        isClosing={isPaymentClosing}
        formState={paymentForm}
        setFormField={(key, val) => setPaymentForm(prev => ({ ...prev, [key]: val }))}
        isEditMode={isPaymentEdit}
        isDetailMode={isPaymentDetail}
        onClose={() => {
          setIsPaymentClosing(true);
          setTimeout(() => { setIsPaymentOpen(false); setIsPaymentClosing(false); }, 350);
        }}
        onEdit={() => {
          setIsPaymentEdit(true);
          setIsPaymentDetail(false);
        }}
        shipmentOptions={shipmentOptions}
        onSave={async () => {
          try {
            if (!paymentForm.id) return;
            await paymentRequestService.updatePaymentRequest(paymentForm.id, paymentForm);
            setIsPaymentOpen(false);
            fetchDetails();
            toastSuccess('Payment request updated successfully');
          } catch (err: any) {
            console.error(err);
            toastError(err instanceof Error ? err.message : (err?.message || 'Failed to save payment request'));
          }
        }}
      />

      <AddEditSupplierDialog
        isOpen={isSupplierDialogOpen}
        isClosing={isSupplierClosing}
        isEditMode={true}
        onClose={handleCloseSupplierDialog}
        formState={supplierFormState}
        setFormField={(key, val) => setSupplierFormState(prev => ({ ...prev, [key]: val }))}
        onSave={handleSaveSupplier}
      />
    </div>
  );
};

export default SupplierDetailsPage;
