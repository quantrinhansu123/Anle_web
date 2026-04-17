import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Trash2, Loader2, Mail, Phone, MapPin,
  Send, CheckCircle2, Star
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  shippingAgentService,
  type ShippingAgent,
  type AgentBooking,
  type AgentBookingRole,
  type CreateShippingAgentDto,
} from '../../../services/shippingAgentService';

interface Props {
  shipmentId: string;
}

const ROLE_CONFIG: Record<AgentBookingRole, { label: string; color: string }> = {
  primary: { label: 'Primary', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  secondary: { label: 'Secondary', color: 'bg-slate-50 text-slate-600 border-slate-200' },
  customs: { label: 'Customs', color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  local: { label: 'Local', color: 'bg-amber-50 text-amber-600 border-amber-200' },
};

const AgentsTab: React.FC<Props> = ({ shipmentId }) => {
  const [bookings, setBookings] = useState<AgentBooking[]>([]);
  const [agents, setAgents] = useState<ShippingAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedRole, setSelectedRole] = useState<AgentBookingRole>('primary');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [newAgent, setNewAgent] = useState<Partial<CreateShippingAgentDto>>({
    name: '', type: 'general', contact_person: '', email: '', phone: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingData, agentData] = await Promise.all([
        shippingAgentService.getBookings(shipmentId),
        shippingAgentService.getAgents(),
      ]);
      setBookings(Array.isArray(bookingData) ? bookingData : []);
      setAgents(Array.isArray(agentData) ? agentData : []);
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [shipmentId]);

  const assignedAgentIds = bookings.map(b => b.agent_id);
  const availableAgents = agents.filter(a => !assignedAgentIds.includes(a.id));

  const handleAssign = async () => {
    if (!selectedAgentId) return;
    try {
      setIsAssigning(true);
      await shippingAgentService.createBooking({
        shipment_id: shipmentId,
        agent_id: selectedAgentId,
        role: selectedRole,
      });
      setSelectedAgentId('');
      setShowAssign(false);
      fetchData();
    } catch (err) {
      console.error('Failed to assign agent:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!newAgent.name) return;
    try {
      setIsCreatingAgent(true);
      await shippingAgentService.createAgent(newAgent as CreateShippingAgentDto);
      setNewAgent({ name: '', type: 'general', contact_person: '', email: '', phone: '' });
      setShowCreateAgent(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create agent:', err);
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const handlePreAlert = async (bookingId: string) => {
    try {
      setSavingId(bookingId);
      await shippingAgentService.sendPreAlert(bookingId);
      fetchData();
    } catch (err) { console.error(err); } finally { setSavingId(null); }
  };

  const handleConfirm = async (bookingId: string) => {
    try {
      setSavingId(bookingId);
      await shippingAgentService.confirmBooking(bookingId);
      fetchData();
    } catch (err) { console.error(err); } finally { setSavingId(null); }
  };

  const handleRemove = async (bookingId: string) => {
    try {
      setSavingId(bookingId);
      await shippingAgentService.deleteBooking(bookingId);
      fetchData();
    } catch (err) { console.error(err); } finally { setSavingId(null); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Assigned Agents ({bookings.length})
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateAgent(!showCreateAgent)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-[12px] font-bold hover:bg-slate-50 transition-all active:scale-95">
            <Plus size={14} /> New Agent
          </button>
          <button onClick={() => setShowAssign(!showAssign)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-[12px] font-bold hover:bg-primary/90 shadow-sm transition-all active:scale-95">
            <Users size={14} /> Assign Agent
          </button>
        </div>
      </div>

      {/* Create Agent Form */}
      {showCreateAgent && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[11px] font-bold text-primary uppercase tracking-wider">New Shipping Agent</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Name *</label>
              <input type="text" placeholder="Agent name" value={newAgent.name || ''}
                onChange={e => setNewAgent(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-bold bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Type</label>
              <select value={newAgent.type} onChange={e => setNewAgent(p => ({ ...p, type: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-bold bg-white">
                <option value="general">General</option>
                <option value="customs_broker">Customs Broker</option>
                <option value="freight_forwarder">Freight Forwarder</option>
                <option value="warehouse">Warehouse</option>
                <option value="local_agent">Local Agent</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Contact Person</label>
              <input type="text" placeholder="Contact name" value={newAgent.contact_person || ''}
                onChange={e => setNewAgent(p => ({ ...p, contact_person: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-medium bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Email</label>
              <input type="email" placeholder="email@agent.com" value={newAgent.email || ''}
                onChange={e => setNewAgent(p => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-medium bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">Phone</label>
              <input type="text" placeholder="Phone" value={newAgent.phone || ''}
                onChange={e => setNewAgent(p => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-medium bg-white" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button onClick={handleCreateAgent} disabled={isCreatingAgent || !newAgent.name}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-[12px] font-bold hover:bg-primary/90 shadow-sm disabled:opacity-50 active:scale-95">
              {isCreatingAgent ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create Agent
            </button>
            <button onClick={() => setShowCreateAgent(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Assign Agent Form */}
      {showAssign && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Assign Agent to Shipment</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={selectedAgentId} onChange={e => setSelectedAgentId(e.target.value)}
              className="col-span-2 px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-bold bg-white">
              <option value="">Select an agent...</option>
              {availableAgents.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
              ))}
            </select>
            <select value={selectedRole} onChange={e => setSelectedRole(e.target.value as AgentBookingRole)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-bold bg-white">
              {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAssign} disabled={isAssigning || !selectedAgentId}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 shadow-sm disabled:opacity-50 active:scale-95">
              {isAssigning ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />} Assign
            </button>
            <button onClick={() => setShowAssign(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Assigned Agent Cards */}
      {bookings.length === 0 && !showAssign ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center">
          <Users size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-[13px] text-slate-400 font-medium">No agents assigned yet</p>
          <button onClick={() => setShowAssign(true)}
            className="mt-3 text-[12px] font-bold text-primary hover:text-primary/80">+ Assign First Agent</button>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map(booking => {
            const agent = booking.agent;
            const roleMeta = ROLE_CONFIG[booking.role];
            return (
              <div key={booking.id} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold border', roleMeta.color)}>
                        {roleMeta.label}
                      </span>
                      {booking.confirmed && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <CheckCircle2 size={10} /> Confirmed
                        </span>
                      )}
                      {booking.pre_alert_sent && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-200">
                          <Send size={10} /> Pre-Alert Sent
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] font-bold text-slate-800">{agent?.name || 'Unknown Agent'}</p>
                    {agent && (
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[11px] text-slate-500">
                        {agent.contact_person && <span className="font-medium">{agent.contact_person}</span>}
                        {agent.email && <span className="flex items-center gap-1"><Mail size={10} /> {agent.email}</span>}
                        {agent.phone && <span className="flex items-center gap-1"><Phone size={10} /> {agent.phone}</span>}
                        {agent.country && <span className="flex items-center gap-1"><MapPin size={10} /> {agent.country}</span>}
                        {agent.rating > 0 && <span className="flex items-center gap-0.5"><Star size={10} className="text-amber-400 fill-amber-400" /> {agent.rating}</span>}
                      </div>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                  {!booking.pre_alert_sent && (
                    <button onClick={() => handlePreAlert(booking.id)} disabled={savingId === booking.id}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold text-violet-600 border border-violet-200 hover:bg-violet-50 disabled:opacity-50 active:scale-95">
                      <Send size={12} /> Send Pre-Alert
                    </button>
                  )}
                  {!booking.confirmed && (
                    <button onClick={() => handleConfirm(booking.id)} disabled={savingId === booking.id}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold text-emerald-600 border border-emerald-200 hover:bg-emerald-50 disabled:opacity-50 active:scale-95">
                      <CheckCircle2 size={12} /> Confirm
                    </button>
                  )}
                  <div className="flex-1" />
                  <button onClick={() => handleRemove(booking.id)} disabled={savingId === booking.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50">
                    {savingId === booking.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgentsTab;
