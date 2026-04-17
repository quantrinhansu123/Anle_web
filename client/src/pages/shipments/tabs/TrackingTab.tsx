import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, Plus, Trash2, Loader2, MapPin, AlertTriangle,
  ArrowRight, PackageCheck, FileText, DollarSign, Navigation,
  Anchor, CircleDot, MessageSquare, RefreshCw, Timer
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  shipmentTrackingService,
  type ShipmentTrackingEvent,
  type TrackingEventType,
  type CreateTrackingEventDto,
  type SlaInfo,
} from '../../../services/shipmentTrackingService';

interface Props {
  shipmentId: string;
  shipmentEta?: string | null;
}

const EVENT_CONFIG: Record<TrackingEventType, { label: string; icon: React.ReactNode; color: string }> = {
  status_change: { label: 'Status Change', icon: <ArrowRight size={14} />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  location_update: { label: 'Location Update', icon: <MapPin size={14} />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  delay: { label: 'Delay', icon: <AlertTriangle size={14} />, color: 'text-red-600 bg-red-50 border-red-200' },
  customs_hold: { label: 'Customs Hold', icon: <Anchor size={14} />, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  departed: { label: 'Departed', icon: <Navigation size={14} />, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  arrived: { label: 'Arrived', icon: <PackageCheck size={14} />, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  checkpoint: { label: 'Checkpoint', icon: <CircleDot size={14} />, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  note: { label: 'Note', icon: <MessageSquare size={14} />, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  document: { label: 'Document', icon: <FileText size={14} />, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  cost_update: { label: 'Cost Update', icon: <DollarSign size={14} />, color: 'text-pink-600 bg-pink-50 border-pink-200' },
};

const EVENT_TYPES = Object.keys(EVENT_CONFIG) as TrackingEventType[];

const POLL_INTERVAL = 30000; // 30 seconds

const formatDate = (value: string) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
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
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d);
};

// ─── SLA Indicator Component ──────────────────────────────
const SlaIndicator: React.FC<{ sla: SlaInfo | null; loading: boolean }> = ({ sla, loading }) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-2">
        <Loader2 size={14} className="animate-spin text-slate-400" />
        <span className="text-[11px] text-slate-400">Loading SLA info...</span>
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
          label: 'SLA BREACH',
          pulse: true,
        };
      case 'customer':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          text: 'text-white',
          border: 'border-orange-500',
          icon: '⚠️',
          label: 'Customer Alert',
          pulse: true,
        };
      case 'internal':
        return {
          bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
          text: 'text-amber-800',
          border: 'border-amber-300',
          icon: '⏰',
          label: 'Internal Alert',
          pulse: false,
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          icon: '✅',
          label: 'On Track',
          pulse: false,
        };
    }
  };

  const config = getAlertConfig(sla.alert_level);

  return (
    <div className={clsx(
      'rounded-xl border p-4 transition-all',
      config.bg, config.border,
      config.pulse && 'animate-pulse'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">{config.icon}</span>
          <div>
            <p className={clsx('text-[11px] font-black uppercase tracking-wider', config.text)}>
              {config.label}
            </p>
            <div className={clsx('flex items-center gap-4 mt-1', config.text)}>
              <div className="flex items-center gap-1.5">
                <Timer size={12} className="opacity-70" />
                <span className="text-[12px] font-bold">
                  ETA: {formatEtaDate(sla.eta)}
                </span>
              </div>
              {sla.delay_hours > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={12} className="opacity-70" />
                  <span className="text-[12px] font-black">
                    Delay: +{sla.delay_hours}h
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        {sla.has_active_delay && sla.delay_hours > 0 && (
          <div className={clsx(
            'px-3 py-1.5 rounded-lg text-[18px] font-black tabular-nums',
            sla.alert_level === 'none' ? 'text-emerald-600' : config.text
          )}>
            +{sla.delay_hours}h
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────
const TrackingTab: React.FC<Props> = ({ shipmentId }) => {
  const [events, setEvents] = useState<ShipmentTrackingEvent[]>([]);
  const [sla, setSla] = useState<SlaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [slaLoading, setSlaLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lastPoll, setLastPoll] = useState<Date>(new Date());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<CreateTrackingEventDto>>({
    event_type: 'note',
    title: '',
    description: '',
    location: '',
  });

  const fetchData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await shipmentTrackingService.getTrackingEvents(shipmentId);
      setEvents(Array.isArray(data) ? data : []);
      setLastPoll(new Date());
    } catch (err) {
      console.error('Failed to load tracking events:', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchSla = async () => {
    try {
      setSlaLoading(true);
      const data = await shipmentTrackingService.getSlaInfo(shipmentId);
      setSla(data);
    } catch (err) {
      console.error('Failed to load SLA info:', err);
    } finally {
      setSlaLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
    fetchSla();
  }, [shipmentId]);

  // Polling
  useEffect(() => {
    const doPoll = () => {
      if (document.visibilityState === 'visible') {
        fetchData(false);
        fetchSla();
      }
    };

    pollRef.current = setInterval(doPoll, POLL_INTERVAL);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData(false);
        fetchSla();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shipmentId]);

  const handleAdd = async () => {
    if (!newEvent.title) return;
    try {
      setIsAdding(true);
      const dto: CreateTrackingEventDto = {
        shipment_id: shipmentId,
        event_type: newEvent.event_type || 'note',
        title: newEvent.title!,
        description: newEvent.description || null,
        location: newEvent.location || null,
        delay_hours: newEvent.delay_hours || null,
      };
      await shipmentTrackingService.createTrackingEvent(dto);
      setNewEvent({ event_type: 'note', title: '', description: '', location: '' });
      setShowAddForm(false);
      fetchData();
      fetchSla(); // Refresh SLA after adding event
    } catch (err) {
      console.error('Failed to add event:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await shipmentTrackingService.deleteTrackingEvent(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete event:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Group events by date
  const groupedEvents: Record<string, ShipmentTrackingEvent[]> = {};
  events.forEach((event) => {
    const dateKey = formatDate(event.created_at);
    if (!groupedEvents[dateKey]) groupedEvents[dateKey] = [];
    groupedEvents[dateKey].push(event);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* SLA Indicator */}
      <SlaIndicator sla={sla} loading={slaLoading} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Timeline ({events.length} events)
          </span>
          <button
            onClick={() => { fetchData(false); fetchSla(); }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            title="Refresh now"
          >
            <RefreshCw size={10} />
            <span className="tabular-nums">{formatTime(lastPoll.toISOString())}</span>
          </button>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-[12px] font-bold hover:bg-primary/90 shadow-sm transition-all active:scale-95"
        >
          <Plus size={14} />
          Add Event
        </button>
      </div>

      {/* Add Event Form */}
      {showAddForm && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[11px] font-bold text-primary uppercase tracking-wider">New Tracking Event</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Event Type</label>
              <select
                value={newEvent.event_type || 'note'}
                onChange={(e) => setNewEvent(p => ({ ...p, event_type: e.target.value as TrackingEventType }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-bold bg-white"
              >
                {EVENT_TYPES.map(t => (
                  <option key={t} value={t}>{EVENT_CONFIG[t].label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Title *</label>
              <input
                type="text" placeholder="e.g. Departed Ho Chi Minh City"
                value={newEvent.title || ''}
                onChange={(e) => setNewEvent(p => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-bold bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Location</label>
              <input
                type="text" placeholder="e.g. Cat Lai Port"
                value={newEvent.location || ''}
                onChange={(e) => setNewEvent(p => ({ ...p, location: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-medium bg-white"
              />
            </div>
            {newEvent.event_type === 'delay' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500">Delay (hours)</label>
                <input
                  type="number" step="0.5" placeholder="Auto-calculated if empty"
                  value={newEvent.delay_hours || ''}
                  onChange={(e) => setNewEvent(p => ({ ...p, delay_hours: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-bold bg-white"
                />
                <p className="text-[10px] text-slate-400">Leave empty to auto-calculate from ETA</p>
              </div>
            )}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-500">Description</label>
              <textarea
                placeholder="Optional notes..."
                value={newEvent.description || ''}
                onChange={(e) => setNewEvent(p => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-medium bg-white resize-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={isAdding || !newEvent.title}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-[12px] font-bold hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50 active:scale-95"
            >
              {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add to Timeline
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center">
          <Clock size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-[13px] text-slate-400 font-medium">No tracking events yet</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-3 text-[12px] font-bold text-primary hover:text-primary/80 transition-colors"
          >
            + Record First Event
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {Object.entries(groupedEvents).map(([dateLabel, dateEvents]) => (
            <div key={dateLabel}>
              {/* Date Header */}
              <div className="flex items-center gap-2 py-2 sticky top-0 z-10 bg-[#f8fafc]">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dateLabel}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Events for this date */}
              <div className="relative pl-6 space-y-1">
                {/* Vertical line */}
                <div className="absolute left-[11px] top-0 bottom-0 w-px bg-slate-200" />

                {dateEvents.map((event) => {
                  const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.note;
                  const timeStr = formatTime(event.created_at);

                  return (
                    <div key={event.id} className="relative group">
                      {/* Dot */}
                      <div className={clsx(
                        'absolute -left-6 top-3 w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10',
                        config.color.split(' ')[1], // bg color
                      )}>
                        <span className={config.color.split(' ')[0]}>{config.icon}</span>
                      </div>

                      {/* Card */}
                      <div className={clsx(
                        'ml-2 rounded-xl border bg-white p-3 hover:shadow-sm transition-all',
                        event.event_type === 'delay' ? 'border-red-200 hover:border-red-300' : 'border-slate-100 hover:border-slate-200'
                      )}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border', config.color)}>
                                {config.label}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 tabular-nums">{timeStr}</span>
                            </div>
                            <p className="text-[13px] font-bold text-slate-800">{event.title}</p>
                            {event.description && (
                              <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">{event.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {event.location && (
                                <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                                  <MapPin size={10} /> {event.location}
                                </span>
                              )}
                              {event.delay_hours != null && event.delay_hours > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                                  <AlertTriangle size={10} /> +{event.delay_hours}h delay
                                </span>
                              )}
                              {event.created_by?.full_name && (
                                <span className="text-[10px] font-medium text-slate-400">
                                  by {event.created_by.full_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(event.id)}
                            disabled={deletingId === event.id}
                            className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 shrink-0"
                          >
                            {deletingId === event.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          </button>
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

export default TrackingTab;
