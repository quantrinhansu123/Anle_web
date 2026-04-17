import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Plus, Trash2, Loader2, MapPin, Shield,
  ChevronDown, ChevronUp, Image as ImageIcon, X
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  shipmentIncidentService,
  type ShipmentIncident,
  type IncidentType,
  type IncidentSeverity,
  type IncidentStatus,
  type CreateShipmentIncidentDto,
} from '../../../services/shipmentIncidentService';
import { uploadService } from '../../../services/uploadService';

interface Props {
  shipmentId: string;
}

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: 'damage', label: 'Damage' },
  { value: 'delay', label: 'Delay' },
  { value: 'loss', label: 'Loss' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'customs', label: 'Customs' },
  { value: 'safety', label: 'Safety' },
  { value: 'theft', label: 'Theft' },
  { value: 'weather', label: 'Weather' },
  { value: 'other', label: 'Other' },
];

const SEVERITY_CONFIG: Record<IncidentSeverity, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  medium: { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  high: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  critical: { label: 'Critical', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
};

const STATUS_CONFIG: Record<IncidentStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-red-50 text-red-600 border-red-200' },
  investigating: { label: 'Investigating', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  escalated: { label: 'Escalated', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  resolved: { label: 'Resolved', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  closed: { label: 'Closed', color: 'bg-slate-50 text-slate-600 border-slate-200' },
};

const STATUS_OPTIONS: IncidentStatus[] = ['open', 'investigating', 'escalated', 'resolved', 'closed'];

const formatDateTime = (value: string) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(d);
};

const IncidentsTab: React.FC<Props> = ({ shipmentId }) => {
  const [incidents, setIncidents] = useState<ShipmentIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [newIncident, setNewIncident] = useState<Partial<CreateShipmentIncidentDto>>({
    incident_type: 'damage',
    severity: 'medium',
    title: '',
    description: '',
    location: '',
    reported_by: '',
    photo_urls: [],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await shipmentIncidentService.getIncidents(shipmentId);
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [shipmentId]);

  const handleAdd = async () => {
    if (!newIncident.title) return;
    try {
      setIsAdding(true);
      const dto: CreateShipmentIncidentDto = {
        shipment_id: shipmentId,
        incident_type: newIncident.incident_type || 'other',
        severity: newIncident.severity || 'medium',
        title: newIncident.title!,
        description: newIncident.description || null,
        location: newIncident.location || null,
        reported_by: newIncident.reported_by || null,
        photo_urls: newIncident.photo_urls || [],
      };
      await shipmentIncidentService.createIncident(dto);
      setNewIncident({ incident_type: 'damage', severity: 'medium', title: '', description: '', location: '', reported_by: '', photo_urls: [] });
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to add incident:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleStatusChange = async (id: string, status: IncidentStatus) => {
    try {
      setSavingId(id);
      const dto: any = { status };
      if (status === 'resolved' && resolutionText) {
        dto.resolution = resolutionText;
        setResolutionText('');
      }
      await shipmentIncidentService.updateIncident(id, dto);
      fetchData();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setSavingId(id);
      await shipmentIncidentService.deleteIncident(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setSavingId(null);
    }
  };

  const openCount = incidents.filter(i => i.status === 'open' || i.status === 'investigating' || i.status === 'escalated').length;
  const criticalCount = incidents.filter(i => i.severity === 'critical' && i.status !== 'closed' && i.status !== 'resolved').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500">Total</span>
          <span className="text-[13px] font-black text-slate-800">{incidents.length}</span>
        </div>
        {openCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
            <span className="text-[11px] font-bold text-red-500">Open</span>
            <span className="text-[13px] font-black text-red-700">{openCount}</span>
          </div>
        )}
        {criticalCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100 border border-red-300 animate-pulse">
            <AlertTriangle size={12} className="text-red-600" />
            <span className="text-[11px] font-bold text-red-700">{criticalCount} Critical</span>
          </div>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-[12px] font-bold hover:bg-red-700 shadow-sm transition-all active:scale-95"
        >
          <Plus size={14} />
          Report Incident
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="rounded-xl border border-red-200 bg-red-50/30 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Report New Incident</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Type</label>
              <select
                value={newIncident.incident_type}
                onChange={(e) => setNewIncident(p => ({ ...p, incident_type: e.target.value as IncidentType }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-bold bg-white"
              >
                {INCIDENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Severity</label>
              <select
                value={newIncident.severity}
                onChange={(e) => setNewIncident(p => ({ ...p, severity: e.target.value as IncidentSeverity }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-bold bg-white"
              >
                {Object.entries(SEVERITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-500">Title *</label>
              <input
                type="text" placeholder="e.g. Container damage during loading"
                value={newIncident.title || ''}
                onChange={(e) => setNewIncident(p => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-bold bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Location</label>
              <input
                type="text" placeholder="Where did it happen?"
                value={newIncident.location || ''}
                onChange={(e) => setNewIncident(p => ({ ...p, location: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-medium bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Reported By</label>
              <input
                type="text" placeholder="Name of reporter"
                value={newIncident.reported_by || ''}
                onChange={(e) => setNewIncident(p => ({ ...p, reported_by: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-medium bg-white"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-500">Description</label>
              <textarea
                placeholder="Describe the incident..."
                value={newIncident.description || ''}
                onChange={(e) => setNewIncident(p => ({ ...p, description: e.target.value }))}
                rows={2} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-medium bg-white resize-none"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <ImageIcon size={12} />
                Photo Evidence
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {newIncident.photo_urls?.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 w-16 h-16">
                    <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        const newPhotos = [...(newIncident.photo_urls || [])];
                        newPhotos.splice(idx, 1);
                        setNewIncident(p => ({ ...p, photo_urls: newPhotos }));
                      }}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                ))}
                <label className="flex items-center justify-center w-16 h-16 rounded-xl border-2 border-dashed border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setIsUploading(true);
                        const url = await uploadService.uploadFile(file);
                        setNewIncident(p => ({ ...p, photo_urls: [...(p.photo_urls || []), url] }));
                      } catch (err) {
                        console.error('Upload failed', err);
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                  />
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={20} />}
                </label>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button onClick={handleAdd} disabled={isAdding || !newIncident.title}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 text-white text-[12px] font-bold hover:bg-red-700 shadow-sm transition-all disabled:opacity-50 active:scale-95">
              {isAdding ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
              Report
            </button>
            <button onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Incidents List */}
      {incidents.length === 0 && !showAddForm ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center">
          <Shield size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-[13px] text-slate-400 font-medium">No incidents reported — good news!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {incidents.map((inc) => {
            const sevMeta = SEVERITY_CONFIG[inc.severity];
            const statusMeta = STATUS_CONFIG[inc.status];
            const isExpanded = expandedId === inc.id;

            return (
              <div key={inc.id} className={clsx(
                'rounded-xl border bg-white overflow-hidden transition-all',
                inc.severity === 'critical' && inc.status !== 'closed' && inc.status !== 'resolved'
                  ? 'border-red-300 shadow-md shadow-red-100'
                  : 'border-slate-200'
              )}>
                {/* Header */}
                <div
                  className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : inc.id)}
                >
                  <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold border', sevMeta.bg)}>
                    {sevMeta.label}
                  </span>
                  <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold border', statusMeta.color)}>
                    {statusMeta.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 truncate">{inc.title}</p>
                    <p className="text-[10px] text-slate-400">
                      {INCIDENT_TYPES.find(t => t.value === inc.incident_type)?.label || inc.incident_type}
                      {inc.location && <> · <MapPin size={9} className="inline" /> {inc.location}</>}
                      {' · '}{formatDateTime(inc.created_at)}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-1 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                    {inc.description && (
                      <p className="text-[12px] text-slate-600">{inc.description}</p>
                    )}
                    {inc.photo_urls && inc.photo_urls.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Photo Evidence</p>
                        <div className="flex flex-wrap gap-2">
                          {inc.photo_urls.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded-xl overflow-hidden border border-slate-200 hover:border-slate-400 transition-colors">
                              <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {inc.reported_by && (
                      <p className="text-[11px] text-slate-400">Reported by: <span className="font-bold text-slate-600">{inc.reported_by}</span></p>
                    )}
                    {inc.resolution && (
                      <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-200">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Resolution</p>
                        <p className="text-[12px] text-emerald-800">{inc.resolution}</p>
                      </div>
                    )}

                    {/* Resolution Input (for resolving) */}
                    {inc.status !== 'resolved' && inc.status !== 'closed' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Resolution Note (optional)</label>
                        <input
                          type="text" placeholder="How was this resolved?"
                          value={expandedId === inc.id ? resolutionText : ''}
                          onChange={(e) => setResolutionText(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] bg-white"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <select
                        value={inc.status}
                        onChange={(e) => handleStatusChange(inc.id, e.target.value as IncidentStatus)}
                        disabled={savingId === inc.id}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold bg-white"
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                      <div className="flex-1" />
                      <button
                        onClick={() => handleDelete(inc.id)}
                        disabled={savingId === inc.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                      >
                        {savingId === inc.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IncidentsTab;
