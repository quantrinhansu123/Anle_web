import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Plus, Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import {
  salesChargeCatalogService,
  type SalesChargeCatalog,
} from '../../../services/salesChargeCatalogService';
import { useToastContext } from '../../../contexts/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** When user picks a row to apply to the quotation line */
  onPick: (item: SalesChargeCatalog) => void;
  allowCreate: boolean;
  /** After a successful create — sync outer list (dropdown) */
  onCreated?: (item: SalesChargeCatalog) => void;
}

export const SalesChargeCatalogDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onPick,
  allowCreate,
  onCreated,
}) => {
  const { success: toastSuccess, error: toastError } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SalesChargeCatalog[]>([]);
  const [filter, setFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await salesChargeCatalogService.getAll();
        if (!cancelled) setRows(list);
      } catch (e: unknown) {
        if (!cancelled) toastError(e instanceof Error ? e.message : 'Failed to load catalog');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, toastError]);

  useEffect(() => {
    if (!isOpen) {
      setFilter('');
      setNewCode('');
      setNewName('');
      setNewType('');
      setShowAddForm(false);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.freight_code.toLowerCase().includes(q) ||
        r.charge_name.toLowerCase().includes(q) ||
        r.charge_type.toLowerCase().includes(q),
    );
  }, [rows, filter]);

  const handleCreate = async () => {
    const freight_code = newCode.trim();
    const charge_name = newName.trim();
    const charge_type = newType.trim();
    if (!freight_code || !charge_name || !charge_type) {
      toastError('Enter freight code, charge name, and charge type');
      return;
    }
    setCreating(true);
    try {
      const item = await salesChargeCatalogService.create({
        freight_code,
        charge_name,
        charge_type,
      });
      setRows((prev) =>
        [...prev.filter((x) => x.id !== item.id), item].sort((a, b) =>
          a.freight_code.localeCompare(b.freight_code),
        ),
      );
      onCreated?.(item);
      toastSuccess('Charge added to catalog');
      setNewCode('');
      setNewName('');
      setNewType('');
    } catch (e: unknown) {
      toastError(e instanceof Error ? e.message : 'Could not add charge');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-border w-full max-w-3xl max-h-[min(90vh,720px)] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sales-charge-catalog-title"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 id="sales-charge-catalog-title" className="text-[16px] font-black text-slate-900">
              Charge catalog
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Pick a row to apply to the quotation line{allowCreate ? ', or use Add to register a new charge.' : '.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-border text-slate-500 hover:bg-slate-50 transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter by code, name, or type…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-[13px] bg-white"
              />
            </div>
            {allowCreate && (
              <button
                type="button"
                onClick={() => setShowAddForm((v) => !v)}
                aria-expanded={showAddForm}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-[12px] font-bold shadow-md shadow-primary/20 hover:bg-primary/90"
              >
                <Plus size={14} />
                {showAddForm ? 'Hide' : 'Add'}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-[13px]">
              <Loader2 size={18} className="animate-spin" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-[13px] text-muted-foreground">No matching rows.</p>
          ) : (
            <table className="w-full text-left text-[12px]">
              <thead className="sticky top-0 bg-slate-50 border-b border-border z-[1]">
                <tr>
                  <th className="px-4 py-2.5 font-bold text-muted-foreground uppercase">Freight code</th>
                  <th className="px-4 py-2.5 font-bold text-muted-foreground uppercase">Charge name</th>
                  <th className="px-4 py-2.5 font-bold text-muted-foreground uppercase">Charge type</th>
                  <th className="px-4 py-2.5 font-bold text-muted-foreground uppercase text-right w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 hover:bg-slate-50/80">
                    <td className="px-4 py-2 font-semibold text-slate-800">{row.freight_code}</td>
                    <td className="px-4 py-2 text-slate-700">{row.charge_name}</td>
                    <td className="px-4 py-2 text-slate-600">{row.charge_type}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          onPick(row);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/15"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {allowCreate && showAddForm && (
          <div className="border-t border-border px-5 py-4 bg-muted/10 shrink-0 space-y-3">
            <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-wide">Add new charge</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">Freight code</label>
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-[13px]"
                  placeholder="e.g. AIR-FRT"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-muted-foreground">Charge name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-[13px]"
                  placeholder="Display name"
                />
              </div>
              <div className="space-y-1 sm:col-span-3">
                <label className="text-[11px] font-bold text-muted-foreground">Charge type</label>
                <input
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-[13px]"
                  placeholder="e.g. Freight, Surcharge…"
                />
              </div>
            </div>
            <button
              type="button"
              disabled={creating}
              onClick={handleCreate}
              className={clsx(
                'inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-[12px] font-bold shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50',
              )}
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add to catalog
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
