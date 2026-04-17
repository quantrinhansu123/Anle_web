import React from 'react';
import { User, Anchor, FileText, Barcode, Package, Tag, Info, Ship, Plane, MapPin, Calendar, CheckCircle2, XCircle, ScrollText } from 'lucide-react';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DateInput } from '../../../components/ui/DateInput';
import { clsx } from 'clsx';
import type { ShipmentFormState } from '../types';

interface OverviewTabProps {
  form: ShipmentFormState;
  setField: <K extends keyof ShipmentFormState>(key: K, value: ShipmentFormState[K]) => void;
  customers: any[];
  suppliers: any[];
  contracts: { value: string; label: string }[];
  selectedCustomer: any;
  selectedSupplier: any;
  handleCreateNewCustomer: () => void;
  handleCreateNewSupplier: () => void;
  isSavingCustomer: boolean;
  isSavingSupplier: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  form, setField, customers, suppliers, contracts, selectedCustomer, selectedSupplier,
  handleCreateNewCustomer, handleCreateNewSupplier, isSavingCustomer, isSavingSupplier
}) => {
  return (
    <div className="space-y-6">
      {/* Customer */}
      <section className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-blue-50 bg-blue-50/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <User size={16} className="text-blue-600" />
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-wider">Customer Information</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isNewCustomer} onChange={e => setField('isNewCustomer', e.target.checked)} className="w-4 h-4 rounded border-blue-300 text-blue-500 focus:ring-blue-500/20" />
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Create New Customer</span>
          </label>
        </div>
        <div className="p-5 space-y-3">
          {!form.isNewCustomer ? (
            <SearchableSelect options={customers} value={form.customer_id} onValueChange={v => setField('customer_id', v)} placeholder="Search customer..." />
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 pt-2">
              <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"><Package size={12} /> Company Name <span className="text-red-500">*</span></label><input type="text" value={form.newCustomer?.company_name || ''} onChange={e => setField('newCustomer', { ...form.newCustomer, company_name: e.target.value })} placeholder="Enter company name" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium" /></div>
              <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"><Barcode size={12} /> Customer Code (3 Chars) <span className="text-red-500">*</span></label><input type="text" value={form.newCustomer?.code || ''} onChange={e => setField('newCustomer', { ...form.newCustomer, code: e.target.value.toUpperCase().slice(0, 3) })} placeholder="E.g. TDS" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-blue-600 uppercase" /></div>
              <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">Tax Code</label><input type="text" value={form.newCustomer?.tax_code || ''} onChange={e => setField('newCustomer', { ...form.newCustomer, tax_code: e.target.value })} placeholder="Tax Code" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium" /></div>
              <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">Phone</label><input type="text" value={form.newCustomer?.phone || ''} onChange={e => setField('newCustomer', { ...form.newCustomer, phone: e.target.value })} placeholder="Phone number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium" /></div>
              <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">Email</label><input type="email" value={form.newCustomer?.email || ''} onChange={e => setField('newCustomer', { ...form.newCustomer, email: e.target.value })} placeholder="Email address" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium" /></div>
              <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">Address</label><input type="text" value={form.newCustomer?.address || ''} onChange={e => setField('newCustomer', { ...form.newCustomer, address: e.target.value })} placeholder="Company address" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium" /></div>
              <div className="col-span-2 flex gap-2 mt-2">
                <button onClick={handleCreateNewCustomer} disabled={isSavingCustomer || !form.newCustomer?.company_name || !form.newCustomer?.code} className={clsx("flex-1 px-4 py-2 font-bold rounded-xl text-[13px] flex items-center justify-center gap-2 transition-all", (form.newCustomer?.company_name && form.newCustomer?.code) ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20" : "bg-slate-100 text-slate-400")}><CheckCircle2 size={16} /> Confirm & Save Customer</button>
                <button onClick={() => setField('isNewCustomer', false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-[13px] font-bold text-slate-600 flex items-center gap-2 transition-all"><XCircle size={16} /> Discard</button>
              </div>
            </div>
          )}
          {!form.isNewCustomer && selectedCustomer && (
            <div className="grid grid-cols-4 gap-3 pt-3 border-t border-blue-50 mt-3">
              <div className="space-y-0.5"><span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Code</span><p className="text-[12px] font-bold text-slate-800">{selectedCustomer.code || '—'}</p></div>
              <div className="space-y-0.5"><span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Tax Code</span><p className="text-[12px] font-medium text-slate-700">{selectedCustomer.tax_code || '—'}</p></div>
              <div className="space-y-0.5"><span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Phone</span><p className="text-[12px] font-medium text-slate-700">{selectedCustomer.phone || '—'}</p></div>
              <div className="space-y-0.5"><span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Email</span><p className="text-[12px] font-medium text-slate-700 truncate" title={selectedCustomer.email}>{selectedCustomer.email || '—'}</p></div>
              <div className="space-y-0.5 col-span-4"><span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Address</span><p className="text-[12px] font-medium text-slate-700">{selectedCustomer.address || '—'}</p></div>
            </div>
          )}
        </div>
      </section>

      {/* Supplier */}
      <section className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-emerald-50 bg-emerald-50/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Anchor size={16} className="text-emerald-600" />
            <span className="text-[12px] font-bold text-emerald-600 uppercase tracking-wider">Supplier Information</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isNewSupplier} onChange={e => setField('isNewSupplier', e.target.checked)} className="w-4 h-4 rounded border-emerald-300 text-emerald-500 focus:ring-emerald-500/20" />
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Create New Supplier</span>
          </label>
        </div>
        <div className="p-5 space-y-3">
          {!form.isNewSupplier ? (
            <SearchableSelect options={suppliers} value={form.supplier_id} onValueChange={v => setField('supplier_id', v)} placeholder="Search supplier..." />
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 pt-2">
              <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"><Package size={12} /> Company Name <span className="text-red-500">*</span></label><input type="text" value={form.newSupplier?.company_name || ''} onChange={e => setField('newSupplier', { ...form.newSupplier, company_name: e.target.value })} placeholder="Enter supplier company name" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium" /></div>
              <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"><Barcode size={12} /> Supplier Code (3 Chars) <span className="text-red-500">*</span></label><input type="text" value={form.newSupplier?.id || ''} onChange={e => setField('newSupplier', { ...form.newSupplier, id: e.target.value.toUpperCase().slice(0, 3) })} placeholder="E.g. MSC" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-emerald-600 uppercase" /></div>
              <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">Tax Code</label><input type="text" value={form.newSupplier?.tax_code || ''} onChange={e => setField('newSupplier', { ...form.newSupplier, tax_code: e.target.value })} placeholder="Tax Code" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium" /></div>
              <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">Phone</label><input type="text" value={form.newSupplier?.phone || ''} onChange={e => setField('newSupplier', { ...form.newSupplier, phone: e.target.value })} placeholder="Phone number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium" /></div>
              <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">Email</label><input type="email" value={form.newSupplier?.email || ''} onChange={e => setField('newSupplier', { ...form.newSupplier, email: e.target.value })} placeholder="Email address" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium" /></div>
              <div className="space-y-1.5"><label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">Address</label><input type="text" value={form.newSupplier?.address || ''} onChange={e => setField('newSupplier', { ...form.newSupplier, address: e.target.value })} placeholder="Company address" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium" /></div>
              <div className="col-span-2 flex gap-2 mt-2">
                <button onClick={handleCreateNewSupplier} disabled={isSavingSupplier || !form.newSupplier?.company_name || !form.newSupplier?.id} className={clsx("flex-1 px-4 py-2 font-bold rounded-xl text-[13px] flex items-center justify-center gap-2 transition-all", (form.newSupplier?.company_name && form.newSupplier?.id) ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20" : "bg-slate-100 text-slate-400")}><CheckCircle2 size={16} /> Confirm & Save Supplier</button>
                <button onClick={() => setField('isNewSupplier', false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-[13px] font-bold text-slate-600 flex items-center gap-2 transition-all"><XCircle size={16} /> Discard</button>
              </div>
            </div>
          )}
          {!form.isNewSupplier && selectedSupplier && (
            <div className="grid grid-cols-4 gap-3 pt-3 border-t border-emerald-50 mt-3">
              <div className="space-y-0.5"><span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Code</span><p className="text-[12px] font-bold text-slate-800">{selectedSupplier.value || '—'}</p></div>
              <div className="space-y-0.5"><span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Tax Code</span><p className="text-[12px] font-medium text-slate-700">{selectedSupplier.tax_code || '—'}</p></div>
              <div className="space-y-0.5"><span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Phone</span><p className="text-[12px] font-medium text-slate-700">{selectedSupplier.phone || '—'}</p></div>
              <div className="space-y-0.5"><span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Email</span><p className="text-[12px] font-medium text-slate-700 truncate" title={selectedSupplier.email}>{selectedSupplier.email || '—'}</p></div>
              <div className="space-y-0.5 col-span-4"><span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Address</span><p className="text-[12px] font-medium text-slate-700">{selectedSupplier.address || '—'}</p></div>
            </div>
          )}
        </div>
      </section>

      {/* Shipment Details */}
      <section className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-indigo-50 bg-indigo-50/50 flex items-center gap-2">
          <FileText size={16} className="text-indigo-600" />
          <span className="text-[12px] font-bold text-indigo-600 uppercase tracking-wider">Shipment Details & Contract</span>
        </div>
        <div className="p-5 grid grid-cols-2 gap-x-5 gap-y-4">
          <div className="space-y-1.5 col-span-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Barcode size={12} /> Shipment Code</label>
            <input type="text" value={form.code || ''} onChange={e => setField('code', e.target.value)} placeholder="Auto if left empty"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all" />
          </div>

          {/* Contract Selector (SOP gate: Hợp đồng OK) */}
          <div className="space-y-1.5 col-span-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><ScrollText size={12} /> Contract <span className="text-red-500">*</span></label>
            <SearchableSelect options={contracts} value={form.contract_id || ''} onValueChange={v => setField('contract_id', v || null)} placeholder="Link contract..." />
            {!form.contract_id && (
              <p className="text-[10px] text-amber-600 font-medium">SOP requires a linked contract before running the shipment.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Package size={12} /> Commodity *</label>
            <input type="text" value={form.commodity || ''} onChange={e => setField('commodity', e.target.value)} placeholder="Commodity name (EN + CN if exporting to China)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Tag size={12} /> HS Code</label>
            <input type="text" value={form.hs_code || ''} onChange={e => setField('hs_code', e.target.value)} placeholder="HS Code"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Info size={12} /> Quantity *</label>
            <input type="number" step="0.01" value={form.quantity || ''} onChange={e => setField('quantity', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Package size={12} /> Packing</label>
            <input type="text" value={form.packing || ''} onChange={e => setField('packing', e.target.value)} placeholder="20 Cartons"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Incoterms</label>
            <select value={form.term || ''} onChange={e => setField('term', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold">
              <option value="">— Select —</option>
              {['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Ship size={12} /> Vessel & Voyage</label>
            <input type="text" value={form.vessel_voyage || ''} onChange={e => setField('vessel_voyage', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all" />
          </div>

          {/* Transport mode */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Transport Mode</label>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.transport_sea} onChange={e => { setField('transport_sea', e.target.checked); if (e.target.checked) setField('transport_air', false); }}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                <Ship size={14} className={form.transport_sea ? 'text-blue-600' : 'text-slate-400'} />
                <span className="text-[12px] font-medium">Sea</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.transport_air} onChange={e => { setField('transport_air', e.target.checked); if (e.target.checked) setField('transport_sea', false); }}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                <Plane size={14} className={form.transport_air ? 'text-indigo-600' : 'text-slate-400'} />
                <span className="text-[12px] font-medium">Air</span>
              </label>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Load Type</label>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.load_fcl} onChange={e => { setField('load_fcl', e.target.checked); if (e.target.checked) setField('load_lcl', false); }}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                <span className="text-[12px] font-medium">FCL</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.load_lcl} onChange={e => { setField('load_lcl', e.target.checked); if (e.target.checked) setField('load_fcl', false); }}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                <span className="text-[12px] font-medium">LCL</span>
              </label>
            </div>
          </div>

          {/* POL / POD / ETD / ETA */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><MapPin size={12} /> POL</label>
            <input type="text" value={form.pol || ''} onChange={e => setField('pol', e.target.value)} placeholder="Port of Loading"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><MapPin size={12} /> POD</label>
            <input type="text" value={form.pod || ''} onChange={e => setField('pod', e.target.value)} placeholder="Port of Discharge"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Calendar size={12} /> ETD</label>
            <DateInput value={form.etd || ''} onChange={v => setField('etd', v)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Calendar size={12} /> ETA</label>
            <DateInput value={form.eta || ''} onChange={v => setField('eta', v)} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default OverviewTab;
