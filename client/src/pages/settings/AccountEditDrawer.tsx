import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Eye, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { Employee } from '../../services/employeeService';
import { employeeService } from '../../services/employeeService';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { useToastContext } from '../../contexts/ToastContext';
import { APP_ROLES, DATA_SCOPE_OPTIONS, resolveAppRoleId, type AppRoleId, type DataScope } from '../../data/phanQuyen';
import {
  appendAudit,
  loadAccountMeta,
  saveAccountMeta,
  type AccountMeta,
} from '../../services/phanQuyenStore';

type Props = {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
  onSaved: (employee: Employee) => void;
  onViewEffective: (employee: Employee) => void;
};

const AccountEditDrawer: React.FC<Props> = ({ employee, open, onClose, onSaved, onViewEffective }) => {
  const { success, error } = useToastContext();
  const [saving, setSaving] = useState(false);
  const [roleId, setRoleId] = useState<AppRoleId>('logistics');
  const [scope, setScope] = useState<DataScope>('personal');
  const [locked, setLocked] = useState(false);
  const [standby, setStandby] = useState(false);
  const [caretaker, setCaretaker] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (!employee || !open) return;
    const meta = loadAccountMeta()[employee.id] || {};
    setRoleId(resolveAppRoleId(employee.department_code, employee.role));
    setScope((meta.dataScope as DataScope) || 'personal');
    setLocked(employee.is_active === false);
    setStandby(Boolean(meta.isStandby));
    setCaretaker(meta.caretaker || '');
    setUsername(meta.username || employee.email?.split('@')[0] || '');
  }, [employee, open]);

  if (!open || !employee) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      const role = APP_ROLES.find((r) => r.id === roleId)!;
      const department_code = role.departmentCodes[0];
      const updated = await employeeService.updateEmployee(employee.id, {
        department_code,
        is_active: !locked,
        role: roleId === 'admin' ? 'admin' : employee.role || 'senior',
      });
      const meta: AccountMeta = {
        username,
        dataScope: scope,
        isStandby: standby,
        caretaker: standby ? caretaker : '',
      };
      saveAccountMeta(employee.id, meta);
      appendAudit({
        action: locked ? 'account_lock' : 'role_change',
        actor: 'Admin',
        target: username || employee.full_name,
        detail: `Cập nhật vai trò ${role.name}, phạm vi ${DATA_SCOPE_OPTIONS.find((s) => s.id === scope)?.label}${standby ? ', tài khoản dự phòng' : ''}`,
      });
      success('Đã cập nhật tài khoản');
      onSaved({ ...updated, ...employee, department_code, is_active: !locked });
      onClose();
    } catch (err: any) {
      error(err?.message || 'Không lưu được tài khoản');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative h-full w-full max-w-md bg-white shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">Chỉnh sửa tài khoản</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">{employee.full_name}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-[12px] font-bold text-slate-600">Tài khoản</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border text-[13px] font-semibold outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[12px] font-bold text-slate-600">Vai trò</span>
            <SearchableSelect
              value={roleId}
              onValueChange={(v) => setRoleId(v as AppRoleId)}
              options={APP_ROLES.map((r) => ({ value: r.id, label: r.name }))}
              placeholder="Chọn vai trò"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[12px] font-bold text-slate-600">Phạm vi dữ liệu</span>
            <SearchableSelect
              value={scope}
              onValueChange={(v) => setScope(v as DataScope)}
              options={DATA_SCOPE_OPTIONS.map((s) => ({ value: s.id, label: s.label }))}
              placeholder="Chọn phạm vi"
            />
          </label>

          <label className="flex items-center gap-3 px-3 py-3 rounded-xl border border-border cursor-pointer">
            <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} className="h-4 w-4" />
            <div>
              <div className="text-[13px] font-bold text-slate-800">Khóa tài khoản</div>
              <div className="text-[11px] text-muted-foreground">Không cho đăng nhập hệ thống</div>
            </div>
          </label>

          <label className="flex items-center gap-3 px-3 py-3 rounded-xl border border-border cursor-pointer">
            <input type="checkbox" checked={standby} onChange={(e) => setStandby(e.target.checked)} className="h-4 w-4" />
            <div>
              <div className="text-[13px] font-bold text-slate-800">Tài khoản dự phòng</div>
              <div className="text-[11px] text-muted-foreground">Gắn nhãn riêng và người phụ trách</div>
            </div>
          </label>

          {standby ? (
            <label className="block space-y-1.5">
              <span className="text-[12px] font-bold text-slate-600">Người phụ trách</span>
              <input
                value={caretaker}
                onChange={(e) => setCaretaker(e.target.value)}
                placeholder="Họ tên người phụ trách"
                className="w-full px-3 py-2 rounded-xl border border-border text-[13px] font-semibold outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
          ) : null}

          <button
            type="button"
            onClick={() => onViewEffective(employee)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-[13px] font-bold text-slate-700 hover:bg-muted"
          >
            <Eye size={16} />
            Xem quyền thực tế
          </button>
        </div>

        <div className="p-4 border-t border-border flex gap-3 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border bg-white text-[13px] font-bold text-slate-600"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className={clsx(
              'flex-1 py-2.5 rounded-xl bg-primary text-white text-[13px] font-bold flex items-center justify-center gap-2',
              saving && 'opacity-60',
            )}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            Lưu
          </button>
        </div>
      </aside>
    </div>,
    document.body,
  );
};

export default AccountEditDrawer;
