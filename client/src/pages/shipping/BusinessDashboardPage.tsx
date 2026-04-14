import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import {
  DateRangePicker,
  type DateRangePickerRange,
} from '../../components/ui/date-range-picker';
import {
  businessDashboardService,
  type BusinessDashboardData,
} from '../../services/businessDashboardService';

function defaultFilterRange(): DateRangePickerRange {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date(to.getFullYear(), to.getMonth() - 2, 1);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px rgba(0,0,0,.08)',
};

/** Compact currency-style amounts for chart axes (e.g. 11.1M, 2.5B). Values are VND. */
function formatCurrencyCompactEn(value: number): string {
  const v = Number(value);
  if (!Number.isFinite(v) || v === 0) return '0';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(v);
}

const COLOR_TEAL = '#0d9488';
const COLOR_ORANGE = '#ea580c';

type MoneyChartRow = { name: string; value: number };

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex justify-center items-center gap-2 py-1">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
    </div>
  );
}

type MoneyLabelProps = {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  value?: number | string;
};

const MoneyBarLabel: React.FC<MoneyLabelProps> = ({ x, y, width, value }) => {
  const vx = typeof x === 'number' ? x : Number(x);
  const vy = typeof y === 'number' ? y : Number(y);
  const vw = typeof width === 'number' ? width : Number(width);
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(vx) || !Number.isFinite(vy) || !Number.isFinite(vw)) return null;
  return (
    <text
      x={vx + vw / 2}
      y={vy - 6}
      fill="#334155"
      fontSize={10}
      fontWeight={700}
      textAnchor="middle"
    >
      {formatCurrencyCompactEn(num)}
    </text>
  );
};

type CountLabelProps = {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: number | string;
};

const CountBarLabel: React.FC<CountLabelProps> = ({ x, y, width, height, value }) => {
  const vx = typeof x === 'number' ? x : Number(x);
  const vy = typeof y === 'number' ? y : Number(y);
  const vw = typeof width === 'number' ? width : Number(width);
  const vh = typeof height === 'number' ? height : Number(height);
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(vx) || !Number.isFinite(vy) || !Number.isFinite(vw) || !Number.isFinite(vh)) {
    return null;
  }
  const cy = vy + vh / 2 + 4;
  return (
    <text x={vx + vw / 2} y={cy} fill="#fff" fontSize={12} fontWeight={800} textAnchor="middle">
      {String(n)}
    </text>
  );
};

function mapMoneyRows(rows: BusinessDashboardData['salesRevenueByPerson']): MoneyChartRow[] {
  return rows.map((r) => ({ name: r.name, value: r.revenueVnd }));
}

const BusinessDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterRange, setFilterRange] = useState<DateRangePickerRange>(defaultFilterRange);
  const [data, setData] = useState<BusinessDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayName = user?.full_name?.trim() || 'Guest';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const to = filterRange.to ?? filterRange.from;
      const res = await businessDashboardService.getDashboard({
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

  const salesData = useMemo(
    () => (data ? mapMoneyRows(data.salesRevenueByPerson) : []),
    [data],
  );
  const customerData = useMemo(
    () => (data ? mapMoneyRows(data.customerRevenue) : []),
    [data],
  );
  const serviceData = useMemo(
    () => (data ? mapMoneyRows(data.revenueByService) : []),
    [data],
  );
  const statusData = useMemo(
    () =>
      data
        ? data.customersByShipmentStatus.map((r) => ({ name: r.name, count: r.count }))
        : [],
    [data],
  );

  const statusYMax = useMemo(() => {
    const m = statusData.reduce((acc, r) => Math.max(acc, r.count), 0);
    return Math.max(10, Math.ceil(m * 1.15));
  }, [statusData]);

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
            <p className="text-[11px] text-muted-foreground font-semibold mb-0.5">
              Business report
            </p>
            <h1 className="text-lg font-black text-foreground tracking-tight">
              Welcome {displayName}{' '}
              <span className="font-normal" aria-hidden>
                👋
              </span>
            </h1>
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
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold hover:bg-muted disabled:opacity-50 inline-flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : null}
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
            <p className="text-[13px] font-bold text-destructive mb-1">Could not load Business Dashboard</p>
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
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 md:gap-4 pb-8">
          {error && (
            <div className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 font-medium">
              Showing cached data. Refresh failed: {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <div className="mb-1">
                <h2 className="text-[12px] sm:text-[13px] font-bold text-foreground leading-snug">
                  Sales revenue by salesperson (by quotation date range)
                </h2>
              </div>
              <LegendDot color={COLOR_TEAL} label="Total" />
              {salesData.length === 0 ? (
                <p className="text-[13px] text-muted-foreground py-16 text-center">
                  No salesperson revenue in the selected range
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={salesData} margin={{ top: 24, right: 8, left: 4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={72}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCurrencyCompactEn(Number(v))}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v) => [`${formatCurrencyCompactEn(Number(v ?? 0))} VND`, 'Total']}
                    />
                    <Bar dataKey="value" fill={COLOR_TEAL} radius={[6, 6, 0, 0]} maxBarSize={48}>
                      <LabelList dataKey="value" content={<MoneyBarLabel />} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <div className="mb-1">
                <h2 className="text-[12px] sm:text-[13px] font-bold text-foreground leading-snug">
                  Customer revenue
                </h2>
              </div>
              <LegendDot color={COLOR_ORANGE} label="Total" />
              {customerData.length === 0 ? (
                <p className="text-[13px] text-muted-foreground py-16 text-center">
                  No customer revenue in the selected range
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={customerData} margin={{ top: 24, right: 8, left: 4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 8, fontWeight: 600, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-55}
                      textAnchor="end"
                      height={88}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCurrencyCompactEn(Number(v))}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v) => [`${formatCurrencyCompactEn(Number(v ?? 0))} VND`, 'Total']}
                    />
                    <Bar dataKey="value" fill={COLOR_ORANGE} radius={[6, 6, 0, 0]} maxBarSize={44}>
                      <LabelList dataKey="value" content={<MoneyBarLabel />} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <div className="mb-1">
                <h2 className="text-[12px] sm:text-[13px] font-bold text-foreground leading-snug">
                  Revenue by service
                </h2>
              </div>
              <LegendDot color={COLOR_TEAL} label="Total" />
              {serviceData.length === 0 ? (
                <p className="text-[13px] text-muted-foreground py-16 text-center">
                  No service_mode data in the selected range
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={serviceData} margin={{ top: 24, right: 8, left: 4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCurrencyCompactEn(Number(v))}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v) => [`${formatCurrencyCompactEn(Number(v ?? 0))} VND`, 'Total']}
                    />
                    <Bar dataKey="value" fill={COLOR_TEAL} radius={[6, 6, 0, 0]} maxBarSize={56}>
                      <LabelList dataKey="value" content={<MoneyBarLabel />} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <div className="mb-1">
                <h2 className="text-[12px] sm:text-[13px] font-bold text-foreground leading-snug">
                  Number of customers per shipment status
                </h2>
              </div>
              <LegendDot color={COLOR_ORANGE} label="Count" />
              {statusData.length === 0 ? (
                <p className="text-[13px] text-muted-foreground py-16 text-center">
                  No shipments with a customer in the selected created-date range
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={statusData} margin={{ top: 16, right: 8, left: 4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, statusYMax]}
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v) => [String(v ?? 0), 'Count']}
                    />
                    <Bar dataKey="count" fill={COLOR_ORANGE} radius={[6, 6, 0, 0]} maxBarSize={56}>
                      <LabelList dataKey="count" content={<CountBarLabel />} />
                    </Bar>
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

export default BusinessDashboardPage;
