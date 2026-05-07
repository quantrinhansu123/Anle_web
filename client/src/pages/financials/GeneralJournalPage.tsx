import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Plus, RefreshCcw, Save, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useToastContext } from '../../contexts/ToastContext';
import {
  generalJournalService,
  type CreateGeneralJournalEntryDto,
  type GeneralJournalEntry,
} from '../../services/generalJournalService';

const th = 'px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-border/40 whitespace-nowrap';
const td = 'px-3 py-2 text-[12px] border-b border-border/40 align-middle';

type DraftRow = {
  id: string;
  posting_date: string;
  voucher_no: string;
  voucher_date: string;
  description: string;
  line_no: string;
  account_code: string;
  debit: string;
  credit: string;
  isNew?: boolean;
  dirty?: boolean;
  saving?: boolean;
};

const emptyDraft = (): DraftRow => ({
  id: `new_${crypto.randomUUID()}`,
  posting_date: new Date().toISOString().slice(0, 10),
  voucher_no: '',
  voucher_date: '',
  description: '',
  line_no: '',
  account_code: '',
  debit: '',
  credit: '',
  isNew: true,
  dirty: true,
});

const toNumber = (s: string) => {
  const n = Number(String(s || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export default function GeneralJournalPage() {
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DraftRow[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await generalJournalService.list(1, 500);
      const mapped = (Array.isArray(data) ? data : []).map((r: GeneralJournalEntry): DraftRow => ({
        id: r.id,
        posting_date: r.posting_date || '',
        voucher_no: r.voucher_no || '',
        voucher_date: r.voucher_date || '',
        description: r.description || '',
        line_no: r.line_no != null ? String(r.line_no) : '',
        account_code: r.account_code || '',
        debit: r.debit != null ? String(r.debit) : '',
        credit: r.credit != null ? String(r.credit) : '',
        isNew: false,
        dirty: false,
      }));
      setRows(mapped);
    } catch (e: any) {
      error(e?.message || 'Failed to load journal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const addRow = () => setRows((p) => [emptyDraft(), ...p]);

  const updateRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((p) => p.map((r) => (r.id === id ? { ...r, ...patch, dirty: true } : r)));
  };

  const removeRow = async (r: DraftRow) => {
    if (r.isNew) {
      setRows((p) => p.filter((x) => x.id !== r.id));
      return;
    }
    try {
      await generalJournalService.remove(r.id);
      setRows((p) => p.filter((x) => x.id !== r.id));
      success('Deleted');
    } catch (e: any) {
      error(e?.message || 'Failed to delete');
    }
  };

  const saveRow = async (r: DraftRow) => {
    const dto: CreateGeneralJournalEntryDto = {
      posting_date: r.posting_date,
      voucher_no: r.voucher_no || null,
      voucher_date: r.voucher_date || null,
      description: r.description || null,
      line_no: r.line_no ? Number(r.line_no) : null,
      account_code: r.account_code || null,
      debit: toNumber(r.debit),
      credit: toNumber(r.credit),
    };
    if (!dto.posting_date) {
      error('Posting date is required');
      return;
    }

    updateRow(r.id, { saving: true });
    try {
      const saved = r.isNew
        ? await generalJournalService.create(dto)
        : await generalJournalService.update(r.id, dto);
      setRows((p) =>
        p.map((x) =>
          x.id === r.id
            ? {
                id: saved.id,
                posting_date: saved.posting_date || '',
                voucher_no: saved.voucher_no || '',
                voucher_date: saved.voucher_date || '',
                description: saved.description || '',
                line_no: saved.line_no != null ? String(saved.line_no) : '',
                account_code: saved.account_code || '',
                debit: saved.debit != null ? String(saved.debit) : '',
                credit: saved.credit != null ? String(saved.credit) : '',
                isNew: false,
                dirty: false,
                saving: false,
              }
            : x,
        ),
      );
      success('Saved');
    } catch (e: any) {
      updateRow(r.id, { saving: false });
      error(e?.message || 'Failed to save');
    }
  };

  const dirtyCount = useMemo(() => rows.filter((r) => r.dirty).length, [rows]);

  return (
    <div className="animate-in fade-in duration-300 w-full flex-1 flex flex-col min-h-0 -mt-2 bg-muted/30">
      <div className="flex flex-col gap-4 px-4 md:px-6 py-4 md:py-6 w-full max-w-none flex-1 min-h-0">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4 md:p-5 shrink-0 space-y-3 w-full min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate('/finance')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-[11px] font-bold bg-white shrink-0"
              >
                <ChevronLeft size={14} />
                Back
              </button>
              <h1 className="mt-2 text-lg md:text-xl font-black text-foreground tracking-tight">
                General Journal
              </h1>
              <p className="text-[12px] text-muted-foreground font-medium">
                Posting date, voucher no/date, description, line, account code, debit/credit.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void fetchData()}
                className="px-3 py-2 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all shadow-sm"
                title="Refresh"
              >
                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[12px] font-black text-white shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-95"
              >
                <Plus size={16} />
                New row
              </button>
            </div>
          </div>

          {dirtyCount > 0 && (
            <div className="text-[12px] font-bold text-amber-700">
              {dirtyCount} row(s) have unsaved changes.
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 min-h-0">
          <div className="w-full overflow-auto">
            <table className="min-w-[1400px] w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                <tr>
                  <th className={th}>Posting date</th>
                  <th className={th}>Voucher no</th>
                  <th className={th}>Voucher date</th>
                  <th className={th}>Description</th>
                  <th className={th}>Line</th>
                  <th className={th}>Account</th>
                  <th className={clsx(th, 'text-right')}>Debit</th>
                  <th className={clsx(th, 'text-right')}>Credit</th>
                  <th className={clsx(th, 'text-center')}>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={clsx(td, 'py-12 text-center text-muted-foreground italic')}>
                      {loading ? 'Loading…' : 'No data. Click “New row” to add.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className={clsx('hover:bg-slate-50/60', r.dirty && 'bg-amber-50/40')}>
                      <td className={td}>
                        <input
                          type="date"
                          value={r.posting_date}
                          onChange={(e) => updateRow(r.id, { posting_date: e.target.value })}
                          className="w-[150px] rounded-lg border border-border bg-white px-2 py-1 text-[12px] font-bold"
                        />
                      </td>
                      <td className={td}>
                        <input
                          value={r.voucher_no}
                          onChange={(e) => updateRow(r.id, { voucher_no: e.target.value })}
                          className="w-[170px] rounded-lg border border-border bg-white px-2 py-1 text-[12px]"
                        />
                      </td>
                      <td className={td}>
                        <input
                          type="date"
                          value={r.voucher_date}
                          onChange={(e) => updateRow(r.id, { voucher_date: e.target.value })}
                          className="w-[150px] rounded-lg border border-border bg-white px-2 py-1 text-[12px]"
                        />
                      </td>
                      <td className={td}>
                        <input
                          value={r.description}
                          onChange={(e) => updateRow(r.id, { description: e.target.value })}
                          className="w-[420px] rounded-lg border border-border bg-white px-2 py-1 text-[12px]"
                        />
                      </td>
                      <td className={td}>
                        <input
                          value={r.line_no}
                          onChange={(e) => updateRow(r.id, { line_no: e.target.value })}
                          className="w-[80px] rounded-lg border border-border bg-white px-2 py-1 text-[12px]"
                        />
                      </td>
                      <td className={td}>
                        <input
                          value={r.account_code}
                          onChange={(e) => updateRow(r.id, { account_code: e.target.value })}
                          className="w-[120px] rounded-lg border border-border bg-white px-2 py-1 text-[12px] font-bold"
                        />
                      </td>
                      <td className={clsx(td, 'text-right')}>
                        <input
                          value={r.debit}
                          onChange={(e) => updateRow(r.id, { debit: e.target.value })}
                          className="w-[140px] rounded-lg border border-border bg-white px-2 py-1 text-[12px] text-right tabular-nums"
                        />
                      </td>
                      <td className={clsx(td, 'text-right')}>
                        <input
                          value={r.credit}
                          onChange={(e) => updateRow(r.id, { credit: e.target.value })}
                          className="w-[140px] rounded-lg border border-border bg-white px-2 py-1 text-[12px] text-right tabular-nums"
                        />
                      </td>
                      <td className={clsx(td, 'text-center')}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void saveRow(r)}
                            disabled={Boolean(r.saving) || !r.dirty}
                            className={clsx(
                              'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-black shadow-sm transition-all',
                              r.dirty
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                            )}
                            title="Save"
                          >
                            <Save size={14} />
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeRow(r)}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-black bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                            title="Delete"
                          >
                            <Trash2 size={14} />
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
    </div>
  );
}

