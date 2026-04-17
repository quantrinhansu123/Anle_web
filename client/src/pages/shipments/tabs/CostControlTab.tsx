import React, { useState, useEffect } from 'react';
import {
  DollarSign, Loader2, TrendingUp, TrendingDown, Lock, AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import { shipmentService } from '../../../services/shipmentService';

interface Props {
  shipmentId: string;
}

interface CostBreakdown {
  trucking: number;
  agent: number;
  customs: number;
  other: number;
}

const COST_KEYS: { key: keyof CostBreakdown; label: string; bg: string; text: string }[] = [
  { key: 'trucking', label: 'Trucking Cost', bg: 'bg-orange-50', text: 'text-orange-700' },
  { key: 'customs', label: 'Customs Fee', bg: 'bg-teal-50', text: 'text-teal-700' },
  { key: 'agent', label: 'Agent Fee', bg: 'bg-blue-50', text: 'text-blue-700' },
  { key: 'other', label: 'Other Expenses', bg: 'bg-slate-50', text: 'text-slate-700' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);

const CostControlTab: React.FC<Props> = ({ shipmentId }) => {
  const [plannedCost, setPlannedCost] = useState<CostBreakdown>({ trucking: 0, agent: 0, customs: 0, other: 0 });
  const [actualCost, setActualCost] = useState<CostBreakdown>({ trucking: 0, agent: 0, customs: 0, other: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await shipmentService.getShipmentById(shipmentId);
      if (res) {
        if (res.planned_cost) setPlannedCost({ trucking: 0, agent: 0, customs: 0, other: 0, ...res.planned_cost });
        if (res.actual_cost) setActualCost({ trucking: 0, agent: 0, customs: 0, other: 0, ...res.actual_cost });
      }
    } catch (err) {
      console.error('Failed to load shipment costs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [shipmentId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await shipmentService.updateShipment(shipmentId, {
        planned_cost: plannedCost,
        actual_cost: actualCost,
      } as any);
      // Small toast or visual check could be added
      fetchData();
    } catch (err) {
      console.error('Failed to update cost breakdown:', err);
    } finally {
      setSaving(false);
    }
  };

  const getSum = (cb: CostBreakdown) => (Number(cb.trucking) || 0) + (Number(cb.agent) || 0) + (Number(cb.customs) || 0) + (Number(cb.other) || 0);

  const sumPlanned = getSum(plannedCost);
  const sumActual = getSum(actualCost);
  const variance = sumActual - sumPlanned;
  const isRedAlert = sumPlanned > 0 && sumActual > sumPlanned * 1.1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-blue-600" />
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-wider">Cost Breakdown (JSON)</span>
          </div>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[12px] font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save Costs'}
          </button>
        </div>

        {/* Warning if variance > 10% */}
        {isRedAlert && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-bold text-red-700">PROFIT WARNING</p>
              <p className="text-[12px] text-red-600 font-medium">Actual Cost is exceeding Planned Cost by over 10%.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* PLANNED COLUMN */}
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2 mb-4">
              <h3 className="text-[14px] font-bold text-slate-800">Planned Costs</h3>
              <p className="text-[11px] text-slate-500">Initial planned</p>
            </div>
            {COST_KEYS.map(item => (
              <div key={`plan_${item.key}`} className="flex items-center justify-between gap-4">
                <span className={clsx("text-[12px] font-bold px-2 py-1 rounded", item.bg, item.text)}>{item.label}</span>
                <input type="number" min="0" value={plannedCost[item.key] || ''} onChange={e => setPlannedCost(p => ({ ...p, [item.key]: Number(e.target.value) }))}
                  className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 text-right text-[13px] font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20" />
              </div>
            ))}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[13px] font-black text-slate-800 uppercase tracking-wide">Total Planned</span>
              <span className="text-[15px] font-black text-blue-600">{formatCurrency(sumPlanned)} <span className="text-[10px] text-blue-400">VND</span></span>
            </div>
          </div>

          {/* ACTUAL COLUMN */}
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2 mb-4">
              <h3 className="text-[14px] font-bold text-slate-800">Actual Costs</h3>
              <p className="text-[11px] text-slate-500">Actual incurred costs</p>
            </div>
            {COST_KEYS.map(item => (
              <div key={`act_${item.key}`} className="flex items-center justify-between gap-4">
                <span className={clsx("text-[12px] font-bold px-2 py-1 rounded", item.bg, item.text)}>{item.label}</span>
                <input type="number" min="0" value={actualCost[item.key] || ''} onChange={e => setActualCost(p => ({ ...p, [item.key]: Number(e.target.value) }))}
                  className={clsx("w-32 px-3 py-1.5 rounded-lg border text-right text-[13px] font-bold focus:ring-2 focus:ring-blue-500/20 transition-colors", 
                    actualCost[item.key] > (plannedCost[item.key] || 0) ? 'border-red-300 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50/30 text-emerald-700'
                  )} />
              </div>
            ))}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[13px] font-black text-slate-800 uppercase tracking-wide">Total Actual</span>
              <span className={clsx("text-[15px] font-black", sumActual > sumPlanned ? "text-red-600" : "text-emerald-600")}>{formatCurrency(sumActual)} <span className="text-[10px] opacity-70">VND</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className={clsx("rounded-xl p-4 border flex items-center justify-between",
          variance > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"
        )}>
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            {variance > 0 ? <TrendingUp size={14} className="text-amber-500" /> : <TrendingDown size={14} className="text-emerald-500" />}
            Variance (Actual - Planned)
          </p>
          <p className={clsx("text-[18px] font-black mt-1", variance > 0 ? "text-amber-700" : "text-emerald-700")}>
            {variance > 0 ? '+' : ''}{formatCurrency(variance)} <span className="text-[12px] font-bold opacity-70">VND</span>
          </p>
        </div>
        {!isRedAlert && <Lock size={32} className="text-emerald-200 opacity-50" />}
        {isRedAlert && <AlertTriangle size={32} className="text-red-300" />}
      </div>
    </div>
  );
};

export default CostControlTab;
