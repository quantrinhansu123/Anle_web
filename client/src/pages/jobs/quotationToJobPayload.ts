import { customerService } from '../../services/customerService';
import type { SalesFormState } from '../sales/types';
import type { JobBound, JobUpsertPayload } from './types';

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

function clampJobPriorityRank(raw?: number | null): number {
  const r = Number(raw);
  if (!Number.isFinite(r)) return 1;
  return Math.min(3, Math.max(1, Math.round(r)));
}

/**
 * Builds the payload for POST /jobs from a quotation editor form (mirrors JobEditorPage.handleQuotationChange fills).
 */
export async function buildJobCreatePayloadFromQuotation(form: SalesFormState): Promise<JobUpsertPayload> {
  if (!form.id) throw new Error('Quotation must be saved before creating a job');

  const ship = form.relatedShipment;
  const custId = (ship?.customer_id || '').trim();
  const qPic = (form.customer_contact_name || '').trim();
  const qPhone = (form.customer_contact_tel || '').trim();
  const qEmail = (form.customer_contact_email || '').trim();
  const sc = ship?.customers;

  let customer_id: string | null = custId || null;
  let customer_pic = '';
  let customer_phone = '';
  let customer_email = '';

  if (custId) {
    let pic = qPic || sc?.sales_staff || '';
    let phone = qPhone || sc?.phone || '';
    let email = qEmail || sc?.email || '';
    if (!pic || !phone || !email) {
      try {
        const det = await customerService.getCustomerDetails(custId);
        const c0 = det.contacts?.[0];
        if (!pic) pic = c0?.full_name || det.sales_staff || '';
        if (!phone) phone = det.phone || c0?.phone || '';
        if (!email) email = det.email || c0?.email || '';
      } catch {
        /* keep partial fill from quotation / shipment */
      }
    }
    customer_pic = pic || '';
    customer_phone = phone || '';
    customer_email = email || '';
  } else {
    customer_pic = qPic;
    customer_phone = qPhone;
    customer_email = qEmail;
  }

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
    customer_pic: customer_pic.trim() || null,
    customer_phone: customer_phone.trim() || null,
    customer_email: customer_email.trim() || null,
    bound: mapQuotationDirectionToBound(form.direction),
    services,
    workflow_status: 'draft',
    priority_rank: clampJobPriorityRank(form.priority_rank),
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
      },
    ],
  };
}
