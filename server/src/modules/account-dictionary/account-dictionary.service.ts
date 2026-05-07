import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type { AccountDictionaryRow, CreateAccountDictionaryDto, UpdateAccountDictionaryDto } from './account-dictionary.types';

const isMissingPostgrestTable = (err: unknown, table: string): boolean => {
  const e = err as any;
  const msg = String(e?.message || '');
  const details = String(e?.details || '');
  const hint = String(e?.hint || '');
  const combined = `${msg}\n${details}\n${hint}`;
  return (
    e?.code === 'PGRST205' ||
    combined.includes(`Could not find the table 'public.${table}' in the schema cache`) ||
    combined.includes(`relation "public.${table}" does not exist`) ||
    combined.includes(`relation "${table}" does not exist`)
  );
};

export class AccountDictionaryService {
  async list(page = 1, limit = 200): Promise<{ data: AccountDictionaryRow[]; count: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await supabase
      .from('account_dictionary')
      .select('*', { count: 'exact' })
      .order('account_code', { ascending: true })
      .range(from, to);
    if (error) {
      if (isMissingPostgrestTable(error, 'account_dictionary')) return { data: [], count: 0 };
      throw new AppError(error.message, 400);
    }
    return { data: (data ?? []) as AccountDictionaryRow[], count: count ?? 0 };
  }

  async create(dto: CreateAccountDictionaryDto): Promise<AccountDictionaryRow> {
    const payload: any = {
      ...dto,
      account_code: String(dto.account_code || '').trim(),
      name_vi: dto.name_vi ?? '',
      name_en: dto.name_en ?? '',
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('account_dictionary').insert(payload).select().single();
    if (error) {
      if (isMissingPostgrestTable(error, 'account_dictionary')) {
        throw new AppError(
          "Missing database table 'public.account_dictionary'. Apply migration `server/sql/migrations/20260507_add_account_dictionary_table.sql` and reload the PostgREST schema cache.",
          500,
        );
      }
      throw new AppError(error.message, 400);
    }
    return data as AccountDictionaryRow;
  }

  async update(id: string, dto: UpdateAccountDictionaryDto): Promise<AccountDictionaryRow> {
    const payload: any = {
      ...dto,
      updated_at: new Date().toISOString(),
    };
    if (payload.account_code != null) payload.account_code = String(payload.account_code).trim();
    const { data, error } = await supabase.from('account_dictionary').update(payload).eq('id', id).select().single();
    if (error) {
      if (isMissingPostgrestTable(error, 'account_dictionary')) {
        throw new AppError(
          "Missing database table 'public.account_dictionary'. Apply migration `server/sql/migrations/20260507_add_account_dictionary_table.sql` and reload the PostgREST schema cache.",
          500,
        );
      }
      throw new AppError(error.message, 400);
    }
    return data as AccountDictionaryRow;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('account_dictionary').delete().eq('id', id);
    if (error) {
      if (isMissingPostgrestTable(error, 'account_dictionary')) {
        throw new AppError(
          "Missing database table 'public.account_dictionary'. Apply migration `server/sql/migrations/20260507_add_account_dictionary_table.sql` and reload the PostgREST schema cache.",
          500,
        );
      }
      throw new AppError(error.message, 400);
    }
  }
}

