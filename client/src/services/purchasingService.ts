import { apiFetch } from '../lib/api';

export interface PurchasingItem {
  id: string;
  shipment_id: string;
  supplier_id: string;
  pic_id?: string | null;
  description: string;
  hs_code?: string | null;
  rate: number;
  quantity: number;
  unit: string;
  currency: 'USD' | 'VND';
  exchange_rate: number;
  tax_percent: number;
  tax_value?: number;
  total?: number;
  specification?: string | null;
  note?: string | null;
  created_at?: string;
  shipments?: any;
  suppliers?: any;
  employees?: any;
}

export type CreatePurchasingItemDto = Omit<PurchasingItem, 'id' | 'tax_value' | 'total' | 'created_at' | 'shipments' | 'suppliers' | 'employees'>;

export const purchasingService = {
  getPurchasingItems: (page = 1, limit = 20) => 
    apiFetch<PurchasingItem[]>(`/purchasing?page=${page}&limit=${limit}`),

  getPurchasingItemById: (id: string) => 
    apiFetch<PurchasingItem>(`/purchasing/${id}`),

  createPurchasingItem: (dto: CreatePurchasingItemDto) => 
    apiFetch<PurchasingItem>('/purchasing', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updatePurchasingItem: (id: string, dto: Partial<CreatePurchasingItemDto>) => 
    apiFetch<PurchasingItem>(`/purchasing/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  deletePurchasingItem: (id: string) => 
    apiFetch<void>(`/purchasing/${id}`, {
      method: 'DELETE',
    }),
};
