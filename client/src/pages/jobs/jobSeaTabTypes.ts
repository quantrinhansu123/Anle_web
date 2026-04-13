/** Persisted under `service_details.sea` on `fms_jobs`. */
export interface JobSeaTabFields {
  freight_term: string;
  load_type: string;
  service_terms: string;
  incoterm: string;
  shipper: string;
  consignee: string;
  delivery_agent: string;
  vendor: string;
  co_loader: string;
  sea_internal_remark: string;
  sea_carrier: string;
  first_vessel: string;
  mvvd: string;
  por: string;
  pol: string;
  ts: string;
  pod: string;
  pvt: string;
  warehouse: string;
  liner_booking_no: string;
  voy_1: string;
  voy_2: string;
  etd: string;
  eta: string;
  si_close_at: string;
  cargo_close_at: string;
  atd: string;
  ata: string;
}

const SEA_KEYS: (keyof JobSeaTabFields)[] = [
  'freight_term',
  'load_type',
  'service_terms',
  'incoterm',
  'shipper',
  'consignee',
  'delivery_agent',
  'vendor',
  'co_loader',
  'sea_internal_remark',
  'sea_carrier',
  'first_vessel',
  'mvvd',
  'por',
  'pol',
  'ts',
  'pod',
  'pvt',
  'warehouse',
  'liner_booking_no',
  'voy_1',
  'voy_2',
  'etd',
  'eta',
  'si_close_at',
  'cargo_close_at',
  'atd',
  'ata',
];

export function emptyJobSeaTabFields(): JobSeaTabFields {
  return SEA_KEYS.reduce((acc, k) => {
    acc[k] = '';
    return acc;
  }, {} as JobSeaTabFields);
}

function str(v: unknown): string {
  return v == null ? '' : String(v);
}

export function jobSeaTabFromJson(raw: unknown): JobSeaTabFields {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const base = emptyJobSeaTabFields();
  for (const k of SEA_KEYS) {
    if (k in o) base[k] = str(o[k]);
  }
  return base;
}

export function jobSeaTabToJson(f: JobSeaTabFields): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of SEA_KEYS) {
    out[k] = (f[k] ?? '').trim();
  }
  return out;
}

/** Booking confirmation table row (persisted in `booking_confirmations`). */
export interface SeaBookingRow {
  booking: string;
  type: string;
  shipper: string;
  consignee: string;
  package: string;
  num: string;
  gross: string;
  measure: string;
}

/** Attachment row (persisted in `sea_attachments`). */
export interface SeaAttachmentRow {
  label: string;
  file_name: string;
  file_url: string;
}

/** Total container volume row (persisted in `container_volumes`). */
export interface SeaContainerVolumeRow {
  type: string;
  size: string;
  total_quantity: string;
}

/** Cargo information row (persisted in `cargo_information`). */
export interface SeaCargoRow {
  type_of_commodities: string;
  commodity: string;
  size: string;
  type: string;
  quantity: string;
  soc: string;
  package_qty: string;
  package_type: string;
  total: string;
}

export interface SeaTabTablesState {
  booking_confirmations: SeaBookingRow[];
  sea_attachments: SeaAttachmentRow[];
  container_volumes: SeaContainerVolumeRow[];
  cargo_information: SeaCargoRow[];
}

export function emptySeaBookingRow(): SeaBookingRow {
  return {
    booking: '',
    type: '',
    shipper: '',
    consignee: '',
    package: '',
    num: '',
    gross: '',
    measure: '',
  };
}

export function emptySeaAttachmentRow(): SeaAttachmentRow {
  return { label: '', file_name: '', file_url: '' };
}

export function emptySeaContainerVolumeRow(): SeaContainerVolumeRow {
  return { type: '', size: '', total_quantity: '' };
}

export function emptySeaCargoRow(): SeaCargoRow {
  return {
    type_of_commodities: '',
    commodity: '',
    size: '',
    type: '',
    quantity: '',
    soc: '',
    package_qty: '',
    package_type: '',
    total: '',
  };
}

