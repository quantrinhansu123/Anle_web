import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Download, Plus, RefreshCcw, Save, Trash2, Upload } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useToastContext } from '../../contexts/ToastContext';
import {
  accountDictionaryService,
  type AccountDictionaryRow,
  type CreateAccountDictionaryDto,
} from '../../services/accountDictionaryService';

const th = 'px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-border/40 whitespace-nowrap';
const td = 'px-3 py-2 text-[12px] border-b border-border/40 align-middle';

type DraftRow = {
  id: string;
  account_code: string;
  name_vi: string;
  name_en: string;
  form_template: string;
  level1_code: string;
  isNew?: boolean;
  dirty?: boolean;
  saving?: boolean;
};

const emptyDraft = (): DraftRow => ({
  id: `new_${crypto.randomUUID()}`,
  account_code: '',
  name_vi: '',
  name_en: '',
  form_template: '',
  level1_code: '',
  isNew: true,
  dirty: true,
});

function normalizeHeaderKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export default function AccountsEnglishPage() {
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const rowsRef = useRef<DraftRow[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await accountDictionaryService.list(1, 500);
      const mapped = (Array.isArray(data) ? data : []).map((r: AccountDictionaryRow): DraftRow => ({
        id: r.id,
        account_code: r.account_code || '',
        name_vi: r.name_vi || '',
        name_en: r.name_en || '',
        form_template: r.form_template || '',
        level1_code: r.level1_code || '',
        isNew: false,
        dirty: false,
      }));
      setRows(mapped);
    } catch (e: any) {
      error(e?.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    // Keep selection valid when rows change (e.g. after refresh/import/delete).
    const existing = new Set(rows.filter((r) => !r.isNew).map((r) => r.id));
    setSelectedIds((prev) => prev.filter((id) => existing.has(id)));
  }, [rows]);

  const addRow = () => setRows((p) => [emptyDraft(), ...p]);

  const updateRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((p) =>
      p.map((r) => (r.id === id ? { ...r, ...patch, dirty: true } : r)),
    );
  };

  const toggleSelectAll = () => {
    const selectable = rows.filter((r) => !r.isNew).map((r) => r.id);
    if (selectedIds.length === selectable.length) setSelectedIds([]);
    else setSelectedIds(selectable);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const bulkDeleteSelected = async () => {
    const targets = rows.filter((r) => selectedIds.includes(r.id) && !r.isNew);
    if (!targets.length) return;
    let ok = 0;
    let fail = 0;
    const deletedIds: string[] = [];
    for (const r of targets) {
      try {
        await accountDictionaryService.remove(r.id);
        ok++;
        deletedIds.push(r.id);
      } catch (e) {
        console.error(e);
        fail++;
      }
    }
    if (deletedIds.length) {
      setRows((p) => p.filter((r) => !deletedIds.includes(r.id)));
    }
    setSelectedIds((p) => p.filter((id) => !deletedIds.includes(id)));
    if (ok) success(`Deleted ${ok} row(s)`);
    if (fail) error(`Failed to delete ${fail} row(s). (Server may be missing table account_dictionary)`);
  };

  const removeRow = async (r: DraftRow) => {
    if (r.isNew) {
      setRows((p) => p.filter((x) => x.id !== r.id));
      return;
    }
    try {
      await accountDictionaryService.remove(r.id);
      setRows((p) => p.filter((x) => x.id !== r.id));
      success('Deleted');
    } catch (e: any) {
      error(e?.message || 'Failed to delete');
    }
  };

  const saveRow = async (r: DraftRow) => {
    const dto: CreateAccountDictionaryDto = {
      account_code: r.account_code.trim(),
      name_vi: r.name_vi,
      name_en: r.name_en,
      form_template: r.form_template || null,
      level1_code: r.level1_code || null,
    };
    if (!dto.account_code) {
      error('Account code is required');
      return;
    }

    updateRow(r.id, { saving: true });
    try {
      const saved = r.isNew
        ? await accountDictionaryService.create(dto)
        : await accountDictionaryService.update(r.id, dto);

      setRows((p) =>
        p.map((x) =>
          x.id === r.id
            ? {
                id: saved.id,
                account_code: saved.account_code || '',
                name_vi: saved.name_vi || '',
                name_en: saved.name_en || '',
                form_template: saved.form_template || '',
                level1_code: saved.level1_code || '',
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

  const saveAll = async () => {
    const ids = rowsRef.current.filter((r) => r.dirty).map((r) => r.id);
    if (!ids.length) return;

    let ok = 0;
    let fail = 0;

    for (const id of ids) {
      const r = rowsRef.current.find((x) => x.id === id);
      if (!r || !r.dirty) continue;
      try {
        await saveRow(r);
        ok++;
      } catch (e) {
        console.error(e);
        fail++;
      }
    }

    if (ok) success(`Saved ${ok} row(s)`);
    if (fail) error(`Failed to save ${fail} row(s)`);
  };

  const downloadTemplate = () => {
    const header = ['Mã tài khoản', 'Tên tài khoản', 'In English', 'Mẫu phiếu', 'TK cấp 1'];
    const sample = [
      {
        'Mã tài khoản': '111',
        'Tên tài khoản': 'Tiền mặt',
        'In English': 'Cash on hand',
        'Mẫu phiếu': '',
        'TK cấp 1': '',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample, { header });
    XLSX.utils.sheet_add_aoa(ws, [header], { origin: 'A1' });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Accounts');
    XLSX.writeFile(wb, `Accounts_Template_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const importFromFile = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
    if (!json.length) {
      error('File is empty');
      return;
    }

    const keys = Object.keys(json[0] || {});
    const map = new Map<string, string>();
    for (const k of keys) map.set(normalizeHeaderKey(k), k);

    const pick = (row: Record<string, unknown>, norm: string) => row[map.get(norm) || ''];

    const dtos: CreateAccountDictionaryDto[] = json
      .map((r) => {
        const account_code = String(pick(r, 'ma tai khoan') || pick(r, 'account code') || '').trim();
        if (!account_code) return null;
        return {
          account_code,
          name_vi: String(pick(r, 'ten tai khoan') || pick(r, 'ten tk') || '').trim(),
          name_en: String(pick(r, 'in english') || pick(r, 'ten tieng anh') || pick(r, 'english') || '').trim(),
          form_template: String(pick(r, 'mau phieu') || '').trim() || null,
          level1_code: String(pick(r, 'tk cap 1') || pick(r, 'cap 1') || '').trim() || null,
        } as CreateAccountDictionaryDto;
      })
      .filter(Boolean) as CreateAccountDictionaryDto[];

    if (dtos.length === 0) {
      error('No valid rows found (missing Account code)');
      return;
    }

    let ok = 0;
    let fail = 0;
    // Simple sequential import to avoid rate limits.
    for (const dto of dtos) {
      try {
        await accountDictionaryService.create(dto);
        ok++;
      } catch (e) {
        console.error(e);
        fail++;
      }
    }

    await fetchData();
    if (ok) success(`Imported ${ok} row(s)`);
    if (fail) error(`Failed to import ${fail} row(s). (Server may be missing table account_dictionary)`);
  };

  const onUpload = async (f?: File | null) => {
    if (!f) return;
    try {
      await importFromFile(f);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const dirtyCount = useMemo(() => rows.filter((r) => r.dirty).length, [rows]);
  const selectableCount = useMemo(() => rows.filter((r) => !r.isNew).length, [rows]);

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
                Accounts
              </h1>
              <p className="text-[12px] text-muted-foreground font-medium">
                Account code, Vietnamese name, English name, form template, level 1 account.
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
                onClick={() => void saveAll()}
                disabled={dirtyCount === 0}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-black shadow-sm active:scale-95',
                  dirtyCount === 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-border'
                    : 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700',
                )}
                title="Save all"
              >
                <Save size={16} />
                Save all
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => void onUpload(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-[12px] font-black text-slate-700 shadow-sm hover:bg-muted active:scale-95"
                title="Download template"
              >
                <Download size={16} />
                Template
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-[12px] font-black text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95"
                title="Upload Excel"
              >
                <Upload size={16} />
                Upload
              </button>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => void bulkDeleteSelected()}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-[12px] font-black text-white shadow-md shadow-red-600/20 hover:bg-red-700 active:scale-95"
                  title="Delete selected"
                >
                  <Trash2 size={16} />
                  Delete ({selectedIds.length})
                </button>
              )}
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
            <table className="min-w-[1200px] w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                <tr>
                  <th className={clsx(th, 'w-12 text-center')}>
                    <input
                      type="checkbox"
                      checked={selectableCount > 0 && selectedIds.length === selectableCount}
                      onChange={toggleSelectAll}
                      className="rounded border-border"
                      aria-label="Select all"
                    />
                  </th>
                  <th className={th}>Mã tài khoản</th>
                  <th className={th}>Tên tài khoản</th>
                  <th className={th}>In English</th>
                  <th className={th}>Mẫu phiếu</th>
                  <th className={th}>TK cấp 1</th>
                  <th className={clsx(th, 'text-center')}>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={clsx(td, 'py-12 text-center text-muted-foreground italic')}>
                      {loading ? 'Loading…' : 'No data. Click “New row” to add.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className={clsx('hover:bg-slate-50/60', r.dirty && 'bg-amber-50/40')}>
                      <td className={clsx(td, 'text-center')} onClick={(e) => e.stopPropagation()}>
                        {!r.isNew ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(r.id)}
                            onChange={() => toggleSelect(r.id)}
                            className="rounded border-border"
                            aria-label={`Select ${r.account_code || r.id}`}
                          />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className={td}>
                        <input
                          value={r.account_code}
                          onChange={(e) => updateRow(r.id, { account_code: e.target.value })}
                          className="w-[140px] rounded-lg border border-border bg-white px-2 py-1 text-[12px] font-bold"
                        />
                      </td>
                      <td className={td}>
                        <input
                          value={r.name_vi}
                          onChange={(e) => updateRow(r.id, { name_vi: e.target.value })}
                          className="w-[280px] rounded-lg border border-border bg-white px-2 py-1 text-[12px]"
                        />
                      </td>
                      <td className={td}>
                        <input
                          value={r.name_en}
                          onChange={(e) => updateRow(r.id, { name_en: e.target.value })}
                          className="w-[340px] rounded-lg border border-border bg-white px-2 py-1 text-[12px]"
                        />
                      </td>
                      <td className={td}>
                        <input
                          value={r.form_template}
                          onChange={(e) => updateRow(r.id, { form_template: e.target.value })}
                          className="w-[160px] rounded-lg border border-border bg-white px-2 py-1 text-[12px]"
                        />
                      </td>
                      <td className={td}>
                        <input
                          value={r.level1_code}
                          onChange={(e) => updateRow(r.id, { level1_code: e.target.value })}
                          className="w-[120px] rounded-lg border border-border bg-white px-2 py-1 text-[12px]"
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

