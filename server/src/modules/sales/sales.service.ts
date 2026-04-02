import { supabase } from '../../config/supabase';
import { CreateSalesDto, UpdateSalesDto, Sales } from './sales.types';
import { AppError } from '../../middlewares/error.middleware';

export const salesService = {
  async getAll(page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('sales')
      .select('*, sales_items(*), shipments(*, customers(*), suppliers(*))', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new AppError(error.message, 400);
    return { data: data ?? [], count: count ?? 0 };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('sales')
      .select('*, sales_items(*), shipments(*, customers(*), suppliers(*))')
      .eq('id', id)
      .single();

    if (error) throw new AppError(error.message, 404);
    return data;
  },

  async create(dto: CreateSalesDto) {
    // 1. Insert header
    const { data: header, error: headerError } = await supabase
      .from('sales')
      .insert({ shipment_id: dto.shipment_id })
      .select()
      .single();

    if (headerError) throw new AppError(headerError.message, 400);

    // 2. Insert lines
    if (dto.items && dto.items.length > 0) {
      const itemsToInsert = dto.items.map(item => ({
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

    return this.getById(header.id);
  },

  async update(id: string, dto: UpdateSalesDto) {
    if (dto.shipment_id) {
       const { error: headerErr } = await supabase
         .from('sales')
         .update({ shipment_id: dto.shipment_id })
         .eq('id', id);
       if (headerErr) throw new AppError(headerErr.message, 400);
    }

    if (dto.items) {
      // Get current items
      const { data: currentItems } = await supabase.from('sales_items').select('id').eq('sales_id', id);
      const currentIds = currentItems?.map(i => i.id) || [];
      const incomingIds = dto.items.map(i => i.id).filter(Boolean);

      // IDs to delete
      const idsToDelete = currentIds.filter(itemId => !incomingIds.includes(itemId));

      if (idsToDelete.length > 0) {
        const { error: delErr } = await supabase.from('sales_items').delete().in('id', idsToDelete);
        if (delErr) throw new AppError(delErr.message, 400);
      }

      // Upsert / Insert
      const itemsToUpdate = dto.items.filter(i => i.id).map(i => ({ ...i, sales_id: id }));
      const itemsToInsert = dto.items.filter(i => !i.id).map(i => {
         const { id: _id, ...rest } = i as any;
         return { ...rest, sales_id: id };
      });

      if (itemsToUpdate.length > 0) {
        const { error: upErr } = await supabase.from('sales_items').upsert(itemsToUpdate);
        if (upErr) throw new AppError(upErr.message, 400);
      }

      if (itemsToInsert.length > 0) {
        const { error: inErr } = await supabase.from('sales_items').insert(itemsToInsert);
        if (inErr) throw new AppError(inErr.message, 400);
      }
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
