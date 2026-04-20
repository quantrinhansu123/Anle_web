import { formatDate } from '../../lib/utils';
import { parseSeaHouseBlV1 } from './seaHouseBlPersistence';
import type { Shipment } from './types';

const BL_RELEASE_LABELS: Record<string, string> = {
  draft: 'Draft',
  surrendered: 'Surrendered',
  released: 'Released',
  hold: 'Hold',
};

function seaHouseBlBlob(shipment: Shipment): unknown {
  const sd = shipment.service_details as Record<string, unknown> | null | undefined;
  if (!sd || typeof sd !== 'object') return undefined;
  return sd.sea_house_bl;
}

function cellDate(raw: string | null | undefined): string {
  const t = (raw || '').trim();
  if (!t) return '—';
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return formatDate(t.slice(0, 10));
  return t;
}

function partyName(name: string | undefined, code: string | undefined): string {
  const n = (name || '').trim();
  const c = (code || '').trim();
  if (n && c) return `${n} (${c})`;
  return n || c || '—';
}

function formatContainers(shipment: Shipment, parsed: ReturnType<typeof parseSeaHouseBlV1>): string {
  if (parsed) {
    const nums = (parsed.container.containerRows || [])
      .map((r) => (r.containerNo || '').trim())
      .filter(Boolean);
    if (nums.length > 0) {
      const shown = nums.slice(0, 4).join(', ');
      return nums.length > 4 ? `${shown}…` : shown;
    }
  }
  const lines = (shipment as any).bl_lines || [];
  const fromLines = lines
    .map((l: any) => (l.name_1 || '').trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');
  return fromLines || '—';
}

function blReleaseLabel(raw: string | undefined | null): string {
  const t = (raw || '').trim().toLowerCase();
  if (!t) return '—';
  return BL_RELEASE_LABELS[t] ?? (raw || '').trim();
}

export type HouseSeaBlTableRow = {
  shipmentId: string;
  masterJobNo: string;
  mbl: string;
  hbl: string;
  cont: string;
  shpr: string;
  cnee: string;
  salesman: string;
  pol: string;
  pod: string;
  etd: string;
  eta: string;
  atd: string;
  ata: string;
  status: string;
  operators: string;
};

export function buildHouseSeaBlTableRow(shipment: Shipment): HouseSeaBlTableRow {
  const parsed = parseSeaHouseBlV1(seaHouseBlBlob(shipment));
  const top = parsed?.topBar;
  const header = parsed?.header;

  const mblFromShipment = (shipment.master_bl_number || '').trim();
  const mblFromBlob = (top?.masterBl || '').trim();
  const mbl = mblFromShipment || mblFromBlob || '—';

  const hbl = (top?.hbl || '').trim() || '—';

  return {
    shipmentId: shipment.id,
    masterJobNo: shipment.master_job_no || '—',
    mbl,
    hbl,
    cont: formatContainers(shipment, parsed),
    shpr: partyName(header?.shipperName, header?.shipper),
    cnee: partyName(header?.consigneeName, header?.consignee),
    salesman: shipment.salesperson?.full_name?.trim() || '—',
    pol: (header?.pol || '').trim() || '—',
    pod: (header?.pod || '').trim() || '—',
    etd: cellDate(header?.etd),
    eta: cellDate(header?.eta),
    atd: cellDate(header?.atd),
    ata: cellDate(header?.ata),
    status: blReleaseLabel(top?.blReleaseStatus),
    operators: (shipment.operators || '').trim() || '—',
  };
}

export function houseSeaBlRowSearchBlob(row: HouseSeaBlTableRow): string {
  return [
    row.masterJobNo,
    row.mbl,
    row.hbl,
    row.cont,
    row.shpr,
    row.cnee,
    row.salesman,
    row.pol,
    row.pod,
    row.etd,
    row.eta,
    row.atd,
    row.ata,
    row.status,
    row.operators,
  ]
    .join(' ')
    .toLowerCase();
}
