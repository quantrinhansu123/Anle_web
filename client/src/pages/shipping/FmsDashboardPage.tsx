import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  DollarSign,
  Wallet,
  Users,
  TrendingUp,
  Package,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  fmsDashboardService,
  type FmsDashboardData,
} from '../../services/fmsDashboardService';
import {
  DateRangePicker,
  type DateRangePickerRange,
} from '../../components/ui/date-range-picker';

function defaultFmsFilterRange(): DateRangePickerRange {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date(to.getFullYear(), to.getMonth() - 11, 1);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

const formatVnd = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const formatVndShort = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px rgba(0,0,0,.08)',
};

const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  feasibility_checked: 'Feasibility checked',
  planned: 'Planned',
  docs_ready: 'Docs ready',
  booked: 'Booked',
  customs_ready: 'Customs ready',
  in_transit: 'In transit',
  delivered: 'Delivered',
  cost_closed: 'Cost closed',
  cancelled: 'Cancelled',
};

const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  draft: '#94a3b8',
  feasibility_checked: '#6366f1',
  planned: '#8b5cf6',
  docs_ready: '#0ea5e9',
  booked: '#f59e0b',
  customs_ready: '#06b6d4',
  in_transit: '#3b82f6',
  delivered: '#10b981',
  cost_closed: '#16a34a',
  cancelled: '#ef4444',
};

const FALLBACK_CHART_COLORS = [
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#10b981',
  '#64748b',
];

