export interface DebitNoteInvoiceItem {
  id?: string;
  description: string;
  unit: string;
  rate: number;
  quantity: number;
  amount: number;
  tax_percent: number;
  total: number;
}

export interface DebitNoteChiHoItem {
  id?: string;
  description: string;
  unit: string;
  rate: number;
  quantity: number;
  amount: number;
  total: number;
}

export interface DebitNote {
  id: string;
  shipment_id: string;
  note_date: string;
  no_doc: string;
  created_at: string;
  shipments?: {
    id: string;
    customers?: { company_name: string };
    suppliers?: { company_name: string };
  };
  invoice_items?: DebitNoteInvoiceItem[];
  chi_ho_items?: DebitNoteChiHoItem[];
}

export interface DebitNoteFormState {
  id?: string;
  shipment_id: string;
  note_date: string;
  invoice_items: DebitNoteInvoiceItem[];
  chi_ho_items: DebitNoteChiHoItem[];
}

export interface CreateDebitNoteDto {
  shipment_id: string;
  note_date: string;
  invoice_items: DebitNoteInvoiceItem[];
  chi_ho_items: DebitNoteChiHoItem[];
}

export interface UpdateDebitNoteDto extends Partial<CreateDebitNoteDto> {}
