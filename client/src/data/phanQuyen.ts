/** Catalog for Settings → Phân quyền (access control UX). */

export type DataScope = 'personal' | 'department' | 'assigned' | 'company';

export type PermissionAction =
  | 'access'
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'export';

export type ModuleKey = 'trading' | 'inventory' | 'logistics' | 'report';

export type AppRoleId = 'logistics' | 'sales' | 'accounting' | 'hr' | 'admin';

export const DATA_SCOPE_OPTIONS: { id: DataScope; label: string }[] = [
  { id: 'personal', label: 'Cá nhân' },
  { id: 'department', label: 'Phòng ban' },
  { id: 'assigned', label: 'Được phân công' },
  { id: 'company', label: 'Toàn công ty' },
];

export const PERMISSION_ACTIONS: {
  id: PermissionAction;
  label: string;
  /** Modules that support this action */
  modules: ModuleKey[];
}[] = [
  { id: 'access', label: 'Truy cập', modules: ['trading', 'inventory', 'logistics', 'report'] },
  { id: 'view', label: 'Xem', modules: ['trading', 'inventory', 'logistics', 'report'] },
  { id: 'create', label: 'Tạo', modules: ['trading', 'inventory', 'logistics'] },
  { id: 'edit', label: 'Sửa', modules: ['trading', 'inventory', 'logistics'] },
  { id: 'delete', label: 'Xóa', modules: ['trading', 'inventory', 'logistics'] },
  { id: 'approve', label: 'Duyệt', modules: ['trading', 'inventory', 'logistics'] },
  { id: 'export', label: 'Xuất dữ liệu', modules: ['trading', 'inventory', 'logistics', 'report'] },
];

export const PERMISSION_MODULES: {
  id: ModuleKey;
  label: string;
  labelVi: string;
}[] = [
  { id: 'trading', label: 'Trading', labelVi: 'Thương mại' },
  { id: 'inventory', label: 'Inventory', labelVi: 'Kho hàng' },
  { id: 'logistics', label: 'Logistics', labelVi: 'Vận tải' },
  { id: 'report', label: 'Report', labelVi: 'Báo cáo' },
];

export const APP_ROLES: {
  id: AppRoleId;
  name: string;
  description: string;
  /** Map employee.department_code values */
  departmentCodes: string[];
}[] = [
  {
    id: 'logistics',
    name: 'Logistics',
    description: 'Vận hành lô hàng, B/L, tracking và dịch vụ vận tải.',
    departmentCodes: ['logistics', 'warehouse'],
  },
  {
    id: 'sales',
    name: 'Sales',
    description: 'Báo giá, trading sale, khách hàng và cơ hội bán hàng.',
    departmentCodes: ['sales'],
  },
  {
    id: 'accounting',
    name: 'Kế toán',
    description: 'Công nợ, chi phí, hạch toán và báo cáo tài chính.',
    departmentCodes: ['finance'],
  },
  {
    id: 'hr',
    name: 'HR',
    description: 'Nhân sự, tạm ứng lương và danh mục tổ chức.',
    departmentCodes: ['hr'],
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Quản trị hệ thống, phân quyền và cấu hình chung.',
    departmentCodes: ['bod', 'admin'],
  },
];

export type ModulePermission = {
  actions: Partial<Record<PermissionAction, boolean>>;
  scope: DataScope;
};

export type RolePermissionMap = Record<ModuleKey, ModulePermission>;

export const defaultModulePermission = (): ModulePermission => ({
  actions: {
    access: false,
    view: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
    export: false,
  },
  scope: 'personal',
});

export const defaultRolePermissions = (): RolePermissionMap => ({
  trading: defaultModulePermission(),
  inventory: defaultModulePermission(),
  logistics: defaultModulePermission(),
  report: defaultModulePermission(),
});

/** Seeded defaults so the matrix is usable out of the box. */
export const SEED_ROLE_PERMISSIONS: Record<AppRoleId, RolePermissionMap> = {
  logistics: {
    trading: { actions: { access: true, view: true }, scope: 'assigned' },
    inventory: { actions: { access: true, view: true }, scope: 'department' },
    logistics: {
      actions: { access: true, view: true, create: true, edit: true, export: true },
      scope: 'assigned',
    },
    report: { actions: { access: true, view: true, export: true }, scope: 'department' },
  },
  sales: {
    trading: {
      actions: { access: true, view: true, create: true, edit: true },
      scope: 'personal',
    },
    inventory: { actions: { access: true, view: true }, scope: 'assigned' },
    logistics: { actions: { access: true, view: true }, scope: 'assigned' },
    report: { actions: { access: true, view: true }, scope: 'personal' },
  },
  accounting: {
    trading: { actions: { access: true, view: true, export: true }, scope: 'company' },
    inventory: { actions: { access: true, view: true, export: true }, scope: 'company' },
    logistics: { actions: { access: true, view: true, export: true }, scope: 'company' },
    report: {
      actions: { access: true, view: true, export: true },
      scope: 'company',
    },
  },
  hr: {
    trading: { actions: {}, scope: 'personal' },
    inventory: { actions: {}, scope: 'personal' },
    logistics: { actions: {}, scope: 'personal' },
    report: { actions: { access: true, view: true }, scope: 'department' },
  },
  admin: {
    trading: {
      actions: {
        access: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        approve: true,
        export: true,
      },
      scope: 'company',
    },
    inventory: {
      actions: {
        access: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        approve: true,
        export: true,
      },
      scope: 'company',
    },
    logistics: {
      actions: {
        access: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        approve: true,
        export: true,
      },
      scope: 'company',
    },
    report: {
      actions: { access: true, view: true, export: true },
      scope: 'company',
    },
  },
};

export function resolveAppRoleId(departmentCode?: string, role?: string): AppRoleId {
  const code = (departmentCode || '').toLowerCase();
  const r = (role || '').toLowerCase();
  if (r === 'admin' || r === 'ceo' || r === 'director' || code === 'bod') return 'admin';
  const hit = APP_ROLES.find((x) => x.departmentCodes.includes(code));
  return hit?.id || 'logistics';
}

export function actionSupported(moduleId: ModuleKey, action: PermissionAction): boolean {
  return PERMISSION_ACTIONS.find((a) => a.id === action)?.modules.includes(moduleId) ?? false;
}

export function deepClonePermissions(map: RolePermissionMap): RolePermissionMap {
  return JSON.parse(JSON.stringify(map)) as RolePermissionMap;
}
