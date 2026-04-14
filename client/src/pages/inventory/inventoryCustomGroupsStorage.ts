import type { ActivityKind, InventoryOverviewCard, WarehouseKind } from './inventoryOverviewMock';
import { COMPANY_LABEL, HCM_WAREHOUSE_LABEL } from './inventoryOverviewMock';

export type GroupByMode = 'none' | 'activity' | 'warehouse' | 'custom';

export type CustomGroupDefinition = { id: string; name: string };

export type CustomGroupsState = {
  groups: CustomGroupDefinition[];
  /** Card id → custom group id. Omitted or unknown id = unassigned. */
  membership: Record<string, string>;
};

const STORAGE_KEY = 'job-anle.inventory-overview.custom-groups.v1';

const defaultState = (): CustomGroupsState => ({ groups: [], membership: {} });

export function loadCustomGroupsState(): CustomGroupsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return defaultState();
    const groups = (parsed as { groups?: unknown }).groups;
    const membership = (parsed as { membership?: unknown }).membership;
    if (!Array.isArray(groups) || typeof membership !== 'object' || membership === null) {
      return defaultState();
    }
    const safeGroups: CustomGroupDefinition[] = groups
      .filter((g): g is CustomGroupDefinition => {
        return (
          g !== null &&
          typeof g === 'object' &&
          typeof (g as CustomGroupDefinition).id === 'string' &&
          typeof (g as CustomGroupDefinition).name === 'string'
        );
      })
      .map((g) => ({ id: g.id, name: g.name.trim() || 'Untitled' }));
    const safeMembership: Record<string, string> = {};
    for (const [k, v] of Object.entries(membership as Record<string, unknown>)) {
      if (typeof v === 'string' && v.length > 0) safeMembership[k] = v;
    }
    return { groups: safeGroups, membership: safeMembership };
  } catch {
    return defaultState();
  }
}

export function saveCustomGroupsState(state: CustomGroupsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private mode */
  }
}

export function newCustomGroupId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `g-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Build grouped sections for the current mode (cards already search-filtered). */
export function buildGroupedSections(
  cards: InventoryOverviewCard[],
  mode: GroupByMode,
  custom: CustomGroupsState,
): { key: string; heading: string; cards: InventoryOverviewCard[] }[] {
  if (mode === 'none' || cards.length === 0) {
    return [{ key: 'all', heading: '', cards }];
  }

  if (mode === 'activity') {
    const order: ActivityKind[] = [
      'receipts',
      'internal_transfers',
      'delivery_orders',
      'returns',
    ];
    return order
      .map((k) => ({
        key: `a-${k}`,
        heading: ACTIVITY_SECTION_LABEL[k],
        cards: cards.filter((c) => c.activityKind === k),
      }))
      .filter((s) => s.cards.length > 0);
  }

  if (mode === 'warehouse') {
    const order: WarehouseKind[] = ['company', 'hcm'];
    return order
      .map((k) => ({
        key: `w-${k}`,
        heading: WAREHOUSE_SECTION_LABEL[k],
        cards: cards.filter((c) => c.warehouseKind === k),
      }))
      .filter((s) => s.cards.length > 0);
  }

  // custom
  const assignedIds = new Set<string>();
  const sections: { key: string; heading: string; cards: InventoryOverviewCard[] }[] = [];

  for (const g of custom.groups) {
    const inGroup = cards.filter((c) => custom.membership[c.id] === g.id);
    inGroup.forEach((c) => assignedIds.add(c.id));
    sections.push({ key: `c-${g.id}`, heading: g.name, cards: inGroup });
  }

  const unassigned = cards.filter((c) => !assignedIds.has(c.id));
  if (unassigned.length > 0) {
    sections.push({ key: 'unassigned', heading: 'Unassigned', cards: unassigned });
  }

  if (sections.length === 0 && cards.length > 0) {
    return [{ key: 'all', heading: '', cards }];
  }

  return sections;
}

export const ACTIVITY_SECTION_LABEL: Record<ActivityKind, string> = {
  receipts: 'Receipts',
  internal_transfers: 'Internal Transfers',
  delivery_orders: 'Delivery Orders',
  returns: 'Returns',
};

export const WAREHOUSE_SECTION_LABEL: Record<WarehouseKind, string> = {
  company: COMPANY_LABEL,
  hcm: HCM_WAREHOUSE_LABEL,
};
