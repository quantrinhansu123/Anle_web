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

export interface CreateSalesChargeCatalogDTO {
  freight_code: string;
  charge_name: string;
  charge_type: string;
}

export interface UpdateSalesChargeCatalogDTO {
  freight_code?: string;
  charge_name?: string;
  charge_type?: string;
  default_price?: number;
  is_favorite?: boolean;
}
