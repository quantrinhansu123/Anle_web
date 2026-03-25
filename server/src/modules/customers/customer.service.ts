import { supabase } from '@/config/supabase';
import type { CreateCustomerDto, Customer, UpdateCustomerDto } from './customer.types';

export class CustomerService {
  async findAll(page = 1, limit = 20): Promise<{ data: Customer[]; count: number }> {
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .range(from, from + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  async findById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert(dto)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