function formatStatusLabel(status: string): string {
  if (SHIPMENT_STATUS_LABELS[status]) return SHIPMENT_STATUS_LABELS[status];
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const FmsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<FmsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRange, setFilterRange] = useState<DateRangePickerRange>(defaultFmsFilterRange);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const to = filterRange.to ?? filterRange.from;
      const res = await fmsDashboardService.getDashboard({
        from: filterRange.from,
        to,
      });
      setData(res);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [filterRange]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = data?.summary;
  const monthlySeries = data?.monthly ?? [];

  const shipmentPieData = useMemo(() => {
    const rows = data?.shipmentStatus ?? [];
    return rows.map((r, i) => ({
      key: r.status,
      name: formatStatusLabel(r.status),
      value: r.count,
      color: SHIPMENT_STATUS_COLORS[r.status] ?? FALLBACK_CHART_COLORS[i % FALLBACK_CHART_COLORS.length],
    }));
  }, [data?.shipmentStatus]);

  const serviceChartData = useMemo(() => {
    const rows = data?.revenueByService ?? [];
    return rows.map((s) => ({
      ...s,
      nameShort: s.name.length > 14 ? `${s.name.slice(0, 12)}…` : s.name,
    }));
  }, [data?.revenueByService]);

  const statCards = useMemo(() => {
    if (!summary) return [];
    const gross = summary.grossProfitVnd;
    return [
      {
        label: 'Total revenue (VND)',
        value: formatVnd(summary.totalRevenueVnd),
        icon: <DollarSign size={18} />,
        color: 'text-emerald-600',
        bg: 'bg-emerald-500/10',
      },
      {
        label: 'Total cost',
        value: formatVnd(summary.totalCostVnd),
        icon: <Wallet size={18} />,
        color: 'text-amber-600',
        bg: 'bg-amber-500/10',
      },
      {
        label: 'Number of customers',
        value: String(summary.customerCount),
        icon: <Users size={18} />,
        color: 'text-blue-600',
        bg: 'bg-blue-500/10',
      },
      {
        label: 'Gross profit',
        value: formatVnd(gross),
        icon: <TrendingUp size={18} />,
        color: gross >= 0 ? 'text-violet-600' : 'text-red-600',
        bg: gross >= 0 ? 'bg-violet-500/10' : 'bg-red-500/10',
      },
      {
        label: 'Total shipments',
        value: String(summary.totalShipments),
        icon: <Package size={18} />,
        color: 'text-primary',
        bg: 'bg-primary/10',
      },
    ];
  }, [summary]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col min-h-0 -mt-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/shipping')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm"
          >
            <ChevronLeft size={16} />
            Back
          </button>
          <div>
            <h1 className="text-lg font-black text-foreground tracking-tight">Dashboard FMS</h1>
            <p className="text-[11px] text-muted-foreground font-medium">
              Freight management summary (live data)
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <div className="[&_button]:h-9 [&_button]:min-h-0 [&_button]:min-w-0 [&_button]:px-3 [&_button]:py-2 [&_button]:text-[12px] [&_button]:rounded-lg [&_button]:font-bold">
            <DateRangePicker
              key={`${filterRange.from.getTime()}-${filterRange.to?.getTime() ?? ''}`}
              initialDateFrom={filterRange.from}
              initialDateTo={filterRange.to}
              align="end"
              locale="en-US"
              showCompare={false}
              onUpdate={({ range }) =>
                setFilterRange({ from: range.from, to: range.to ?? range.from })
              }
            />
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold hover:bg-muted disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <Loader2 className="animate-spin text-primary" size={36} />
          <p className="text-[13px] font-semibold">Loading dashboard…</p>
        </div>
      )}

      {error && !data && (
        <div className="bg-white rounded-2xl border border-destructive/30 shadow-sm p-6 flex gap-3 items-start">
          <AlertCircle className="text-destructive shrink-0 mt-0.5" size={20} />
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-destructive mb-1">Could not load FMS dashboard</p>
            <p className="text-[12px] text-muted-foreground whitespace-pre-wrap break-words">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 px-3 py-1.5 rounded-lg bg-primary text-white text-[12px] font-bold"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {data && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-8">
          {error && (
            <div className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 font-medium">
              Showing cached data. Refresh failed: {error}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {statCards.map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-2xl border border-border shadow-sm p-4 md:p-5 flex items-center gap-3 md:gap-4"
              >
                <div
                  className={clsx(
                    'w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0',
                    item.bg,
                    item.color,
                  )}
                >
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-wide leading-tight mb-1">
                    {item.label}
                  </p>
                  <p
                    className={clsx(
                      'text-sm md:text-lg xl:text-xl font-black tabular-nums break-all sm:break-normal sm:truncate',
                      item.color,
                    )}
                    title={item.value}
                  >
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={15} className="text-primary" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">
                  Cargo volume by month
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3 font-medium">
                Sum of shipment quantity by month
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlySeries} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fmsVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={56}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [
                      `${Number(v ?? 0).toLocaleString('en-US')} units`,
                      'Volume',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="volumeTeu"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#fmsVolume)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <LineChartIcon size={15} className="text-primary" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">
                  Revenue by month
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3 font-medium">VND (quotation lines)</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlySeries} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={56}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatVndShort(Number(v))}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [formatVnd(Number(v ?? 0)), 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenueVnd"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon size={15} className="text-primary" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">
                  Shipment status
                </span>
              </div>
              {shipmentPieData.length === 0 ? (
                <p className="text-[13px] text-muted-foreground py-8 text-center">No shipments yet</p>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="w-full max-w-[200px] shrink-0 mx-auto md:mx-0">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={shipmentPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={80}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {shipmentPieData.map((entry) => (
                            <Cell key={entry.key} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 flex-1 w-full">
                    {shipmentPieData.map((d) => (
                      <div key={d.key} className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: d.color }}
                        />
                        <span className="text-[11px] text-muted-foreground font-medium truncate flex-1">
                          {d.name}
                        </span>
                        <span className="text-[11px] font-bold text-foreground tabular-nums">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={15} className="text-primary" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">
                  Revenue by service
                </span>
              </div>
              {serviceChartData.length === 0 ? (
                <p className="text-[13px] text-muted-foreground py-8 text-center">
                  No sales / service mode data yet
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={serviceChartData}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
                    barSize={22}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatVndShort(Number(v))}
                    />
                    <YAxis
                      type="category"
                      dataKey="nameShort"
                      width={100}
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v) => [formatVnd(Number(v ?? 0)), 'Revenue']}
                      labelFormatter={(_, payload) => {
                        const p = payload?.[0]?.payload as { name?: string } | undefined;
                        return p?.name ?? '';
                      }}
                    />
                    <Bar dataKey="revenueVnd" radius={[0, 6, 6, 0]} fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FmsDashboardPage;
