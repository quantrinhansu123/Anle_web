import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers2,
  MoreVertical,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import {
  INVENTORY_OVERVIEW_CARDS,
  type InventoryOverviewCard,
} from './inventoryOverviewMock';
import {
  buildGroupedSections,
  loadCustomGroupsState,
  newCustomGroupId,
  saveCustomGroupsState,
  type CustomGroupsState,
  type GroupByMode,
} from './inventoryCustomGroupsStorage';

const PRIMARY_ACTION = '#4c5f8b';
const ACCENT_RED = '#dc2626';

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function cardMatchesQuery(card: InventoryOverviewCard, q: string): boolean {
  if (!q) return true;
  const n = normalize(q);
  return (
    normalize(card.title).includes(n) ||
    normalize(card.locationLabel).includes(n) ||
    String(card.toProcessCount).includes(n)
  );
}

const GROUP_BY_LABEL: Record<GroupByMode, string> = {
  none: 'None',
  activity: 'Activity type',
  warehouse: 'Warehouse',
  custom: 'Custom groups',
};

const InventoryOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState<GroupByMode>('none');
  const [customState, setCustomState] = useState<CustomGroupsState>(() => loadCustomGroupsState());
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [groupPanel, setGroupPanel] = useState<'pick' | 'manage'>('pick');
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    saveCustomGroupsState(customState);
  }, [customState]);

  const filtered = useMemo(
    () => INVENTORY_OVERVIEW_CARDS.filter((c) => cardMatchesQuery(c, search)),
    [search],
  );

  const sections = useMemo(
    () => buildGroupedSections(filtered, groupBy, customState),
    [filtered, groupBy, customState],
  );

  const total = INVENTORY_OVERVIEW_CARDS.length;
  const showing = filtered.length;
  const rangeLabel =
    showing === 0 ? `0 / ${total}` : `1-${showing} / ${total}`;

  return (
    <div className="animate-in fade-in duration-300 w-full flex-1 flex flex-col min-h-0 -mt-2 bg-muted/40">
      <div className="flex flex-col gap-5 px-4 md:px-6 py-4 md:py-6 w-full max-w-none flex-1 min-h-0">
        <header className="flex flex-col gap-4 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => navigate('/inventory')}
              >
                <ChevronLeft size={16} />
                Module
              </Button>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                Inventory Overview
              </h1>
            </div>
            <div className="flex flex-col items-stretch lg:items-end gap-3 w-full lg:max-w-md">
              <div className="relative w-full">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                  strokeWidth={2}
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className={clsx(
                    'w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-white text-sm',
                    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25',
                  )}
                  aria-label="Search inventory operations"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 w-full">
                <div className="flex flex-wrap items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
                    <Filter size={16} strokeWidth={2} />
                    Filters
                  </Button>
                  <Popover
                    open={groupMenuOpen}
                    onOpenChange={(open) => {
                      setGroupMenuOpen(open);
                      if (!open) setGroupPanel('pick');
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={clsx(
                          'gap-1.5',
                          groupBy !== 'none' ? 'text-foreground font-medium' : 'text-muted-foreground',
                        )}
                        aria-expanded={groupMenuOpen}
                        aria-haspopup="dialog"
                      >
                        <Layers2 size={16} strokeWidth={2} />
                        Group by
                        {groupBy !== 'none' && (
                          <span className="text-xs font-normal text-muted-foreground">
                            ({GROUP_BY_LABEL[groupBy]})
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[min(100vw-2rem,22rem)] p-0 overflow-hidden">
                      {groupPanel === 'pick' ? (
                        <GroupByPickPanel
                          groupBy={groupBy}
                          onSelect={(mode) => {
                            setGroupBy(mode);
                            setGroupMenuOpen(false);
                          }}
                          onManageCustom={() => setGroupPanel('manage')}
                        />
                      ) : (
                        <CustomGroupsManagePanel
                          customState={customState}
                          setCustomState={setCustomState}
                          newGroupName={newGroupName}
                          setNewGroupName={setNewGroupName}
                          onBack={() => setGroupPanel('pick')}
                        />
                      )}
                    </PopoverContent>
                  </Popover>
                  <Button type="button" variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
                    <Star size={16} strokeWidth={2} />
                    Favorites
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground tabular-nums">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled aria-label="Previous page">
                    <ChevronLeft size={18} />
                  </Button>
                  <span className="min-w-18 text-center text-xs font-medium text-foreground/80">
                    {rangeLabel}
                  </span>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled aria-label="Next page">
                    <ChevronRight size={18} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white/80 p-10 text-center text-sm text-muted-foreground">
            No operations match your search.
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {sections.map((section) => (
              <section key={section.key} className="min-w-0">
                {section.heading ? (
                  <h2 className="text-sm font-semibold text-foreground/90 tracking-tight mb-3">
                    {section.heading}
                  </h2>
                ) : null}
                {section.cards.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 border border-dashed border-border rounded-lg px-3 bg-white/60">
                    No operations in this group.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    {section.cards.map((card) => (
                      <OperationCard key={card.id} card={card} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function GroupByPickPanel({
  groupBy,
  onSelect,
  onManageCustom,
}: {
  groupBy: GroupByMode;
  onSelect: (m: GroupByMode) => void;
  onManageCustom: () => void;
}) {
  const rows: { mode: GroupByMode; hint?: string }[] = [
    { mode: 'none', hint: 'Single grid' },
    { mode: 'activity', hint: 'Receipts, transfers, deliveries, returns' },
    { mode: 'warehouse', hint: 'Company vs HCM warehouse' },
    { mode: 'custom', hint: 'Your saved groups' },
  ];

  return (
    <div className="py-1">
      <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Group by
      </p>
      {rows.map(({ mode, hint }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onSelect(mode)}
          className={clsx(
            'w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-muted',
            groupBy === mode && 'bg-primary/5 font-medium text-foreground',
          )}
        >
          <div>{GROUP_BY_LABEL[mode]}</div>
          {hint ? <div className="text-xs text-muted-foreground font-normal mt-0.5">{hint}</div> : null}
        </button>
      ))}
      <div className="border-t border-border my-1" />
      <button
        type="button"
        onClick={onManageCustom}
        className="w-full text-left px-3 py-2.5 text-sm text-primary hover:bg-muted font-medium"
      >
        Manage custom groups…
      </button>
    </div>
  );
}

function CustomGroupsManagePanel({
  customState,
  setCustomState,
  newGroupName,
  setNewGroupName,
  onBack,
}: {
  customState: CustomGroupsState;
  setCustomState: React.Dispatch<React.SetStateAction<CustomGroupsState>>;
  newGroupName: string;
  setNewGroupName: (v: string) => void;
  onBack: () => void;
}) {
  const addGroup = () => {
    const name = newGroupName.trim() || 'New group';
    setCustomState((prev) => ({
      ...prev,
      groups: [...prev.groups, { id: newCustomGroupId(), name }],
    }));
    setNewGroupName('');
  };

  const removeGroup = (id: string) => {
    setCustomState((prev) => {
      const membership = { ...prev.membership };
      for (const [cid, gid] of Object.entries(membership)) {
        if (gid === id) delete membership[cid];
      }
      return {
        groups: prev.groups.filter((g) => g.id !== id),
        membership,
      };
    });
  };

  const renameGroup = (id: string, name: string) => {
    setCustomState((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === id ? { ...g, name: name.trim() || g.name } : g)),
    }));
  };

  const setCardGroup = (cardId: string, groupId: string) => {
    setCustomState((prev) => {
      const membership = { ...prev.membership };
      if (!groupId) delete membership[cardId];
      else membership[cardId] = groupId;
      return { ...prev, membership };
    });
  };

  return (
    <div className="flex flex-col max-h-[min(70vh,28rem)]">
      <div className="flex items-center gap-2 border-b border-border px-2 py-2 shrink-0">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack} aria-label="Back">
          <ArrowLeft size={18} />
        </Button>
        <span className="text-sm font-semibold">Custom groups</span>
      </div>
      <div className="overflow-y-auto custom-scrollbar p-3 space-y-4 flex-1 min-h-0">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Add group</p>
          <div className="flex gap-2">
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name"
              className="flex-1 min-w-0 h-9 rounded-md border border-border px-2 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addGroup();
                }
              }}
            />
            <Button type="button" size="sm" className="shrink-0 gap-1" onClick={addGroup}>
              <Plus size={14} />
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Your groups</p>
          {customState.groups.length === 0 ? (
            <p className="text-xs text-muted-foreground">No custom groups yet. Add one above, then assign operations.</p>
          ) : (
            <ul className="space-y-2">
              {customState.groups.map((g) => (
                <li key={g.id} className="flex items-center gap-2">
                  <input
                    value={g.name}
                    onChange={(e) => renameGroup(g.id, e.target.value)}
                    className="flex-1 min-w-0 h-9 rounded-md border border-border px-2 text-sm"
                    aria-label="Group name"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive shrink-0"
                    onClick={() => removeGroup(g.id)}
                    aria-label={`Delete group ${g.name}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Assign each operation</p>
          <ul className="space-y-2">
            {INVENTORY_OVERVIEW_CARDS.map((card) => (
              <li
                key={card.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-border/80 bg-muted/20 px-2 py-2"
              >
                <div className="min-w-0 flex-1 text-xs">
                  <div className="font-semibold text-foreground">{card.title}</div>
                  <div className="text-muted-foreground truncate">{card.locationLabel}</div>
                </div>
                <select
                  className="h-9 rounded-md border border-border bg-white text-sm px-2 shrink-0 sm:min-w-40"
                  value={customState.membership[card.id] ?? ''}
                  onChange={(e) => setCardGroup(card.id, e.target.value)}
                  aria-label={`Group for ${card.title}`}
                >
                  <option value="">Unassigned</option>
                  {customState.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function OperationCard({ card }: { card: InventoryOverviewCard }) {
  return (
    <article
      className={clsx(
        'relative flex flex-col rounded-xl border border-border/80 bg-white shadow-sm',
        'min-h-[168px] overflow-hidden transition-shadow hover:shadow-md',
      )}
    >
      {card.accentWarehouse && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ backgroundColor: ACCENT_RED }}
          aria-hidden
        />
      )}
      <div className={clsx('flex flex-1 flex-col p-4', card.accentWarehouse && 'pl-[15px]')}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <h3 className="text-[15px] font-bold text-foreground leading-snug">{card.title}</h3>
            <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{card.locationLabel}</p>
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground/90 uppercase pt-1">
              {card.toProcessCount} TO PROCESS
            </p>
          </div>
          <CardMenu card={card} />
        </div>
        <div className="mt-auto pt-4">
          <button
            type="button"
            className={clsx(
              'inline-flex items-center justify-center rounded-md px-3.5 py-2 text-xs font-semibold text-white',
              'shadow-sm transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            )}
            style={{
              backgroundColor: PRIMARY_ACTION,
              outlineColor: PRIMARY_ACTION,
            }}
          >
            {card.actionLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

function CardMenu({ card }: { card: InventoryOverviewCard }) {
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className={clsx(
          'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground',
          'hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        )}
        aria-label={`More options for ${card.title}`}
      >
        <MoreVertical size={18} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        <div className="flex flex-col py-1 text-sm">
          <button type="button" className="rounded-md px-3 py-2 text-left hover:bg-muted">
            Pin to favorites
          </button>
          <button type="button" className="rounded-md px-3 py-2 text-left hover:bg-muted">
            Configure
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default InventoryOverviewPage;
