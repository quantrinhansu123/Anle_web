import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type { CreateTradingSaleDto, UpdateTradingSaleDto } from './trading-sales.types';

const SELECT =
  '*, shipments(*)';

export const tradingSalesService = {
  async getAll(page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('trading_sales')
      .select(SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new AppError(error.message, 400);
    return { data: data ?? [], count: count ?? 0 };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('trading_sales')
      .select(SELECT)
      .eq('id', id)
      .single();

    if (error) throw new AppError(error.message, 404);
    return data;
  },

  async create(dto: CreateTradingSaleDto) {
    const payload = {
      ...dto,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('trading_sales')
      .insert(payload)
      .select(SELECT)
      .single();

    if (error) throw new AppError(error.message, 400);
    return data;
  },

  async update(id: string, dto: UpdateTradingSaleDto) {
    const payload = {
      ...dto,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('trading_sales')
      .update(payload)
      .eq('id', id)
      .select(SELECT)
      .single();

    if (error) throw new AppError(error.message, 400);
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('trading_sales')
      .delete()
      .eq('id', id);

    if (error) throw new AppError(error.message, 400);
    return true;
  },
};

