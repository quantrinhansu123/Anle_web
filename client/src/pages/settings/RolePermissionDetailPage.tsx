import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Loader2, Save, Undo2 } from 'lucide-react';
import { clsx } from 'clsx';
import { createPortal } from 'react-dom';
import { employeeService } from '../../services/employeeService';
import { useToastContext } from '../../contexts/ToastContext';
import {
  APP_ROLES,
  DATA_SCOPE_OPTIONS,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  actionSupported,
  deepClonePermissions,
  resolveAppRoleId,
  type AppRoleId,
  type DataScope,
  type ModuleKey,
  type PermissionAction,
  type RolePermissionMap,
} from '../../data/phanQuyen';
import {
  appendAudit,
  loadAllRolePermissions,
  saveRolePermissions,
} from '../../services/phanQuyenStore';

function cellKey(moduleId: ModuleKey, action: PermissionAction) {
  return `${moduleId}:${action}`;
}

const RolePermissionDetailPage: React.FC = () => {
  const { roleId = '' } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const role = APP_ROLES.find((r) => r.id === roleId);

  const [accountCount, setAccountCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [baseline, setBaseline] = useState<RolePermissionMap | null>(null);
  const [draft, setDraft] = useState<RolePermissionMap | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!role) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const all = loadAllRolePermissions();
        const perms = deepClonePermissions(all[role.id]);
        if (!cancelled) {
          setBaseline(deepClonePermissions(perms));
          setDraft(deepClonePermissions(perms));
        }
        const employees = await employeeService.getEmployees();
        if (!cancelled) {
          const count = (employees || []).filter(
            (e) => resolveAppRoleId(e.department_code, e.role) === role.id,
          ).length;
          setAccountCount(count);
        }
      } catch (err: any) {
        if (!cancelled) error(err?.message || 'Không tải được quyền vai trò');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, error]);

  const dirtyCells = useMemo(() => {
    const set = new Set<string>();
    if (!baseline || !draft) return set;
    for (const mod of PERMISSION_MODULES) {
      for (const action of PERMISSION_ACTIONS) {
        if (!actionSupported(mod.id, action.id)) continue;
        const a = Boolean(baseline[mod.id].actions[action.id]);
        const b = Boolean(draft[mod.id].actions[action.id]);
        if (a !== b) set.add(cellKey(mod.id, action.id));
      }
      if (baseline[mod.id].scope !== draft[mod.id].scope) {
        set.add(`${mod.id}:scope`);
      }
    }
    return set;
  }, [baseline, draft]);

  const isDirty = dirtyCells.size > 0;

  if (!role) {
    return (
      <div className="py-16 text-center">
        <p className="text-[14px] font-bold text-slate-700 mb-4">Không tìm thấy vai trò</p>
        <button
          type="button"
          onClick={() => navigate('/cai-dat/phan-quyen')}
          className="px-4 py-2 rounded-xl bg-primary text-white text-[13px] font-bold"
        >
          Quay lại Phân quyền
        </button>
      </div>
    );
  }

  const toggle = (moduleId: ModuleKey, action: PermissionAction) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = deepClonePermissions(prev);
      const current = Boolean(next[moduleId].actions[action]);
      next[moduleId].actions[action] = !current;
      if (action === 'access' && !current) {
        next[moduleId].actions.view = true;
      }
      if (action === 'access' && current) {
        next[moduleId].actions = {};
      }
      return next;
    });
  };

  const setScope = (moduleId: ModuleKey, scope: DataScope) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = deepClonePermissions(prev);
      next[moduleId].scope = scope;
      return next;
    });
  };

  const handleReset = () => {
    if (!baseline) return;
    setDraft(deepClonePermissions(baseline));
  };

  const handleSave = async () => {
    if (!draft || !role) return;
    try {
      setSaving(true);
      saveRolePermissions(role.id as AppRoleId, draft);
      appendAudit({
        action: 'permissions_save',
        actor: 'Admin',
        target: role.name,
        detail: `Cập nhật ma trận quyền vai trò ${role.name} (áp dụng ${accountCount} tài khoản)`,
      });
      setBaseline(deepClonePermissions(draft));
      setConfirmOpen(false);
      success(`Đã lưu quyền cho vai trò ${role.name}`);
    } catch (err: any) {
      error(err?.message || 'Không lưu được quyền');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full pb-10">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate('/cai-dat/phan-quyen')}
            className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground shadow-sm mt-0.5"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{role.name}</h1>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">{role.description}</p>
            <p className="text-[12px] font-bold text-primary mt-2">{accountCount} tài khoản đang sử dụng</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!isDirty}
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-[13px] font-bold text-slate-700 disabled:opacity-40"
          >
            <Undo2 size={15} />
            Hủy thay đổi
          </button>
          <button
            type="button"
            disabled={!isDirty}
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-[13px] font-bold disabled:opacity-40"
          >
            <Save size={15} />
            Lưu quyền
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading || !draft ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/30">
                  <th className="py-3 px-4 font-bold">Phân hệ</th>
                  {PERMISSION_ACTIONS.map((a) => (
                    <th key={a.id} className="py-3 px-2 font-bold text-center">
                      {a.label}
                    </th>
                  ))}
                  <th className="py-3 px-4 font-bold">Phạm vi dữ liệu</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MODULES.map((mod) => (
                  <tr key={mod.id} className="border-b border-border/70">
                    <td className="py-3 px-4">
                      <div className="text-[13px] font-bold text-slate-800">{mod.label}</div>
                      <div className="text-[11px] text-muted-foreground">{mod.labelVi}</div>
                    </td>
                    {PERMISSION_ACTIONS.map((action) => {
                      const supported = actionSupported(mod.id, action.id);
                      if (!supported) {
                        return (
                          <td key={action.id} className="py-3 px-2 text-center text-muted-foreground text-[13px]">
                            —
                          </td>
                        );
                      }
                      const checked = Boolean(draft[mod.id].actions[action.id]);
                      const dirty = dirtyCells.has(cellKey(mod.id, action.id));
                      return (
                        <td key={action.id} className="py-3 px-2 text-center">
                          <label
                            className={clsx(
                              'inline-flex items-center justify-center w-9 h-9 rounded-lg border cursor-pointer transition-colors',
                              dirty ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200' : 'border-transparent hover:bg-muted',
                            )}
                            title={dirty ? 'Ô vừa thay đổi' : action.label}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(mod.id, action.id)}
                              className="h-4 w-4"
                            />
                          </label>
                        </td>
                      );
                    })}
                    <td className="py-3 px-4">
                      <select
                        value={draft[mod.id].scope}
                        onChange={(e) => setScope(mod.id, e.target.value as DataScope)}
                        className={clsx(
                          'w-full min-w-[150px] px-2.5 py-1.5 rounded-lg border text-[12px] font-semibold outline-none',
                          dirtyCells.has(`${mod.id}:scope`)
                            ? 'border-amber-400 bg-amber-50'
                            : 'border-border bg-white',
                        )}
                      >
                        {DATA_SCOPE_OPTIONS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isDirty ? (
        <p className="mt-3 text-[12px] font-semibold text-amber-700">
          Có {dirtyCells.size} thay đổi chưa lưu — các ô đổi được đánh dấu màu vàng.
        </p>
      ) : null}

      {confirmOpen ? (
        <SaveImpactDialog
          roleName={role.name}
          accountCount={accountCount}
          saving={saving}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => void handleSave()}
        />
      ) : null}
    </div>
  );
};

function SaveImpactDialog({
  roleName,
  accountCount,
  saving,
  onCancel,
  onConfirm,
}: {
  roleName: string;
  accountCount: number;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-[16px] font-bold text-slate-900 mb-2">Xác nhận lưu quyền</h3>
          <p className="text-[14px] text-slate-600 leading-relaxed font-medium">
            Thay đổi này áp dụng cho <span className="font-bold text-slate-900">{accountCount} tài khoản</span> thuộc
            vai trò <span className="font-bold text-slate-900">{roleName}</span>.
          </p>
        </div>
        <div className="p-4 bg-slate-50 border-t border-border flex gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border bg-white text-[13px] font-bold text-slate-600"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-[13px] font-bold inline-flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            Lưu quyền
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default RolePermissionDetailPage;
