import { SystemSettingsService } from './src/modules/system-settings/system-settings.service';
import 'dotenv/config';

async function test() {
  try {
    const settings = await SystemSettingsService.getSettings();
    console.log('Settings fetched successfully:', settings);
  } catch (err) {
    console.error('Failed to fetch settings in test script:', err);
  }
}

test();
