/** System roles for employee dropdown (English). */
export const EMPLOYEE_ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'senior', label: 'Senior' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'junior', label: 'Junior' },
  { value: 'collaborator', label: 'Collaborator' },
] as const;

export type EmployeeRoleValue = (typeof EMPLOYEE_ROLE_OPTIONS)[number]['value'];

/** Display labels for stored role codes (incl. legacy). */
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  senior: 'Senior',
  intermediate: 'Intermediate',
  junior: 'Junior',
  collaborator: 'Collaborator',
  // Legacy
  ceo: 'Admin',
  director: 'Senior',
  manager: 'Intermediate',
  senior_staff: 'Senior',
  staff: 'Junior',
};

const ROLE_HIERARCHY: Record<string, number> = {
  collaborator: 0,
  junior: 1,
  staff: 1,
  intermediate: 2,
  senior_staff: 2,
  manager: 3,
  senior: 4,
  director: 4,
  ceo: 5,
  admin: 6,
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return 'Junior';
  return ROLE_LABELS[role] || role;
}

/** Map any stored/legacy role to one of the 5 standard catalog codes. */
export function toStandardRole(role: string | null | undefined): string {
  const key = (role || 'junior').trim();
  const label = ROLE_LABELS[key];
  if (label === 'Admin') return 'admin';
  if (label === 'Senior') return 'senior';
  if (label === 'Intermediate') return 'intermediate';
  if (label === 'Junior') return 'junior';
  if (label === 'Collaborator') return 'collaborator';
  if (EMPLOYEE_ROLE_OPTIONS.some((r) => r.value === key)) return key;
  return 'junior';
}

/** True if userRole is in allowedRoles or meets the minimum hierarchy of that set. */
export function hasAllowedRole(
  userRole: string | null | undefined,
  allowedRoles: string[],
  opts?: { position?: string | null; departmentCode?: string | null },
): boolean {
  if (userRole === 'admin' || userRole === 'ceo' || opts?.position === 'Admin' || opts?.departmentCode === 'bod') {
    return true;
  }
  if (!userRole || allowedRoles.length === 0) return false;
  if (allowedRoles.includes(userRole)) return true;
  const minLevel = Math.min(...allowedRoles.map((r) => ROLE_HIERARCHY[r] ?? Number.POSITIVE_INFINITY));
  return (ROLE_HIERARCHY[userRole] || 0) >= minLevel && Number.isFinite(minLevel);
}
