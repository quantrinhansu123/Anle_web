import { supabase } from '@/config/supabase';
import type { 
  CreatePaymentRequestDto, 
  PaymentRequest, 
  UpdatePaymentRequestDto,
  PaymentRequestInvoice 
} from './payment-request.types';

export class PaymentRequestService {
  async findAll(page = 1, limit = 20): Promise<{ data: any[]; count: number }> {
    const from = (page - 1) * limit;
    
    // Using the view payment_requests_totals if helpful, 
    // but the user wants Shipment ID and Date and No_Doc.
    // Let's select from payment_requests and join shipments
    // Select from view to get total_amount, but we still need shipments join for filtering/display
    const { data, error, count } = await supabase
      .from('payment_requests_totals')
      .select('*, shipments(id, supplier_id, suppliers(company_name))', { count: 'exact' })
      .range(from, from + limit - 1)
      .order('request_date', { ascending: false });

    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  async findById(id: string): Promise<PaymentRequest | null> {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*, invoices:payment_request_invoices(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(dto: CreatePaymentRequestDto): Promise<PaymentRequest> {
    const { invoices, ...requestData } = dto;

    // 1. Create Payment Request
    const { data: request, error: requestError } = await supabase
      .from('payment_requests')
      .insert(requestData)
      .select()
      .single();

    if (requestError) throw requestError;

    // 2. Create Invoices
    if (invoices && invoices.length > 0) {
      const invoicesWithId = invoices.map((inv, index) => ({
        ...inv,
        payment_request_id: request.id,
        sort_order: index
      }));

      const { error: invoiceError } = await supabase
        .from('payment_request_invoices')
        .insert(invoicesWithId);

      if (invoiceError) {
        // Optional: rollback request if possible, but let's keep it simple
        throw invoiceError;
      }
    }

    return this.findById(request.id) as Promise<PaymentRequest>;
  }

  async update(id: string, dto: UpdatePaymentRequestDto): Promise<PaymentRequest> {
    const { invoices, ...requestData } = dto;

    // 1. Update Payment Request
    if (Object.keys(requestData).length > 0) {
      const { error: requestError } = await supabase
        .from('payment_requests')
        .update(requestData)
        .eq('id', id);

      if (requestError) throw requestError;
    }

    // 2. Update Invoices (Simple approach: delete all and re-insert)
    if (invoices) {
      // DELETE existing
      const { error: deleteError } = await supabase
        .from('payment_request_invoices')
        .delete()
        .eq('payment_request_id', id);

      if (deleteError) throw deleteError;

      // INSERT new ones
      const invoicesToInsert = invoices.map((inv, index) => ({
        no_invoice: inv.no_invoice,
        description: inv.description,
        date_issue: inv.date_issue,
        payable_amount: inv.payable_amount,
        payment_request_id: id,
        sort_order: index
      }));

      const { error: insertError } = await supabase
        .from('payment_request_invoices')
        .insert(invoicesToInsert);

      if (insertError) throw insertError;
    }

    return this.findById(id) as Promise<PaymentRequest>;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('payment_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
