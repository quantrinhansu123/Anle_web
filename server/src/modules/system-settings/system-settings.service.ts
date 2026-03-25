import { supabase } from '../../config/supabase';
import { SystemSettings, UpdateSystemSettingsDTO } from '../../types/system-settings';

export class SystemSettingsService {
  /**
   * Get the current system settings (there should only be one record)
   */
  static async getSettings(): Promise<SystemSettings> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      // If no data, return default empty-ish object if someone hasn't seeded yet
      // This is safe because of ON CONFLICT DO NOTHING in migration
      throw new Error(`Failed to fetch system settings: ${error.message}`);
    }

    return data as SystemSettings;
  }

  /**
   * Update the system settings record
   */
  static async updateSettings(id: string, updates: UpdateSystemSettingsDTO): Promise<SystemSettings> {
    const { data, error } = await supabase
      .from('system_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update system settings: ${error.message}`);
    }

    return data as SystemSettings;
  }
}
