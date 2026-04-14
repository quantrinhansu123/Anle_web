import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { BalanceSheetNode } from './balanceSheetMock';
import { useToastContext } from '../../contexts/ToastContext';
import { PROFIT_LOSS_MOCK } from './profitLossMock';

function fmtMoney(n: number | null): string {
  if (n === null) return '—';
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)} VND`;
}

function visibleRows(
  nodes: BalanceSheetNode[],
  expanded: Set<string>,
  depth = 0,
): { node: BalanceSheetNode; depth: number }[] {
  const out: { node: BalanceSheetNode; depth: number }[] = [];
  for (const n of nodes) {
    out.push({ node: n, depth });
    if (n.children?.length && expanded.has(n.id)) {
      out.push(...visibleRows(n.children, expanded, depth + 1));
    }
  }
  return out;
}

const FISCAL_YEARS = [2024, 2025, 2026, 2027, 2028];

const ProfitLossPage: React.FC = () => {
  const navigate = useNavigate();
  const { info } = useToastContext();
  const [fiscalYear, setFiscalYear] = useState(2026);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const rows = useMemo(() => visibleRows(PROFIT_LOSS_MOCK, expanded), [expanded]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="animate-in fade-in duration-300 w-full flex-1 flex flex-col min-h-0 -mt-2 bg-muted/30">
      <div className="flex flex-col gap-4 px-4 md:px-6 py-4 md:py-6 w-full max-w-none flex-1 min-h-0">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4 md:p-5 shrink-0 space-y-4 w-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-3 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/finance')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-[11px] font-bold bg-white shrink-0"
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
              </div>
              <h1 className="text-lg md:text-xl font-black text-foreground tracking-tight font-inter">
                Profit and loss
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => info('PDF export will be available when the reporting API is connected.')}
                  className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 shadow-sm"
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => info('XLSX export will be available when the reporting API is connected.')}
                  className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 shadow-sm"
                >
                  XLSX
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-[11px] md:text-[12px] text-muted-foreground min-w-0 md:max-w-xl md:text-right md:items-end">
              <div className="flex flex-wrap gap-x-4 gap-y-2 md:justify-end">
                <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-foreground">
                  <CalendarDays size={14} className="shrink-0 opacity-70" />
                  <span className="whitespace-nowrap">Year</span>
                  <select
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(Number(e.target.value))}
                    className="rounded border border-border bg-white px-2 py-0.5 text-[11px] font-medium text-foreground"
                  >
                    {FISCAL_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 md:justify-end items-start">
                <span className="inline-flex items-center gap-1.5">
                  <BarChart2 size={14} className="shrink-0 opacity-70" />
                  <span>Comparison: None</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen size={14} className="shrink-0 opacity-70" />
                  <span>Journal</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 md:justify-end">
                <span className="inline-flex items-start gap-1.5 text-left md:text-right">
                  <Filter size={14} className="shrink-0 opacity-70 mt-0.5" />
                  <span>Options: Exclude entries marked non-reporting; posted entries only</span>
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <FileText size={14} className="shrink-0 opacity-70" />
                <span className="font-medium text-foreground/90">Report: Business results (B02-DN)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 w-full min-w-0 flex flex-col">
          <div className="mx-auto w-full max-w-5xl flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="px-4 py-3 border-b border-border text-right text-[12px] text-muted-foreground shrink-0">
              Fiscal year {fiscalYear}
            </div>
            <div className="flex-1 overflow-auto min-h-0">
              <table className="w-full border-collapse text-[13px] min-w-[560px]">
                <thead className="sticky top-0 z-10 bg-white border-b border-border">
                  <tr className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                    <th className="px-4 py-3.5 w-[52%]">Line item</th>
                    <th className="px-4 py-3.5 w-[14%] text-center whitespace-nowrap">Code</th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap">{fiscalYear} balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ node: n, depth }) => {
                    const hasKids = Boolean(n.children?.length);
                    const isOpen = expanded.has(n.id);
                    const pad = 12 + depth * 18;
                    return (
                      <tr
                        key={n.id}
                        className={clsx(
                          'border-b border-border/50 hover:bg-slate-50/60',
                          n.section && 'bg-slate-100/90',
                        )}
                      >
                        <td
                          className={clsx(
                            'px-4 py-3 align-middle',
                            (n.section || hasKids) && 'font-bold text-foreground',
                            !n.section && !hasKids && 'font-normal text-slate-800',
                          )}
                          style={{ paddingLeft: pad }}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            {hasKids ? (
                              <button
                                type="button"
                                onClick={() => toggle(n.id)}
                                className="p-0.5 rounded hover:bg-muted text-muted-foreground shrink-0"
                                aria-expanded={isOpen}
                                aria-label={isOpen ? 'Collapse' : 'Expand'}
                              >
                                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            ) : (
                              <span className="w-[22px] shrink-0" aria-hidden />
                            )}
                            <span className="wrap-break-word">{n.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums text-muted-foreground font-medium">
                          {n.code ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-800 whitespace-nowrap">
                          {fmtMoney(n.balance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center shrink-0 pb-2">
          Sample data for layout only — will be replaced by live general-ledger data.
        </p>
      </div>
    </div>
  );
};

export default ProfitLossPage;
