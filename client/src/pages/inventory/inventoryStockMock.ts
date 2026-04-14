import { COMPANY_LABEL, HCM_WAREHOUSE_LABEL } from './inventoryOverviewMock';

export type StockWarehouseKey = 'company' | 'hcm';

export type InventoryStockRow = {
  id: string;
  productCode: string;
  warehouseKey: StockWarehouseKey;
  categoryId: string;
  unitCostVnd: number;
  onHand: number;
  available: number;
  incoming: number;
  outgoing: number;
  unit: string;
};

export const STOCK_WAREHOUSE_SIDEBAR: { id: 'all' | StockWarehouseKey; label: string }[] = [
  { id: 'all', label: 'All warehouses' },
  { id: 'company', label: COMPANY_LABEL },
  { id: 'hcm', label: HCM_WAREHOUSE_LABEL },
];

export const STOCK_CATEGORY_SIDEBAR: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'general', label: 'General' },
  { id: 'consumables', label: 'Consumables' },
];

export const INVENTORY_STOCK_MOCK: InventoryStockRow[] = [
  {
    id: 'r1',
    productCode: '02023000',
    warehouseKey: 'company',
    categoryId: 'general',
    unitCostVnd: 0,
    onHand: 3000,
    available: 3000,
    incoming: 0,
    outgoing: 0,
    unit: 'Unit',
  },
  {
    id: 'r2',
    productCode: '02023001',
    warehouseKey: 'hcm',
    categoryId: 'general',
    unitCostVnd: 12500,
    onHand: 120,
    available: 100,
    incoming: 40,
    outgoing: 20,
    unit: 'Unit',
  },
  {
    id: 'r3',
    productCode: '03011002',
    warehouseKey: 'hcm',
    categoryId: 'consumables',
    unitCostVnd: 8900,
    onHand: 500,
    available: 480,
    incoming: 0,
    outgoing: 20,
    unit: 'Box',
  },
];
