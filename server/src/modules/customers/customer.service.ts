import { supabase } from '../../config/supabase';
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

  async getDetails(id: string): Promise<any> {
    // 1. Fetch Customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (customerError) throw customerError;
    if (!customer) return null;

    // 2. Fetch Contacts
    const { data: contacts } = await supabase
      .from('customer_contacts')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: true });

    // 3. Fetch Notes
    const { data: notes } = await supabase
      .from('customer_notes')
      .select('*, author:employees(full_name)')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    // 4. Fetch Shipments
    const { data: shipments } = await supabase
      .from('shipments')
      .select('*, suppliers(company_name), employees!shipments_pic_id_fkey(full_name)')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    const shipmentIds = (shipments || []).map((s: any) => s.id);

    // 5. Fetch Sales/Quotations
    let sales = [];
    if (shipmentIds.length > 0) {
      const { data: salesData } = await supabase
        .from('sales')
        .select('*, sales_items(total)')
        .in('shipment_id', shipmentIds)
        .order('created_at', { ascending: false });
      sales = salesData || [];
    }

    return {
      ...customer,
      contacts: contacts || [],
      notes: notes || [],
      shipments: shipments || [],
      sales: sales
    };
  }
}
