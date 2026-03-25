import { supabase } from '../../config/supabase';
import type { CreateSupplierDto, Supplier, UpdateSupplierDto } from './supplier.types';

export class SupplierService {
  async findAll(page = 1, limit = 20): Promise<{ data: Supplier[]; count: number }> {
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('suppliers')
      .select('*', { count: 'exact' })
      .range(from, from + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  async findById(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(dto)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
