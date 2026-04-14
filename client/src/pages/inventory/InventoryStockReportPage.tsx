import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  History,
  Layers2,
  MapPin,
  PackagePlus,
  Pencil,
  Search,
  Star,
  Upload,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import {
  INVENTORY_STOCK_MOCK,
  STOCK_CATEGORY_SIDEBAR,
  STOCK_WAREHOUSE_SIDEBAR,
  type InventoryStockRow,
  type StockWarehouseKey,
} from './inventoryStockMock';

type StockGroupBy = 'none' | 'warehouse' | 'category';

const GROUP_LABEL: Record<StockGroupBy, string> = {
  none: 'None',
  warehouse: 'Warehouse',
  category: 'Category',
};

function fmtMoneyVnd(n: number): string {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)} VND`;
}

function fmtQty(n: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(n);
}

function warehouseLabel(key: StockWarehouseKey): string {
  return key === 'company' ? STOCK_WAREHOUSE_SIDEBAR[1].label : STOCK_WAREHOUSE_SIDEBAR[2].label;
}

function categoryLabel(id: string): string {
  return STOCK_CATEGORY_SIDEBAR.find((c) => c.id === id)?.label ?? id;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

const InventoryStockReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [warehouseId, setWarehouseId] = useState<'all' | StockWarehouseKey>('all');
  const [categoryId, setCategoryId] = useState('all');
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState<StockGroupBy>('none');
  const [groupOpen, setGroupOpen] = useState(false);
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<InventoryStockRow[]>(() =>
    INVENTORY_STOCK_MOCK.map((r) => ({ ...r })),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftOnHand, setDraftOnHand] = useState('');

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (warehouseId !== 'all' && r.warehouseKey !== warehouseId) return false;
      if (categoryId !== 'all' && r.categoryId !== categoryId) return false;
      if (search && !normalize(r.productCode).includes(normalize(search))) return false;
      const pf = colFilters.product?.trim();
      if (pf && !normalize(r.productCode).includes(normalize(pf))) return false;
      return true;
    });
  }, [rows, warehouseId, categoryId, search, colFilters]);

  const grouped = useMemo(() => {
    if (groupBy === 'none') return [{ key: 'all', heading: '', rows: filtered }];
    if (groupBy === 'warehouse') {
      const keys: StockWarehouseKey[] = ['company', 'hcm'];
      return keys
        .map((k) => ({
          key: `w-${k}`,
          heading: warehouseLabel(k),
          rows: filtered.filter((r) => r.warehouseKey === k),
        }))
        .filter((g) => g.rows.length > 0);
    }
    const cats = [...new Set(filtered.map((r) => r.categoryId))];
    return cats
      .map((id) => ({
        key: `c-${id}`,
        heading: categoryLabel(id),
        rows: filtered.filter((r) => r.categoryId === id),
      }))
      .filter((g) => g.rows.length > 0);
  }, [filtered, groupBy]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        const tv = r.unitCostVnd * r.onHand;
        acc.totalValue += tv;
        acc.onHand += r.onHand;
        acc.available += r.available;
        acc.incoming += r.incoming;
        acc.outgoing += r.outgoing;
        return acc;
      },
      { totalValue: 0, onHand: 0, available: 0, incoming: 0, outgoing: 0 },
    );
  }, [filtered]);

  const n = filtered.length;
  const rangeLabel = n === 0 ? '0 / 0' : `1-${n} / ${n}`;

  const startEdit = (r: InventoryStockRow) => {
    setEditingId(r.id);
    setDraftOnHand(String(r.onHand));
  };

  const commitEdit = (id: string) => {
    const v = Number(draftOnHand.replace(/,/g, ''));
    if (!Number.isFinite(v) || v < 0) {
      setEditingId(null);
      return;
    }
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, onHand: v, available: Math.min(x.available, v) } : x)));
    setEditingId(null);
  };

  return (
    <div className="animate-in fade-in duration-300 w-full flex-1 flex flex-col min-h-0 -mt-2 bg-muted/40">
      <div className="flex flex-1 min-h-0 flex-col gap-4 px-4 md:px-6 py-4 md:py-6">
        <header className="flex flex-col gap-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => navigate('/inventory')}
              >
                <ChevronLeft size={16} />
                Module
              </Button>
              <h1 className="text-xl font-semibold tracking-tight">Inventory</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" className="gap-1 bg-[#4c5f8b] hover:bg-[#4c5f8b]/90 text-white">
                + New
              </Button>
              <Button type="button" variant="outline" size="icon" className="h-9 w-9" aria-label="Import">
                <Upload size={16} />
              </Button>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
                <Filter size={16} />
                Filters
              </Button>
              <Popover open={groupOpen} onOpenChange={setGroupOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={clsx('gap-1.5', groupBy !== 'none' && 'font-medium text-foreground')}
                  >
                    <Layers2 size={16} />
                    Group by
                    {groupBy !== 'none' && (
                      <span className="text-xs font-normal text-muted-foreground">({GROUP_LABEL[groupBy]})</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-52 p-1">
                  {(Object.keys(GROUP_LABEL) as StockGroupBy[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={clsx(
                        'w-full text-left rounded-md px-3 py-2 text-sm hover:bg-muted',
                        groupBy === mode && 'bg-primary/5 font-medium',
                      )}
                      onClick={() => {
                        setGroupBy(mode);
                        setGroupOpen(false);
                      }}
                    >
                      {GROUP_LABEL[mode]}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
                <Star size={16} />
                Favorites
              </Button>
              <div className="flex items-center gap-0.5 text-muted-foreground ml-2">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled aria-label="Previous">
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-xs tabular-nums min-w-16 text-center text-foreground/80">{rangeLabel}</span>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled aria-label="Next">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0 gap-4 flex-col lg:flex-row">
          <aside className="w-full shrink-0 lg:w-56 space-y-4">
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Warehouse</h2>
              <nav className="flex flex-col rounded-xl border border-border bg-white p-1">
                {STOCK_WAREHOUSE_SIDEBAR.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWarehouseId(w.id)}
                    className={clsx(
                      'text-left rounded-lg px-3 py-2 text-xs leading-snug transition-colors',
                      warehouseId === w.id
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'hover:bg-muted text-foreground',
                    )}
                  >
                    {w.label}
                  </button>
                ))}
              </nav>
            </div>
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Category</h2>
              <nav className="flex flex-col rounded-xl border border-border bg-white p-1">
                {STOCK_CATEGORY_SIDEBAR.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={clsx(
                      'text-left rounded-lg px-3 py-2 text-xs transition-colors',
                      categoryId === c.id
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'hover:bg-muted',
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <div className="flex-1 min-w-0 flex flex-col rounded-xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-border bg-muted/30">
              <span className="text-xs font-semibold text-muted-foreground">Quick filters</span>
            </div>
            <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto custom-scrollbar">
              {grouped.map((section) => (
                <div key={section.key} className="min-w-[920px]">
                  {section.heading ? (
                    <div className="px-3 py-2 text-sm font-semibold bg-muted/20 border-b border-border">
                      {section.heading}
                    </div>
                  ) : null}
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="w-10 p-2 text-left">
                          <input type="checkbox" className="rounded border-border" aria-label="Select all" />
                        </th>
                        <th className="p-2 text-left font-semibold min-w-[140px]">
                          <div>Product</div>
                          <input
                            className="mt-1 w-full h-7 rounded border border-border px-1.5 text-[11px] font-normal"
                            placeholder="Type and press Enter"
                            value={colFilters.product ?? ''}
                            onChange={(e) => setColFilters((f) => ({ ...f, product: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                          />
                        </th>
                        <th className="p-2 text-right font-semibold whitespace-nowrap">Unit cost</th>
                        <th className="p-2 text-right font-semibold whitespace-nowrap">Total value</th>
                        <th className="p-2 text-right font-semibold whitespace-nowrap">On hand</th>
                        <th className="p-2 text-right font-semibold whitespace-nowrap">Available</th>
                        <th className="p-2 text-right font-semibold whitespace-nowrap">Incoming</th>
                        <th className="p-2 text-right font-semibold whitespace-nowrap">Outgoing</th>
                        <th className="p-2 text-left font-semibold whitespace-nowrap">Unit</th>
                        <th className="p-2 w-28 text-right font-semibold"> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-muted-foreground text-sm">
                            No lines match the current filters.
                          </td>
                        </tr>
                      ) : (
                        section.rows.map((r) => {
                          const totalVal = r.unitCostVnd * r.onHand;
                          return (
                            <tr key={r.id} className="border-b border-border/80 hover:bg-muted/30">
                              <td className="p-2 align-middle">
                                <input type="checkbox" className="rounded border-border" aria-label={`Select ${r.productCode}`} />
                              </td>
                              <td className="p-2 align-middle font-medium">{r.productCode}</td>
                              <td className="p-2 align-middle text-right tabular-nums text-muted-foreground">
                                {fmtMoneyVnd(r.unitCostVnd)}
                              </td>
                              <td className="p-2 align-middle text-right tabular-nums">{fmtMoneyVnd(totalVal)}</td>
                              <td className="p-2 align-middle text-right">
                                {editingId === r.id ? (
                                  <span className="inline-flex items-center gap-1 justify-end">
                                    <input
                                      className="w-24 h-8 rounded border border-border px-2 text-right tabular-nums text-sm"
                                      value={draftOnHand}
                                      onChange={(e) => setDraftOnHand(e.target.value)}
                                      onBlur={() => commitEdit(r.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') commitEdit(r.id);
                                        if (e.key === 'Escape') setEditingId(null);
                                      }}
                                      autoFocus
                                    />
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 justify-end tabular-nums">
                                    {fmtQty(r.onHand)}
                                    <button
                                      type="button"
                                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                      aria-label="Edit on hand"
                                      onClick={() => startEdit(r)}
                                    >
                                      <Pencil size={14} />
                                    </button>
                                  </span>
                                )}
                              </td>
                              <td className="p-2 align-middle text-right tabular-nums">{fmtQty(r.available)}</td>
                              <td className="p-2 align-middle text-right tabular-nums">{fmtQty(r.incoming)}</td>
                              <td className="p-2 align-middle text-right tabular-nums">{fmtQty(r.outgoing)}</td>
                              <td className="p-2 align-middle text-muted-foreground">{r.unit}</td>
                              <td className="p-2 align-middle">
                                <div className="flex justify-end gap-0.5">
                                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="History">
                                    <History size={16} />
                                  </Button>
                                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Replenish">
                                    <PackagePlus size={16} />
                                  </Button>
                                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Locations">
                                    <MapPin size={16} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {section.rows.length > 0 && !section.heading && (
                      <tfoot>
                        <tr className="bg-muted/40 font-semibold border-t-2 border-border">
                          <td className="p-2" />
                          <td className="p-2">Total</td>
                          <td className="p-2" />
                          <td className="p-2 text-right tabular-nums">{fmtMoneyVnd(totals.totalValue)}</td>
                          <td className="p-2 text-right tabular-nums">{fmtQty(totals.onHand)}</td>
                          <td className="p-2 text-right tabular-nums">{fmtQty(totals.available)}</td>
                          <td className="p-2 text-right tabular-nums">{fmtQty(totals.incoming)}</td>
                          <td className="p-2 text-right tabular-nums">{fmtQty(totals.outgoing)}</td>
                          <td className="p-2" colSpan={2} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              ))}
            </div>
            {groupBy !== 'none' && filtered.length > 0 && (
              <div className="border-t border-border bg-muted/30 px-3 py-2 text-xs font-semibold flex flex-wrap gap-4 justify-end tabular-nums">
                <span>Total value: {fmtMoneyVnd(totals.totalValue)}</span>
                <span>On hand: {fmtQty(totals.onHand)}</span>
                <span>Available: {fmtQty(totals.available)}</span>
                <span>Incoming: {fmtQty(totals.incoming)}</span>
                <span>Outgoing: {fmtQty(totals.outgoing)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryStockReportPage;
