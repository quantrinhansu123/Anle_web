import type { Sales } from '../sales/types';
import type { HeaderTabState } from './bl-tabs/HeaderTab';

const INCOTERM_VALUES = new Set([
  'fob',
  'cif',
  'cfr',
  'exw',
  'dap',
  'ddp',
  'fas',
  'fca',
  'cpt',
  'cip',
  'dpu',
]);

function sliceIsoDate(v?: string | null): string {
  if (!v) return '';
  const s = String(v).trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

function normalizeBound(direction?: string | null): string {
  const d = String(direction ?? '')
    .trim()
    .toLowerCase();
  if (d === 'import' || d === 'export' || d === 'domestic' || d === 'transit') return d;
  return '';
}

function normalizeIncoterm(raw?: string | null): string {
  const t = (raw || '').trim().toLowerCase();
  return INCOTERM_VALUES.has(t) ? t : '';
}

function deriveLoadType(sales: Sales): string {
  const sh = sales.shipments;
  if (sh?.load_fcl) return 'fcl';
  if (sh?.load_lcl) return 'lcl';
  return '';
}

export function isSeaHouseBlBlobEmpty(blob: unknown): boolean {
  if (blob == null || typeof blob !== 'object' || Array.isArray(blob)) return true;
  const o = blob as Record<string, unknown>;
  return Object.keys(o).length === 0;
}

/** Meaningful user/server data already stored under sea_house_bl — skip auto-prefill. */
export function seaHouseBlBlobHasContent(blob: unknown): boolean {
  if (isSeaHouseBlBlobEmpty(blob)) return false;
  const o = blob as Record<string, unknown>;
  return Object.keys(o).some((k) => {
    const v = o[k];
    if (v == null) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (typeof v === 'object' && !Array.isArray(v)) return Object.keys(v as object).length > 0;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
}

export function buildSeaHousePrefillFromSales(sales: Sales): {
  headerPatch: Partial<HeaderTabState>;
  topBar: {
    masterBl: string;
    bound: string;
    incoterm: string;
    loadType: string;
    shipmentLabel: string;
  };
} {
  const sh = sales.shipments;
  const custName = (sh?.customers?.company_name || '').trim();
  const headerPatch: Partial<HeaderTabState> = {
    pol: (sh?.pol || sales.pickup || '').trim(),
    pod: (sh?.pod || sales.final_destination || '').trim(),
    por: (sales.pickup || sh?.pol || '').trim(),
    pvy: (sales.final_destination || sh?.pod || '').trim(),
    etd: sliceIsoDate(sh?.etd),
    eta: sliceIsoDate(sh?.eta),
    issueDate: sliceIsoDate(sales.quote_date),
    performanceDate: sliceIsoDate(sales.due_date),
    shipperName: custName,
    consigneeName: (sales.customer_trade_name || custName).trim(),
  };

  const topBar = {
    masterBl: (sales.bill_no || sh?.bill_no || '').trim(),
    bound: normalizeBound(sales.direction),
    incoterm: normalizeIncoterm(sales.incoterms),
    loadType: deriveLoadType(sales),
    shipmentLabel: (sh?.code || '').trim(),
  };

  return { headerPatch, topBar };
}
