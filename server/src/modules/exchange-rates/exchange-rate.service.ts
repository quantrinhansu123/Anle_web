import { supabase } from '../../config/supabase';
import type { ExchangeRate, CreateExchangeRateDTO, UpdateExchangeRateDTO } from './exchange-rate.types';

export class ExchangeRateService {
  async findAll(): Promise<ExchangeRate[]> {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('currency_code', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async findByCurrencyCode(code: string): Promise<ExchangeRate | null> {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('currency_code', code.toUpperCase())
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is code for "no rows found" with .single()
    return data;
  }

  async upsert(dto: CreateExchangeRateDTO): Promise<ExchangeRate> {
    const { data, error } = await supabase
      .from('exchange_rates')
      .upsert({
        ...dto,
        currency_code: dto.currency_code.toUpperCase(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'currency_code' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, dto: UpdateExchangeRateDTO): Promise<ExchangeRate> {
    const { data, error } = await supabase
      .from('exchange_rates')
      .update({
        ...dto,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('exchange_rates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const exchangeRateService = new ExchangeRateService();
