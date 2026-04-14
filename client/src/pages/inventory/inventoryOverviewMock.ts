export type ActivityKind =
  | 'receipts'
  | 'internal_transfers'
  | 'delivery_orders'
  | 'returns';

export type WarehouseKind = 'company' | 'hcm';

export type InventoryOverviewCard = {
  id: string;
  title: string;
  locationLabel: string;
  toProcessCount: number;
  /** Thin red accent on the left (e.g. HCM warehouse). */
  accentWarehouse: boolean;
  actionLabel: string;
  activityKind: ActivityKind;
  warehouseKind: WarehouseKind;
};

export const COMPANY_LABEL = 'SOTA LOGISTIC TRANSPORTATION JSC';
export const HCM_WAREHOUSE_LABEL = 'HCM Warehouse';

export const INVENTORY_OVERVIEW_CARDS: InventoryOverviewCard[] = [
  {
    id: '1',
    title: 'Receipts',
    locationLabel: COMPANY_LABEL,
    toProcessCount: 0,
    accentWarehouse: false,
    actionLabel: 'Open',
    activityKind: 'receipts',
    warehouseKind: 'company',
  },
  {
    id: '2',
    title: 'Internal Transfers',
    locationLabel: COMPANY_LABEL,
    toProcessCount: 0,
    accentWarehouse: false,
    actionLabel: 'Open',
    activityKind: 'internal_transfers',
    warehouseKind: 'company',
  },
  {
    id: '3',
    title: 'Delivery Orders',
    locationLabel: HCM_WAREHOUSE_LABEL,
    toProcessCount: 0,
    accentWarehouse: true,
    actionLabel: 'Open',
    activityKind: 'delivery_orders',
    warehouseKind: 'hcm',
  },
  {
    id: '4',
    title: 'Returns',
    locationLabel: HCM_WAREHOUSE_LABEL,
    toProcessCount: 0,
    accentWarehouse: true,
    actionLabel: 'Open',
    activityKind: 'returns',
    warehouseKind: 'hcm',
  },
  {
    id: '5',
    title: 'Receipts',
    locationLabel: HCM_WAREHOUSE_LABEL,
    toProcessCount: 0,
    accentWarehouse: true,
    actionLabel: 'Open',
    activityKind: 'receipts',
    warehouseKind: 'hcm',
  },
  {
    id: '6',
    title: 'Internal Transfers',
    locationLabel: HCM_WAREHOUSE_LABEL,
    toProcessCount: 0,
    accentWarehouse: true,
    actionLabel: 'Open',
    activityKind: 'internal_transfers',
    warehouseKind: 'hcm',
  },
  {
    id: '7',
    title: 'Delivery Orders',
    locationLabel: COMPANY_LABEL,
    toProcessCount: 0,
    accentWarehouse: false,
    actionLabel: 'Open',
    activityKind: 'delivery_orders',
    warehouseKind: 'company',
  },
  {
    id: '8',
    title: 'Returns',
    locationLabel: COMPANY_LABEL,
    toProcessCount: 0,
    accentWarehouse: false,
    actionLabel: 'Open',
    activityKind: 'returns',
    warehouseKind: 'company',
  },
];
