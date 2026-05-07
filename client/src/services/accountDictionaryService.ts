import { apiFetch } from '../lib/api';

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

export type CreateAccountDictionaryDto = Omit<AccountDictionaryRow, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAccountDictionaryDto = Partial<CreateAccountDictionaryDto>;

export const accountDictionaryService = {
  list: (page = 1, limit = 500) => apiFetch<AccountDictionaryRow[]>(`/account-dictionary?page=${page}&limit=${limit}`),
  create: (dto: CreateAccountDictionaryDto) =>
    apiFetch<AccountDictionaryRow>('/account-dictionary', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateAccountDictionaryDto) =>
    apiFetch<AccountDictionaryRow>(`/account-dictionary/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  remove: (id: string) => apiFetch<void>(`/account-dictionary/${id}`, { method: 'DELETE' }),
};

