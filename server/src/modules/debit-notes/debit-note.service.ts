import { supabase } from '../../config/supabase';
import type { CreateDebitNoteDto, DebitNote, UpdateDebitNoteDto } from './debit-note.types';

export class DebitNoteService {
  async findAll(page = 1, limit = 20): Promise<{ data: DebitNote[]; count: number }> {
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('debit_notes')
      .select(`
        *,
        shipments(id, customers(company_name), suppliers(company_name)),
        invoice_items:debit_note_invoice_items(*),
        chi_ho_items:debit_note_chi_ho_items(*)
      `, { count: 'exact' })
      .range(from, from + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  async findById(id: string): Promise<DebitNote | null> {
    const { data: note, error: noteError } = await supabase
      .from('debit_notes')
      .select('*, shipments(id, customers(company_name), suppliers(company_name))')
      .eq('id', id)
      .single();

    if (noteError) throw noteError;
    if (!note) return null;

    const [invoiceItems, chiHoItems] = await Promise.all([
      supabase.from('debit_note_invoice_items').select('*').eq('debit_note_id', id).order('sort_order', { ascending: true }),
      supabase.from('debit_note_chi_ho_items').select('*').eq('debit_note_id', id).order('sort_order', { ascending: true }),
    ]);

    return {
      ...note,
      invoice_items: invoiceItems.data ?? [],
      chi_ho_items: chiHoItems.data ?? [],
    };
  }

  async create(dto: CreateDebitNoteDto): Promise<DebitNote> {
    const { invoice_items, chi_ho_items, ...noteData } = dto;

    // 1. Create the Debit Note
    const { data: note, error: noteError } = await supabase
      .from('debit_notes')
      .insert(noteData)
      .select()
      .single();

    if (noteError) throw noteError;

    // 2. Create items if any
    const itemPromises = [];
    if (invoice_items && invoice_items.length > 0) {
      itemPromises.push(
        supabase.from('debit_note_invoice_items').insert(
          invoice_items.map((it, idx) => ({ ...it, debit_note_id: note.id, sort_order: it.sort_order ?? idx }))
        )
      );
    }
    if (chi_ho_items && chi_ho_items.length > 0) {
      itemPromises.push(
        supabase.from('debit_note_chi_ho_items').insert(
          chi_ho_items.map((it, idx) => ({ ...it, debit_note_id: note.id, sort_order: it.sort_order ?? idx }))
        )
      );
    }

    if (itemPromises.length > 0) {
      const results = await Promise.all(itemPromises);
      for (const res of results) {
        if (res.error) throw res.error;
      }
    }

    return this.findById(note.id) as Promise<DebitNote>;
  }

  async update(id: string, dto: UpdateDebitNoteDto): Promise<DebitNote> {
    const { invoice_items, chi_ho_items, ...noteData } = dto;

    // 1. Update the Debit Note
    if (Object.keys(noteData).length > 0) {
      const { error } = await supabase
        .from('debit_notes')
        .update(noteData)
        .eq('id', id);
      if (error) throw error;
    }

    // 2. Sync invoice items if provided
    if (invoice_items) {
      // Simple strategy: delete all and re-insert
      await supabase.from('debit_note_invoice_items').delete().eq('debit_note_id', id);
      if (invoice_items.length > 0) {
        const { error } = await supabase
          .from('debit_note_invoice_items')
          .insert(invoice_items.map((it, idx) => ({ ...it, debit_note_id: id, sort_order: it.sort_order ?? idx })));
        if (error) throw error;
      }
    }

    // 3. Sync chi ho items if provided
    if (chi_ho_items) {
      await supabase.from('debit_note_chi_ho_items').delete().eq('debit_note_id', id);
      if (chi_ho_items.length > 0) {
        const { error } = await supabase
          .from('debit_note_chi_ho_items')
          .insert(chi_ho_items.map((it, idx) => ({ ...it, debit_note_id: id, sort_order: it.sort_order ?? idx })));
        if (error) throw error;
      }
    }

    return this.findById(id) as Promise<DebitNote>;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('debit_notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
