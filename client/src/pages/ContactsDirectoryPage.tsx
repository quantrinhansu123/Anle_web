import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Search,
  RefreshCcw,
  Users,
  Building2,
  Truck,
  Mail,
  Phone,
  Globe,
  Eye,
  Filter,
  UserRound,
} from 'lucide-react';
import { customerService, type Customer } from '../services/customerService';
import { supplierService, type Supplier } from '../services/supplierService';
import { useToastContext } from '../contexts/ToastContext';

type DirectorySource = 'customer' | 'supplier';
type SourceFilter = 'all' | DirectorySource;
type ContactRow = {
  id: string;
  source: DirectorySource;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  lane: string;
  owner: string;
  status: string;
  healthClass: string;
  viewPath: string;
};

const statusLabelMap: Record<string, string> = {
  new: 'Lead',
  follow_up: 'Follow Up',
  quotation_sent: 'Quotation',
  meeting: 'Negotiation',
  lost: 'Lost',
};

const ContactsDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { error } = useToastContext();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchText, setSearchText] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customersData, suppliersData] = await Promise.all([
        customerService.getCustomers(),
        supplierService.getSuppliers(),
      ]);
      setCustomers(customersData);
      setSuppliers(suppliersData);
    } catch (err: any) {
      error(err?.message || 'Failed to load contacts directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const rows = useMemo<ContactRow[]>(() => {
    const customerRows: ContactRow[] = customers.map((c) => {
      const owner = c.sales_staff || c.sales_team || c.sales_department || 'Unassigned';
      const status = statusLabelMap[c.status] || 'Lead';
      const healthClass = c.status === 'lost' ? 'text-rose-700 bg-rose-50' : c.status === 'meeting' ? 'text-emerald-700 bg-emerald-50' : 'text-blue-700 bg-blue-50';
      return {
        id: c.id,
        source: 'customer',
        company: c.company_name,
        contactName: c.local_name || c.english_name || c.company_name,
        email: c.email || '—',
        phone: c.phone || '—',
        lane: c.country || c.state_province || 'VN Domestic',
        owner,
        status,
        healthClass,
        viewPath: `/customers/directory/${c.id}`,
      };
    });

    const supplierRows: ContactRow[] = suppliers.map((s) => ({
      id: s.id,
      source: 'supplier',
      company: s.company_name,
      contactName: s.company_name,
      email: s.email || '—',
      phone: s.phone || '—',
      lane: s.address || 'No address',
      owner: 'Procurement',
      status: 'Vendor',
      healthClass: 'text-slate-700 bg-slate-100',
      viewPath: `/suppliers/directory/${s.id}`,
    }));

    return [...customerRows, ...supplierRows].sort((a, b) => a.company.localeCompare(b.company));
  }, [customers, suppliers]);

  const ownerOptions = useMemo(() => {
    const allOwners = rows.map((row) => row.owner).filter((owner) => owner !== 'Unassigned');
    return Array.from(new Set(allOwners)).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        normalized.length === 0 ||
        row.company.toLowerCase().includes(normalized) ||
        row.contactName.toLowerCase().includes(normalized) ||
        row.email.toLowerCase().includes(normalized) ||
        row.phone.toLowerCase().includes(normalized);

      const matchesSource = sourceFilter === 'all' || row.source === sourceFilter;
      const matchesOwner = ownerFilter === 'all' || row.owner === ownerFilter;

      return matchesSearch && matchesSource && matchesOwner;
    });
  }, [rows, searchText, sourceFilter, ownerFilter]);

  const metrics = useMemo(() => {
    const total = filteredRows.length;
    const customersCount = filteredRows.filter((row) => row.source === 'customer').length;
    const suppliersCount = filteredRows.filter((row) => row.source === 'supplier').length;
    const actionable = filteredRows.filter((row) => row.status !== 'Lost').length;
    return { total, customersCount, suppliersCount, actionable };
  }, [filteredRows]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col gap-4 -mt-2 min-h-0">
      <div className="bg-white rounded-2xl border border-border shadow-sm p-4 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[20px] font-black text-slate-900 tracking-tight">Unified Contacts Directory</h1>
            <p className="text-[12px] text-slate-500 mt-1">
              Consolidated customer and supplier contacts for logistics operations, pricing, and follow-up workflows.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-xl border border-border bg-white hover:bg-muted transition-all"
          >
            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border p-3 bg-slate-50/60">
            <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wide">
              <Users size={13} />
              Total Contacts
            </div>
            <p className="text-[24px] font-black text-slate-900 mt-1 tabular-nums">{metrics.total}</p>
          </div>
          <div className="rounded-xl border border-border p-3 bg-blue-50/70">
            <div className="flex items-center gap-2 text-blue-700 text-[11px] font-bold uppercase tracking-wide">
              <Building2 size={13} />
              Customers
            </div>
            <p className="text-[24px] font-black text-blue-700 mt-1 tabular-nums">{metrics.customersCount}</p>
          </div>
          <div className="rounded-xl border border-border p-3 bg-amber-50/70">
            <div className="flex items-center gap-2 text-amber-700 text-[11px] font-bold uppercase tracking-wide">
              <Truck size={13} />
              Suppliers
            </div>
            <p className="text-[24px] font-black text-amber-700 mt-1 tabular-nums">{metrics.suppliersCount}</p>
          </div>
          <div className="rounded-xl border border-border p-3 bg-emerald-50/70">
            <div className="flex items-center gap-2 text-emerald-700 text-[11px] font-bold uppercase tracking-wide">
              <Globe size={13} />
              Actionable
            </div>
            <p className="text-[24px] font-black text-emerald-700 mt-1 tabular-nums">{metrics.actionable}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search company, contact, email, phone..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-[13px] bg-white"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-border bg-white text-[12px] text-slate-500 font-bold">
            <Filter size={13} />
            Filters
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
            className="px-3 py-2 rounded-xl border border-border bg-white text-[12px] font-bold"
          >
            <option value="all">All Sources</option>
            <option value="customer">Customers</option>
            <option value="supplier">Suppliers</option>
          </select>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-white text-[12px] font-bold"
          >
            <option value="all">All Owners</option>
            {ownerOptions.map((owner) => (
              <option key={owner} value={owner}>{owner}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserRound size={14} className="text-primary" />
            <h2 className="text-[13px] font-black uppercase tracking-wide text-primary">Contacts Table</h2>
          </div>
          <span className="text-[11px] text-slate-500 font-bold">{filteredRows.length} contact(s)</span>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[980px] w-full text-[12px]">
            <thead className="bg-slate-50/70">
              <tr className="text-slate-500">
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wide">Company</th>
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wide">Contact</th>
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wide">Email / Phone</th>
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wide">Source</th>
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wide">Owner</th>
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wide">Status</th>
                <th className="px-3 py-2 text-right font-bold uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <RefreshCcw size={14} className="animate-spin" />
                      Loading contacts...
                    </span>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-400">No matching contact</td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={`${row.source}-${row.id}`} className="border-t border-border hover:bg-slate-50/60 transition-colors">
                    <td className="px-3 py-2.5">
                      <div>
                        <p className="font-bold text-slate-900">{row.company}</p>
                        <p className="text-[11px] text-slate-500">{row.lane}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-700">{row.contactName}</td>
                    <td className="px-3 py-2.5">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 text-slate-700">
                          <Mail size={12} className="text-slate-400" />
                          {row.email}
                        </div>
                        <div className="inline-flex items-center gap-1.5 text-slate-700">
                          <Phone size={12} className="text-slate-400" />
                          {row.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={clsx('px-2 py-0.5 rounded-full border font-semibold', row.source === 'customer' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
                        {row.source === 'customer' ? 'Customer' : 'Supplier'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">{row.owner}</td>
                    <td className="px-3 py-2.5">
                      <span className={clsx('px-2 py-1 rounded-lg text-[11px] font-semibold', row.healthClass)}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(row.viewPath)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-[11px] font-bold hover:bg-slate-100"
                        >
                          <Eye size={12} />
                          View
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

export default ContactsDirectoryPage;
