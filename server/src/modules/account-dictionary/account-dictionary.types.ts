export interface AccountDictionaryRow {
  id: string;
  account_code: string;
  name_vi: string;
  name_en: string;
  form_template?: string | null;
  level1_code?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountDictionaryDto {
  account_code: string;
  name_vi: string;
  name_en: string;
  form_template?: string | null;
  level1_code?: string | null;
}

export interface UpdateAccountDictionaryDto extends Partial<CreateAccountDictionaryDto> {}

