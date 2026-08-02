import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  KeyRound,
  Shield,
  Plus,
  Trash2,
  Save,
  Loader2,
  RefreshCcw,
  CheckSquare,
  Square,
} from 'lucide-react';
import { clsx } from 'clsx';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToastContext } from '../../contexts/ToastContext';
import { ORG_DEPARTMENT_OPTIONS } from '../../data/employeeDepartments';
import { EMPLOYEE_POSITION_OPTIONS } from '../../data/employeePositions';
import { EMPLOYEE_ROLE_OPTIONS } from '../../data/employeeRoles';
import {
  buildAccessRoleKey,
  flattenViewsFromModuleData,
  groupViewsBySection,
} from '../../data/accessControl';
import {
  accessControlService,
  type AccessRoleKey,
} from '../../services/accessControlService';

type TabId = 'role' | 'permissions';

const AccessControlPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToastContext();

  const [activeTab, setActiveTab] = useState<TabId>('role');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [roleKeys, setRoleKeys] = useState<AccessRoleKey[]>([]);
  const [departmentCode, setDepartmentCode] = useState('');
  const [position, setPosition] = useState('');
  const [role, setRole] = useState('');

  const [selectedKey, setSelectedKey] = useState('');
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);

  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const previewKey = useMemo(
    () => buildAccessRoleKey(departmentCode, position, role),
    [departmentCode, position, role],
  );

  const allViews = useMemo(() => flattenViewsFromModuleData(), []);
  const viewsBySection = useMemo(() => groupViewsBySection(allViews), [allViews]);

  const loadKeys = useCallback(async () => {
    try {
      setLoading(true);
      const data = await accessControlService.listRoleKeys();
      setRoleKeys(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      error(err?.message || 'Failed to load role keys');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  useEffect(() => {
    if (!selectedKey) {
      setSelectedPaths([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingPerms(true);
        const paths = await accessControlService.getPermissions(selectedKey);
        if (!cancelled) setSelectedPaths(Array.isArray(paths) ? paths : []);
      } catch (err: any) {
        if (!cancelled) {
          console.error(err);
          error(err?.message || 'Failed to load permissions');
          setSelectedPaths([]);
        }
      } finally {
        if (!cancelled) setLoadingPerms(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedKey, error]);

  const handleAddKey = async () => {
    if (!previewKey) {
      error('Select Department, Position, and Role first');
      return;
    }
    try {
      setSaving(true);
      const created = await accessControlService.createRoleKey({
        key: previewKey,
        department_code: departmentCode,
        position,
        role,
      });
      setRoleKeys((prev) => [created, ...prev.filter((k) => k.key !== created.key)]);
      setSelectedKey(created.key);
      success(`Added key: ${created.key}`);
    } catch (err: any) {
      console.error(err);
      error(err?.message || 'Failed to add role key');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteKey) return;
    try {
      setDeleting(true);
      await accessControlService.deleteRoleKey(confirmDeleteKey);
      setRoleKeys((prev) => prev.filter((k) => k.key !== confirmDeleteKey));
      if (selectedKey === confirmDeleteKey) setSelectedKey('');
      success('Role key deleted');
      setConfirmDeleteKey(null);
    } catch (err: any) {
      console.error(err);
      error(err?.message || 'Failed to delete role key');
    } finally {
      setDeleting(false);
    }
  };

  const togglePath = (path: string) => {
    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  };

  const setSectionPaths = (section: string, checked: boolean) => {
    const sectionPaths = (viewsBySection[section] || []).map((v) => v.path);
    setSelectedPaths((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, ...sectionPaths]));
      }
      return prev.filter((p) => !sectionPaths.includes(p));
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedKey) {
      error('Select a role key first');
      return;
    }
    try {
      setSaving(true);
      const saved = await accessControlService.setPermissions(selectedKey, selectedPaths);
      setSelectedPaths(saved);
      success(`Saved ${saved.length} view(s) for ${selectedKey}`);
    } catch (err: any) {
      console.error(err);
      error(err?.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col -mt-2 min-h-0">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => navigate('/system')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-primary" />
          <h1 className="text-[18px] font-black text-slate-900 tracking-tight">Access Control</h1>
        </div>
        <button
          type="button"
          onClick={loadKeys}
          className="ml-auto px-3 py-1.5 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all"
          title="Refresh"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex items-center gap-1 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('role')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all',
            activeTab === 'role'
              ? 'bg-white text-primary shadow-sm ring-1 ring-border'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <KeyRound size={14} />
          Role
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all',
            activeTab === 'permissions'
              ? 'bg-white text-primary shadow-sm ring-1 ring-border'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Shield size={14} />
          Permissions
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
        {activeTab === 'role' ? (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="p-5 border-b border-border space-y-4">
              <p className="text-[13px] text-muted-foreground">
                Build a role key from Department, Position, and Role. Format:{' '}
                <code className="text-[12px] bg-muted px-1.5 py-0.5 rounded">dept_position_role</code>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-700">Department</label>
                  <SearchableSelect
                    options={ORG_DEPARTMENT_OPTIONS.map((d) => ({ value: d.code, label: d.name }))}
                    value={departmentCode}
                    onValueChange={setDepartmentCode}
                    placeholder="Select department"
                    hideSearch
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-700">Position</label>
                  <SearchableSelect
                    options={EMPLOYEE_POSITION_OPTIONS.map((p) => ({ value: p, label: p }))}
                    value={position}
                    onValueChange={setPosition}
                    placeholder="Select position"
                    hideSearch
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-700">Role</label>
                  <SearchableSelect
                    options={EMPLOYEE_ROLE_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
                    value={role}
                    onValueChange={setRole}
                    placeholder="Select role"
                    hideSearch
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl bg-muted/30 border border-border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Preview key
                  </span>
                  <p className="text-[13px] font-mono font-bold text-slate-800 break-all">
                    {previewKey || '—'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddKey}
                  disabled={!previewKey || saving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-bold shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Add key
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Loading…
                </div>
              ) : roleKeys.length === 0 ? (
                <p className="text-center py-16 text-[13px] text-muted-foreground italic">
                  No role keys yet. Add a combination above.
                </p>
              ) : (
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                      <th className="px-3 py-2 border-b border-border">Key</th>
                      <th className="px-3 py-2 border-b border-border">Department</th>
                      <th className="px-3 py-2 border-b border-border">Position</th>
                      <th className="px-3 py-2 border-b border-border">Role</th>
                      <th className="px-3 py-2 border-b border-border w-16 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleKeys.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2.5 border-b border-border/50 text-[12px] font-mono font-bold text-slate-800">
                          {row.key}
                        </td>
                        <td className="px-3 py-2.5 border-b border-border/50 text-[12px]">
                          {ORG_DEPARTMENT_OPTIONS.find((d) => d.code === row.department_code)?.name ||
                            row.department_code}
                        </td>
                        <td className="px-3 py-2.5 border-b border-border/50 text-[12px]">{row.position}</td>
                        <td className="px-3 py-2.5 border-b border-border/50 text-[12px] capitalize">
                          {row.role}
                        </td>
                        <td className="px-3 py-2.5 border-b border-border/50 text-center">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteKey(row.key)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="p-5 border-b border-border flex flex-wrap items-end gap-3">
              <div className="space-y-1.5 flex-1 min-w-[240px]">
                <label className="text-[12px] font-bold text-slate-700">Role combination</label>
                <SearchableSelect
                  options={roleKeys.map((k) => ({ value: k.key, label: k.key }))}
                  value={selectedKey}
                  onValueChange={setSelectedKey}
                  placeholder="Select role key"
                />
              </div>
              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={!selectedKey || saving || loadingPerms}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-bold shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save permissions
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5">
              {!selectedKey ? (
                <p className="text-center py-16 text-[13px] text-muted-foreground italic">
                  Select a role key to assign views.
                </p>
              ) : loadingPerms ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Loading permissions…
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(viewsBySection).map(([section, views]) => {
                    const allChecked = views.every((v) => selectedPaths.includes(v.path));
                    return (
                      <div key={section} className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-[12px] font-black uppercase tracking-wider text-primary">
                            {section}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setSectionPaths(section, !allChecked)}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors"
                          >
                            {allChecked ? <CheckSquare size={14} /> : <Square size={14} />}
                            {allChecked ? 'Clear section' : 'Select section'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {views.map((v) => {
                            const checked = selectedPaths.includes(v.path);
                            return (
                              <label
                                key={v.path}
                                className={clsx(
                                  'flex items-start gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all',
                                  checked
                                    ? 'border-primary/40 bg-primary/5'
                                    : 'border-border hover:bg-muted/30',
                                )}
                              >
                                <input
                                  type="checkbox"
                                  className="mt-1 rounded border-border"
                                  checked={checked}
                                  onChange={() => togglePath(v.path)}
                                />
                                <span className="min-w-0">
                                  <span className="block text-[13px] font-bold text-slate-800">
                                    {v.title}
                                  </span>
                                  <span className="block text-[11px] font-mono text-muted-foreground truncate">
                                    {v.path}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDeleteKey}
        onClose={() => setConfirmDeleteKey(null)}
        onConfirm={handleConfirmDelete}
        isProcessing={deleting}
        message={
          <>
            Delete role key <strong className="font-mono">{confirmDeleteKey}</strong>?
            <br />
            <span className="text-muted-foreground font-medium">
              Assigned view permissions for this key will also be removed.
            </span>
          </>
        }
      />
    </div>
  );
};

export default AccessControlPage;
