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

  commodity_code: string | null;
  commodity_name: string | null;
  unit: string | null;

  price_usd: number | null;
  quantity: number | null;
  amount_usd: number | null;
  payment_percent: number | null;
  exchange_rate: number | null;
  total_vnd: number | null;

  note: string | null;

  created_at: string | null;
  updated_at: string | null;

  // Joins (optional)
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
  commodity_code?: string | null;
  commodity_name?: string | null;
  unit?: string | null;
  price_usd?: number | null;
  quantity?: number | null;
  amount_usd?: number | null;
  payment_percent?: number | null;
  exchange_rate?: number | null;
  total_vnd?: number | null;
  note?: string | null;
};

export type UpdateTradingSaleDto = Partial<CreateTradingSaleDto>;

