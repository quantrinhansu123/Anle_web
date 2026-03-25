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

  async getDetails(id: string): Promise<any> {
    // 1. Fetch Supplier
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (supplierError) throw supplierError;
    if (!supplier) return null;

    // 2. Fetch Shipments
    const { data: shipments, error: shipmentsError } = await supabase
      .from('shipments')
      .select('*, customers(company_name)')
      .eq('supplier_id', id)
      .order('created_at', { ascending: false });

    if (shipmentsError) throw shipmentsError;

    const shipmentIds = (shipments || []).map(s => s.id);

    // 3. Fetch Payment Requests and Debit Notes if there are shipments
    let paymentRequests = [];
    let debitNotes = [];

    if (shipmentIds.length > 0) {
      const [prResult, dnResult] = await Promise.all([
        supabase
          .from('payment_requests_totals')
          .select('*, shipments(id, current_supplier:suppliers(company_name))')
          .in('shipment_id', shipmentIds)
          .order('request_date', { ascending: false }),
        supabase
          .from('debit_notes')
          .select('*, shipments(id, customers(company_name), suppliers(company_name))')
          .in('shipment_id', shipmentIds)
          .order('note_date', { ascending: false })
      ]);

      if (prResult.error) throw prResult.error;
      if (dnResult.error) throw dnResult.error;

      paymentRequests = prResult.data || [];
      debitNotes = dnResult.data || [];
    }

    return {
      ...supplier,
      shipments: shipments || [],
      payment_requests: paymentRequests,
      debit_notes: debitNotes
    };
  }
}
