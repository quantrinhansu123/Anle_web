import { moduleData } from './moduleData';
import { toStandardRole } from './employeeRoles';
import { toEnglishPosition } from './employeePositions';

export type AccessViewItem = {
  path: string;
  title: string;
  section: string;
  modulePath: string;
};

/** Lowercase slug: spaces/hyphens → underscore */
export function slugifyPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[/&]+/g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

/** Build access key: `{departmentCode}_{positionSlug}_{role}` */
export function buildAccessRoleKey(
  departmentCode: string,
  position: string,
  role: string,
): string {
  const dept = slugifyPart(departmentCode);
  const pos = slugifyPart(position);
  const r = slugifyPart(role);
  if (!dept || !pos || !r) return '';
  return `${dept}_${pos}_${r}`;
}

export function getEmployeeAccessKey(user: {
  department_code?: string | null;
  position?: string | null;
  role?: string | null;
}): string {
  const dept = (user.department_code || '').trim();
  const position = toEnglishPosition(user.position || '');
  const role = toStandardRole(user.role);
  if (!dept || !position) return '';
  return buildAccessRoleKey(dept, position, role);
}

/** Flatten all module cards from moduleData into view checklist items. */
export function flattenViewsFromModuleData(): AccessViewItem[] {
  const items: AccessViewItem[] = [];
  const seen = new Set<string>();

  for (const [modulePath, sections] of Object.entries(moduleData)) {
    for (const section of sections) {
      for (const card of section.items) {
        if (!card.path || seen.has(card.path)) continue;
        seen.add(card.path);
        items.push({
          path: card.path,
          title: card.title,
          section: section.section,
          modulePath,
        });
      }
    }
  }

  return items.sort((a, b) => {
    const s = a.section.localeCompare(b.section);
    if (s !== 0) return s;
    return a.title.localeCompare(b.title);
  });
}

/** Group flattened views by section label. */
export function groupViewsBySection(views: AccessViewItem[]): Record<string, AccessViewItem[]> {
  const groups: Record<string, AccessViewItem[]> = {};
  for (const v of views) {
    if (!groups[v.section]) groups[v.section] = [];
    groups[v.section].push(v);
  }
  return groups;
}

/**
 * Returns true if path is allowed for the role key's permission list.
 * Empty permission list = no extra restriction configured (caller may treat as deny or allow).
 */
export function canViewPath(allowedPaths: string[] | null | undefined, path: string): boolean {
  if (!allowedPaths || allowedPaths.length === 0) return false;
  if (allowedPaths.includes(path)) return true;
  // Prefix match for nested routes under a module card path
  return allowedPaths.some((p) => path === p || path.startsWith(`${p}/`));
}
