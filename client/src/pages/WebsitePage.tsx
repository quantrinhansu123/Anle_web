import React, { useMemo, useState } from 'react';
import {
  Anchor,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Container,
  Globe,
  MapPin,
  Search,
  ShipWheel,
  Warehouse,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { shipmentService } from '../services/shipmentService';
import { shipmentTrackingService, type ShipmentTrackingEvent } from '../services/shipmentTrackingService';
import type { Shipment } from './shipments/types';
import { useToastContext } from '../contexts/ToastContext';

type TrackingEvent = {
  time: string;
  title: string;
  note: string;
  location: string;
};

const SERVICE_ITEMS = [
  {
    title: 'Vận tải biển quốc tế',
    description: 'FCL/LCL tuyến châu Á, châu Âu, Mỹ với lịch tàu cố định hàng tuần.',
    icon: Anchor,
  },
  {
    title: 'Khai thác cảng & CFS',
    description: 'Nâng hạ container, đóng/rút hàng, quản lý bãi và kiểm đếm tại cảng.',
    icon: Container,
  },
  {
    title: 'Kho bãi logistics',
    description: 'Kho ngoại quan, kho thường, phân phối last-mile và vận hành tồn kho.',
    icon: Warehouse,
  },
  {
    title: 'Đại lý tàu & thông quan',
    description: 'Dịch vụ chứng từ, hải quan, CO/CQ và tư vấn compliance xuất nhập khẩu.',
    icon: ShipWheel,
  },
];

const VESSEL_SCHEDULE = [
  { vessel: 'ANLE MERIDIAN', route: 'HCM - Singapore - Rotterdam', etd: '24/04/2026', eta: '16/05/2026', status: 'Open booking' },
  { vessel: 'ANLE PACIFIC', route: 'Hải Phòng - Busan - LA', etd: '26/04/2026', eta: '13/05/2026', status: 'Closing soon' },
  { vessel: 'ANLE NIPPON', route: 'Đà Nẵng - Tokyo - Osaka', etd: '28/04/2026', eta: '04/05/2026', status: 'Open booking' },
];

const MARITIME_BG_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="45%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b3a53"/>
      <stop offset="100%" stop-color="#082f49"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#sky)"/>
  <rect y="560" width="1600" height="340" fill="url(#sea)" opacity="0.95"/>
  <rect y="520" width="1600" height="45" fill="#1f2937" opacity="0.8"/>
  <g fill="#0f172a" opacity="0.75">
    <rect x="130" y="380" width="28" height="160"/>
    <rect x="430" y="360" width="26" height="180"/>
    <rect x="760" y="370" width="26" height="170"/>
    <rect x="1080" y="350" width="30" height="190"/>
    <rect x="1340" y="365" width="24" height="175"/>
  </g>
  <g stroke="#111827" stroke-width="12" fill="none" opacity="0.85">
    <path d="M145 390 L250 320 L320 390" />
    <path d="M443 375 L560 300 L640 375" />
    <path d="M773 385 L900 305 L980 385" />
    <path d="M1096 370 L1235 285 L1325 370" />
    <path d="M1352 385 L1450 325 L1515 385" />
  </g>
  <g fill="#1e293b" opacity="0.82">
    <rect x="280" y="520" width="290" height="42" rx="5" />
    <rect x="615" y="520" width="245" height="42" rx="5" />
    <rect x="920" y="520" width="330" height="42" rx="5" />
  </g>
  <g fill="#334155" opacity="0.65">
    <rect x="1020" y="600" width="250" height="28" rx="4"/>
    <rect x="1045" y="628" width="220" height="26" rx="4"/>
    <rect x="1080" y="654" width="180" height="24" rx="4"/>
  </g>
  <ellipse cx="1180" cy="712" rx="360" ry="34" fill="#94a3b8" opacity="0.12"/>
</svg>
`)}`;

const mapShipmentStatus = (status?: string): string => {
  switch (status) {
    case 'draft':
      return 'Mới tạo';
    case 'feasibility_checked':
    case 'planned':
      return 'Đang xác nhận';
    case 'docs_ready':
      return 'Đã sẵn sàng chứng từ';
    case 'booked':
      return 'Đã booking';
    case 'customs_ready':
      return 'Sẵn sàng thông quan';
    case 'in_transit':
      return 'Đang vận chuyển';
    case 'delivered':
      return 'Đã giao hàng';
    case 'cost_closed':
      return 'Đã quyết toán';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return 'Đang xử lý';
  }
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toTrackingEvent = (event: ShipmentTrackingEvent): TrackingEvent => ({
  time: formatDateTime(event.created_at),
  title: event.title || 'Cập nhật vận chuyển',
  note: event.description || 'Không có ghi chú chi tiết.',
  location: event.location || 'N/A',
});

const toShipmentFallbackEvents = (shipment: Shipment): TrackingEvent[] => {
  const items: TrackingEvent[] = [];
  if (shipment.created_at) {
    items.push({
      time: formatDateTime(shipment.created_at),
      title: 'Job được tạo',
      note: `Job ${shipment.code || shipment.master_job_no || shipment.id} đã được tạo trong Job Management.`,
      location: shipment.pol || 'N/A',
    });
  }
  if (shipment.etd) {
    items.push({
      time: formatDateTime(shipment.etd),
      title: 'ETD kế hoạch',
      note: 'Thời gian khởi hành dự kiến từ hệ thống job.',
      location: shipment.pol || 'N/A',
    });
  }
  if (shipment.eta) {
    items.push({
      time: formatDateTime(shipment.eta),
      title: 'ETA kế hoạch',
      note: 'Thời gian đến dự kiến theo lịch job.',
      location: shipment.pod || 'N/A',
    });
  }
  if (shipment.status) {
    items.push({
      time: formatDateTime(shipment.actual_eta || shipment.eta || shipment.created_at),
      title: mapShipmentStatus(shipment.status),
      note: 'Trạng thái hiện tại đồng bộ từ Job Management.',
      location: shipment.pod || shipment.pol || 'N/A',
    });
  }
  return items.reverse();
};

const WebsitePage: React.FC = () => {
  const { error } = useToastContext();
  const [trackingCode, setTrackingCode] = useState('');
  const [isTrackingVisible, setTrackingVisible] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'progress' | 'detail'>('progress');
  const [isTrackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [trackedShipment, setTrackedShipment] = useState<Shipment | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('N/A');

  const latestEvent = useMemo(
    () => (trackingEvents.length > 0 ? trackingEvents[0] : null),
    [trackingEvents],
  );

  const handleTrackShipment = async () => {
    if (!trackingCode.trim()) {
      setTrackingError('Vui lòng nhập mã tracking (Job code / Master Job / Master BL).');
      setTrackingVisible(false);
      return;
    }

    try {
      setTrackingLoading(true);
      setTrackingError(null);
      const shipment = await shipmentService.findShipmentForTracking(trackingCode);
      if (!shipment) {
        setTrackingVisible(false);
        setTrackingError('Không tìm thấy dữ liệu Job Management với mã đã nhập.');
        return;
      }

      setTrackedShipment(shipment);
      const rawEvents = await shipmentTrackingService.getTrackingEvents(shipment.id);
      const normalizedEvents = rawEvents.map(toTrackingEvent);
      const resolvedEvents = normalizedEvents.length > 0 ? normalizedEvents : toShipmentFallbackEvents(shipment);

      setTrackingEvents(resolvedEvents);
      setLastUpdatedAt(
        formatDateTime(rawEvents[0]?.created_at || shipment.actual_eta || shipment.updated_at || shipment.created_at),
      );
      setTrackingVisible(true);
    } catch (err: any) {
      const message = err?.message || 'Không thể tải dữ liệu tracking từ Job Management.';
      setTrackingVisible(false);
      setTrackingError(message);
      error(message);
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col gap-4 -mt-2 min-h-0">
      <div className="relative bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.12] pointer-events-none"
          style={{ backgroundImage: `url("${MARITIME_BG_SVG}")` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/80 to-white/90 pointer-events-none" />
        <div className="relative">
        <header className="border-b border-border bg-slate-50/70 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/90 text-slate-900 font-black flex items-center justify-center">AP</div>
            <div>
              <p className="text-[16px] font-black tracking-tight text-slate-900">ANLE Port Logistics</p>
              <p className="text-[11px] font-semibold text-slate-500">Integrated Maritime & Port Solutions</p>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-[12px] font-bold text-slate-700">
            <button className="hover:text-primary transition-colors">Giải pháp cảng</button>
            <button className="hover:text-primary transition-colors">Lịch tàu</button>
            <button className="hover:text-primary transition-colors">Theo dõi lô hàng</button>
            <button className="hover:text-primary transition-colors">Liên hệ</button>
          </nav>
        </header>

        <section className="px-5 py-6 grid grid-cols-1 xl:grid-cols-3 gap-4 border-b border-border">
          <div className="xl:col-span-2 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 text-white p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/90 font-bold">Maritime Corporate Website</p>
            <h1 className="text-[26px] font-black leading-tight mt-2">
              Cổng thông tin vận tải biển và dịch vụ cảng chuẩn doanh nghiệp logistics
            </h1>
            <p className="text-[13px] text-slate-200 mt-3 max-w-3xl">
              Giao diện mô phỏng website công ty cảng biển: thể hiện năng lực tuyến vận tải, lịch tàu, và tra cứu hành trình lô hàng theo thời gian thực.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <button className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-900 text-[12px] font-black hover:bg-cyan-300 transition-colors">
                Yêu cầu báo giá
              </button>
              <button className="px-4 py-2 rounded-xl border border-white/20 text-white text-[12px] font-bold hover:bg-white/10 transition-colors">
                Xem năng lực dịch vụ
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-primary font-black uppercase tracking-wide">
              <MapPin size={13} />
              Cảng khai thác chính
            </div>
            <div className="mt-3 space-y-2 text-[12px] text-slate-700">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-semibold">Cát Lái Terminal</span>
                <span className="text-slate-500">HCM</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-semibold">Lạch Huyện Port</span>
                <span className="text-slate-500">Hải Phòng</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-semibold">Tiên Sa Port</span>
                <span className="text-slate-500">Đà Nẵng</span>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 border-b border-border">
          {SERVICE_ITEMS.map((service) => (
            <article key={service.title} className="rounded-xl border border-border bg-white p-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <service.icon size={18} />
              </div>
              <h3 className="text-[14px] font-black text-slate-900 mt-3">{service.title}</h3>
              <p className="text-[12px] text-slate-600 mt-1 leading-relaxed">{service.description}</p>
            </article>
          ))}
        </section>

        <section className="px-5 py-5 grid grid-cols-1 xl:grid-cols-3 gap-4 border-b border-border">
          <div className="xl:col-span-2 rounded-2xl border border-border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px] font-black text-slate-800 uppercase tracking-wide">
                <CalendarDays size={14} className="text-primary" />
                Lịch tàu tuần này
              </div>
              <button className="text-[11px] font-bold text-primary hover:underline">Xem đầy đủ</button>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[640px] text-[12px]">
                <thead className="bg-slate-50/60 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold uppercase">Vessel</th>
                    <th className="px-3 py-2 text-left font-bold uppercase">Route</th>
                    <th className="px-3 py-2 text-left font-bold uppercase">ETD</th>
                    <th className="px-3 py-2 text-left font-bold uppercase">ETA</th>
                    <th className="px-3 py-2 text-left font-bold uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {VESSEL_SCHEDULE.map((row) => (
                    <tr key={row.vessel} className="border-t border-border hover:bg-slate-50/50">
                      <td className="px-3 py-2.5 font-bold text-slate-900">{row.vessel}</td>
                      <td className="px-3 py-2.5 text-slate-700">{row.route}</td>
                      <td className="px-3 py-2.5 text-slate-700">{row.etd}</td>
                      <td className="px-3 py-2.5 text-slate-700">{row.eta}</td>
                      <td className="px-3 py-2.5">
                        <span className={clsx('px-2 py-0.5 rounded-full text-[11px] font-bold', row.status === 'Closing soon' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-slate-50/40 p-4">
            <div className="text-[11px] font-black uppercase tracking-wide text-primary">Global Coverage</div>
            <h3 className="text-[18px] font-black text-slate-900 mt-1">120+ điểm kết nối cảng</h3>
            <p className="text-[12px] text-slate-600 mt-2 leading-relaxed">
              Kết nối mạng lưới đại lý tại APAC, EU, US để kiểm soát lịch tàu và tối ưu transit time cho khách hàng xuất nhập khẩu.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-white border border-border p-2">
                <p className="font-black text-slate-900">98%</p>
                <p className="text-slate-500">On-time departure</p>
              </div>
              <div className="rounded-lg bg-white border border-border p-2">
                <p className="font-black text-slate-900">24/7</p>
                <p className="text-slate-500">Ops support</p>
              </div>
              <div className="rounded-lg bg-white border border-border p-2">
                <p className="font-black text-slate-900">35k+</p>
                <p className="text-slate-500">TEU/year</p>
              </div>
              <div className="rounded-lg bg-white border border-border p-2">
                <p className="font-black text-slate-900">AEO</p>
                <p className="text-slate-500">Compliant</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-5 bg-white">
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-border flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-primary">Tracking Portal</div>
                <h2 className="text-[15px] font-black text-slate-900 mt-0.5">Theo dõi lô hàng theo vận đơn</h2>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="w-full pl-9 pr-24 py-2 rounded-xl border border-border text-[12px] font-semibold"
                  placeholder="Nhập Job code / Master Job / Master BL..."
                />
                <button
                  onClick={handleTrackShipment}
                  disabled={isTrackingLoading}
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary/90"
                >
                  {isTrackingLoading ? 'Đang tải...' : 'Tra cứu'}
                </button>
              </div>
            </div>

            {trackingError ? (
              <div className="px-4 py-8 text-center">
                <div className="inline-flex items-center gap-2 text-[12px] text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
                  <AlertCircle size={14} />
                  {trackingError}
                </div>
              </div>
            ) : !isTrackingVisible ? (
              <div className="px-4 py-10 text-center text-[12px] text-slate-500">
                Nhập mã để tra cứu dữ liệu lô hàng được đồng bộ từ Job Management.
              </div>
            ) : (
              <div className="px-4 py-4">
                <div className="rounded-xl border border-border p-4 bg-white">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-[11px] text-slate-500 font-bold">Mã vận đơn</p>
                      <p className="text-[15px] font-black text-slate-900">{trackedShipment?.code || trackedShipment?.master_job_no || trackingCode}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Cập nhật lần cuối: {lastUpdatedAt}
                      </p>
                    </div>
                    <span className={clsx(
                      'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full',
                      trackedShipment?.status === 'delivered' ? 'text-emerald-700 bg-emerald-50' : 'text-blue-700 bg-blue-50'
                    )}>
                      <CheckCircle2 size={12} />
                      {latestEvent?.title || mapShipmentStatus(trackedShipment?.status)}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {trackingEvents.slice(0, 4).map((event, index) => (
                      <div key={`${event.time}-${event.title}`} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <CircleDot size={14} className={clsx(index === 0 ? 'text-emerald-600' : 'text-slate-300')} />
                          <div className="w-px h-full bg-slate-200" />
                        </div>
                        <div className="-mt-0.5 pb-2">
                          <p className="text-[12px] font-black text-slate-800">{event.title}</p>
                          <p className="text-[11px] text-slate-600">{event.location}</p>
                          <p className="text-[11px] text-slate-400">{event.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setModalOpen(true)}
                    className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
                  >
                    Xem tất cả chi tiết gửi hàng
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-border shadow-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-slate-500">Cập nhật lần cuối: {lastUpdatedAt}</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="px-5 pt-3">
              <div className="flex items-center gap-1 border-b border-border">
                <button
                  onClick={() => setModalTab('progress')}
                  className={clsx(
                    'px-4 py-2 text-[12px] font-bold rounded-t-lg',
                    modalTab === 'progress' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  Tiến độ vận chuyển
                </button>
                <button
                  onClick={() => setModalTab('detail')}
                  className={clsx(
                    'px-4 py-2 text-[12px] font-bold rounded-t-lg',
                    modalTab === 'detail' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  Chi tiết lô hàng
                </button>
              </div>
            </div>

            <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
              {modalTab === 'progress' ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-3 text-[12px] text-slate-700">
                    Bạn đang xem đầy đủ tiến trình vận chuyển đồng bộ từ Job Management.
                  </div>
                  {trackingEvents.map((event) => (
                    <div key={`${event.time}-${event.title}-modal`} className="grid grid-cols-[140px_1fr] gap-3">
                      <div className="text-[11px] text-slate-500">
                        <p className="font-semibold">{event.time.split(',')[0] || event.time}</p>
                        <p>{event.time.split(',')[1] || ''}</p>
                      </div>
                      <div className="pb-2 border-b border-border/60">
                        <p className="text-[12px] font-black text-slate-900">{event.title}</p>
                        <p className="text-[11px] text-slate-600">{event.note}</p>
                        <p className="text-[11px] text-slate-500">{event.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 text-[12px] text-slate-700">
                  <div className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-3">
                    Bạn đã có thông tin chi tiết. Nếu cần bổ sung chứng từ, vui lòng liên hệ bộ phận vận hành.
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3 border border-border">
                      <p className="text-[11px] text-slate-500 font-bold">Số theo dõi đơn</p>
                      <p className="font-black text-slate-900 mt-1">{trackedShipment?.code || trackedShipment?.master_job_no || 'N/A'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-border">
                      <p className="text-[11px] text-slate-500 font-bold">Ngày job</p>
                      <p className="font-black text-slate-900 mt-1">{trackedShipment?.job_date || 'N/A'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-border">
                      <p className="text-[11px] text-slate-500 font-bold">Dịch vụ</p>
                      <p className="font-black text-slate-900 mt-1">{trackedShipment?.services || 'N/A'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-border">
                      <p className="text-[11px] text-slate-500 font-bold">Phân loại lô hàng</p>
                      <p className="font-black text-slate-900 mt-1">{trackedShipment?.bound || 'N/A'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-border">
                      <p className="text-[11px] text-slate-500 font-bold">POL -&gt; POD</p>
                      <p className="font-black text-slate-900 mt-1">{trackedShipment?.pol || 'N/A'} {'->'} {trackedShipment?.pod || 'N/A'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-border">
                      <p className="text-[11px] text-slate-500 font-bold">Master BL</p>
                      <p className="font-black text-slate-900 mt-1">{trackedShipment?.master_bl_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border flex justify-center">
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-1.5 rounded-full border border-primary/30 text-primary text-[12px] font-bold hover:bg-primary/5"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-2 text-[11px] text-slate-500 flex items-center gap-4">
        <span className="inline-flex items-center gap-1"><Clock3 size={12} /> Demo Website Module</span>
        <span className="inline-flex items-center gap-1"><Globe size={12} /> Maritime style UI</span>
      </div>
    </div>
  );
};

export default WebsitePage;
