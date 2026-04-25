import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Loader2,
  TrendingUp,
  TrendingDown,
  Lock,
  AlertTriangle,
  ExternalLink,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import { shipmentService } from '../../../services/shipmentService';
import { useToastContext } from '../../../contexts/ToastContext';
import { buildDebitLineSeedsFromApprovedCosts } from '../buildDebitLinesFromShipmentCost';

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

function parseActualCost(raw: unknown): {
  breakdown: CostBreakdown;
  incurred: number;
  salesCostApproved: boolean;
  salesCostApprovedAt: string | null;
} {
  const base: CostBreakdown = { trucking: 0, agent: 0, customs: 0, other: 0 };
  if (!raw || typeof raw !== 'object') {
    return { breakdown: base, incurred: 0, salesCostApproved: false, salesCostApprovedAt: null };
  }
  const o = raw as Record<string, unknown>;
  const breakdown: CostBreakdown = {
    trucking: Number(o.trucking) || 0,
    agent: Number(o.agent) || 0,
    customs: Number(o.customs) || 0,
    other: Number(o.other) || 0,
  };
  return {
    breakdown,
    incurred: Number(o.incurred) || 0,
    salesCostApproved: Boolean(o.sales_cost_approved),
    salesCostApprovedAt: typeof o.sales_cost_approved_at === 'string' ? o.sales_cost_approved_at : null,
  };
}

