import type { SalesFormState } from '../sales/types';
import type { CreateShipmentDto, JobBound } from './types';

function sliceIsoDate(v?: string | null): string | null {
  if (!v) return null;
  const s = String(v).trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function mapQuotationDirectionToBound(direction?: string | null): JobBound | null {
  const d = String(direction ?? '')
    .trim()
    .toLowerCase();
  if (d === 'import' || d === 'export' || d === 'domestic' || d === 'transit') return d;
  return null;
}

function clampPriorityRank(raw?: number | null): number {
  const r = Number(raw);
  if (!Number.isFinite(r)) return 1;
  return Math.min(3, Math.max(1, Math.round(r)));
}

/**
 * Builds a partial CreateShipmentDto from a quotation editor form.
 */
export async function buildShipmentFieldsFromQuotation(form: SalesFormState): Promise<Partial<CreateShipmentDto>> {
  if (!form.id) throw new Error('Quotation must be saved before creating a shipment');

  const ship = form.relatedShipment;
  const custId = (ship?.customer_id || '').trim();

  let customer_id: string | undefined = custId || undefined;

  const performance_date = sliceIsoDate(form.due_date) || sliceIsoDate(form.quote_date);
  const job_date = sliceIsoDate(form.quote_date) || performance_date;

  const serviceParts = [form.service_mode, form.direction, form.goods].filter(
    (x): x is string => typeof x === 'string' && x.trim().length > 0,
  );
  const services = serviceParts.length ? serviceParts.map((s) => s.trim()).join(' · ') : null;

  const etd = sliceIsoDate(ship?.etd);
  const eta = sliceIsoDate(ship?.eta);
  const seaEtd = ship?.transport_sea ? etd : null;
  const seaEta = ship?.transport_sea ? eta : null;
  const airEtd = ship?.transport_air ? etd : null;
  const airEta = ship?.transport_air ? eta : null;

  const cargoHint = [form.cargo_volume, ship?.packing, ship?.commodity].find(
    (x): x is string => typeof x === 'string' && x.trim().length > 0,
  );

  return {
    quotation_id: form.id,
    job_date,
    performance_date,
    salesperson_id: form.sales_person_id || null,
    sales_team: (form.business_team || '').trim() || null,
    sales_department: (form.business_department || '').trim() || null,
    customer_id,
    bound: mapQuotationDirectionToBound(form.direction),
    services,
    status: 'draft',
    priority_rank: clampPriorityRank(form.priority_rank),
    master_bl_number: (form.bill_no || '').trim() || null,
    bl_lines: [
      {
        sort_order: 0,
        name_1: (form.goods || ship?.commodity || '').trim() || null,
        sea_customer: null,
        air_customer: null,
        name_2: [form.pickup, form.final_destination].filter(Boolean).join(' → ') || null,
        package_text: cargoHint ? cargoHint.trim() : null,
        unit_text: null,
        sea_etd: seaEtd,
        sea_eta: seaEta,
        air_etd: airEtd,
        air_eta: airEta,
        loading_date: null,
        delivery_date: null,
      },
    ],
  };
}
