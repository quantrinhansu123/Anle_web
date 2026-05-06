import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { shipmentService } from '../services/shipmentService';
import { parseSeaHouseBlV1 } from './shipments/seaHouseBlPersistence';
import type { TrackingUpdate } from './shipments/bl-tabs/TrackingTab';

function normalizeUpdates(updates: TrackingUpdate[] | undefined): TrackingUpdate[] {
  const rows = Array.isArray(updates) ? updates : [];
  return rows
    .map((u) => ({
      at: String(u.at || ''),
      status: String(u.status || ''),
      location: String(u.location || ''),
      note: String(u.note || ''),
    }))
    .filter((u) => u.at || u.status || u.location || u.note)
    .sort((a, b) => String(a.at).localeCompare(String(b.at)));
}

function fmtTimeLabel(at: string) {
  const s = String(at || '').trim();
  if (!s) return '—';
  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return s;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

const HERO_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDdKvPbAJGZn2K5S-tUtiMqBNTKzkIrrD2MoyD-DLIFL7vGs2vqgiVcABubDvVikka9KMR2bs0sg2Y4xc03rJ7-Z1n1dC4vjxO6ggdELjASUs1SdYsL3cOxsXI6YPe1uR9TGyPk9UhdOb5a-LyWdbvVU04LpVo9mxmqduLZD3zk3PmCK34X6EmTrcpzMb5xLM4M4qL1UvKSQ7dmKrCWCKnt8JGnD4klIbCTjqLq9m2NluyPikWV5yCpXKniz3PldDc6dE_Ziyhy-Cov';

const WATERMARK_LOGO = '/appsheet-brand-logo';

const LinkTrackerPage: React.FC = () => {
  const [sp, setSp] = useSearchParams();
  const initialQ = sp.get('q') || '';

  const [query, setQuery] = useState(initialQ);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [shipment, setShipment] = useState<any | null>(null);
  const [updates, setUpdates] = useState<TrackingUpdate[]>([]);

  const displayCode = useMemo(() => {
    const code = String(shipment?.code || '').trim();
    const master = String(shipment?.master_job_no || '').trim();
    return code || master || (shipment?.id ? String(shipment.id).slice(0, 8) : '');
  }, [shipment]);

  const runSearch = async (q: string) => {
    const trimmed = q.trim();
    setErr(null);
    setShipment(null);
    setUpdates([]);
    if (!trimmed) return;

    setLoading(true);
    try {
      const match = await shipmentService.findShipmentForTracking(trimmed);
      if (!match) {
        setErr('Không tìm thấy đơn theo mã đã nhập.');
        return;
      }
      setShipment(match);

      const blob = await shipmentService.getSeaHouseBl(match.id);
      const parsed = parseSeaHouseBlV1(blob);
      setUpdates(normalizeUpdates(parsed?.tracking?.updates));

      setSp(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('q', trimmed);
          return next;
        },
        { replace: true },
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Không thể tải dữ liệu tracking.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 bg-[#f7f9fb] text-[#191c1e]">
      {/* Hero Section */}
      <section className="relative min-h-[520px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img src={HERO_IMG} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#001e40cc] to-[#001e4099]" />
        </div>

        <div className="relative z-10 w-full max-w-none px-4 md:px-10 text-center pt-8">
          <h1 className="text-[36px] md:text-[44px] font-black tracking-tight text-white mb-8">
            Track Your Shipment
          </h1>

          <div className="max-w-3xl mx-auto">
            <form
              className="bg-white p-2 rounded-xl shadow-2xl flex flex-col md:flex-row gap-2 h-auto md:h-20"
              onSubmit={(e) => {
                e.preventDefault();
                void runSearch(query);
              }}
            >
              <div className="flex-grow flex items-center px-4 gap-3">
                <span className="text-slate-400 text-[18px]">Search</span>
                <input
                  className="w-full border-none focus:ring-0 text-[18px] font-medium text-slate-900 placeholder-slate-400 bg-transparent"
                  placeholder="Enter tracking number (e.g. SCMZJS28042601)"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-[#fd8b00] text-white px-12 py-4 md:py-0 rounded-lg text-[24px] font-bold hover:bg-[#904d00] active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Tracking…' : 'Track Now'}
              </button>
            </form>
            <p className="text-white/70 mt-4 text-[14px] font-medium">
              Tra theo <strong>Shipment code</strong> / <strong>Master job no</strong> / <strong>ID</strong>.
            </p>

            {err ? (
              <div className="mt-4 mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-3 text-[14px] text-red-700 flex items-start gap-2 text-left">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <span className="font-semibold">{err}</span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Recent Shipment Tracking (current result) */}
      <section className="py-14 bg-[#f2f4f6]">
        <div className="w-full max-w-none mx-auto px-4 md:px-10">
          <div className="mb-8 flex justify-between items-end gap-3">
            <div>
              <h2 className="text-[30px] font-black tracking-tight text-[#001e40]">Recent Shipments</h2>
              <p className="text-[16px] text-slate-600">View the status of your tracked package.</p>
            </div>
            {shipment?.id ? (
              <Link
                to={`/shipments/sop/${shipment.id}`}
                className="text-[#904d00] font-semibold text-[14px] hover:underline"
              >
                View SOP →
              </Link>
            ) : (
              <span className="text-slate-400 text-[14px]">—</span>
            )}
          </div>

          <div className="relative bg-white rounded-xl shadow-sm border border-slate-200/70 overflow-hidden">
            <div className="p-6 bg-[#001e40]/5 flex flex-wrap gap-6 items-center justify-between border-b border-slate-200/70">
              <div>
                <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  Tracking Number
                </span>
                <div className="text-[24px] font-black text-[#001e40]">
                  {displayCode || '—'}
                </div>
              </div>
              <div className="flex gap-10 flex-wrap">
                <div>
                  <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">From</span>
                  <div className="text-[14px] font-medium text-slate-800">{shipment?.pol || '—'}</div>
                </div>
                <div>
                  <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">To</span>
                  <div className="text-[14px] font-medium text-slate-800">{shipment?.pod || '—'}</div>
                </div>
              </div>
              <div className="bg-[#fd8b00]/10 text-[#904d00] px-4 py-2 rounded-full text-[14px] font-bold">
                {updates.length ? (updates[updates.length - 1]?.status || 'In Transit') : '—'}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-8 p-8">
              {/* Left: Tracking */}
              <div className="min-w-0">
                {!shipment ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center text-slate-600">
                    Nhập mã đơn ở phía trên để xem tracking.
                  </div>
                ) : updates.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center text-slate-600">
                    Chưa có tracking update. Vào Sea House B/L → tab Tracking để thêm mốc.
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />
                    {updates.map((u, idx) => {
                      const isLast = idx === updates.length - 1;
                      return (
                        <div key={`${u.at}-${idx}`} className="relative flex gap-8 mb-10 last:mb-0">
                          <div
                            className={[
                              'z-10 w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0',
                              isLast ? 'bg-[#fd8b00] shadow-lg shadow-orange-200' : 'bg-[#001e40]',
                            ].join(' ')}
                          >
                            <span className="text-[14px] font-black">✓</span>
                          </div>
                          <div className="min-w-0">
                            <div
                              className={[
                                'text-[24px] font-bold',
                                isLast ? 'text-[#fd8b00]' : 'text-[#001e40]',
                              ].join(' ')}
                            >
                              {u.status || 'Update'}
                            </div>
                            <div className="text-[16px] text-slate-600">{fmtTimeLabel(u.at)}</div>
                            {u.location ? (
                              <div className="text-[14px] text-slate-500 mt-1">{u.location}</div>
                            ) : null}
                            {u.note ? (
                              <div className="text-[14px] text-slate-700 mt-2 whitespace-pre-wrap break-words">
                                {u.note}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Logo */}
              <div className="hidden lg:flex items-center justify-center">
                <img
                  src={WATERMARK_LOGO}
                  alt=""
                  className="w-full max-w-[380px] opacity-70"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LinkTrackerPage;

