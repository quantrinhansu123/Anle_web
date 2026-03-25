export interface PaymentRequest {
  id: string;
  shipment_id: string;
  request_date: string;
  no_doc: string;
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
  created_at: string;
  invoices?: PaymentRequestInvoice[];
  total_amount?: number;
  shipments?: {
    id: string;
    supplier_id: string;
    suppliers?: {
      company_name: string;
    };
  };
}

export interface PaymentRequestInvoice {
  id: string;
  payment_request_id: string;
  no_invoice: string | null;
  description: string | null;
  date_issue: string | null;
  payable_amount: number | null;
  sort_order: number;
}

export interface PaymentRequestFormState {
  id?: string;
  shipment_id: string;
  request_date: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  invoices: Omit<PaymentRequestInvoice, 'id' | 'payment_request_id' | 'sort_order'>[];
}
