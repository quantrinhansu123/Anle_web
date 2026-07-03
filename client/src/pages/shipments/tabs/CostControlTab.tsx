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
import { formatInputCurrency, parseCurrency } from '../../../lib/utils';
import { shipmentService } from '../../../services/shipmentService';
import { exchangeRateService } from '../../../services/exchangeRateService';
import { useToastContext } from '../../../contexts/ToastContext';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
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

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: currency === 'VND' ? 0 : 2,
  }).format(amount);

const normalizeCurrency = (currency?: string | null) => (currency || 'VND').toUpperCase();

const toDisplayAmount = (amountVnd: number, currency: string, exchangeRate: number) =>
  currency === 'VND' ? amountVnd : amountVnd / exchangeRate;

const toVndAmount = (amount: number, currency: string, exchangeRate: number) =>
  currency === 'VND' ? amount : amount * exchangeRate;

const mapCostBreakdown = (
  raw: Partial<CostBreakdown> | undefined,
  mapper: (value: number) => number,
): CostBreakdown => ({
  trucking: mapper(Number(raw?.trucking) || 0),
  agent: mapper(Number(raw?.agent) || 0),
  customs: mapper(Number(raw?.customs) || 0),
  other: mapper(Number(raw?.other) || 0),
});

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
  const [displayCurrency, setDisplayCurrency] = useState('VND');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [availableRates, setAvailableRates] = useState<Record<string, number>>({ VND: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [res, rates] = await Promise.all([
        shipmentService.getShipmentById(shipmentId),
        exchangeRateService.getAll().catch(() => []),
      ]);
      const rateMap = rates.reduce<Record<string, number>>(
        (acc, item) => {
          const code = normalizeCurrency(item.currency_code);
          const rate = Number(item.rate) || 0;
          if (code && rate > 0) acc[code] = rate;
          return acc;
        },
        { VND: 1 },
      );
      setAvailableRates(rateMap);
      if (res) {
        const currency = normalizeCurrency(res.currency);
        const rate = currency === 'VND' ? 1 : Number(res.exchange_rate) || rateMap[currency] || 1;
        setDisplayCurrency(currency);
        setExchangeRate(rate);
        if (res.planned_cost && typeof res.planned_cost === 'object') {
          setPlannedCost(
            mapCostBreakdown(res.planned_cost as Partial<CostBreakdown>, (value) =>
              toDisplayAmount(value, currency, rate),
            ),
          );
        }
        if (res.actual_cost && typeof res.actual_cost === 'object') {
          const parsed = parseActualCost(res.actual_cost);
          setActualCost(
            mapCostBreakdown(parsed.breakdown, (value) => toDisplayAmount(value, currency, rate)),
          );
          setIncurred(toDisplayAmount(parsed.incurred, currency, rate));
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
      const plannedCostVnd = mapCostBreakdown(plannedCost, (value) =>
        toVndAmount(value, displayCurrency, exchangeRate),
      );
      const actualCostVnd = mapCostBreakdown(actualCost, (value) =>
        toVndAmount(value, displayCurrency, exchangeRate),
      );
      const actualPayload = {
        ...actualCostVnd,
        incurred: toVndAmount(incurred, displayCurrency, exchangeRate),
        sales_cost_approved: salesCostApproved,
        sales_cost_approved_at: salesCostApproved
          ? salesCostApprovedAt || new Date().toISOString()
          : null,
      };
      await shipmentService.updateShipment(shipmentId, {
        planned_cost: plannedCostVnd,
        actual_cost: actualPayload,
        currency: displayCurrency,
        exchange_rate: exchangeRate,
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
  const vndPlannedCost = useMemo(
    () => mapCostBreakdown(plannedCost, (value) => toVndAmount(value, displayCurrency, exchangeRate)),
    [plannedCost, displayCurrency, exchangeRate],
  );
  const vndActualCost = useMemo(
    () => mapCostBreakdown(actualCost, (value) => toVndAmount(value, displayCurrency, exchangeRate)),
    [actualCost, displayCurrency, exchangeRate],
  );
  const vndIncurred = useMemo(
    () => toVndAmount(incurred, displayCurrency, exchangeRate),
    [incurred, displayCurrency, exchangeRate],
  );

  const varianceSeeds = useMemo(
    () => buildDebitLineSeedsFromApprovedCosts(vndPlannedCost, vndActualCost, vndIncurred),
    [vndPlannedCost, vndActualCost, vndIncurred],
  );
  const currencyOptions = useMemo(
    () => Object.keys(availableRates).map((code) => ({ value: code, label: code })),
    [availableRates],
  );

  const handleCurrencyChange = (currency: string) => {
    const nextCurrency = normalizeCurrency(currency);
    const nextRate = nextCurrency === 'VND' ? 1 : availableRates[nextCurrency] || exchangeRate || 1;
    const plannedVnd = mapCostBreakdown(plannedCost, (value) =>
      toVndAmount(value, displayCurrency, exchangeRate),
    );
    const actualVnd = mapCostBreakdown(actualCost, (value) =>
      toVndAmount(value, displayCurrency, exchangeRate),
    );
    const incurredVnd = toVndAmount(incurred, displayCurrency, exchangeRate);
    setDisplayCurrency(nextCurrency);
    setExchangeRate(nextRate);
    setPlannedCost(mapCostBreakdown(plannedVnd, (value) => toDisplayAmount(value, nextCurrency, nextRate)));
    setActualCost(mapCostBreakdown(actualVnd, (value) => toDisplayAmount(value, nextCurrency, nextRate)));
    setIncurred(toDisplayAmount(incurredVnd, nextCurrency, nextRate));
  };

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
      error('Sales approval is required before pushing costs to Debit Note.');
      return;
    }
    if (varianceSeeds.length === 0) {
      error('There is no positive variance or additional incurred cost to add to debit.');
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
          Cost Workflow → Sales → Debit
        </p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li>
            <strong>Shipment costs</strong> (Planned) and <strong>actual costs by type</strong> are shown side by side;{' '}
            <strong>Additional incurred costs</strong> are recorded separately from the four groups.
          </li>
          <li>
            When preparing Debit, open the <strong>Sales Quotation</strong> for reconciliation; after{' '}
            <strong>Sales confirms</strong> incurred costs / variance, use the button to{' '}
            <strong>push the approved lines</strong> to Debit Note.
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
            Sales Quotation
          </Link>
        ) : (
          <span className="text-[12px] text-slate-400 italic">No sales quotation linked to this shipment</span>
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
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchableSelect
              options={currencyOptions}
              value={displayCurrency}
              onValueChange={handleCurrencyChange}
              placeholder="Currency"
              hideSearch
              hideClearIcon
              className="h-9 w-[96px] rounded-lg px-3 text-[12px]"
            />
            {displayCurrency !== 'VND' && (
              <span className="text-[11px] font-semibold text-slate-500">
                1 {displayCurrency} = {formatCurrency(exchangeRate)} VND
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[12px] font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save Costs'}
            </button>
          </div>
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
              <p className="text-[11px] text-slate-500">Shipment costs — initial plan</p>
            </div>
            {COST_KEYS.map((item) => (
              <div key={`plan_${item.key}`} className="flex items-center justify-between gap-4">
                <span className={clsx('text-[12px] font-bold px-2 py-1 rounded', item.bg, item.text)}>
                  {item.label}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={plannedCost[item.key] ? formatInputCurrency(plannedCost[item.key]) : ''}
                  onChange={(e) =>
                    setPlannedCost((p) => ({ ...p, [item.key]: parseCurrency(e.target.value) }))
                  }
                  className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 text-right text-[13px] font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            ))}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[13px] font-black text-slate-800 uppercase tracking-wide">
                Total Planned (Shipment)
              </span>
              <span className="text-[15px] font-black text-blue-600">
                {formatMoney(sumPlanned, displayCurrency)}{' '}
                <span className="text-[10px] text-blue-400">{displayCurrency}</span>
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2 mb-4">
              <h3 className="text-[14px] font-bold text-slate-800">Actual Costs</h3>
              <p className="text-[11px] text-slate-500">Actual by type + additional incurred costs</p>
            </div>
            {COST_KEYS.map((item) => (
              <div key={`act_${item.key}`} className="flex items-center justify-between gap-4">
                <span className={clsx('text-[12px] font-bold px-2 py-1 rounded', item.bg, item.text)}>
                  {item.label}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={actualCost[item.key] ? formatInputCurrency(actualCost[item.key]) : ''}
                  onChange={(e) =>
                    setActualCost((p) => ({ ...p, [item.key]: parseCurrency(e.target.value) }))
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
                Additional Incurred Cost
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={incurred ? formatInputCurrency(incurred) : ''}
                onChange={(e) => setIncurred(parseCurrency(e.target.value))}
                className="w-32 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50/30 text-right text-[13px] font-bold text-amber-900 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[12px] text-slate-600">
                <span>Subtotal of 4 groups (actual)</span>
                <span className="font-bold tabular-nums">
                  {formatMoney(sumActualCategories, displayCurrency)} {displayCurrency}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px] text-amber-800">
                <span>+ Additional incurred cost</span>
                <span className="font-bold tabular-nums">
                  {formatMoney(sumIncurred, displayCurrency)} {displayCurrency}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[13px] font-black text-slate-800 uppercase tracking-wide">
                  Total Actual
                </span>
                <span
                  className={clsx(
                    'text-[15px] font-black',
                    sumActual > sumPlanned ? 'text-red-600' : 'text-emerald-600',
                  )}
                >
                  {formatMoney(sumActual, displayCurrency)}{' '}
                  <span className="text-[10px] opacity-70">{displayCurrency}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          Sales Confirmation & Debit Note
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
              Sales has confirmed incurred costs / variance
            </span>
            {salesCostApprovedAt && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Recorded at: {new Date(salesCostApprovedAt).toLocaleString('en-US')}
              </p>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              Once checked, positive variance lines and additional incurred costs can be pushed to Debit Note.
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
            Push Approved Costs to Debit Note ({varianceSeeds.length} lines)
          </button>
          {!salesCostApproved && varianceSeeds.length > 0 && (
            <span className="text-[11px] text-amber-700">Sales confirmation is required to unlock.</span>
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
            {formatMoney(variance, displayCurrency)}{' '}
            <span className="text-[12px] font-bold opacity-70">{displayCurrency}</span>
          </p>
        </div>
        {!isRedAlert && <Lock size={32} className="text-emerald-200 opacity-50" />}
        {isRedAlert && <AlertTriangle size={32} className="text-red-300" />}
      </div>
    </div>
  );
};

export default CostControlTab;
