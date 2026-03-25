import { apiFetch } from '../lib/api';
import type { SystemSettings } from '../types/systemSettings';

export const systemSettingsService = {
  getSettings: () => apiFetch<SystemSettings>('/system-settings'),
  updateSettings: (id: string, dto: Partial<SystemSettings>) =>
    apiFetch<SystemSettings>(`/system-settings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),
};
