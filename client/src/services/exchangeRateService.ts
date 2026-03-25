import { apiFetch } from '../lib/api';

export interface ExchangeRate {
  id: string;
  currency_code: string;
  rate: number;
  updated_at: string;
}

export const exchangeRateService = {
  async getAll(): Promise<ExchangeRate[]> {
    return apiFetch<ExchangeRate[]>('/exchange-rates');
  },

  async upsert(dto: { currency_code: string; rate: number }): Promise<ExchangeRate> {
    return apiFetch<ExchangeRate>('/exchange-rates', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async update(id: string, rate: number): Promise<ExchangeRate> {
    return apiFetch<ExchangeRate>(`/exchange-rates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ rate }),
    });
  },

  async delete(id: string): Promise<void> {
    return apiFetch<void>(`/exchange-rates/${id}`, {
      method: 'DELETE',
    });
  }
};