export function emptySeaTabTables(): SeaTabTablesState {
  return {
    booking_confirmations: [emptySeaBookingRow()],
    sea_attachments: [emptySeaAttachmentRow()],
    container_volumes: [emptySeaContainerVolumeRow()],
    cargo_information: [emptySeaCargoRow()],
  };
}

function parseBookingRow(x: unknown): SeaBookingRow {
  const o = x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
  return {
    booking: str(o.booking),
    type: str(o.type),
    shipper: str(o.shipper),
    consignee: str(o.consignee),
    package: str(o.package),
    num: str(o.num),
    gross: str(o.gross),
    measure: str(o.measure),
  };
}

function parseAttachmentRow(x: unknown): SeaAttachmentRow {
  const o = x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
  return {
    label: str(o.label ?? o.attachments),
    file_name: str(o.file_name),
    file_url: str(o.file_url ?? o.url),
  };
}

function parseContainerVolumeRow(x: unknown): SeaContainerVolumeRow {
  const o = x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
  return {
    type: str(o.type),
    size: str(o.size),
    total_quantity: str(o.total_quantity),
  };
}

function parseCargoRow(x: unknown): SeaCargoRow {
  const o = x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
  return {
    type_of_commodities: str(o.type_of_commodities),
    commodity: str(o.commodity),
    size: str(o.size),
    type: str(o.type),
    quantity: str(o.quantity),
    soc: str(o.soc),
    package_qty: str(o.package_qty),
    package_type: str(o.package_type),
    total: str(o.total),
  };
}

function parseTableArray<T>(v: unknown, parseOne: (x: unknown) => T, empty: () => T): T[] {
  if (!Array.isArray(v) || v.length === 0) return [empty()];
  return v.map(parseOne);
}

/** Read table arrays from raw `service_details.sea` blob (same object as flat fields). */
export function parseSeaTables(raw: unknown): SeaTabTablesState {
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    booking_confirmations: parseTableArray(o.booking_confirmations, parseBookingRow, emptySeaBookingRow),
    sea_attachments: parseTableArray(o.sea_attachments, parseAttachmentRow, emptySeaAttachmentRow),
    container_volumes: parseTableArray(o.container_volumes, parseContainerVolumeRow, emptySeaContainerVolumeRow),
    cargo_information: parseTableArray(o.cargo_information, parseCargoRow, emptySeaCargoRow),
  };
}

export function serializeSeaTables(tables: SeaTabTablesState): Record<string, unknown> {
  return {
    booking_confirmations: tables.booking_confirmations.map((r) => ({
      booking: r.booking.trim(),
      type: r.type.trim(),
      shipper: r.shipper.trim(),
      consignee: r.consignee.trim(),
      package: r.package.trim(),
      num: r.num.trim(),
      gross: r.gross.trim(),
      measure: r.measure.trim(),
    })),
    sea_attachments: tables.sea_attachments.map((r) => ({
      label: r.label.trim() || undefined,
      file_name: r.file_name.trim(),
      file_url: r.file_url.trim() || undefined,
    })),
    container_volumes: tables.container_volumes.map((r) => ({
      type: r.type.trim(),
      size: r.size.trim(),
      total_quantity: r.total_quantity.trim(),
    })),
    cargo_information: tables.cargo_information.map((r) => ({
      type_of_commodities: r.type_of_commodities.trim(),
      commodity: r.commodity.trim(),
      size: r.size.trim(),
      type: r.type.trim(),
      quantity: r.quantity.trim(),
      soc: r.soc.trim(),
      package_qty: r.package_qty.trim(),
      package_type: r.package_type.trim(),
      total: r.total.trim(),
    })),
  };
}

/** Full `service_details.sea` object for PATCH (flat strings + table arrays). */
export function mergeSeaPersisted(fields: JobSeaTabFields, tables: SeaTabTablesState): Record<string, unknown> {
  return {
    ...jobSeaTabToJson(fields),
    ...serializeSeaTables(tables),
  };
}
