export interface ExchangeRate {
  id: string;
  currency_code: string;
  rate: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateExchangeRateDTO {
  currency_code: string;
  rate: number;
}

export interface UpdateExchangeRateDTO {
  rate: number;
}
