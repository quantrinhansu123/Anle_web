/** Persisted under `service_details.customs` on `fms_jobs`. */

export interface CustomsContainerRow {
  type: string;
  size: string;
  total_quantity: string;
}

export interface CustomsAttachmentRow {
  label: string;
  file_name: string;
  file_url: string;
}

export interface CustomsScheduleRow {
  from: string;
  etd: string;
  departure_time_to: string;
  eta: string;
  arrival_time: string;
  carrier: string;
  carrier_name: string;
}

export interface CustomsTabState {
  inner_job_no: string;
  area: string;
  bound: string;
  incoterms: string;
  shipper: string;
  consignee: string;
  customer: string;
  co_loader: string;
  pic: string;
  phone: string;
  email: string;
  container_volumes: CustomsContainerRow[];
  commodity: string;
  commodity_vi: string;
  procedure_code: string;
  hs_code: string;
  cds_quantity: string;
  custom_remark: string;
  attachments: CustomsAttachmentRow[];
  schedule_rows: CustomsScheduleRow[];
}

function str(v: unknown): string {
  return v == null ? '' : String(v);
}

export function emptyCustomsContainerRow(): CustomsContainerRow {
  return { type: '', size: '', total_quantity: '' };
}

export function emptyCustomsAttachmentRow(): CustomsAttachmentRow {
  return { label: '', file_name: '', file_url: '' };
}

export function emptyCustomsScheduleRow(): CustomsScheduleRow {
  return {
    from: '',
    etd: '',
    departure_time_to: '',
    eta: '',
    arrival_time: '',
    carrier: '',
    carrier_name: '',
  };
}

export function emptyCustomsTabState(): CustomsTabState {
  return {
    inner_job_no: '',
    area: '',
    bound: '',
    incoterms: '',
    shipper: '',
    consignee: '',
    customer: '',
    co_loader: '',
    pic: '',
    phone: '',
    email: '',
    container_volumes: [emptyCustomsContainerRow()],
    commodity: '',
    commodity_vi: '',
    procedure_code: '',
    hs_code: '',
    cds_quantity: '',
    custom_remark: '',
    attachments: [emptyCustomsAttachmentRow()],
    schedule_rows: [emptyCustomsScheduleRow()],
  };
}

function parseContainerRow(x: unknown): CustomsContainerRow {
  const o = x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
  return {
    type: str(o.type),
    size: str(o.size),
    total_quantity: str(o.total_quantity),
  };
}

function parseAttachmentRow(x: unknown): CustomsAttachmentRow {
  const o = x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
  return {
    label: str(o.label ?? o.attachments),
    file_name: str(o.file_name),
    file_url: str(o.file_url ?? o.url),
  };
}

function parseScheduleRow(x: unknown): CustomsScheduleRow {
  const o = x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
  return {
    from: str(o.from),
    etd: str(o.etd),
    departure_time_to: str(o.departure_time_to),
    eta: str(o.eta),
    arrival_time: str(o.arrival_time),
    carrier: str(o.carrier),
    carrier_name: str(o.carrier_name),
  };
}

function parseTableArray<T>(v: unknown, parseOne: (x: unknown) => T, empty: () => T): T[] {
  if (!Array.isArray(v) || v.length === 0) return [empty()];
  return v.map(parseOne);
}

export function parseCustomsTab(raw: unknown): CustomsTabState {
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    inner_job_no: str(o.inner_job_no),
    area: str(o.area),
    bound: str(o.bound),
    incoterms: str(o.incoterms),
    shipper: str(o.shipper),
    consignee: str(o.consignee),
    customer: str(o.customer),
    co_loader: str(o.co_loader),
    pic: str(o.pic),
    phone: str(o.phone),
    email: str(o.email),
    container_volumes: parseTableArray(o.container_volumes, parseContainerRow, emptyCustomsContainerRow),
    commodity: str(o.commodity),
    commodity_vi: str(o.commodity_vi),
    procedure_code: str(o.procedure_code),
    hs_code: str(o.hs_code),
    cds_quantity: str(o.cds_quantity),
    custom_remark: str(o.custom_remark),
    attachments: parseTableArray(o.attachments, parseAttachmentRow, emptyCustomsAttachmentRow),
    schedule_rows: parseTableArray(o.schedule_rows, parseScheduleRow, emptyCustomsScheduleRow),
  };
}

export function mergeCustomsPersisted(state: CustomsTabState): Record<string, unknown> {
  return {
    inner_job_no: state.inner_job_no.trim(),
    area: state.area.trim(),
    bound: state.bound.trim(),
    incoterms: state.incoterms.trim(),
    shipper: state.shipper.trim(),
    consignee: state.consignee.trim(),
    customer: state.customer.trim(),
    co_loader: state.co_loader.trim(),
    pic: state.pic.trim(),
    phone: state.phone.trim(),
    email: state.email.trim(),
    container_volumes: state.container_volumes.map((r) => ({
      type: r.type.trim(),
      size: r.size.trim(),
      total_quantity: r.total_quantity.trim(),
    })),
    commodity: state.commodity.trim(),
    commodity_vi: state.commodity_vi.trim(),
    procedure_code: state.procedure_code.trim(),
    hs_code: state.hs_code.trim(),
    cds_quantity: state.cds_quantity.trim(),
    custom_remark: state.custom_remark.trim(),
    attachments: state.attachments.map((r) => ({
      label: r.label.trim(),
      file_name: r.file_name.trim(),
      file_url: r.file_url.trim(),
    })),
    schedule_rows: state.schedule_rows.map((r) => ({
      from: r.from.trim(),
      etd: r.etd.trim(),
      departure_time_to: r.departure_time_to.trim(),
      eta: r.eta.trim(),
      arrival_time: r.arrival_time.trim(),
      carrier: r.carrier.trim(),
      carrier_name: r.carrier_name.trim(),
    })),
  };
}
