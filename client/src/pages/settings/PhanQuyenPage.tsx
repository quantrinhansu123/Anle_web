import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Shield,
  Users,
  KeyRound,
  Grid3X3,
  ScrollText,
  Pencil,
  Eye,
  Loader2,
  RefreshCcw,
} from 'lucide-react';
import { clsx } from 'clsx';
import { createPortal } from 'react-dom';
import { employeeService, type Employee } from '../../services/employeeService';
import { useToastContext } from '../../contexts/ToastContext';
import {
  APP_ROLES,
  DATA_SCOPE_OPTIONS,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  actionSupported,
  resolveAppRoleId,
  type AppRoleId,
  type PermissionAction,
} from '../../data/phanQuyen';
import {
  loadAccountMeta,
  loadAllRolePermissions,
  loadAuditLog,
  seedDemoAuditIfEmpty,
  type AccountMeta,
  type AuditEntry,
} from '../../services/phanQuyenStore';
import AccountEditDrawer from './AccountEditDrawer';

type TabId = 'accounts' | 'roles' | 'matrix' | 'audit';

const TABS: { id: TabId; label: string; icon: React.ElementType; hint: string }[] = [
  { id: 'accounts', label: 'Tài khoản', icon: Users, hint: 'Danh sách nhân sự, vai trò, trạng thái và lần đăng nhập gần nhất' },
  { id: 'roles', label: 'Vai trò', icon: KeyRound, hint: 'Các nhóm Logistics, Sales, Kế toán, HR và Admin' },
  { id: 'matrix', label: 'Ma trận quyền', icon: Grid3X3, hint: 'Thiết lập quyền theo phân hệ và thao tác' },
  { id: 'audit', label: 'Nhật ký', icon: ScrollText, hint: 'Lịch sử cấp quyền, thu hồi quyền và thay đổi tài khoản' },
];

function usernameOf(emp: Employee, meta?: AccountMeta) {
  return meta?.username || emp.email?.split('@')[0] || emp.full_name;
}

function formatLogin(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN');
  } catch {
    return '—';
  }
}

