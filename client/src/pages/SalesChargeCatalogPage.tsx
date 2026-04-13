import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Search, Star, Loader2, Trash2, Edit, X, Check,
  ChevronLeft, ChevronRight, Filter, LayoutGrid, List,
  FolderOpen, Heart
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  salesChargeCatalogService,
  type SalesChargeCatalog,
} from '../services/salesChargeCatalogService';
import { useToastContext } from '../contexts/ToastContext';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

/* ─── Constants ─── */
const PAGE_SIZE = 80;
const CHARGE_TYPE_COLORS: Record<string, string> = {
  'Freight': 'bg-blue-50 text-blue-700 border-blue-200',
  'Local Charge': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Surcharge': 'bg-amber-50 text-amber-700 border-amber-200',
  'Pay On Behalf': 'bg-violet-50 text-violet-700 border-violet-200',
};
const getChargeTypeStyle = (type: string) =>
  CHARGE_TYPE_COLORS[type] || 'bg-slate-50 text-slate-700 border-slate-200';

/* ─── Add / Edit Dialog ─── */
interface ChargeFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { freight_code: string; charge_name: string; charge_type: string; default_price: number }) => Promise<void>;
  initialData?: SalesChargeCatalog | null;
  isSubmitting: boolean;
}

const ChargeFormDialog: React.FC<ChargeFormDialogProps> = ({
  isOpen, onClose, onSubmit, initialData, isSubmitting,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCode(initialData?.freight_code ?? '');
      setName(initialData?.charge_name ?? '');
      setType(initialData?.charge_type ?? '');
      setPrice(initialData?.default_price?.toString() ?? '1');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isEdit = !!initialData;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-border w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-black text-slate-900">
            {isEdit ? 'Edit Charge' : 'Add New Charge'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl border border-border text-slate-500 hover:bg-slate-50 transition-colors">
            <X size={16} />
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onSubmit({
              freight_code: code.trim(),
              charge_name: name.trim(),
              charge_type: type.trim(),
              default_price: parseFloat(price) || 1,
            });
          }}
          className="px-5 py-4 space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Freight Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g. AIR-FRT"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Charge Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g. Air Freight"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Charge Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-border text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select type...</option>
                <option value="Freight">Freight</option>
                <option value="Local Charge">Local Charge</option>
                <option value="Surcharge">Surcharge</option>
                <option value="Pay On Behalf">Pay On Behalf</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Default Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="1.00"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-[12px] font-bold shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : isEdit ? <Check size={14} /> : <Plus size={14} />}
              {isEdit ? 'Save Changes' : 'Add Charge'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

/* ─── Main Page ─── */
const SalesChargeCatalogPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToastContext();

  // Data
  const [rows, setRows] = useState<SalesChargeCatalog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // CRUD dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SalesChargeCatalog | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ─── Fetch ─── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await salesChargeCatalogService.getAll();
      setRows(list);
    } catch (e: unknown) {
      toastError(e instanceof Error ? e.message : 'Failed to load charge catalog');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ─── Filtering & Pagination ─── */
  const chargeTypes = useMemo(() => {
    const set = new Set(rows.map((r) => r.charge_type));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let result = rows;
    const q = searchText.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.freight_code.toLowerCase().includes(q) ||
          r.charge_name.toLowerCase().includes(q) ||
          r.charge_type.toLowerCase().includes(q),
      );
    }
    if (filterType) {
      result = result.filter((r) => r.charge_type === filterType);
    }
    if (showFavoritesOnly) {
      result = result.filter((r) => r.is_favorite);
    }
    return result;
  }, [rows, searchText, filterType, showFavoritesOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterType, showFavoritesOnly]);

  /* ─── Handlers ─── */
  const handleToggleFavorite = async (item: SalesChargeCatalog) => {
    const newVal = !item.is_favorite;
    // Optimistic
    setRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, is_favorite: newVal } : r)));
    try {
      await salesChargeCatalogService.update(item.id, { is_favorite: newVal });
    } catch (e: unknown) {
      // Revert
      setRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, is_favorite: !newVal } : r)));
      toastError(e instanceof Error ? e.message : 'Failed to update');
    }
  };

  const handleFormSubmit = async (data: { freight_code: string; charge_name: string; charge_type: string; default_price: number }) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        const updated = await salesChargeCatalogService.update(editingItem.id, data);
        setRows((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r)).sort((a, b) =>
            a.freight_code.localeCompare(b.freight_code),
          ),
        );
        toastSuccess('Charge updated successfully');
      } else {
        const created = await salesChargeCatalogService.create(data);
        setRows((prev) =>
          [...prev, created].sort((a, b) => a.freight_code.localeCompare(b.freight_code)),
        );
        toastSuccess('Charge added to catalog');
      }
      setFormOpen(false);
      setEditingItem(null);
    } catch (e: unknown) {
      toastError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await salesChargeCatalogService.delete(deletingId);
      setRows((prev) => prev.filter((r) => r.id !== deletingId));
      toastSuccess('Charge deleted successfully');
      setConfirmDeleteOpen(false);
      setDeletingId(null);
    } catch (e: unknown) {
      toastError(e instanceof Error ? e.message : 'Failed to delete charge');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (item: SalesChargeCatalog) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const openAdd = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setConfirmDeleteOpen(true);
  };

  const formatPrice = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 1);

  /* ─── Render ─── */
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col min-h-0 -mt-2">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <FolderOpen size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-[18px] font-black text-slate-900 leading-tight">Transport Services</h1>
          <p className="text-[12px] text-muted-foreground">Manage freight charge catalog and transport services</p>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-2">
          {/* Add button */}
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-[12px] font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus size={15} />
            NEW
          </button>

          <div className="w-px h-7 bg-border mx-1 hidden sm:block" />

          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterType(filterType ? '' : chargeTypes[0] || '')}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-bold transition-all',
                filterType
                  ? 'bg-primary/5 border-primary text-primary'
                  : 'bg-white border-border text-muted-foreground hover:bg-slate-50',
              )}
            >
              <Filter size={14} />
              Filter
            </button>
          </div>

          {/* Charge type pills */}
          {chargeTypes.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setFilterType('')}
                className={clsx(
                  'px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all whitespace-nowrap',
                  !filterType ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white border-border text-slate-500 hover:bg-slate-50',
                )}
              >
                All
              </button>
              {chargeTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(filterType === t ? '' : t)}
                  className={clsx(
                    'px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all whitespace-nowrap',
                    filterType === t ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white border-border text-slate-500 hover:bg-slate-50',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1" />

          {/* Favorites toggle */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-bold transition-all',
              showFavoritesOnly
                ? 'bg-amber-50 border-amber-300 text-amber-600'
                : 'bg-white border-border text-muted-foreground hover:bg-slate-50',
            )}
          >
            <Star size={14} className={showFavoritesOnly ? 'fill-amber-400' : ''} />
            Favorites
          </button>

          {/* Pagination info */}
          <span className="text-[12px] text-muted-foreground font-medium tabular-nums whitespace-nowrap hidden lg:inline">
            {filtered.length === 0 ? '0' : `${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filtered.length)}`} / {filtered.length}
          </span>

          {/* Pagination arrows */}
          <div className="flex items-center gap-0.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-border bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-border bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* View mode */}
          <div className="hidden sm:flex items-center border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 transition-all',
                viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-slate-400 hover:bg-slate-50',
              )}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 transition-all',
                viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-slate-400 hover:bg-slate-50',
              )}
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-2 text-[13px]">
              <Loader2 size={20} className="animate-spin" />
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FolderOpen size={48} className="text-slate-200 mb-3" />
              <p className="text-[14px] font-bold text-slate-400">No charges found</p>
              <p className="text-[12px] text-muted-foreground mt-1">Try adjusting your filters or add a new charge</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* ─── Card Grid ─── */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {paged.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 p-4 flex flex-col gap-2"
                >
                  {/* Favorite star */}
                  <button
                    onClick={() => handleToggleFavorite(item)}
                    className="absolute top-3 right-3 p-1 rounded-lg hover:bg-amber-50 transition-all"
                    title={item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      size={16}
                      className={clsx(
                        'transition-colors',
                        item.is_favorite
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 group-hover:text-slate-400',
                      )}
                    />
                  </button>

                  {/* Charge name */}
                  <h3 className="text-[13px] font-black text-slate-900 leading-tight pr-8 line-clamp-2 min-h-[36px]">
                    {item.charge_name}
                  </h3>

                  {/* Charge type badge */}
                  <span
                    className={clsx(
                      'self-start px-2 py-0.5 rounded-md text-[10px] font-bold border',
                      getChargeTypeStyle(item.charge_type),
                    )}
                  >
                    {item.charge_type}
                  </span>

                  {/* Freight code */}
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    [{item.freight_code}]
                  </span>

                  {/* Price */}
                  <span className="text-[12px] text-slate-600">
                    Price: <b className="text-slate-800">{formatPrice(item.default_price ?? 1)} đ</b>
                  </span>

                  {/* Hover actions */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                      title="Edit"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => openDelete(item.id)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ─── List View ─── */
            <table className="w-full text-left text-[12px]">
              <thead className="sticky top-0 bg-slate-50 border-b border-border z-[1]">
                <tr>
                  <th className="px-4 py-2.5 font-bold text-muted-foreground uppercase w-10"></th>
                  <th className="px-4 py-2.5 font-bold text-muted-foreground uppercase">Freight Code</th>
                  <th className="px-4 py-2.5 font-bold text-muted-foreground uppercase">Charge Name</th>
                  <th className="px-4 py-2.5 font-bold text-muted-foreground uppercase">Type</th>
                  <th className="px-4 py-2.5 font-bold text-muted-foreground uppercase text-right">Price</th>
                  <th className="px-4 py-2.5 font-bold text-muted-foreground uppercase text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((item) => (
                  <tr key={item.id} className="border-b border-border/60 hover:bg-slate-50/80 group">
                    <td className="px-4 py-2.5">
                      <button onClick={() => handleToggleFavorite(item)} className="p-0.5">
                        <Star
                          size={14}
                          className={clsx(
                            item.is_favorite
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 hover:text-amber-400',
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-800">{item.freight_code}</td>
                    <td className="px-4 py-2.5 text-slate-700 font-semibold">{item.charge_name}</td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('px-2 py-0.5 rounded-md text-[10px] font-bold border', getChargeTypeStyle(item.charge_type))}>
                        {item.charge_type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-700 tabular-nums">{formatPrice(item.default_price ?? 1)} đ</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-all"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => openDelete(item.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border bg-slate-50/50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-muted-foreground font-medium">
            Total <b>{filtered.length}</b> charge(s)
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-2.5 py-1 rounded-lg border border-border bg-white text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all',
                    pg === currentPage
                      ? 'border-primary bg-primary text-white shadow-sm'
                      : 'border-border bg-white text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {pg}
                </button>
              ))}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2.5 py-1 rounded-lg border border-border bg-white text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <ChargeFormDialog
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingItem(null); }}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        isSubmitting={submitting}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Delete Charge"
        message="Are you sure you want to delete this charge? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => { setConfirmDeleteOpen(false); setDeletingId(null); }}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SalesChargeCatalogPage;
