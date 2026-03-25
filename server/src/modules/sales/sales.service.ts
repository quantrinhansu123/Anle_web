import { supabase } from '@/config/supabase';
import { CreateSalesItemDto, UpdateSalesItemDto, SalesItem } from './sales.types';
import { AppError } from '@/middlewares/error.middleware';

export const salesService = {
  async getAll(page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('sales_items')
      .select('*, shipments(*, customers(*), suppliers(*))', { count: 'exact' })
      .order('id', { ascending: false })
      .range(from, to);

    if (error) throw new AppError(error.message, 400);
    return { data: data ?? [], count: count ?? 0 };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('sales_items')
      .select('*, shipments(*, customers(*), suppliers(*))')
      .eq('id', id)
      .single();

    if (error) throw new AppError(error.message, 404);
    return data;
  },

  async create(dto: CreateSalesItemDto) {
    const { data, error } = await supabase
      .from('sales_items')
      .insert(dto)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    return data;
  },

  async update(id: string, dto: UpdateSalesItemDto) {
    const { data, error } = await supabase
      .from('sales_items')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('sales_items')
      .delete()
      .eq('id', id);

    if (error) throw new AppError(error.message, 400);
    return true;
  }
};
