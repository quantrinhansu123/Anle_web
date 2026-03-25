export interface DebitNote {
  id: string;
  shipment_id: string;
  note_date: string; // ISO Date
  no_doc: string;
  created_at: string;
  
  // Relations
  shipments?: {
    id: string;
    customers?: { company_name: string };
    suppliers?: { company_name: string };
  };
  invoice_items?: DebitNoteInvoiceItem[];
  chi_ho_items?: DebitNoteChiHoItem[];
}

export interface DebitNoteInvoiceItem {
  id: string;
  debit_note_id: string;
  description?: string;
  unit?: string;
  rate?: number;
  quantity?: number;
  amount: number; // Generated
  tax_percent?: number;
  total: number; // Generated
  sort_order: number;
}

export interface DebitNoteChiHoItem {
  id: string;
  debit_note_id: string;
  description?: string;
  unit?: string;
  rate?: number;
  quantity?: number;
  amount: number; // Generated
  total: number; // Generated
  sort_order: number;
}

export interface CreateDebitNoteDto {
  shipment_id: string;
  note_date?: string;
  invoice_items?: Omit<DebitNoteInvoiceItem, 'id' | 'debit_note_id' | 'amount' | 'total'>[];
  chi_ho_items?: Omit<DebitNoteChiHoItem, 'id' | 'debit_note_id' | 'amount' | 'total'>[];
}

export interface UpdateDebitNoteDto extends Partial<CreateDebitNoteDto> {}
