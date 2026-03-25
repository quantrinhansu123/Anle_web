import { Request, Response } from 'express';
import { SystemSettingsService } from './system-settings.service';

export class SystemSettingsController {
  /**
   * GET /api/v1/system-settings
   */
  static async getSettings(_req: Request, res: Response): Promise<void> {
    try {
      console.log('[DEBUG] SystemSettingsController.getSettings hit');
      const settings = await SystemSettingsService.getSettings();
      console.log('[DEBUG] Settings found:', settings ? 'yes' : 'no');
      res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error: any) {
      console.error('[SystemSettingsController.getSettings]:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message || 'Error fetching system settings' }
      });
    }
  }

  /**
   * PATCH /api/v1/system-settings/:id
   */
  static async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedSettings = await SystemSettingsService.updateSettings(id, updates);
      res.status(200).json({
        success: true,
        data: updatedSettings
      });
    } catch (error: any) {
      console.error('[SystemSettingsController.updateSettings]:', error);
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: error.message || 'Error updating system settings' }
      });
    }
  }
}
