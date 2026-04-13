import { apiFetch } from '../lib/api';

export interface SalesChargeCatalog {
  id: string;
  freight_code: string;
  charge_name: string;
  charge_type: string;
  default_price: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export const salesChargeCatalogService = {
  async getAll(): Promise<SalesChargeCatalog[]> {
    return apiFetch<SalesChargeCatalog[]>('/sales-charge-catalog');
  },

  async create(dto: {
    freight_code: string;
    charge_name: string;
    charge_type: string;
  }): Promise<SalesChargeCatalog> {
    return apiFetch<SalesChargeCatalog>('/sales-charge-catalog', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async update(id: string, dto: {
    freight_code?: string;
    charge_name?: string;
    charge_type?: string;
    default_price?: number;
    is_favorite?: boolean;
  }): Promise<SalesChargeCatalog> {
    return apiFetch<SalesChargeCatalog>(`/sales-charge-catalog/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  async delete(id: string): Promise<void> {
    await apiFetch(`/sales-charge-catalog/${id}`, {
      method: 'DELETE',
    });
  },
};
