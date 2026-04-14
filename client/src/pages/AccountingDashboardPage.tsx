import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Filter,
  Layers,
  Star,
  ChevronRight,
  RefreshCcw,
  Search,
  Link2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useToastContext } from '../contexts/ToastContext';
import { accountingDashboardService } from '../services/accountingDashboardService';
import type {
  AccountingDashboardBankCard,
  AccountingDashboardChartBar,
  AccountingDashboardMetric,
  AccountingDashboardSummary,
} from './accounting-dashboard/types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';

function formatMoney(n: number): string {
  return (
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) + ' VND'
  );
}

const METRIC_LABELS: Record<string, string> = {
  draft_validate: 'Invoices to validate',
  unpaid: 'Unpaid invoices',
  overdue: 'Overdue invoices',
  partial_review: 'To review (partially paid)',
  vendor_draft_validate: 'Bills to validate',
  vendor_to_pay: 'Bills to pay',
  vendor_overdue: 'Overdue bills',
  misc_draft_expenses: 'Draft expenses',
  misc_submitted: 'Submitted / in progress expenses',
  cash_unpaid_advances: 'Unpaid salary advances',
};

function metricLabel(m: AccountingDashboardMetric): string {
  return METRIC_LABELS[m.key] ?? m.key;
}

function chartLabelMonth(ym: string): string {
  try {
    return format(parseISO(`${ym}-01`), 'MMM yyyy', { locale: enUS });
  } catch {
    return ym;
  }
}

