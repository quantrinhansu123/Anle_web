import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Search,
  RefreshCcw,
  Filter,
  Users,
  BriefcaseBusiness,
  ShieldCheck,
  Clock3,
  Route,
  ChevronRight,
  Building2,
  Plus,
  Eye,
} from 'lucide-react';
import { customerService, type Customer, type CustomerStatus } from '../services/customerService';
import { useToastContext } from '../contexts/ToastContext';

type StageConfig = {
  id: CustomerStatus;
  title: string;
  badgeClass: string;
  cardClass: string;
};

type CrmAccount = {
  id: string;
  company: string;
  code: string;
  owner: string;
  stage: CustomerStatus;
  stageLabel: string;
  serviceMode: string;
  tradeLane: string;
  potentialScore: number;
  creditLimit: number;
  creditTermDays: number;
  healthLabel: string;
  healthClass: string;
  nextAction: string;
};

const STAGES: StageConfig[] = [
  { id: 'new', title: 'Lead Qualified', badgeClass: 'text-blue-700 bg-blue-50 border-blue-200', cardClass: 'bg-blue-50/70' },
  { id: 'follow_up', title: 'Rate Inquiry', badgeClass: 'text-amber-700 bg-amber-50 border-amber-200', cardClass: 'bg-amber-50/70' },
  { id: 'quotation_sent', title: 'Quotation Issued', badgeClass: 'text-indigo-700 bg-indigo-50 border-indigo-200', cardClass: 'bg-indigo-50/70' },
  { id: 'meeting', title: 'Negotiation', badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200', cardClass: 'bg-emerald-50/70' },
  { id: 'won', title: 'Closed Won', badgeClass: 'text-teal-700 bg-teal-50 border-teal-200', cardClass: 'bg-teal-50/70' },
  { id: 'lost', title: 'Closed Lost', badgeClass: 'text-rose-700 bg-rose-50 border-rose-200', cardClass: 'bg-rose-50/70' },
];

const statusLabelMap: Record<CustomerStatus, string> = {
  new: 'Lead Qualified',
  follow_up: 'Rate Inquiry',
  quotation_sent: 'Quotation Issued',
  meeting: 'Negotiation',
  won: 'Closed Won',
  lost: 'Closed Lost',
};

const normalizeStatus = (status?: string): CustomerStatus => {
  if (status === 'new' || status === 'follow_up' || status === 'quotation_sent' || status === 'meeting' || status === 'won' || status === 'lost') {
    return status;
  }
  return 'new';
};

const toCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

const toDateLabel = (isoDate?: string): string => {
  if (!isoDate) return 'No schedule';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return 'No schedule';
  return parsed.toLocaleDateString('en-GB');
};

const getServiceMode = (customer: Customer): string => {
  const source = `${customer.customer_group || ''} ${customer.customer_source || ''} ${customer.industry || ''}`.toLowerCase();
  if (source.includes('air')) return 'Air Freight';
  if (source.includes('truck') || source.includes('road')) return 'Trucking';
  if (source.includes('project')) return 'Project Cargo';
  if (source.includes('express')) return 'Express';
  return 'Sea Freight';
};

const computePotentialScore = (customer: Customer): number => {
  let score = 20;
  score += Math.min((customer.rank || 0) * 20, 60);
  if ((customer.credit_limit || 0) >= 500000) score += 15;
  if ((customer.credit_limit || 0) >= 1000000) score += 10;
  if (customer.sales_staff) score += 10;
  if (customer.status === 'meeting' || customer.status === 'quotation_sent') score += 10;
  return Math.min(score, 100);
};

const getHealth = (customer: Customer): { label: string; className: string } => {
  if ((customer.credit_term_days || 0) > 45) return { label: 'Monitor', className: 'text-amber-700 bg-amber-50' };
  if (customer.status === 'lost') return { label: 'At Risk', className: 'text-rose-700 bg-rose-50' };
  if (customer.status === 'won') return { label: 'Strategic', className: 'text-teal-700 bg-teal-50' };
  if (customer.status === 'meeting' || customer.status === 'quotation_sent') return { label: 'Healthy', className: 'text-emerald-700 bg-emerald-50' };
  return { label: 'Stable', className: 'text-slate-700 bg-slate-100' };
};

const CRMPage: React.FC = () => {
  const navigate = useNavigate();
  const { error } = useToastContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | CustomerStatus>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (err: any) {
      error(err?.message || 'Failed to load CRM data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const accounts = useMemo<CrmAccount[]>(() => {
    return customers.map((customer) => {
      const stage = normalizeStatus(customer.status);
      const owner = customer.sales_staff || customer.sales_team || customer.sales_department || 'Unassigned';
      const tradeLane = customer.country || customer.state_province || 'VN Domestic';
      const potentialScore = computePotentialScore(customer);
      const health = getHealth(customer);
      const updated = customer.updated_at ? new Date(customer.updated_at) : new Date();
      const nextActionAt = new Date(updated.getTime() + (3 + (potentialScore < 50 ? 4 : 0)) * 24 * 60 * 60 * 1000);

      return {
        id: customer.id,
        company: customer.company_name,
        code: customer.code || '---',
        owner,
        stage,
        stageLabel: statusLabelMap[stage],
        serviceMode: getServiceMode(customer),
        tradeLane,
        potentialScore,
        creditLimit: customer.credit_limit || 0,
        creditTermDays: customer.credit_term_days || 0,
        healthLabel: health.label,
        healthClass: health.className,
        nextAction: toDateLabel(nextActionAt.toISOString()),
      };
    });
  }, [customers]);

  const ownerOptions = useMemo(() => {
    const mapped = accounts
      .map((item) => item.owner)
      .filter((owner) => owner !== 'Unassigned');
    return Array.from(new Set(mapped)).sort((a, b) => a.localeCompare(b));
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return accounts.filter((account) => {
      const matchesSearch =
        normalized.length === 0 ||
        account.company.toLowerCase().includes(normalized) ||
        account.code.toLowerCase().includes(normalized) ||
        account.tradeLane.toLowerCase().includes(normalized) ||
        account.serviceMode.toLowerCase().includes(normalized);

      const matchesStage = stageFilter === 'all' || account.stage === stageFilter;
      const matchesOwner =
        ownerFilter === 'all' ||
        (ownerFilter === 'unassigned' && account.owner === 'Unassigned') ||
        account.owner === ownerFilter;

      return matchesSearch && matchesStage && matchesOwner;
    });
  }, [accounts, ownerFilter, search, stageFilter]);

  const pipelineByStage = useMemo(() => {
    return STAGES.map((stage) => ({
      ...stage,
      items: filteredAccounts
        .filter((item) => item.stage === stage.id)
        .sort((a, b) => b.potentialScore - a.potentialScore),
    }));
  }, [filteredAccounts]);

  const metrics = useMemo(() => {
    const total = filteredAccounts.length;
    const hotLeads = filteredAccounts.filter((item) => item.potentialScore >= 70 && item.stage !== 'lost').length;
    const assigned = filteredAccounts.filter((item) => item.owner !== 'Unassigned').length;
    const avgCreditTerm = total === 0 ? 0 : Math.round(filteredAccounts.reduce((sum, item) => sum + item.creditTermDays, 0) / total);

    return { total, hotLeads, assigned, avgCreditTerm };
  }, [filteredAccounts]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col gap-4 -mt-2 min-h-0">
      <div className="bg-white rounded-2xl border border-border shadow-sm p-4 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[20px] font-black text-slate-900 tracking-tight">Logistics CRM Pipeline</h1>
            <p className="text-[12px] text-slate-500 mt-1">
              Follow up leads, monitor account health, and prioritize logistics opportunities from existing customer data.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchCustomers}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-xl border border-border bg-white hover:bg-muted transition-all"
            >
              <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => navigate('/customers/directory')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-xl border border-border bg-white hover:bg-muted transition-all"
            >
              <Users size={14} />
              Customer List
            </button>
            <button
              onClick={() => navigate('/customers/directory')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-all"
            >
              <Plus size={14} />
              New Lead
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border p-3 bg-slate-50/60">
            <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wide">
              <Building2 size={13} />
              Total Accounts
            </div>
            <p className="text-[24px] font-black text-slate-900 mt-1 tabular-nums">{metrics.total}</p>
          </div>
          <div className="rounded-xl border border-border p-3 bg-emerald-50/70">
            <div className="flex items-center gap-2 text-emerald-700 text-[11px] font-bold uppercase tracking-wide">
              <BriefcaseBusiness size={13} />
              Hot Opportunities
            </div>
            <p className="text-[24px] font-black text-emerald-700 mt-1 tabular-nums">{metrics.hotLeads}</p>
          </div>
          <div className="rounded-xl border border-border p-3 bg-blue-50/70">
            <div className="flex items-center gap-2 text-blue-700 text-[11px] font-bold uppercase tracking-wide">
              <ShieldCheck size={13} />
              Assigned Owners
            </div>
            <p className="text-[24px] font-black text-blue-700 mt-1 tabular-nums">{metrics.assigned}</p>
          </div>
          <div className="rounded-xl border border-border p-3 bg-amber-50/70">
            <div className="flex items-center gap-2 text-amber-700 text-[11px] font-bold uppercase tracking-wide">
              <Clock3 size={13} />
              Avg Credit Term
            </div>
            <p className="text-[24px] font-black text-amber-700 mt-1 tabular-nums">{metrics.avgCreditTerm}d</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, code, lane, service mode..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-[13px] bg-white"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-border bg-white text-[12px] text-slate-500 font-bold">
            <Filter size={13} />
            Filters
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as 'all' | CustomerStatus)}
            className="px-3 py-2 rounded-xl border border-border bg-white text-[12px] font-bold"
          >
            <option value="all">All Stages</option>
            {STAGES.map((stage) => (
              <option key={stage.id} value={stage.id}>{stage.title}</option>
            ))}
          </select>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-white text-[12px] font-bold"
          >
            <option value="all">All Owners</option>
            <option value="unassigned">Unassigned</option>
            {ownerOptions.map((owner) => (
              <option key={owner} value={owner}>{owner}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 min-h-[320px]">
        {pipelineByStage.map((stage) => (
          <section key={stage.id} className={clsx('rounded-2xl border border-border shadow-sm min-h-[260px] flex flex-col', stage.cardClass)}>
            <div className="px-3 py-3 border-b border-border/70 bg-white/80 rounded-t-2xl flex items-center justify-between">
              <span className={clsx('px-2 py-1 rounded-lg border text-[11px] font-black uppercase tracking-wide', stage.badgeClass)}>
                {stage.title}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-white rounded-full border border-border">{stage.items.length}</span>
            </div>
            <div className="p-3 space-y-2 overflow-y-auto min-h-0">
              {stage.items.length === 0 ? (
                <div className="text-[11px] text-slate-400 italic text-center py-6">No account in this stage</div>
              ) : (
                stage.items.map((item) => (
                  <article
                    key={item.id}
                    className="bg-white rounded-xl border border-border p-3 space-y-2 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => navigate(`/customers/directory/${item.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-black text-slate-900 leading-tight">{item.company}</p>
                        <p className="text-[11px] text-slate-500 font-bold mt-0.5">{item.code} • {item.tradeLane}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-slate-50 font-bold">
                        {item.potentialScore}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">Service</span>
                        <span>{item.serviceMode}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">Owner</span>
                        <span className="truncate max-w-[120px]">{item.owner}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">Next action</span>
                        <span>{item.nextAction}</span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Route size={14} className="text-primary" />
            <h2 className="text-[13px] font-black uppercase tracking-wide text-primary">CRM Account Board</h2>
          </div>
          <span className="text-[11px] text-slate-500 font-bold">{filteredAccounts.length} account(s)</span>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[980px] w-full text-[12px]">
            <thead className="bg-slate-50/70">
              <tr className="text-slate-500">
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wide">Company</th>
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wide">Stage</th>
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wide">Service / Lane</th>
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wide">Owner</th>
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wide">Credit</th>
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wide">Health</th>
                <th className="px-3 py-2 text-right font-bold uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <RefreshCcw size={14} className="animate-spin" />
                      Loading CRM accounts...
                    </span>
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-400">No matching account</td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.id} className="border-t border-border hover:bg-slate-50/60 transition-colors">
                    <td className="px-3 py-2.5">
                      <div>
                        <p className="font-bold text-slate-900">{account.company}</p>
                        <p className="text-[11px] text-slate-500">{account.code}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded-full border border-border bg-white font-semibold">{account.stageLabel}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div>
                        <p className="font-semibold text-slate-700">{account.serviceMode}</p>
                        <p className="text-[11px] text-slate-500">{account.tradeLane}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">{account.owner}</td>
                    <td className="px-3 py-2.5">
                      <div>
                        <p className="font-semibold text-slate-700">${toCurrency(account.creditLimit)}</p>
                        <p className="text-[11px] text-slate-500">{account.creditTermDays} days</p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={clsx('px-2 py-1 rounded-lg text-[11px] font-semibold', account.healthClass)}>
                        {account.healthLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/customers/directory/${account.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-[11px] font-bold hover:bg-slate-100"
                        >
                          <Eye size={12} />
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/customers/directory/${account.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary/90"
                        >
                          Open
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CRMPage;
