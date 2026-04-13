/** Persisted under `service_details.trucking` on `fms_jobs`. */

export interface TruckingTruckRow {
  house_bl: string;
  pol: string;
  pod: string;
  plate_number: string;
  customs_declaration: string;
  salesman: string;
  load_type: string;
  service_terms: string;
  bound: string;
  incoterm: string;
  transport_mode: string;
  area: string;
  partner: string;
}

export interface TruckingQuotationRow {
  quotation: string;
  customer: string;
  status: string;
}

export interface TruckingBillingLineRow {
  customer: string;
  service: string;
  truck: string;
  fare: string;
  fare_name: string;
  tax: string;
  fare_type: string;
  currency: string;
  exchange_rate: string;
  unit: string;
  qty: string;
  rate: string;
}

export interface TruckingTabState {
  trucks: TruckingTruckRow[];
  quotations: TruckingQuotationRow[];
  billing_lines: TruckingBillingLineRow[];
  exchange_date: string;
  exchange_rate: string;
}

function str(v: unknown): string {
  return v == null ? '' : String(v);
}

export function emptyTruckingTruckRow(): TruckingTruckRow {
  return {
    house_bl: '',
    pol: '',
    pod: '',
    plate_number: '',
    customs_declaration: '',
    salesman: '',
    load_type: '',
    service_terms: '',
    bound: '',
    incoterm: '',
    transport_mode: '',
    area: '',
    partner: '',
  };
}

export function emptyTruckingQuotationRow(): TruckingQuotationRow {
  return { quotation: '', customer: '', status: '' };
}

export function emptyTruckingBillingLineRow(): TruckingBillingLineRow {
  return {
    customer: '',
    service: '',
    truck: '',
    fare: '',
    fare_name: '',
    tax: '',
    fare_type: '',
    currency: '',
    exchange_rate: '',
    unit: '',
    qty: '',
    rate: '',
  };
}

export function emptyTruckingTabState(): TruckingTabState {
  return {
    trucks: [emptyTruckingTruckRow()],
    quotations: [emptyTruckingQuotationRow()],
    billing_lines: [emptyTruckingBillingLineRow()],
    exchange_date: '',
    exchange_rate: '',
  };
}

function parseTruckRow(x: unknown): TruckingTruckRow {
  const o = x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
  return {
    house_bl: str(o.house_bl),
    pol: str(o.pol),
    pod: str(o.pod),
    plate_number: str(o.plate_number),
    customs_declaration: str(o.customs_declaration),
    salesman: str(o.salesman),
    load_type: str(o.load_type),
    service_terms: str(o.service_terms),
    bound: str(o.bound),
    incoterm: str(o.incoterm),
    transport_mode: str(o.transport_mode),
    area: str(o.area),
    partner: str(o.partner),
  };
}

function parseQuotationRow(x: unknown): TruckingQuotationRow {
  const o = x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
  return {
    quotation: str(o.quotation),
    customer: str(o.customer),
    status: str(o.status),
  };
}

function parseBillingLineRow(x: unknown): TruckingBillingLineRow {
  const o = x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
  return {
    customer: str(o.customer),
    service: str(o.service),
    truck: str(o.truck),
    fare: str(o.fare),
    fare_name: str(o.fare_name),
    tax: str(o.tax),
    fare_type: str(o.fare_type),
    currency: str(o.currency),
    exchange_rate: str(o.exchange_rate),
    unit: str(o.unit),
    qty: str(o.qty),
    rate: str(o.rate),
  };
}

function parseTableArray<T>(v: unknown, parseOne: (x: unknown) => T, empty: () => T): T[] {
  if (!Array.isArray(v) || v.length === 0) return [empty()];
  return v.map(parseOne);
}

export function parseTruckingTab(raw: unknown): TruckingTabState {
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    trucks: parseTableArray(o.trucks, parseTruckRow, emptyTruckingTruckRow),
    quotations: parseTableArray(o.quotations, parseQuotationRow, emptyTruckingQuotationRow),
    billing_lines: parseTableArray(o.billing_lines, parseBillingLineRow, emptyTruckingBillingLineRow),
    exchange_date: str(o.exchange_date),
    exchange_rate: str(o.exchange_rate),
  };
}

export function mergeTruckingPersisted(state: TruckingTabState): Record<string, unknown> {
  return {
    trucks: state.trucks.map((r) => ({
      house_bl: r.house_bl.trim(),
      pol: r.pol.trim(),
      pod: r.pod.trim(),
      plate_number: r.plate_number.trim(),
      customs_declaration: r.customs_declaration.trim(),
      salesman: r.salesman.trim(),
      load_type: r.load_type.trim(),
      service_terms: r.service_terms.trim(),
      bound: r.bound.trim(),
      incoterm: r.incoterm.trim(),
      transport_mode: r.transport_mode.trim(),
      area: r.area.trim(),
      partner: r.partner.trim(),
    })),
    quotations: state.quotations.map((r) => ({
      quotation: r.quotation.trim(),
      customer: r.customer.trim(),
      status: r.status.trim(),
    })),
    billing_lines: state.billing_lines.map((r) => ({
      customer: r.customer.trim(),
      service: r.service.trim(),
      truck: r.truck.trim(),
      fare: r.fare.trim(),
      fare_name: r.fare_name.trim(),
      tax: r.tax.trim(),
      fare_type: r.fare_type.trim(),
      currency: r.currency.trim(),
      exchange_rate: r.exchange_rate.trim(),
      unit: r.unit.trim(),
      qty: r.qty.trim(),
      rate: r.rate.trim(),
    })),
    exchange_date: state.exchange_date.trim(),
    exchange_rate: state.exchange_rate.trim(),
  };
}
