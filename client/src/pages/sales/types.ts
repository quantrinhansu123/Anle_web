import type { Shipment } from '../shipments/types';

export type QuotationStatus = 'draft' | 'sent' | 'converted' | 'confirmed' | 'final';
export type QuotationType = 'service_breakdown' | 'option_based';
export type ChargeGroup = 'freight' | 'other' | 'on_behalf';

export interface SalesItem {
  id: string;
  sales_id: string;
  description: string;
  rate: number;
  quantity: number;
  unit: string;
  currency: string;
  exchange_rate: number;
  tax_percent: number;
  tax_value: number;
  total: number;
  created_at: string;
}

export interface Sales {
  id: string;
  shipment_id: string;
  quote_date: string;
  no_doc: string;
  status?: QuotationStatus;
  priority_rank?: number;
  quotation_type?: QuotationType;
  due_date?: string;
  validity_from?: string;
  validity_to?: string;
  sales_person_id?: string;
  customer_trade_name?: string;
  customer_contact_name?: string;
  customer_contact_email?: string;
  customer_contact_tel?: string;
  pickup?: string;
  final_destination?: string;
  cargo_volume?: string;
  business_team?: string;
  business_department?: string;
  goods?: string;
  transit_time?: string;
  service_mode?: string;
  direction?: string;
  currency_code?: string;
  job_no?: string;
  sales_inquiry_no?: string;
  bill_no?: string;
  customs_declaration_no?: string;
  incoterms?: string;
  notes?: string;
  exchange_rate?: number;
  exchange_rate_date?: string;
  created_at: string;
  sales_items?: SalesItem[];
  sales_charge_items?: SalesChargeItem[];
  shipments?: Shipment;
  sales_person?: {
    id: string;
    full_name: string;
    team?: string;
    department?: string;
    email?: string;
  };
}

export interface SalesChargeItem {
  id?: string;
  sales_id?: string;
  charge_group: ChargeGroup;
  freight_code?: string;
  charge_name?: string;
  charge_type?: string;
  currency?: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  vat_percent: number;
  amount_ex_vat?: number;
  vat_amount?: number;
  note?: string;
  display_order?: number;
  /** Client-only: row created via mobile Add line; stripped before API */
  _mobileNewSlot?: boolean;
}

export interface SalesItemFormState {
  id?: string;
  description: string;
  rate: number;
  quantity: number;
  unit: string;
  currency: string;
  exchange_rate: number;
  tax_percent: number;
}

export interface SalesFormState {
  id?: string;
  /** Official quotation / document number from API when present */
  no_doc?: string;
  shipment_id: string;
  quote_date?: string;
  status?: QuotationStatus;
  priority_rank?: number;
  quotation_type?: QuotationType;
  due_date?: string;
  validity_from?: string;
  validity_to?: string;
  sales_person_id?: string;
  customer_trade_name?: string;
  customer_contact_name?: string;
  customer_contact_email?: string;
  customer_contact_tel?: string;
  pickup?: string;
  final_destination?: string;
  cargo_volume?: string;
  business_team?: string;
  business_department?: string;
  goods?: string;
  transit_time?: string;
  service_mode?: string;
  direction?: string;
  currency_code?: string;
  job_no?: string;
  sales_inquiry_no?: string;
  bill_no?: string;
  customs_declaration_no?: string;
  incoterms?: string;
  notes?: string;
  exchange_rate?: number;
  exchange_rate_date?: string;
  items: SalesItemFormState[];
  charge_items?: SalesChargeItem[];
  relatedShipment?: Shipment;
}