const CostControlTab: React.FC<Props> = ({ shipmentId }) => {
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const [plannedCost, setPlannedCost] = useState<CostBreakdown>({
    trucking: 0,
    agent: 0,
    customs: 0,
    other: 0,
  });
  const [actualCost, setActualCost] = useState<CostBreakdown>({
    trucking: 0,
    agent: 0,
    customs: 0,
    other: 0,
  });
  const [incurred, setIncurred] = useState(0);
  const [salesCostApproved, setSalesCostApproved] = useState(false);
  const [salesCostApprovedAt, setSalesCostApprovedAt] = useState<string | null>(null);
  const [quotationId, setQuotationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await shipmentService.getShipmentById(shipmentId);
      if (res) {
        if (res.planned_cost && typeof res.planned_cost === 'object') {
          setPlannedCost({
            trucking: 0,
            agent: 0,
            customs: 0,
            other: 0,
            ...(res.planned_cost as CostBreakdown),
          });
        }
        if (res.actual_cost && typeof res.actual_cost === 'object') {
          const parsed = parseActualCost(res.actual_cost);
          setActualCost(parsed.breakdown);
          setIncurred(parsed.incurred);
          setSalesCostApproved(parsed.salesCostApproved);
          setSalesCostApprovedAt(parsed.salesCostApprovedAt);
        }
        setQuotationId(res.quotation_id || null);
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
      const actualPayload = {
        ...actualCost,
        incurred,
        sales_cost_approved: salesCostApproved,
        sales_cost_approved_at: salesCostApproved
          ? salesCostApprovedAt || new Date().toISOString()
          : null,
      };
      await shipmentService.updateShipment(shipmentId, {
        planned_cost: plannedCost,
        actual_cost: actualPayload,
      } as any);
      if (salesCostApproved && !salesCostApprovedAt) {
        setSalesCostApprovedAt(new Date().toISOString());
      }
      if (!salesCostApproved) {
        setSalesCostApprovedAt(null);
      }
      success('Cost breakdown saved successfully');
      fetchData();
    } catch (err: any) {
      console.error('Failed to update cost breakdown:', err);
      error(err instanceof Error ? err.message : err?.message || 'Failed to save costs');
    } finally {
      setSaving(false);
    }
  };

  const getSum = (cb: CostBreakdown) =>
    (Number(cb.trucking) || 0) +
    (Number(cb.agent) || 0) +
    (Number(cb.customs) || 0) +
    (Number(cb.other) || 0);

  const sumPlanned = getSum(plannedCost);
  const sumActualCategories = getSum(actualCost);
  const sumIncurred = Math.max(0, Number(incurred) || 0);
  const sumActual = sumActualCategories + sumIncurred;
  const variance = sumActual - sumPlanned;
  const isRedAlert = sumPlanned > 0 && sumActual > sumPlanned * 1.1;

  const varianceSeeds = useMemo(
    () => buildDebitLineSeedsFromApprovedCosts(plannedCost, actualCost, incurred),
    [plannedCost, actualCost, incurred],
  );

  const handleToggleSalesApproved = (checked: boolean) => {
    setSalesCostApproved(checked);
    if (checked) {
      setSalesCostApprovedAt((prev) => prev || new Date().toISOString());
    } else {
      setSalesCostApprovedAt(null);
    }
  };

  const handlePushToDebitNote = () => {
    if (!salesCostApproved) {
      error('Cần bộ phận Sales xác nhận chi phí trước khi đưa vào Debit Note.');
      return;
    }
    if (varianceSeeds.length === 0) {
      error('Không có chênh lệch (thực tế − kế hoạch) hoặc phí phát sinh để thêm vào debit.');
      return;
    }
    navigate(`/shipments/sop/${shipmentId}/sea-house-bl/debit-note`, {
      state: {
        debitLinesFromCosting: varianceSeeds,
        costingPushId:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `cost-${Date.now()}`,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 text-[12px] text-slate-700 leading-relaxed">
        <p className="font-bold text-violet-900 uppercase tracking-wide text-[11px] mb-1">
          Quy trình chi phí → Sales → Debit
        </p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li>
            <strong>Chi phí lô</strong> (Planned) và <strong>thực tế theo loại</strong> hiển thị cạnh nhau;{' '}
            <strong>Phí phát sinh</strong> ghi nhận thêm ngoài bốn nhóm.
          </li>
          <li>
            Khi làm Debit, mở <strong>Báo giá (Sales)</strong> để đối chiếu; sau khi{' '}
            <strong>Sales xác nhận</strong> chi phí phát sinh / chênh lệch, dùng nút để{' '}
            <strong>đổ thẳng các dòng</strong> sang Debit Note.
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {quotationId ? (
          <Link
            to={`/financials/sales/${quotationId}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-white px-3 py-2 text-[12px] font-bold text-primary shadow-sm hover:bg-primary/5"
          >
            <ExternalLink size={14} />
            Báo giá (Sales)
          </Link>
        ) : (
          <span className="text-[12px] text-slate-400 italic">Chưa gắn báo giá trên lô hàng</span>
        )}
        <Link
          to={`/shipments/sop/${shipmentId}/sea-house-bl/debit-note`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <FileText size={14} />
          Debit Note (Sea House B/L)
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-blue-600" />
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-wider">
              Cost breakdown
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[12px] font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save Costs'}
          </button>
        </div>

        {isRedAlert && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-bold text-red-700">PROFIT WARNING</p>
              <p className="text-[12px] text-red-600 font-medium">
                Actual Cost is exceeding Planned Cost by over 10%.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2 mb-4">
              <h3 className="text-[14px] font-bold text-slate-800">Planned Costs</h3>
              <p className="text-[11px] text-slate-500">Chi phí lô — kế hoạch ban đầu</p>
            </div>
            {COST_KEYS.map((item) => (
              <div key={`plan_${item.key}`} className="flex items-center justify-between gap-4">
                <span className={clsx('text-[12px] font-bold px-2 py-1 rounded', item.bg, item.text)}>
                  {item.label}
                </span>
                <input
                  type="number"
                  min="0"
                  value={plannedCost[item.key] || ''}
                  onChange={(e) =>
                    setPlannedCost((p) => ({ ...p, [item.key]: Number(e.target.value) }))
                  }
                  className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 text-right text-[13px] font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            ))}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[13px] font-black text-slate-800 uppercase tracking-wide">
                Tổng kế hoạch (lô)
              </span>
              <span className="text-[15px] font-black text-blue-600">
                {formatCurrency(sumPlanned)} <span className="text-[10px] text-blue-400">VND</span>
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2 mb-4">
              <h3 className="text-[14px] font-bold text-slate-800">Actual Costs</h3>
              <p className="text-[11px] text-slate-500">Thực tế theo loại + phí phát sinh</p>
            </div>
            {COST_KEYS.map((item) => (
              <div key={`act_${item.key}`} className="flex items-center justify-between gap-4">
                <span className={clsx('text-[12px] font-bold px-2 py-1 rounded', item.bg, item.text)}>
                  {item.label}
                </span>
                <input
                  type="number"
                  min="0"
                  value={actualCost[item.key] || ''}
                  onChange={(e) =>
                    setActualCost((p) => ({ ...p, [item.key]: Number(e.target.value) }))
                  }
                  className={clsx(
                    'w-32 px-3 py-1.5 rounded-lg border text-right text-[13px] font-bold focus:ring-2 focus:ring-blue-500/20 transition-colors',
                    actualCost[item.key] > (plannedCost[item.key] || 0)
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-emerald-200 bg-emerald-50/30 text-emerald-700',
                  )}
                />
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 pt-1">
              <span className="text-[12px] font-bold px-2 py-1 rounded bg-amber-50 text-amber-800">
                Phí phát sinh
              </span>
              <input
                type="number"
                min="0"
                value={incurred || ''}
                onChange={(e) => setIncurred(Number(e.target.value))}
                className="w-32 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50/30 text-right text-[13px] font-bold text-amber-900 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[12px] text-slate-600">
                <span>Cộng 4 nhóm (thực tế)</span>
                <span className="font-bold tabular-nums">{formatCurrency(sumActualCategories)} VND</span>
              </div>
              <div className="flex items-center justify-between text-[12px] text-amber-800">
                <span>+ Phí phát sinh</span>
                <span className="font-bold tabular-nums">{formatCurrency(sumIncurred)} VND</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[13px] font-black text-slate-800 uppercase tracking-wide">
                  Tổng thực tế
                </span>
                <span
                  className={clsx(
                    'text-[15px] font-black',
                    sumActual > sumPlanned ? 'text-red-600' : 'text-emerald-600',
                  )}
                >
                  {formatCurrency(sumActual)}{' '}
                  <span className="text-[10px] opacity-70">VND</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          Xác nhận Sales & Debit Note
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={salesCostApproved}
            onChange={(e) => handleToggleSalesApproved(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600"
          />
          <div>
            <span className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
              {salesCostApproved && <CheckCircle2 size={16} className="text-emerald-600" />}
              Sales đã xác nhận chi phí phát sinh / chênh lệch
            </span>
            {salesCostApprovedAt && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Thời điểm ghi nhận: {new Date(salesCostApprovedAt).toLocaleString('vi-VN')}
              </p>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              Sau khi tick, có thể đẩy các dòng chênh lệch dương và phí phát sinh sang Debit Note.
            </p>
          </div>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handlePushToDebitNote}
            disabled={!salesCostApproved || varianceSeeds.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-[12px] font-bold text-white shadow-md disabled:opacity-45 disabled:pointer-events-none hover:from-teal-700 hover:to-emerald-700"
          >
            <FileText size={14} />
            Đưa chi phí đã duyệt vào Debit Note ({varianceSeeds.length} dòng)
          </button>
          {!salesCostApproved && varianceSeeds.length > 0 && (
            <span className="text-[11px] text-amber-700">Cần xác nhận Sales để mở khóa.</span>
          )}
        </div>
      </div>

      <div
        className={clsx(
          'rounded-xl p-4 border flex items-center justify-between',
          variance > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50',
        )}
      >
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            {variance > 0 ? (
              <TrendingUp size={14} className="text-amber-500" />
            ) : (
              <TrendingDown size={14} className="text-emerald-500" />
            )}
            Variance (Actual − Planned)
          </p>
          <p
            className={clsx(
              'text-[18px] font-black mt-1',
              variance > 0 ? 'text-amber-700' : 'text-emerald-700',
            )}
          >
            {variance > 0 ? '+' : ''}
            {formatCurrency(variance)} <span className="text-[12px] font-bold opacity-70">VND</span>
          </p>
        </div>
        {!isRedAlert && <Lock size={32} className="text-emerald-200 opacity-50" />}
        {isRedAlert && <AlertTriangle size={32} className="text-red-300" />}
      </div>
    </div>
  );
};

export default CostControlTab;