function MiniBarChart({ data }: { data: AccountingDashboardChartBar[] }) {
  const rows = data.map((d) => ({ ...d, name: chartLabelMonth(d.label) }));
  return (
    <div className="h-[100px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => [formatMoney(Number(value)), '']}
            contentStyle={{ borderRadius: 10, fontSize: 12 }}
          />
          <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniLineChart({ values }: { values: number[] }) {
  const rows = values.map((value, i) => ({ i: String(i + 1), value }));
  return (
    <div className="h-[88px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="i" hide />
          <Tooltip formatter={(value) => [formatMoney(Number(value)), '']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
          <Line type="monotone" dataKey="value" stroke="#94a3b8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MetricsList({ items }: { items: AccountingDashboardMetric[] }) {
  return (
    <ul className="space-y-2 text-[13px] flex-1 min-h-0">
      {items.map((m) => (
        <li key={m.key} className="flex justify-between gap-2 border-b border-border/50 pb-2 last:border-0">
          <span className="text-muted-foreground truncate">
            <span className="font-bold text-foreground">{m.count}</span> {metricLabel(m)}
          </span>
          <span className="font-bold tabular-nums shrink-0">{formatMoney(m.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

const AccountingDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { info, error } = useToastContext();
  const [data, setData] = useState<AccountingDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const s = await accountingDashboardService.getSummary();
      setData(s);
    } catch (e) {
      console.error(e);
      error(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void load();
  }, [load]);

  const stub = (msg: string) => () => info(msg);

  const cardCount = useMemo(() => {
    if (!data) return 6;
    return 3 + data.bankAccounts.length + 1;
  }, [data]);

  return (
    <div className="animate-in fade-in duration-300 w-full flex-1 flex flex-col gap-4 pb-8 -mt-2">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/finance')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0 mt-0.5"
          >
            <ChevronLeft size={16} />
            Back
          </button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Accounting dashboard</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">Invoices, payables, and cash flow at a glance</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Search…"
              className="w-full pl-10 pr-24 py-2 rounded-xl border border-border bg-white text-[13px]"
              readOnly
              onFocus={stub('Search is coming soon')}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              Favorites
            </span>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="p-2 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted"
            title="Refresh"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl border border-border px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={stub('Filters: coming soon')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold text-muted-foreground hover:bg-muted"
        >
          <Filter size={14} />
          Filters
        </button>
        <button
          type="button"
          onClick={stub('Group by: coming soon')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold text-muted-foreground hover:bg-muted"
        >
          <Layers size={14} />
          Group by
        </button>
        <button
          type="button"
          onClick={stub('Added to favorites')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold text-muted-foreground hover:bg-muted"
        >
          <Star size={14} />
          Favorites
        </button>
        <div className="ml-auto flex items-center gap-1 text-[12px] font-bold text-slate-500">
          <span>
            1-{cardCount} / {cardCount}
          </span>
          <button type="button" className="p-1 rounded opacity-40 cursor-not-allowed" disabled>
            <ChevronLeft size={16} />
          </button>
          <button type="button" className="p-1 rounded opacity-40 cursor-not-allowed" disabled>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="py-24 text-center text-muted-foreground animate-pulse">Loading…</div>
      ) : !data ? (
        <div className="py-24 text-center text-muted-foreground">No data</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <DashboardCard
            title="Customer invoices"
            primary={{ label: 'NEW INVOICE', onClick: () => navigate('/financials/invoicing') }}
            secondary={{ label: 'Invoice list', onClick: () => navigate('/financials/invoices') }}
          >
            <MetricsList items={data.customerInvoices.metrics} />
            <MiniBarChart data={data.customerInvoices.chartBars} />
          </DashboardCard>

          <DashboardCard
            title="Vendor bills"
            primary={{ label: 'UPLOAD', onClick: stub('Upload: coming soon') }}
            secondary={{ label: 'Create manually', onClick: () => navigate('/financials/purchasing') }}
          >
            <MetricsList items={data.vendorBills.metrics} />
            <MiniBarChart data={data.vendorBills.chartBars} />
          </DashboardCard>

          <DashboardCard
            title="Miscellaneous"
            primary={{ label: 'NEW ENTRY', onClick: () => navigate('/financials/expenses') }}
          >
            <MetricsList items={data.miscellaneous.metrics} />
            <MiniBarChart data={data.miscellaneous.chartBars} />
          </DashboardCard>

          {data.bankAccounts.map((b) => (
            <BankCard key={b.id} bank={b} onConnect={stub('Bank connection: coming soon')} />
          ))}

          <DashboardCard
            title="Cash"
            primary={{ label: 'NEW TRANSACTION', onClick: () => navigate('/financials/advances') }}
          >
            <MetricsList items={data.cash.metrics} />
            <MiniLineChart values={data.cash.sparkline} />
          </DashboardCard>
        </div>
      )}
    </div>
  );
};

function DashboardCard({
  title,
  primary,
  secondary,
  children,
}: {
  title: string;
  primary: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-4 flex flex-col min-h-[320px]">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h2 className="text-[15px] font-black text-foreground leading-tight">{title}</h2>
        <button
          type="button"
          onClick={primary.onClick}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-black tracking-wide hover:bg-primary/90"
        >
          {primary.label}
        </button>
      </div>
      {secondary && (
        <button
          type="button"
          onClick={secondary.onClick}
          className="text-left text-[12px] font-bold text-primary hover:underline mb-2 -mt-1"
        >
          {secondary.label}
        </button>
      )}
      <div className="flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  );
}

function BankCard({
  bank,
  onConnect,
}: {
  bank: AccountingDashboardBankCard;
  onConnect: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-4 flex flex-col min-h-[280px]">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <h2 className="text-[15px] font-black text-foreground leading-tight">{bank.displayName}</h2>
          {bank.subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{bank.subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onConnect}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-black tracking-wide hover:bg-primary/90 flex items-center gap-1"
        >
          <Link2 size={12} />
          CONNECT
        </button>
      </div>
      <p className="text-[12px] text-muted-foreground mt-2">Unpaid in / out</p>
      <p className="text-lg font-black tabular-nums">{formatMoney(bank.unpaidTotal)}</p>
      <MiniLineChart values={bank.sparkline} />
    </div>
  );
}

export default AccountingDashboardPage;
