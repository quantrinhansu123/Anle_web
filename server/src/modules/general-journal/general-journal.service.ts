import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type { CreateGeneralJournalEntryDto, GeneralJournalEntry, UpdateGeneralJournalEntryDto } from './general-journal.types';

export class GeneralJournalService {
  async list(page = 1, limit = 200): Promise<{ data: GeneralJournalEntry[]; count: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await supabase
      .from('general_journal_entries')
      .select('*', { count: 'exact' })
      .order('posting_date', { ascending: false })
      .order('voucher_no', { ascending: false })
      .order('line_no', { ascending: true })
      .range(from, to);
    if (error) throw new AppError(error.message, 400);
    return { data: (data ?? []) as GeneralJournalEntry[], count: count ?? 0 };
  }

  async create(dto: CreateGeneralJournalEntryDto): Promise<GeneralJournalEntry> {
    const payload: any = {
      ...dto,
      debit: Number(dto.debit ?? 0),
      credit: Number(dto.credit ?? 0),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('general_journal_entries').insert(payload).select().single();
    if (error) throw new AppError(error.message, 400);
    return data as GeneralJournalEntry;
  }

  async update(id: string, dto: UpdateGeneralJournalEntryDto): Promise<GeneralJournalEntry> {
    const payload: any = {
      ...dto,
      updated_at: new Date().toISOString(),
    };
    if (payload.debit != null) payload.debit = Number(payload.debit);
    if (payload.credit != null) payload.credit = Number(payload.credit);
    const { data, error } = await supabase.from('general_journal_entries').update(payload).eq('id', id).select().single();
    if (error) throw new AppError(error.message, 400);
    return data as GeneralJournalEntry;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('general_journal_entries').delete().eq('id', id);
    if (error) throw new AppError(error.message, 400);
  }
}

