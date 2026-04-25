import { supabase } from '../../config/supabase';
import { CreateSalesDto, UpdateSalesDto } from './sales.types';
import { AppError } from '../../middlewares/error.middleware';
import { ShipmentService } from '../shipments/shipment.service';
import type { CreateShipmentDto } from '../shipments/shipment.types';
import { assertStatusTransition, normalizeStatus, type CanonicalStatus } from './sales.workflow';

const SALES_SELECT = '*, sales_items(*), sales_charge_items(*), shipments!sales_shipment_id_fkey(*, customers(*), suppliers(*)), sales_person:employees(*)';
const shipmentService = new ShipmentService();

const HEADER_FIELDS: Array<keyof CreateSalesDto> = [
  'shipment_id',
  'customer_id',
  'quote_date',
  'status',
  'priority_rank',
  'quotation_type',
  'due_date',
  'validity_from',
  'validity_to',
  'sales_person_id',
  'customer_trade_name',
  'customer_contact_name',
  'customer_contact_email',
  'customer_contact_tel',
  'pickup',
  'final_destination',
  'cargo_volume',
  'business_team',
  'business_department',
  'goods',
  'transit_time',
  'service_mode',
  'direction',
  'currency_code',
  'job_no',
  'sales_inquiry_no',
  'bill_no',
  'customs_declaration_no',
  'incoterms',
  'notes',
  'exchange_rate',
  'exchange_rate_date',
];

const pickHeaderPayload = (dto: Partial<CreateSalesDto>) => {
  const payload: Record<string, unknown> = {};
  for (const key of HEADER_FIELDS) {
    const value = dto[key];
    if (value !== undefined) {
      payload[key] = value;
    }
  }
  return payload;
};

const toLegacySalesStatus = (status: CanonicalStatus): string => {
  if (status === 'won') return 'converted';
  if (status === 'lost') return 'final';
  return status;
};

const isSalesStatusConstraintError = (error: unknown): boolean => {
  const msg = (error as { message?: string } | null)?.message || '';
  return msg.includes('sales_status_check');
};

const isMissingSalesColumnError = (error: unknown, column: string): boolean => {
  const msg = (error as { message?: string } | null)?.message || '';
  return msg.includes(`Could not find the '${column}' column of 'sales'`);
};

const syncSalesItems = async (salesId: string, incomingItems: NonNullable<UpdateSalesDto['items']>) => {
  const { data: currentItems } = await supabase
    .from('sales_items')
    .select('id')
    .eq('sales_id', salesId);

  const currentIds = currentItems?.map(i => i.id) || [];
  const incomingIds = incomingItems.map(i => i.id).filter(Boolean);
  const idsToDelete = currentIds.filter(itemId => !incomingIds.includes(itemId));

  if (idsToDelete.length > 0) {
    const { error: delErr } = await supabase.from('sales_items').delete().in('id', idsToDelete);
    if (delErr) throw new AppError(delErr.message, 400);
  }

  const itemsToUpdate = incomingItems.filter(i => i.id).map(i => ({ ...i, sales_id: salesId }));
  const itemsToInsert = incomingItems.filter(i => !i.id).map(i => {
    const { id: _id, ...rest } = i as any;
    return { ...rest, sales_id: salesId };
  });

  if (itemsToUpdate.length > 0) {
    const { error: upErr } = await supabase.from('sales_items').upsert(itemsToUpdate);
    if (upErr) throw new AppError(upErr.message, 400);
  }

  if (itemsToInsert.length > 0) {
    const { error: inErr } = await supabase.from('sales_items').insert(itemsToInsert);
    if (inErr) throw new AppError(inErr.message, 400);
  }
};

const syncChargeItems = async (salesId: string, incomingCharges: NonNullable<UpdateSalesDto['charge_items']>) => {
  const { data: currentItems } = await supabase
    .from('sales_charge_items')
    .select('id')
    .eq('sales_id', salesId);

  const currentIds = currentItems?.map(i => i.id) || [];
  const incomingIds = incomingCharges.map(i => i.id).filter(Boolean);
  const idsToDelete = currentIds.filter(itemId => !incomingIds.includes(itemId));

  if (idsToDelete.length > 0) {
    const { error: delErr } = await supabase.from('sales_charge_items').delete().in('id', idsToDelete);
    if (delErr) throw new AppError(delErr.message, 400);
  }

  const itemsToUpdate = incomingCharges.filter(i => i.id).map(i => ({ ...i, sales_id: salesId }));
  const itemsToInsert = incomingCharges.filter(i => !i.id).map(i => {
    const { id: _id, ...rest } = i as any;
    return { ...rest, sales_id: salesId };
  });

  if (itemsToUpdate.length > 0) {
    const { error: upErr } = await supabase.from('sales_charge_items').upsert(itemsToUpdate);
    if (upErr) throw new AppError(upErr.message, 400);
  }

  if (itemsToInsert.length > 0) {
    const { error: inErr } = await supabase.from('sales_charge_items').insert(itemsToInsert);
    if (inErr) throw new AppError(inErr.message, 400);
  }
};