const PhanQuyenPage: React.FC = () => {
  const navigate = useNavigate();
  const { error } = useToastContext();
  const [tab, setTab] = useState<TabId>('accounts');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [metaMap, setMetaMap] = useState<Record<string, AccountMeta>>({});
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [effectiveEmp, setEffectiveEmp] = useState<Employee | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const rolePerms = useMemo(() => loadAllRolePermissions(), [tab]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      seedDemoAuditIfEmpty();
      const list = await employeeService.getEmployees();
      setEmployees(Array.isArray(list) ? list : []);
      setMetaMap(loadAccountMeta());
      setAudit(loadAuditLog());
    } catch (err: any) {
      error(err?.message || 'Không tải được danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void load();
  }, [load]);

  const roleCounts = useMemo(() => {
    const counts: Record<AppRoleId, number> = {
      logistics: 0,
      sales: 0,
      accounting: 0,
      hr: 0,
      admin: 0,
    };
    for (const e of employees) {
      counts[resolveAppRoleId(e.department_code, e.role)] += 1;
    }
    return counts;
  }, [employees]);

  const activeTab = TABS.find((t) => t.id === tab)!;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/cai-dat')}
            className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Phân quyền</h1>
            <p className="text-[12px] text-muted-foreground">Quản lý tài khoản, vai trò và ma trận quyền hệ thống</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-[13px] font-bold text-slate-700 hover:bg-muted"
        >
          <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/30">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-bold transition-all',
                  active ? 'bg-white text-primary shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="px-4 py-3 border-b border-border/70 bg-white">
          <p className="text-[13px] text-slate-600 font-medium">{activeTab.hint}</p>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="animate-spin text-primary" size={28} />
              <p className="text-[13px] font-semibold">Đang tải…</p>
            </div>
          ) : null}

          {!loading && tab === 'accounts' ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3 font-bold">Tài khoản</th>
                    <th className="py-2 pr-3 font-bold">Nhân sự</th>
                    <th className="py-2 pr-3 font-bold">Vai trò</th>
                    <th className="py-2 pr-3 font-bold">Trạng thái</th>
                    <th className="py-2 pr-3 font-bold">Đăng nhập gần nhất</th>
                    <th className="py-2 font-bold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const meta = metaMap[emp.id];
                    const role = APP_ROLES.find((r) => r.id === resolveAppRoleId(emp.department_code, emp.role));
                    const standby = Boolean(meta?.isStandby) || emp.is_active === false;
                    const active = emp.is_active !== false && !meta?.isStandby;
                    return (
                      <tr key={emp.id} className="border-b border-border/60 hover:bg-muted/20">
                        <td className="py-3 pr-3 text-[13px] font-bold text-slate-800">{usernameOf(emp, meta)}</td>
                        <td className="py-3 pr-3 text-[13px] font-semibold text-slate-700">
                          {emp.full_name}
                          {standby && meta?.caretaker ? (
                            <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                              Phụ trách: {meta.caretaker}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3 pr-3">
                          <span className="inline-flex px-2 py-0.5 rounded-lg bg-slate-100 text-[12px] font-bold text-slate-700">
                            {role?.name || '—'}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          {active ? (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
                              <span className="w-2 h-2 rounded-full bg-slate-300" />
                              Dự phòng
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-[12px] text-muted-foreground font-medium">
                          {formatLogin(meta?.lastLoginAt)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEffectiveEmp(emp)}
                              className="px-2.5 py-1.5 rounded-lg border border-border text-[12px] font-bold text-slate-600 hover:bg-muted inline-flex items-center gap-1"
                            >
                              <Eye size={13} />
                              Quyền
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditEmp(emp)}
                              className="px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[12px] font-bold hover:bg-primary/15 inline-flex items-center gap-1"
                            >
                              <Pencil size={13} />
                              Chỉnh sửa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[13px] text-muted-foreground">
                        Chưa có tài khoản nhân sự.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : null}

          {!loading && tab === 'roles' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {APP_ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => navigate(`/cai-dat/phan-quyen/roles/${role.id}`)}
                  className="text-left p-4 rounded-2xl border border-border bg-white hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-[15px] font-bold text-slate-900">{role.name}</h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary">
                      {roleCounts[role.id]} tài khoản
                    </span>
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{role.description}</p>
                  <p className="mt-3 text-[12px] font-bold text-primary">Mở chi tiết quyền →</p>
                </button>
              ))}
            </div>
          ) : null}

          {!loading && tab === 'matrix' ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3 font-bold">Phân hệ</th>
                    {APP_ROLES.map((r) => (
                      <th key={r.id} className="py-2 px-2 font-bold text-center">
                        {r.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_MODULES.map((mod) => (
                    <tr key={mod.id} className="border-b border-border/60">
                      <td className="py-3 pr-3">
                        <div className="text-[13px] font-bold text-slate-800">{mod.label}</div>
                        <div className="text-[11px] text-muted-foreground">{mod.labelVi}</div>
                      </td>
                      {APP_ROLES.map((role) => {
                        const perms = rolePerms[role.id][mod.id];
                        const on = PERMISSION_ACTIONS.filter((a) => actionSupported(mod.id, a.id) && perms.actions[a.id]).map(
                          (a) => a.label,
                        );
                        const scope = DATA_SCOPE_OPTIONS.find((s) => s.id === perms.scope)?.label;
                        return (
                          <td key={role.id} className="py-3 px-2 align-top">
                            <button
                              type="button"
                              onClick={() => navigate(`/cai-dat/phan-quyen/roles/${role.id}`)}
                              className="w-full text-left rounded-xl border border-border/80 bg-slate-50/80 p-2 hover:border-primary/40"
                            >
                              <div className="text-[11px] font-semibold text-slate-700 leading-snug">
                                {on.length ? on.join(' · ') : 'Chưa cấp quyền'}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-1">Phạm vi: {scope}</div>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[12px] text-muted-foreground mt-3">
                Bấm ô vai trò để mở màn hình chỉnh sửa quyền chi tiết.
              </p>
            </div>
          ) : null}

          {!loading && tab === 'audit' ? (
            <div className="space-y-2">
              {audit.map((row) => (
                <div key={row.id} className="rounded-xl border border-border bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="text-[11px] font-bold text-muted-foreground w-40 shrink-0">
                    {formatLogin(row.at)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-slate-800">{row.detail}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {row.actor} → {row.target} · {row.action}
                    </div>
                  </div>
                </div>
              ))}
              {audit.length === 0 ? (
                <p className="py-10 text-center text-[13px] text-muted-foreground">Chưa có nhật ký.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <AccountEditDrawer
        employee={editEmp}
        open={Boolean(editEmp)}
        onClose={() => setEditEmp(null)}
        onSaved={(emp) => {
          setEmployees((prev) => prev.map((e) => (e.id === emp.id ? { ...e, ...emp } : e)));
          setMetaMap(loadAccountMeta());
          setAudit(loadAuditLog());
        }}
        onViewEffective={(emp) => {
          setEditEmp(null);
          setEffectiveEmp(emp);
        }}
      />

      {effectiveEmp ? (
        <EffectivePermissionsModal
          employee={effectiveEmp}
          meta={metaMap[effectiveEmp.id]}
          onClose={() => setEffectiveEmp(null)}
        />
      ) : null}
    </div>
  );
};

function EffectivePermissionsModal({
  employee,
  meta,
  onClose,
}: {
  employee: Employee;
  meta?: AccountMeta;
  onClose: () => void;
}) {
  const roleId = resolveAppRoleId(employee.department_code, employee.role);
  const role = APP_ROLES.find((r) => r.id === roleId)!;
  const perms = loadAllRolePermissions()[roleId];

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-bold text-slate-900">Quyền thực tế</h3>
            <p className="text-[12px] text-muted-foreground">
              {usernameOf(employee, meta)} · {role.name}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[13px] font-bold text-slate-600 px-3 py-1.5 rounded-lg hover:bg-muted">
            Đóng
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {PERMISSION_MODULES.map((mod) => {
            const row = perms[mod.id];
            const actions = PERMISSION_ACTIONS.filter(
              (a) => actionSupported(mod.id, a.id as PermissionAction) && row.actions[a.id],
            );
            if (!row.actions.access && actions.length === 0) return null;
            return (
              <div key={mod.id} className="rounded-xl border border-border p-3">
                <div className="text-[13px] font-bold text-slate-800">
                  {mod.label} · {mod.labelVi}
                </div>
                <div className="text-[12px] text-slate-600 mt-1">
                  {actions.length ? actions.map((a) => a.label).join(' · ') : 'Không có thao tác'}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Phạm vi: {DATA_SCOPE_OPTIONS.find((s) => s.id === row.scope)?.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default PhanQuyenPage;
