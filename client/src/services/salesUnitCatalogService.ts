import { apiFetch } from '../lib/api';

export interface SalesUnitCatalog {
  id: string;
  code: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const salesUnitCatalogService = {
  async getAll(): Promise<SalesUnitCatalog[]> {
    return apiFetch<SalesUnitCatalog[]>('/sales-unit-catalog');
  },

  async create(dto: { code: string; name: string; active?: boolean }): Promise<SalesUnitCatalog> {
    return apiFetch<SalesUnitCatalog>('/sales-unit-catalog', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};
