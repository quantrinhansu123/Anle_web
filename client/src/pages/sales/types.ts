import type { Shipment } from '../shipments/types';

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
  created_at: string;
  sales_items?: SalesItem[];
  shipments?: Shipment;
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
  shipment_id: string;
  items: SalesItemFormState[];
  relatedShipment?: Shipment;
}
