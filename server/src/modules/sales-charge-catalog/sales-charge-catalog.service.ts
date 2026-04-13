import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type { CreateSalesChargeCatalogDTO, SalesChargeCatalog, UpdateSalesChargeCatalogDTO } from './sales-charge-catalog.types';

export class SalesChargeCatalogService {
  async findAll(): Promise<SalesChargeCatalog[]> {
    const { data, error } = await supabase
      .from('sales_charge_catalog')
      .select('*')
      .order('freight_code', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async create(dto: CreateSalesChargeCatalogDTO): Promise<SalesChargeCatalog> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('sales_charge_catalog')
      .insert({
        freight_code: dto.freight_code.trim(),
        charge_name: dto.charge_name.trim(),
        charge_type: dto.charge_type.trim(),
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Mã cước phí (freight code) đã tồn tại', 409);
      }
      throw error;
    }
    return data;
  }

  async update(id: string, dto: UpdateSalesChargeCatalogDTO): Promise<SalesChargeCatalog> {
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { updated_at: now };

    if (dto.freight_code !== undefined) updateData.freight_code = dto.freight_code.trim();
    if (dto.charge_name !== undefined) updateData.charge_name = dto.charge_name.trim();
    if (dto.charge_type !== undefined) updateData.charge_type = dto.charge_type.trim();
    if (dto.default_price !== undefined) updateData.default_price = dto.default_price;
    if (dto.is_favorite !== undefined) updateData.is_favorite = dto.is_favorite;

    const { data, error } = await supabase
      .from('sales_charge_catalog')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('Mã cước phí (freight code) đã tồn tại', 409);
      }
      throw error;
    }
    if (!data) throw new AppError('Không tìm thấy cước phí', 404);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('sales_charge_catalog')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const salesChargeCatalogService = new SalesChargeCatalogService();
