import React from 'react';
import {
  Loader2,
  MapPin,
  AlertTriangle,
  ArrowRight,
  PackageCheck,
  FileText,
  DollarSign,
  Navigation,
  Anchor,
  CircleDot,
  MessageSquare,
  Timer,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { ShipmentTrackingEvent, TrackingEventType, SlaInfo } from '../../services/shipmentTrackingService';

const EVENT_CONFIG: Record<
  TrackingEventType,
  { labelVi: string; icon: React.ReactNode; color: string }
> = {
  status_change: { labelVi: 'Trạng thái', icon: <ArrowRight size={14} />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  location_update: { labelVi: 'Vị trí', icon: <MapPin size={14} />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  delay: { labelVi: 'Trễ', icon: <AlertTriangle size={14} />, color: 'text-red-600 bg-red-50 border-red-200' },
  customs_hold: { labelVi: 'Hải quan', icon: <Anchor size={14} />, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  departed: { labelVi: 'Khởi hành', icon: <Navigation size={14} />, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  arrived: { labelVi: 'Đến', icon: <PackageCheck size={14} />, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  checkpoint: { labelVi: 'Checkpoint', icon: <CircleDot size={14} />, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  note: { labelVi: 'Ghi chú', icon: <MessageSquare size={14} />, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  document: { labelVi: 'Chứng từ', icon: <FileText size={14} />, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  cost_update: { labelVi: 'Chi phí', icon: <DollarSign size={14} />, color: 'text-pink-600 bg-pink-50 border-pink-200' },
};

const formatDate = (value: string) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
};

const formatTime = (value: string) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const formatEtaDate = (value: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

const PublicSlaBanner: React.FC<{ sla: SlaInfo | null; loading: boolean }> = ({ sla, loading }) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-2">
        <Loader2 size={14} className="animate-spin text-slate-400" />
        <span className="text-[11px] text-slate-500">Đang tải trạng thái tiến độ…</span>
      </div>
    );
  }
  if (!sla) return null;

  const getAlertConfig = (level: string) => {
    switch (level) {
      case 'breach':
        return {
          bg: 'bg-gradient-to-r from-red-600 to-red-700',
          text: 'text-white',
          border: 'border-red-700',
          icon: '🚨',
          label: 'Vượt SLA',
          pulse: true,
        };
      case 'customer':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          text: 'text-white',
          border: 'border-orange-500',
          icon: '⚠️',
          label: 'Cảnh báo khách hàng',
          pulse: true,
        };
      case 'internal':
        return {
          bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
          text: 'text-amber-800',
          border: 'border-amber-300',
          icon: '⏰',
          label: 'Cảnh báo nội bộ',
          pulse: false,
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          icon: '✅',
          label: 'Đúng tiến độ',
          pulse: false,
        };
    }
  };

  const config = getAlertConfig(sla.alert_level);

  return (
    <div
      className={clsx(
        'rounded-xl border p-4 transition-all',
        config.bg,
        config.border,
        config.pulse && 'animate-pulse',
      )}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg shrink-0">{config.icon}</span>
          <div className="min-w-0">
            <p className={clsx('text-[11px] font-black uppercase tracking-wider', config.text)}>{config.label}</p>
            <div className={clsx('flex flex-wrap items-center gap-4 mt-1', config.text)}>
              <div className="flex items-center gap-1.5">
                <Timer size={12} className="opacity-70 shrink-0" />
                <span className="text-[12px] font-bold">ETA: {formatEtaDate(sla.eta)}</span>
              </div>
              {sla.delay_hours > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={12} className="opacity-70 shrink-0" />
                  <span className="text-[12px] font-black">Trễ: +{sla.delay_hours}h</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {sla.has_active_delay && sla.delay_hours > 0 && (
          <div
            className={clsx(
              'px-3 py-1.5 rounded-lg text-[18px] font-black tabular-nums shrink-0',
              sla.alert_level === 'none' ? 'text-emerald-600' : config.text,
            )}
          >
            +{sla.delay_hours}h
          </div>
        )}
      </div>
    </div>
  );
};

export interface PublicTrackingDisplayProps {
  events: ShipmentTrackingEvent[];
  sla: SlaInfo | null;
  slaLoading: boolean;
  eventCountLabel?: string;
}

const PublicTrackingDisplay: React.FC<PublicTrackingDisplayProps> = ({
  events,
  sla,
  slaLoading,
  eventCountLabel,
}) => {
  const grouped: Record<string, ShipmentTrackingEvent[]> = {};
  events.forEach((event) => {
    const dateKey = formatDate(event.created_at);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(event);
  });

  return (
    <div className="space-y-4">
      <PublicSlaBanner sla={sla} loading={slaLoading} />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {eventCountLabel ?? `Timeline (${events.length} sự kiện)`}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center">
          <p className="text-[13px] text-slate-500 font-medium">Chưa có sự kiện tracking.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {Object.entries(grouped).map(([dateLabel, dateEvents]) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-2 py-2 sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dateLabel}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="relative pl-6 space-y-1">
                <div className="absolute left-[11px] top-0 bottom-0 w-px bg-slate-200" />
                {dateEvents.map((event) => {
                  const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.note;
                  const timeStr = formatTime(event.created_at);
                  return (
                    <div key={event.id} className="relative">
                      <div
                        className={clsx(
                          'absolute -left-6 top-3 w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10',
                          config.color.split(' ')[1],
                        )}
                      >
                        <span className={config.color.split(' ')[0]}>{config.icon}</span>
                      </div>
                      <div
                        className={clsx(
                          'ml-2 rounded-xl border bg-white p-3 shadow-sm',
                          event.event_type === 'delay' ? 'border-red-200' : 'border-slate-100',
                        )}
                      >
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border', config.color)}>
                            {config.labelVi}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 tabular-nums">{timeStr}</span>
                        </div>
                        <p className="text-[13px] font-bold text-slate-800">{event.title}</p>
                        {event.description && (
                          <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-3">{event.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {event.location && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                              <MapPin size={10} /> {event.location}
                            </span>
                          )}
                          {event.delay_hours != null && event.delay_hours > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                              <AlertTriangle size={10} /> +{event.delay_hours}h
                            </span>
                          )}
                          {event.created_by?.full_name && (
                            <span className="text-[10px] font-medium text-slate-400">bởi {event.created_by.full_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicTrackingDisplay;
