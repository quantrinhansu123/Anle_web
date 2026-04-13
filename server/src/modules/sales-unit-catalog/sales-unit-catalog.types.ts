export interface SalesUnitCatalog {
  id: string;
  code: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSalesUnitCatalogDTO {
  code: string;
  name: string;
  active?: boolean;
}
