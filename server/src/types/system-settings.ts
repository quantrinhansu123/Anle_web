export interface SystemSettings {
  id: string;
  company_name: string;
  representative?: string;
  tax_code?: string;
  address?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  community_group?: string;
  zalo?: string;
  tiktok?: string;
  tech_support_name?: string;
  tech_support_role?: string;
  tech_support_phone?: string;
  tech_support_email?: string;
  business_support_name?: string;
  business_support_role?: string;
  business_support_phone?: string;
  business_support_email?: string;
  version?: string;
  license_date?: string;
  created_at: string;
  updated_at: string;
}

export type UpdateSystemSettingsDTO = Partial<Omit<SystemSettings, 'id' | 'created_at' | 'updated_at'>>;