export const salesService = {
  async getAll(page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('sales')
      .select(SALES_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new AppError(error.message, 400);
    return { data: data ?? [], count: count ?? 0 };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('sales')
      .select(SALES_SELECT)
      .eq('id', id)
      .single();

    if (error) throw new AppError(error.message, 404);
    return data;
  },

  async create(dto: CreateSalesDto) {
    const { items = [], charge_items = [], ...headerDto } = dto;
    const normalizedStatus = normalizeStatus(headerDto.status);
    const buildInsertPayload = (includeCustomerId: boolean) => {
      const baseHeader =
        includeCustomerId
          ? headerDto
          : (() => {
              const { customer_id: _customerId, ...rest } = headerDto;
              return rest;
            })();
      return {
        ...pickHeaderPayload(baseHeader),
        status: normalizedStatus,
      };
    };
    let baseInsertPayload = buildInsertPayload(true);
    let allowCustomerId = true;
    let { data: header, error: headerError } = await supabase
      .from('sales')
      .insert(baseInsertPayload)
      .select()
      .single();

    // Backward compatibility for databases that do not yet have sales.customer_id.
    if (headerError && allowCustomerId && isMissingSalesColumnError(headerError, 'customer_id')) {
      allowCustomerId = false;
      baseInsertPayload = buildInsertPayload(false);
      const retryWithoutCustomer = await supabase
        .from('sales')
        .insert(baseInsertPayload)
        .select()
        .single();
      header = retryWithoutCustomer.data;
      headerError = retryWithoutCustomer.error;
    }

    // Backward compatibility for databases still using legacy sales_status_check.
    if (headerError && isSalesStatusConstraintError(headerError)) {
      const legacyPayload = {
        ...baseInsertPayload,
        status: toLegacySalesStatus(normalizedStatus),
      };
      const retry = await supabase
        .from('sales')
        .insert(legacyPayload)
        .select()
        .single();
      header = retry.data;
      headerError = retry.error;
    }
    if (headerError && allowCustomerId && isMissingSalesColumnError(headerError, 'customer_id')) {
      allowCustomerId = false;
      baseInsertPayload = buildInsertPayload(false);
      const legacyPayload = {
        ...baseInsertPayload,
        status: toLegacySalesStatus(normalizedStatus),
      };
      const retryLegacyWithoutCustomer = await supabase
        .from('sales')
        .insert(legacyPayload)
        .select()
        .single();
      header = retryLegacyWithoutCustomer.data;
      headerError = retryLegacyWithoutCustomer.error;
    }

    if (headerError) throw new AppError(headerError.message, 400);

    // 2. Insert lines
    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        ...item,
        sales_id: header.id
      }));

      const { error: itemsError } = await supabase
        .from('sales_items')
        .insert(itemsToInsert);

      if (itemsError) {
        await supabase.from('sales').delete().eq('id', header.id);
        throw new AppError(itemsError.message, 400);
      }
    }

    if (charge_items.length > 0) {
      const chargesToInsert = charge_items.map(item => ({
        ...item,
        sales_id: header.id,
      }));

      const { error: chargeErr } = await supabase
        .from('sales_charge_items')
        .insert(chargesToInsert);

      if (chargeErr) {
        await supabase.from('sales').delete().eq('id', header.id);
        throw new AppError(chargeErr.message, 400);
      }
    }

    const created = await this.getById(header.id);
    await this.syncCustomerStatus(created, normalizedStatus);
    return this.getById(header.id);
  },

  async update(id: string, dto: UpdateSalesDto) {
    const { items, charge_items, ...headerDto } = dto;
    const current = await this.getById(id);
    const currentStatus = normalizeStatus(current.status);

    const headerPayload = pickHeaderPayload(headerDto);
    if (headerDto.status !== undefined) {
      const nextStatus = normalizeStatus(headerDto.status);
      this.assertStatusTransition(currentStatus, nextStatus);
      headerPayload.status = nextStatus;
    }

    if (Object.keys(headerPayload).length > 0) {
       let { error: headerErr } = await supabase
         .from('sales')
         .update(headerPayload)
         .eq('id', id);

       if (headerErr && Object.prototype.hasOwnProperty.call(headerPayload, 'customer_id') && isMissingSalesColumnError(headerErr, 'customer_id')) {
         const { customer_id: _customerId, ...fallbackPayload } = headerPayload;
         const retryWithoutCustomer = await supabase
           .from('sales')
           .update(fallbackPayload)
           .eq('id', id);
         headerErr = retryWithoutCustomer.error;
       }

       if (headerErr && isSalesStatusConstraintError(headerErr) && typeof headerPayload.status === 'string') {
         const legacyPayload = {
           ...headerPayload,
           status: toLegacySalesStatus(headerPayload.status as CanonicalStatus),
         };
         const retry = await supabase
           .from('sales')
           .update(legacyPayload)
           .eq('id', id);
         headerErr = retry.error;

         if (headerErr && Object.prototype.hasOwnProperty.call(legacyPayload, 'customer_id') && isMissingSalesColumnError(headerErr, 'customer_id')) {
           const { customer_id: _customerId, ...legacyFallbackPayload } = legacyPayload as Record<string, unknown>;
           const retryLegacyWithoutCustomer = await supabase
             .from('sales')
             .update(legacyFallbackPayload)
             .eq('id', id);
           headerErr = retryLegacyWithoutCustomer.error;
         }
       }

       if (headerErr) throw new AppError(headerErr.message, 400);
    }

    if (items) {
      await syncSalesItems(id, items);
    }

    if (charge_items) {
      await syncChargeItems(id, charge_items);
    }

    const updated = await this.getById(id);
    await this.syncCustomerStatus(updated, normalizeStatus(updated.status));
    return updated;
  },

  async delete(id: string) {
    // Cascading delete is configured on sales_items.sales_id
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (error) throw new AppError(error.message, 400);
    return true;
  },

  assertStatusTransition(current: CanonicalStatus, next: CanonicalStatus) {
    assertStatusTransition(current, next);
  },

  async syncCustomerStatus(sale: any, status: CanonicalStatus) {
    const customerId = sale?.customer_id || sale?.shipments?.customer_id || null;
    if (!customerId) return;

    const mappedCustomerStatus =
      status === 'won'
        ? 'won'
        : status === 'lost'
          ? 'lost'
          : status === 'sent'
            ? 'quotation_sent'
            : null;

    if (!mappedCustomerStatus) return;

    const { error } = await supabase
      .from('customers')
      .update({ status: mappedCustomerStatus, updated_at: new Date().toISOString() })
      .eq('id', customerId);

    if (error) throw new AppError(error.message, 400);
  },

  async changeStatus(id: string, next: CanonicalStatus) {
    const sale = await this.getById(id);
    const current = normalizeStatus(sale.status);
    this.assertStatusTransition(current, next);

    let { error } = await supabase
      .from('sales')
      .update({ status: next })
      .eq('id', id);

    if (error && isSalesStatusConstraintError(error)) {
      const retry = await supabase
        .from('sales')
        .update({ status: toLegacySalesStatus(next) })
        .eq('id', id);
      error = retry.error;
    }

    if (error) throw new AppError(error.message, 400);

    const updated = await this.getById(id);
    await this.syncCustomerStatus(updated, next);
    return updated;
  },

  async confirm(id: string) {
    return this.changeStatus(id, 'confirmed');
  },

  async markWon(id: string) {
    return this.changeStatus(id, 'won');
  },

  async markLost(id: string) {
    return this.changeStatus(id, 'lost');
  },

  async sendEmail(id: string, payload: { to_email?: string; subject?: string; content_snapshot?: string; sent_by?: string }) {
    const sale = await this.getById(id);
    const current = normalizeStatus(sale.status);
    if (current === 'draft') {
      throw new AppError('Quotation must be confirmed before sending.', 400);
    }

    const emailLogPayload = {
      sales_id: id,
      to_email: payload.to_email || sale.customer_contact_email || null,
      subject: payload.subject || `Quotation ${sale.no_doc || sale.id}`,
      content_snapshot: payload.content_snapshot || null,
      sent_by: payload.sent_by || null,
      status: 'logged',
      sent_at: new Date().toISOString(),
    };

    const { error: logErr } = await supabase
      .from('quotation_email_logs')
      .insert(emailLogPayload);
    if (logErr) throw new AppError(logErr.message, 400);

    const updated = await this.changeStatus(id, 'sent');
    return {
      quotation: updated,
      email_log: emailLogPayload,
    };
  },

  async createJob(id: string, shipmentInput?: Partial<CreateShipmentDto>) {
    const sale = await this.getById(id);
    const status = normalizeStatus(sale.status);
    if (status !== 'won') {
      throw new AppError('Only won quotations can create jobs.', 400);
    }

    if (sale.shipment_id) {
      const existing = await shipmentService.findById(sale.shipment_id);
      if (existing) {
        return { shipment: existing, quotation: sale, already_created: true };
      }
    }

    const customerId =
      shipmentInput?.customer_id ||
      sale.customer_id ||
      sale.shipments?.customer_id ||
      null;

    if (!customerId) {
      throw new AppError('Cannot create job: quotation does not have a customer.', 400);
    }

    const { bl_lines, ...shipmentHeader } = shipmentInput || {};
    const createdShipment = await shipmentService.create({
      ...(shipmentHeader as Partial<CreateShipmentDto>),
      customer_id: customerId,
      quotation_id: id,
      status: shipmentHeader.status || 'draft',
    } as CreateShipmentDto);

    if (Array.isArray(bl_lines) && bl_lines.length > 0) {
      await shipmentService.replaceBlLines(createdShipment.id, bl_lines as any);
    }

    const { error: updateErr } = await supabase
      .from('sales')
      .update({
        shipment_id: createdShipment.id,
        job_no: createdShipment.code || null,
      })
      .eq('id', id);
    if (updateErr) throw new AppError(updateErr.message, 400);

    const updatedSale = await this.getById(id);
    return { shipment: createdShipment, quotation: updatedSale, already_created: false };
  },
};
