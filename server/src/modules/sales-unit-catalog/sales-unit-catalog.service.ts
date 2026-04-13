import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type { CreateSalesUnitCatalogDTO, SalesUnitCatalog } from './sales-unit-catalog.types';

export class SalesUnitCatalogService {
  async findAll(): Promise<SalesUnitCatalog[]> {
    const { data, error } = await supabase
      .from('sales_unit_catalog')
      .select('*')
      .order('code', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async create(dto: CreateSalesUnitCatalogDTO): Promise<SalesUnitCatalog> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('sales_unit_catalog')
      .insert({
        code: dto.code.trim(),
        name: dto.name.trim(),
        active: dto.active ?? true,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Mã đơn vị (code) đã tồn tại', 409);
      }
      throw error;
    }
    return data;
  }
}

export const salesUnitCatalogService = new SalesUnitCatalogService();
