import type { Shipment } from '../shipments/types';

export interface SalesItem {
  id: string;
  shipment_id: string;
  description: string;
  rate: number;
  quantity: number;
  unit: string;
  currency: 'USD' | 'VND';
  exchange_rate: number;
  tax_percent: number;
  tax_value: number;
  total: number;
  created_at: string;
  shipments?: Shipment;
}

export interface SalesFormState {
  id?: string;
  shipment_id: string;
  description: string;
  rate: number;
  quantity: number;
  unit: string;
  currency: 'USD' | 'VND';
  exchange_rate: number;
  tax_percent: number;
}
