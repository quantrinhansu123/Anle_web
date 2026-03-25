import { supabase } from '../../config/supabase';
import { CreatePurchasingItemDto, UpdatePurchasingItemDto, PurchasingItem } from './purchasing.types';
import { AppError } from '../../middlewares/error.middleware';

export const purchasingService = {
  async getAll(page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('purchasing_items')
      .select('*, shipments(*, customers(*), suppliers(*)), suppliers(*), employees(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new AppError(error.message, 400);
    return { data: data ?? [], count: count ?? 0 };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('purchasing_items')
      .select('*, shipments(*, customers(*), suppliers(*)), suppliers(*), employees(*)')
      .eq('id', id)
      .single();

    if (error) throw new AppError(error.message, 404);
    return data;
  },

  async create(dto: CreatePurchasingItemDto) {
    const { data, error } = await supabase
      .from('purchasing_items')
      .insert(dto)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    return data;
  },

  async update(id: string, dto: UpdatePurchasingItemDto) {
    const { data, error } = await supabase
      .from('purchasing_items')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('purchasing_items')
      .delete()
      .eq('id', id);

    if (error) throw new AppError(error.message, 400);
    return true;
  }
};
