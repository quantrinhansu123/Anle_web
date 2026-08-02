import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type { CreateAccessRoleKeyDTO } from './access-control.types';

export const accessControlService = {
  async listRoleKeys() {
    const { data, error } = await supabase
      .from('access_role_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 400);
    return data || [];
  },

  async createRoleKey(dto: CreateAccessRoleKeyDTO) {
    const key = (dto.key || '').trim();
    if (!key || !dto.department_code || !dto.position || !dto.role) {
      throw new AppError('key, department_code, position, and role are required', 400);
    }

    const { data: existing } = await supabase
      .from('access_role_keys')
      .select('id, key')
      .eq('key', key)
      .maybeSingle();

    if (existing) {
      throw new AppError(`Role key already exists: ${key}`, 409);
    }

    const { data, error } = await supabase
      .from('access_role_keys')
      .insert({
        key,
        department_code: dto.department_code,
        position: dto.position,
        role: dto.role,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    return data;
  },

  async deleteRoleKey(key: string) {
    const decoded = decodeURIComponent(key);
    const { error } = await supabase
      .from('access_role_keys')
      .delete()
      .eq('key', decoded);

    if (error) throw new AppError(error.message, 400);
    return true;
  },

  async getPermissions(roleKey: string) {
    const decoded = decodeURIComponent(roleKey);
    const { data, error } = await supabase
      .from('access_role_permissions')
      .select('view_path')
      .eq('role_key', decoded)
      .order('view_path', { ascending: true });

    if (error) throw new AppError(error.message, 400);
    return (data || []).map((r) => r.view_path as string);
  },

  async setPermissions(roleKey: string, viewPaths: string[]) {
    const decoded = decodeURIComponent(roleKey);
    const paths = Array.from(
      new Set((viewPaths || []).map((p) => String(p).trim()).filter(Boolean)),
    );

    const { data: keyRow } = await supabase
      .from('access_role_keys')
      .select('key')
      .eq('key', decoded)
      .maybeSingle();

    if (!keyRow) {
      throw new AppError(`Role key not found: ${decoded}`, 404);
    }

    const { error: delErr } = await supabase
      .from('access_role_permissions')
      .delete()
      .eq('role_key', decoded);

    if (delErr) throw new AppError(delErr.message, 400);

    if (paths.length === 0) {
      return [];
    }

    const rows = paths.map((view_path) => ({ role_key: decoded, view_path }));
    const { data, error } = await supabase
      .from('access_role_permissions')
      .insert(rows)
      .select('view_path');

    if (error) throw new AppError(error.message, 400);
    return (data || []).map((r) => r.view_path as string);
  },
};
