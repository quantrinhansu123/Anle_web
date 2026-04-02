import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Users, Briefcase, Mail, Phone, MapPin, 
  Calendar, Ship, FileText, ExternalLink, Loader2,
  AlertCircle, TrendingUp, Clock, Shield, Plus
} from 'lucide-react';
import { employeeService, type Employee } from '../../services/employeeService';
import { shipmentService } from '../../services/shipmentService';
import { contractService } from '../../services/contractService';
import { customerService, type Customer } from '../../services/customerService';
import { supplierService, type Supplier } from '../../services/supplierService';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import { useToastContext } from '../../contexts/ToastContext';

// Import Types and Dialogs
import type { ShipmentFormState } from '../shipments/types';
import type { Contract } from '../contracts/types';
import ShipmentDialog from '../shipments/dialogs/ShipmentDialog';
import ContractDialog from '../contracts/dialogs/ContractDialog';
import EmployeeDialog from './dialogs/EmployeeDialog';

// --- INITIAL STATES ---
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

const INITIAL_CONTRACT_FORM: Partial<Contract> = {
  customer_id: undefined,
  supplier_id: undefined,
  pic_id: '',
  no_contract: '',
  payment_term: '',
  type_logistic: false,
  type_trading: false,
  file_url: ''
};

const EmployeeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToastContext();
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setDynamicTitle } = useBreadcrumb();

  // Dialog Options State
  const [customerOptions, setCustomerOptions] = useState<(Customer & { value: string, label: string })[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<(Supplier & { value: string, label: string })[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<{ value: string, label: string }[]>([]);

  // Shipment Dialog State
  const [isShipmentOpen, setIsShipmentOpen] = useState(false);
  const [isShipmentClosing, setIsShipmentClosing] = useState(false);
  const [isShipmentEdit, setIsShipmentEdit] = useState(false);
  const [isShipmentDetail, setIsShipmentDetail] = useState(false);
  const [shipmentForm, setShipmentForm] = useState<ShipmentFormState>(INITIAL_SHIPMENT_FORM);

  // Contract Dialog State
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [isContractClosing, setIsContractClosing] = useState(false);
  const [contractMode, setContractMode] = useState<'add' | 'edit' | 'detail'>('add');
  const [contractForm, setContractForm] = useState<Partial<Contract>>(INITIAL_CONTRACT_FORM);

  // Employee Edit Dialog State
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
  const [isEmployeeClosing, setIsEmployeeClosing] = useState(false);
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({});

  useEffect(() => {
    if (employee) {
      setDynamicTitle(employee.full_name);
    }
    return () => setDynamicTitle(null);
  }, [employee, setDynamicTitle]);

  useEffect(() => {
    if (!id) return;
    fetchDetails();
    fetchOptions();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getEmployeeDetails(id!);
      setEmployee(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch employee details');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [customers, suppliers, employees] = await Promise.all([
        customerService.getCustomers(),
        supplierService.getSuppliers(),
        employeeService.getEmployees()
      ]);
      setCustomerOptions(customers.map(c => ({ ...c, value: c.id, label: c.company_name })));
      setSupplierOptions(suppliers.map(s => ({ ...s, value: s.id, label: s.company_name })));
      setEmployeeOptions(employees.map(e => ({ value: e.id, label: e.full_name })));
    } catch (err) {
      console.error('Failed to fetch options', err);
    }
  };

  // HANDLERS FOR SHIPMENT
  const handleAddShipment = () => {
    setShipmentForm({ ...INITIAL_SHIPMENT_FORM, pic_id: user?.id || '' });
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
    } catch (err) {
      console.error(err);
      toastError('Failed to save shipment');
    }
  };

  const setShipmentField = <K extends keyof ShipmentFormState>(key: K, value: ShipmentFormState[K]) => {
    setShipmentForm(prev => ({ ...prev, [key]: value }));
  };

  // HANDLERS FOR CONTRACT
  const handleAddContract = () => {
    setContractForm({ ...INITIAL_CONTRACT_FORM, pic_id: user?.id || '' });
    setContractMode('add');
    setIsContractOpen(true);
  };

  const handleViewContract = (contract: Contract) => {
    setContractForm({ ...contract });
    setContractMode('detail');
    setIsContractOpen(true);
  };

  const handleContractClose = () => {
    setIsContractClosing(true);
    setTimeout(() => {
      setIsContractOpen(false);
      setIsContractClosing(false);
    }, 350);
  };

  const handleSaveContract = async () => {
    try {
      if (contractMode === 'edit' && contractForm.id) {
        // Sanitize DTO for update (remove non-column fields)
        const { id, customers, suppliers, bill_of_ladings, shipments, created_at, ...updateDto } = contractForm as any;
        await contractService.updateContract(contractForm.id, updateDto);
        toastSuccess('Contract updated successfully');
      } else {
        const { ...dto } = contractForm;
        await contractService.createContract(dto as any);
        toastSuccess('Contract created successfully');
      }
      handleContractClose();
      fetchDetails(); // Refresh list
    } catch (err) {
      console.error(err);
      toastError('Failed to save contract');
    }
  };

  const setContractField = (key: string, value: any) => {
    setContractForm(prev => ({ ...prev, [key]: value }));
  };

  // HANDLERS FOR EMPLOYEE
  const handleOpenEditEmployee = () => {
    if (!employee) return;
    setEmployeeForm(employee);
    setIsEmployeeOpen(true);
  };

  const handleEmployeeClose = () => {
    setIsEmployeeClosing(true);
    setTimeout(() => {
      setIsEmployeeOpen(false);
      setIsEmployeeClosing(false);
    }, 350);
  };

  const handleSaveEmployee = async () => {
    try {
      if (!employeeForm.full_name || !employeeForm.email) {
        toastError('Name and Email are required');
        return;
      }

      // Sanitize DTO to remove non-column fields/relations
      const { id: _id, shipments, contracts, created_at, ...updateDto } = employeeForm as any;

      await employeeService.updateEmployee(employeeForm.id!, updateDto);
      handleEmployeeClose();
      fetchDetails(); // Refresh page data
      toastSuccess('Employee updated successfully');
    } catch (err) {
      console.error('Failed to update employee:', err);
      toastError('Failed to update employee');
    }
  };

  const setEmployeeField = <K extends keyof Employee>(key: K, value: Employee[K]) => {
    setEmployeeForm(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="mt-4 text-slate-500 font-bold animate-pulse uppercase tracking-widest text-[11px]">Loading Details...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-red-50/20 rounded-3xl border border-red-100">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">Error Loading Profile</h3>
        <p className="text-slate-500 mb-6 text-center max-w-sm">{error || "Employee not found."}</p>
        <button
          onClick={() => navigate('/employees/directory')}
          className="px-6 py-2.5 bg-white border border-border rounded-xl text-[13px] font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Back to Directory
        </button>
      </div>
    );
  }

  const entityOptions = [
    ...customerOptions.map(c => ({ value: `C:${c.value}`, label: c.label })),
    ...supplierOptions.map(s => ({ value: `S:${s.value}`, label: s.label }))
  ];

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* HEADER / NAVIGATION */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/employees/directory')}
            className="p-2.5 rounded-xl border border-border bg-white text-slate-600 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Employee Profile</h1>
            <div className="flex items-center gap-2 text-slate-400 mt-0.5">
              <Shield size={12} className="text-primary/50" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Internal Directory</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl bg-white border border-border text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <Clock size={16} />
            History
          </button>
          <button 
            onClick={handleOpenEditEmployee}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-[12px] font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* 3-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* COLUMN 1: PROFILE INFO (3/12) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] border border-border shadow-sm p-6 flex flex-col items-center text-center overflow-hidden relative">
            {/* Decoration */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/5 to-transparent -z-1" />

            <div className="w-24 h-24 rounded-3xl bg-slate-100 p-1 mb-4 z-10">
              <div className="w-full h-full rounded-2xl bg-white border-2 border-white shadow-lg overflow-hidden flex items-center justify-center">
                {employee.avatar_url ? (
                  <img src={employee.avatar_url} alt={employee.full_name} className="w-full h-full object-cover" />
                ) : (
                  <Users size={32} className="text-slate-300" />
                )}
              </div>
            </div>

            <h2 className="text-lg font-black text-slate-900 leading-tight mb-1">{employee.full_name}</h2>
            <p className="text-[13px] font-bold text-primary mb-4">{employee.position || 'Employee'}</p>

            <div className="w-full space-y-4 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Briefcase size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Department</span>
                  <span className="text-[12px] font-bold text-slate-700">{employee.department || '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Mail size={14} />
                </div>
                <div className="flex flex-col truncate min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email</span>
                  <span className="text-[12px] font-bold text-slate-700 truncate">{employee.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Phone size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone</span>
                  <span className="text-[12px] font-bold text-slate-700">{employee.phone || '—'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 mt-1">
                  <MapPin size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Address</span>
                  <span className="text-[12px] font-bold text-slate-700 leading-tight">{employee.address || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-border shadow-sm p-6 overflow-hidden">
             <div className="flex items-center gap-2 mb-4">
               <TrendingUp size={16} className="text-primary" />
               <span className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">Performance</span>
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400">Total Shipments</span>
                  <span className="text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md">{employee.shipments?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400">Active Contracts</span>
                  <span className="text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md">{employee.contracts?.length || 0}</span>
                </div>
                <div className="pt-2">
                   <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full w-[80%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                   </div>
                   <p className="text-[10px] text-slate-400 mt-2 font-medium">Efficiency Score: <span className="text-primary font-black">8.5/10</span></p>
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
                  <h3 className="text-[15px] font-black text-slate-900">Responsible Shipments</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Active Logistics Tasks</p>
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
              {employee.shipments && employee.shipments.length > 0 ? (
                <div className="space-y-3">
                  {employee.shipments.map((shipment) => (
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
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[150px]">This employee is not currently managing any shipments.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 3: CONTRACTS (4/12) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2.5rem] border border-border shadow-sm flex flex-col h-full overflow-hidden max-h-[700px]">
            <div className="p-6 border-b border-border bg-slate-50/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-slate-900">Handled Contracts</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Legal & Sales Records</p>
                </div>
              </div>
              <button
                onClick={handleAddContract}
                className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 hover:scale-110 active:scale-95 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {employee.contracts && employee.contracts.length > 0 ? (
                <div className="space-y-4">
                  {employee.contracts.map((contract) => (
                    <div key={contract.id} className="p-5 rounded-[2rem] bg-indigo-50/30 border border-indigo-100/50 hover:bg-indigo-50/50 transition-all group">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-white text-indigo-500 shadow-sm flex items-center justify-center text-[11px] font-black">
                           CNT
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Contract ID</span>
                           <span className="text-[13px] font-bold text-slate-900 uppercase">#{contract.no_contract || 'PENDING'}</span>
                        </div>
                      </div>

                      <h4 className="text-[12px] font-black text-indigo-900 mb-1 group-hover:text-primary transition-colors">{contract.customers?.company_name || 'Loading Customer...'}</h4>
                      <p className="text-[11px] text-indigo-600/70 font-bold tracking-tight mb-4 flex items-center gap-1.5 opacity-80">
                         <MapPin size={10} />
                         Sales Representative
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-indigo-100/50">
                        <div className="flex flex-col">
                           <span className="text-[9px] uppercase font-black text-slate-400 tracking-tight">Created On</span>
                           <span className="text-[11px] font-bold text-slate-700">{formatDate(contract.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           {contract.type_logistic && (
                             <span className="px-2.5 py-1 rounded-xl bg-white border border-indigo-100 text-[10px] font-black text-indigo-400 shadow-sm uppercase tracking-tight" title="Logistic Type">Logistic</span>
                           )}
                           {contract.type_trading && (
                             <span className="px-2.5 py-1 rounded-xl bg-white border border-indigo-100 text-[10px] font-black text-amber-500 shadow-sm uppercase tracking-tight" title="Trading Type">Trading</span>
                           )}
                           <button 
                             onClick={() => handleViewContract(contract)}
                             className="ml-2 w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 hover:scale-110 active:scale-95 transition-all"
                           >
                              <ExternalLink size={14} />
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
                    <FileText size={32} />
                  </div>
                  <p className="text-[13px] font-bold text-slate-900">No contracts found</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[150px]">No sales or service contracts associated yet.</p>
                </div>
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

      <ContractDialog
        isOpen={isContractOpen}
        isClosing={isContractClosing}
        mode={contractMode}
        onClose={handleContractClose}
        formState={contractForm}
        setFormField={setContractField}
        entityOptions={entityOptions}
        employeeOptions={employeeOptions}
        customers={customerOptions}
        suppliers={supplierOptions}
        onSave={handleSaveContract}
        onEdit={() => setContractMode('edit')}
      />

      <EmployeeDialog
        isOpen={isEmployeeOpen}
        isClosing={isEmployeeClosing}
        isEditMode={true}
        onClose={handleEmployeeClose}
        formState={employeeForm}
        setFormField={setEmployeeField}
        onSave={handleSaveEmployee}
      />
    </div>
  );
};

export default EmployeeDetailsPage;
