import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, Search, Upload } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useToastContext } from '../../contexts/ToastContext';

type BalanceAccountRow = {
  accountCode: string;
  accountName: string;
  parentAccountCode?: string;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  endingDebit: number;
  endingCredit: number;
};

const th = 'px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-border/40 whitespace-nowrap';
const td = 'px-3 py-2 text-[12px] border-b border-border/40 align-middle';

const toNumber = (v: unknown): number => {
  if (v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const s = String(v).replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const money = (n: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(n || 0));

function normalizeHeaderKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export default function BalanceAccountsPage() {
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [rows, setRows] = useState<BalanceAccountRow[]>([]);
  const [search, setSearch] = useState('');

  const parseSheet = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

    if (!json.length) {
      setRows([]);
      return;
    }

    // Build header map from first row keys
    const keys = Object.keys(json[0] || {});
    const map = new Map<string, string>();
    for (const k of keys) map.set(normalizeHeaderKey(k), k);

    const pick = (row: Record<string, unknown>, norm: string) => row[map.get(norm) || ''];

    const out: BalanceAccountRow[] = json.map((r) => {
      const accountCode = String(
        pick(r, 'so hieu tk') ||
          pick(r, 'so hieu') ||
          pick(r, 'account') ||
          pick(r, 'account code') ||
          '',
      ).trim();
      const accountName = String(pick(r, 'ten tk') || pick(r, 'ten') || pick(r, 'account name') || '').trim();
      const parentAccountCode = String(pick(r, 'so hieu tk cap cha') || pick(r, 'cap cha') || '').trim() || undefined;

      return {
        accountCode,
        accountName,
        parentAccountCode,
        openingDebit: toNumber(pick(r, 'so du dau ky no') || pick(r, 'dau ky no')),
        openingCredit: toNumber(pick(r, 'so du dau ky co') || pick(r, 'dau ky co')),
        periodDebit: toNumber(pick(r, 'so phat sinh trong ky no') || pick(r, 'phat sinh no')),
        periodCredit: toNumber(pick(r, 'so phat sinh trong ky co') || pick(r, 'phat sinh co')),
        endingDebit: toNumber(pick(r, 'so du cuoi ky no') || pick(r, 'cuoi ky no')),
        endingCredit: toNumber(pick(r, 'so du cuoi ky co') || pick(r, 'cuoi ky co')),
      };
    }).filter((x) => x.accountCode || x.accountName);

    setRows(out);
  };

  const onUpload = async (f?: File | null) => {
    if (!f) return;
    try {
      await parseSheet(f);
      success('Loaded balance accounts');
    } catch (e: any) {
      console.error(e);
      error(e?.message || 'Failed to parse file');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.accountCode || '').toLowerCase().includes(q) || (r.accountName || '').toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <div className="animate-in fade-in duration-300 w-full flex-1 flex flex-col min-h-0 -mt-2 bg-muted/30">
      <div className="flex flex-col gap-4 px-4 md:px-6 py-4 md:py-6 w-full max-w-none flex-1 min-h-0">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4 md:p-5 shrink-0 space-y-4 w-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <button
                type="button"
                onClick={() => navigate('/finance')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-[11px] font-bold bg-white shrink-0"
              >
                <ChevronLeft size={14} />
                Back
              </button>
              <h1 className="text-lg md:text-xl font-black text-foreground tracking-tight">Balance Accounts</h1>
              <p className="text-[12px] text-muted-foreground font-medium">
                Upload Excel to view trial balance by account (opening / period / ending).
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <div className="relative w-full sm:w-[360px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search account code or name…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-white text-[13px] font-medium"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => void onUpload(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[12px] font-black text-white shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-95"
                >
                  <Upload size={16} />
                  Upload Excel
                </button>
                <button
                  type="button"
                  onClick={() => { setRows([]); setSearch(''); }}
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[12px] font-bold shadow-sm',
                    rows.length ? 'border-border bg-white text-slate-700 hover:bg-muted' : 'border-border bg-white text-slate-400 cursor-not-allowed',
                  )}
                  disabled={!rows.length}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 min-h-0">
          <div className="w-full overflow-auto">
            <table className="min-w-[1300px] w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                <tr>
                  <th className={th}>Account code</th>
                  <th className={th}>Account name</th>
                  <th className={th}>Parent</th>
                  <th className={clsx(th, 'text-right')}>Opening debit</th>
                  <th className={clsx(th, 'text-right')}>Opening credit</th>
                  <th className={clsx(th, 'text-right')}>Period debit</th>
                  <th className={clsx(th, 'text-right')}>Period credit</th>
                  <th className={clsx(th, 'text-right')}>Ending debit</th>
                  <th className={clsx(th, 'text-right')}>Ending credit</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={clsx(td, 'py-12 text-center text-muted-foreground italic')}>
                      Upload an Excel file to view data.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, idx) => (
                    <tr key={`${r.accountCode}-${idx}`} className="hover:bg-slate-50/60">
                      <td className={clsx(td, 'font-mono text-[11px] text-slate-700')}>{r.accountCode}</td>
                      <td className={clsx(td, 'font-medium text-slate-800')}>{r.accountName}</td>
                      <td className={clsx(td, 'font-mono text-[11px] text-slate-600')}>{r.parentAccountCode || '—'}</td>
                      <td className={clsx(td, 'text-right tabular-nums')}>{money(r.openingDebit)}</td>
                      <td className={clsx(td, 'text-right tabular-nums')}>{money(r.openingCredit)}</td>
                      <td className={clsx(td, 'text-right tabular-nums')}>{money(r.periodDebit)}</td>
                      <td className={clsx(td, 'text-right tabular-nums')}>{money(r.periodCredit)}</td>
                      <td className={clsx(td, 'text-right tabular-nums font-bold')}>{money(r.endingDebit)}</td>
                      <td className={clsx(td, 'text-right tabular-nums font-bold')}>{money(r.endingCredit)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

