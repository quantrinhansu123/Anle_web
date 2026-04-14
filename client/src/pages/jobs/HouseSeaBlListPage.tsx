import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCcw, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { cn } from '../../lib/utils';
import { jobService } from '../../services/jobService';
import { useToastContext } from '../../contexts/ToastContext';
import type { FmsJob } from './types';
import { buildHouseSeaBlTableRow, houseSeaBlRowSearchBlob, type HouseSeaBlTableRow } from './houseSeaBlListRow';

const thBase =
  'px-3 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight border-r border-border/40 text-left';
const thCheck = cn(thBase, 'w-10 text-center whitespace-nowrap');
const tdBase = 'px-3 py-3 border-r border-border/40 text-[12px] text-slate-700';
const tdCheck = cn(tdBase, 'text-center align-middle');

const COL_COUNT = 15;

function seaHouseBlViewPath(jobId: string) {
  return `/shipping/jobs/${jobId}/sea-house-bl?mode=view&from=house-sea-bl`;
}

const HouseSeaBlListPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError } = useToastContext();
  const [page, setPage] = useState(1);
  const limit = 50;
  const [jobs, setJobs] = useState<FmsJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit) || 1), [total, limit]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { items, pagination } = await jobService.listJobsPaginated(page, limit);
      setJobs(items);
      setTotal(pagination.total);
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to load jobs');
      setJobs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, toastError]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const tableRows: HouseSeaBlTableRow[] = useMemo(() => jobs.map(buildHouseSeaBlTableRow), [jobs]);

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return tableRows;
    return tableRows.filter((r) => houseSeaBlRowSearchBlob(r).includes(q));
  }, [tableRows, searchText]);

  const pageSelectedCount = useMemo(
    () => filteredRows.filter((r) => selectedIds[r.jobId]).length,
    [filteredRows, selectedIds],
  );

  const allFilteredSelected =
    filteredRows.length > 0 && pageSelectedCount === filteredRows.length;

  const toggleAllFiltered = () => {
    if (filteredRows.length === 0) return;
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = { ...prev };
        for (const r of filteredRows) delete next[r.jobId];
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = { ...prev };
        for (const r of filteredRows) next[r.jobId] = true;
        return next;
      });
    }
  };

  const toggleOne = (jobId: string) => {
    setSelectedIds((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  useEffect(() => {
    setSelectedIds({});
  }, [page]);

  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  const renderTableHead = () => (
    <tr>
      <th className={thCheck}>
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
          checked={allFilteredSelected}
          disabled={loading || filteredRows.length === 0}
          onChange={toggleAllFiltered}
          aria-label="Select all on page"
        />
      </th>
      <th className={clsx(thBase, 'min-w-[100px] whitespace-nowrap')}>MBL</th>
      <th className={clsx(thBase, 'min-w-[100px] whitespace-nowrap')}>HBL</th>
      <th className={clsx(thBase, 'min-w-[120px]')}>CONT</th>
      <th className={clsx(thBase, 'min-w-[140px]')}>SHPR</th>
      <th className={clsx(thBase, 'min-w-[140px]')}>CNEE</th>
      <th className={clsx(thBase, 'min-w-[110px]')}>Salesman</th>
      <th className={clsx(thBase, 'min-w-[80px]')}>POL</th>
      <th className={clsx(thBase, 'min-w-[80px]')}>POD</th>
      <th className={clsx(thBase, 'min-w-[88px]')}>ETD</th>
      <th className={clsx(thBase, 'min-w-[88px]')}>ETA</th>
      <th className={clsx(thBase, 'min-w-[88px]')}>ATD</th>
      <th className={clsx(thBase, 'min-w-[88px]')}>ATA</th>
      <th className={clsx(thBase, 'min-w-[96px]')}>Status</th>
      <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight text-left">
        Operators
      </th>
    </tr>
  );

  const renderRow = (r: HouseSeaBlTableRow) => (
    <tr
      key={r.jobId}
      role="link"
      tabIndex={0}
      aria-label={`View Sea House B/L for job ${r.masterJobNo}`}
      onClick={() => navigate(seaHouseBlViewPath(r.jobId))}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(seaHouseBlViewPath(r.jobId));
        }
      }}
      className="cursor-pointer hover:bg-slate-50/60 transition-colors"
    >
      <td className={tdCheck} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
          checked={Boolean(selectedIds[r.jobId])}
          onChange={() => toggleOne(r.jobId)}
          aria-label={`Select ${r.masterJobNo}`}
        />
      </td>
      <td className={tdBase}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(seaHouseBlViewPath(r.jobId));
          }}
          className="font-semibold text-primary hover:underline text-left"
        >
          {r.mbl}
        </button>
      </td>
      <td className={tdBase}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(seaHouseBlViewPath(r.jobId));
          }}
          className="font-bold text-primary hover:underline text-left"
        >
          {r.hbl}
        </button>
      </td>
      <td className={clsx(tdBase, 'max-w-[200px]')}>
        <span className="line-clamp-2" title={r.cont}>
          {r.cont}
        </span>
      </td>
      <td className={clsx(tdBase, 'max-w-[200px]')}>
        <span className="line-clamp-2" title={r.shpr}>
          {r.shpr}
        </span>
      </td>
      <td className={clsx(tdBase, 'max-w-[200px]')}>
        <span className="line-clamp-2" title={r.cnee}>
          {r.cnee}
        </span>
      </td>
      <td className={tdBase}>{r.salesman}</td>
      <td className={tdBase}>{r.pol}</td>
      <td className={tdBase}>{r.pod}</td>
      <td className={tdBase}>{r.etd}</td>
      <td className={tdBase}>{r.eta}</td>
      <td className={tdBase}>{r.atd}</td>
      <td className={tdBase}>{r.ata}</td>
      <td className={tdBase}>
        <span className="text-[11px] font-semibold text-slate-600">{r.status}</span>
      </td>
      <td className="px-3 py-3 text-[12px] text-slate-700">
        <span className="line-clamp-2" title={r.operators}>
          {r.operators}
        </span>
      </td>
    </tr>
  );

  const emptyMessage =
    searchText.trim() && filteredRows.length === 0
      ? 'No rows match your search on this page.'
      : 'No jobs in this page range.';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col -mt-2 min-h-0">
      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
        <div className="md:hidden flex items-center gap-2 p-3 border-b border-border">
          <button
            type="button"
            onClick={() => navigate('/shipping')}
            className="p-2 rounded-xl border border-border bg-white text-muted-foreground shrink-0"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              type="text"
              placeholder="Search MBL, HBL, parties, ports…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-muted/20 border border-border rounded-xl text-[13px] font-medium"
            />
          </div>
          <button
            type="button"
            onClick={() => void fetchData()}
            className="p-2 rounded-xl border border-border bg-white text-muted-foreground shrink-0"
            title="Refresh"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="hidden md:block p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => navigate('/shipping')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0"
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <div className="relative flex-1 max-w-sm min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  placeholder="Search MBL, HBL, parties, ports…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-8 py-1.5 bg-muted/20 border border-border rounded-xl text-[13px] font-medium"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void fetchData()}
                className="px-3 py-1.5 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all"
                title="Refresh"
              >
                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        <div className="md:hidden flex-1 overflow-x-auto p-3 min-h-0">
          <div className="min-w-[1200px]">
            <table className="w-full border-separate border-spacing-0 text-left">
              <thead>
                {renderTableHead()}
              </thead>
              <tbody className="divide-y divide-border/60 bg-white">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={COL_COUNT} className="px-4 py-4 bg-slate-50/30 border-b border-border/40" />
                    </tr>
                  ))
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={COL_COUNT} className="px-4 py-16 text-center text-[13px] text-muted-foreground italic">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(renderRow)
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="hidden md:flex flex-col flex-1 min-h-0 border-t border-border">
          <div className="flex-1 overflow-auto bg-slate-50/20 max-h-[calc(100vh-320px)]">
            <div className="min-w-[1200px] md:min-w-0">
              <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  {renderTableHead()}
                </thead>
                <tbody className="divide-y divide-border/60 bg-white">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={COL_COUNT} className="px-4 py-4 bg-slate-50/30 border-b border-border/40" />
                      </tr>
                    ))
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={COL_COUNT} className="px-4 py-16 text-center text-[13px] text-muted-foreground italic">
                        {emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map(renderRow)
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-border bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="text-[12px] font-medium text-slate-500">
            Showing <b>{showingFrom}</b> – <b>{showingTo}</b> of <b>{total}</b> job(s)
            {searchText.trim() ? (
              <span className="text-muted-foreground">
                {' '}
                · <b>{filteredRows.length}</b> visible on this page after filter
              </span>
            ) : null}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-3 text-[12px] font-bold text-slate-600">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseSeaBlListPage;
