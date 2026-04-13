import { supabase } from '../../config/supabase';
import { CreateSalesDto, UpdateSalesDto } from './sales.types';
import { AppError } from '../../middlewares/error.middleware';

const SALES_SELECT = '*, sales_items(*), sales_charge_items(*), shipments(*, customers(*), suppliers(*)), sales_person:employees(*)';

const HEADER_FIELDS: Array<keyof CreateSalesDto> = [
  'shipment_id',
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

    // 1. Insert header
    const { data: header, error: headerError } = await supabase
      .from('sales')
      .insert(pickHeaderPayload(headerDto))
      .select()
      .single();

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

    return this.getById(header.id);
  },

  async update(id: string, dto: UpdateSalesDto) {
    const { items, charge_items, ...headerDto } = dto;

    const headerPayload = pickHeaderPayload(headerDto);
    if (Object.keys(headerPayload).length > 0) {
       const { error: headerErr } = await supabase
         .from('sales')
         .update(headerPayload)
         .eq('id', id);
       if (headerErr) throw new AppError(headerErr.message, 400);
    }

    if (items) {
      await syncSalesItems(id, items);
    }

    if (charge_items) {
      await syncChargeItems(id, charge_items);
    }

    return this.getById(id);
  },

  async delete(id: string) {
    // Cascading delete is configured on sales_items.sales_id
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (error) throw new AppError(error.message, 400);
    return true;
  }
};
