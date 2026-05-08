import { apiFetchPaginated, apiFetch, type ApiPagination } from '../lib/api';

export type TradingSale = {
  id: string;
  trade_date: string | null;
  no_doc: string | null;
  shipment_id: string | null;
  supplier_id: string | null;
  customer_id: string | null;
  customer_company_name: string | null;
  customer_tax_code: string | null;
  customer_address: string | null;
  unit: string | null;
  commodity_code: string | null;
  commodity_name: string | null;
  price_usd: number | null;
  quantity: number | null;
  amount_usd: number | null;
  payment_percent: number | null;
  exchange_rate: number | null;
  total_vnd: number | null;
  note: string | null;
  created_at: string | null;
  updated_at: string | null;
  shipments?: any;
  suppliers?: any;
};

export type CreateTradingSaleDto = {
  trade_date?: string | null;
  shipment_id?: string | null;
  supplier_id?: string | null;
  customer_id?: string | null;
  customer_company_name?: string | null;
  customer_tax_code?: string | null;
  customer_address?: string | null;
  unit?: string | null;
  commodity_code?: string | null;
  commodity_name?: string | null;
  price_usd?: number | null;
  quantity?: number | null;
  amount_usd?: number | null;
  payment_percent?: number | null;
  exchange_rate?: number | null;
  total_vnd?: number | null;
  note?: string | null;
};

export const tradingSalesService = {
  getTradingSales: async (page = 1, limit = 50): Promise<{ items: TradingSale[]; pagination: ApiPagination }> => {
    return apiFetchPaginated<TradingSale>(`/trading-sales?page=${page}&limit=${limit}`);
  },

  createTradingSale: async (dto: CreateTradingSaleDto): Promise<TradingSale> => {
    return apiFetch<TradingSale>('/trading-sales', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  updateTradingSale: async (id: string, dto: Partial<CreateTradingSaleDto>): Promise<TradingSale> => {
    return apiFetch<TradingSale>(`/trading-sales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  deleteTradingSale: async (id: string): Promise<void> => {
    return apiFetch<void>(`/trading-sales/${id}`, { method: 'DELETE' });
  },
};

