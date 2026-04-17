import React from 'react';
import { Shield, Trash2 } from 'lucide-react';
import type { CustomsClearance, CreateCustomsClearanceDto } from '../../../services/customsClearanceService';

interface CustomsTabProps {
  shipmentId?: string;
  customsClearances: CustomsClearance[];
  newCustomsHsCode: string;
  setNewCustomsHsCode: (val: string) => void;
  newPhytosanitaryStatus: CreateCustomsClearanceDto['phytosanitary_status'];
  setNewPhytosanitaryStatus: (val: any) => void;
  newHsConfirmed: boolean;
  setNewHsConfirmed: (val: boolean) => void;
  isCreatingCustoms: boolean;
  handleCreateCustoms: () => void;
  handleChangeCustomsStatus: (id: string, status: CustomsClearance['status']) => void;
  handleDeleteCustoms: (id: string) => void;
  customsActionLoadingId: string | null;
}

const CustomsTab: React.FC<CustomsTabProps> = ({
  shipmentId, customsClearances, newCustomsHsCode, setNewCustomsHsCode,
  newPhytosanitaryStatus, setNewPhytosanitaryStatus, newHsConfirmed, setNewHsConfirmed,
  isCreatingCustoms, handleCreateCustoms, handleChangeCustomsStatus, handleDeleteCustoms,
  customsActionLoadingId
}) => {
  return (
    <section className="bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-teal-50 bg-teal-50/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-teal-600" />
          <span className="text-[12px] font-bold text-teal-600 uppercase tracking-wider">Customs & Phytosanitary</span>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">Customs Records ({customsClearances.length})</p>
          {customsClearances.length === 0 ? (
            <p className="text-[12px] text-slate-400">No customs declaration available.</p>
          ) : (
            <div className="space-y-1.5">
              {customsClearances.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="font-bold text-slate-700">{item.declaration_no || item.hs_code}</span>
                  <div className="flex items-center gap-1.5">
                    <select value={item.status} onChange={e => handleChangeCustomsStatus(item.id, e.target.value as CustomsClearance['status'])}
                      disabled={customsActionLoadingId === item.id}
                      className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-bold uppercase">
                      <option value="draft">draft</option><option value="submitted">submitted</option>
                      <option value="inspecting">inspecting</option><option value="released">released</option>
                      <option value="on_hold">on_hold</option><option value="rejected">rejected</option>
                    </select>
                    <button onClick={() => handleDeleteCustoms(item.id)} disabled={customsActionLoadingId === item.id}
                      className="p-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {shipmentId ? (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <p className="text-[11px] font-bold text-slate-600 uppercase">Add New Declaration</p>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={newCustomsHsCode} onChange={e => setNewCustomsHsCode(e.target.value)} placeholder="HS Code"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[12px] focus:ring-2 focus:ring-teal-500/20" />
              <select value={newPhytosanitaryStatus} onChange={e => setNewPhytosanitaryStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[12px] focus:ring-2 focus:ring-teal-500/20">
                <option value="pending">Phytosanitary: Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-[12px] text-slate-700 cursor-pointer">
              <input type="checkbox" checked={newHsConfirmed} onChange={e => setNewHsConfirmed(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500/20" />
              HS code confirmed
            </label>
            <button onClick={handleCreateCustoms} disabled={isCreatingCustoms || !newCustomsHsCode.trim()}
              className="w-full py-2 rounded-lg bg-teal-600 text-white text-[12px] font-bold disabled:opacity-50 hover:bg-teal-700 transition-colors shadow-sm border border-teal-700">
              {isCreatingCustoms ? 'Uploading...' : 'Add Customs'}
            </button>
          </div>
        ) : (
          <p className="text-[12px] text-red-500 italic">Save Shipment before adding declaration.</p>
        )}

        <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100">
          <p className="text-[11px] font-bold text-teal-500 uppercase mb-2">Lane Type</p>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[11px] font-bold border border-green-200">🟢 Green</span>
            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-[11px] font-bold border border-yellow-200">🟡 Yellow</span>
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-bold border border-red-200">🔴 Red</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomsTab;
