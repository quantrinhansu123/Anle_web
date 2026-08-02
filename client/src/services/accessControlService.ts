import { apiFetch } from '../lib/api';

export type AccessRoleKey = {
  id: string;
  key: string;
  department_code: string;
  position: string;
  role: string;
  created_at?: string;
};

export const accessControlService = {
  listRoleKeys: () => apiFetch<AccessRoleKey[]>('/access-control/role-keys'),

  createRoleKey: (dto: {
    key: string;
    department_code: string;
    position: string;
    role: string;
  }) =>
    apiFetch<AccessRoleKey>('/access-control/role-keys', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  deleteRoleKey: (key: string) =>
    apiFetch<null>(`/access-control/role-keys/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    }),

  getPermissions: (roleKey: string) =>
    apiFetch<string[]>(`/access-control/permissions/${encodeURIComponent(roleKey)}`),

  setPermissions: (roleKey: string, viewPaths: string[]) =>
    apiFetch<string[]>(`/access-control/permissions/${encodeURIComponent(roleKey)}`, {
      method: 'PUT',
      body: JSON.stringify({ view_paths: viewPaths }),
    }),
};
