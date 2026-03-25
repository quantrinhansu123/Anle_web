import { supabase } from '@/config/supabase';
import type { CreateContractDto, Contract, UpdateContractDto } from './contract.types';

export class ContractService {
  async findAll(page = 1, limit = 20): Promise<{ data: Contract[]; count: number }> {
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('contracts')
      .select('*, customers(company_name), suppliers(company_name), employees(full_name)', { count: 'exact' })
      .range(from, from + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  async findById(id: string): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*, customers(*), suppliers(*), employees(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(dto: CreateContractDto): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .insert(dto)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, dto: UpdateContractDto): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
