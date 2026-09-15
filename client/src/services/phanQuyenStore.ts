import {
  APP_ROLES,
  SEED_ROLE_PERMISSIONS,
  deepClonePermissions,
  type AppRoleId,
  type RolePermissionMap,
} from '../data/phanQuyen';

const PERMS_KEY = 'anle_role_permissions_v1';
const AUDIT_KEY = 'anle_access_audit_v1';
const ACCOUNT_META_KEY = 'anle_account_meta_v1';

export type AuditAction =
  | 'grant'
  | 'revoke'
  | 'role_change'
  | 'account_lock'
  | 'account_unlock'
  | 'scope_change'
  | 'permissions_save';

export type AuditEntry = {
  id: string;
  at: string;
  action: AuditAction;
  actor: string;
  target: string;
  detail: string;
};

export type AccountMeta = {
  /** standby / backup account */
  isStandby?: boolean;
  /** Person responsible for standby account */
  caretaker?: string;
  dataScope?: string;
  lastLoginAt?: string;
  username?: string;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadAllRolePermissions(): Record<AppRoleId, RolePermissionMap> {
  const stored = readJson<Partial<Record<AppRoleId, RolePermissionMap>>>(PERMS_KEY, {});
  const next = {} as Record<AppRoleId, RolePermissionMap>;
  for (const role of APP_ROLES) {
    const base = deepClonePermissions(SEED_ROLE_PERMISSIONS[role.id]);
    const overlay = stored[role.id];
    if (!overlay) {
      next[role.id] = base;
      continue;
    }
    for (const mod of Object.keys(base) as (keyof RolePermissionMap)[]) {
      base[mod] = {
        scope: overlay[mod]?.scope || base[mod].scope,
        actions: { ...base[mod].actions, ...(overlay[mod]?.actions || {}) },
      };
    }
    next[role.id] = base;
  }
  return next;
}

export function saveRolePermissions(roleId: AppRoleId, perms: RolePermissionMap) {
  const all = loadAllRolePermissions();
  all[roleId] = deepClonePermissions(perms);
  writeJson(PERMS_KEY, all);
}

export function loadAuditLog(): AuditEntry[] {
  return readJson<AuditEntry[]>(AUDIT_KEY, []);
}

export function appendAudit(entry: Omit<AuditEntry, 'id' | 'at'> & { at?: string }) {
  const list = loadAuditLog();
  const row: AuditEntry = {
    id: crypto.randomUUID(),
    at: entry.at || new Date().toISOString(),
    action: entry.action,
    actor: entry.actor,
    target: entry.target,
    detail: entry.detail,
  };
  writeJson(AUDIT_KEY, [row, ...list].slice(0, 200));
  return row;
}

export function loadAccountMeta(): Record<string, AccountMeta> {
  return readJson<Record<string, AccountMeta>>(ACCOUNT_META_KEY, {});
}

export function saveAccountMeta(employeeId: string, patch: AccountMeta) {
  const all = loadAccountMeta();
  all[employeeId] = { ...all[employeeId], ...patch };
  writeJson(ACCOUNT_META_KEY, all);
  return all[employeeId];
}

export function seedDemoAuditIfEmpty() {
  if (loadAuditLog().length > 0) return;
  const now = Date.now();
  const samples: Omit<AuditEntry, 'id'>[] = [
    {
      at: new Date(now - 86400000 * 2).toISOString(),
      action: 'grant',
      actor: 'Admin',
      target: 'Sales',
      detail: 'Cấp quyền Tạo/Sửa cho phân hệ Trading',
    },
    {
      at: new Date(now - 86400000).toISOString(),
      action: 'role_change',
      actor: 'Admin',
      target: 'sales00',
      detail: 'Đổi vai trò tài khoản sang Sales',
    },
    {
      at: new Date(now - 3600000 * 5).toISOString(),
      action: 'account_lock',
      actor: 'Admin',
      target: 'hr01',
      detail: 'Chuyển tài khoản sang trạng thái dự phòng',
    },
  ];
  writeJson(
    AUDIT_KEY,
    samples.map((s) => ({ ...s, id: crypto.randomUUID() })),
  );
}
