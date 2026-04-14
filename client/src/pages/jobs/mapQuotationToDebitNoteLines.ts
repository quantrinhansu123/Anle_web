import type { Sales, SalesChargeItem, SalesItem } from '../sales/types';

export type DnLineSeed = {
  service_code: string;
  fare: string;
  fare_type: string;
  fare_name: string;
  tax: string;
  currency: string;
  exchange_rate: number;
  unit: string;
  qty: number;
  rate: number;
};

function vatPercentToTaxKey(p: number): string {
  if (!Number.isFinite(p) || p <= 0) return 'exempt';
  if (p >= 9) return 'vat_10';
  if (p >= 7) return 'vat_8';
  return 'vat_added';
}

function mapFareTypeFromChargeGroup(cg?: string): string {
  if (cg === 'freight') return 'freight';
  if (cg === 'on_behalf') return 'handling';
  return 'other';
}

function mapChargeItem(it: SalesChargeItem): DnLineSeed {
  const qty = Number(it.quantity ?? 0) || 0;
  const rate = Number(it.unit_price ?? 0) || 0;
  return {
    service_code: (it.freight_code || '').trim(),
    fare: (it.charge_type || '').trim(),
    fare_type: mapFareTypeFromChargeGroup(it.charge_group),
    fare_name: (it.charge_name || '').trim(),
    tax: vatPercentToTaxKey(Number(it.vat_percent)),
    currency: (it.currency || 'VND').trim() || 'VND',
    exchange_rate: Number(it.currency && it.currency.toUpperCase() !== 'VND' ? 1 : 1),
    unit: (it.unit || '').trim(),
    qty: qty || 1,
    rate,
  };
}

function mapSalesItem(it: SalesItem): DnLineSeed {
  const qty = Number(it.quantity ?? 0) || 0;
  const rate = Number(it.rate ?? 0) || 0;
  return {
    service_code: '',
    fare: '',
    fare_type: 'other',
    fare_name: (it.description || '').trim(),
    tax: vatPercentToTaxKey(Number(it.tax_percent)),
    currency: (it.currency || 'VND').trim() || 'VND',
    exchange_rate: Number(it.exchange_rate ?? 1) || 1,
    unit: (it.unit || '').trim(),
    qty: qty || 1,
    rate,
  };
}

/** Build debit-note line seeds from quotation charge rows (preferred) and free-text sales lines. */
export function buildDnLineSeedsFromSales(sales: Sales): DnLineSeed[] {
  const charges = [...(sales.sales_charge_items || [])].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );
  const fromCharges = charges
    .filter((c) => (c.charge_name || c.freight_code || c.quantity || c.unit_price))
    .map(mapChargeItem);

  if (fromCharges.length > 0) return fromCharges;

  const items = sales.sales_items || [];
  return items
    .filter((i) => (i.description || '').trim() || Number(i.rate) > 0)
    .map(mapSalesItem);
}
