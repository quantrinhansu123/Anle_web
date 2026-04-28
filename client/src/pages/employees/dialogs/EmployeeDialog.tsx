import React from 'react';
import { createPortal } from 'react-dom';
import { X, User, Briefcase, Mail, Phone, MapPin, Lock, Camera, Loader2, Plus, ChevronRight, Banknote, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { apiFetch } from '../../../lib/api';
import type { Employee } from '../../../services/employeeService';
import { useToastContext } from '../../../contexts/ToastContext';
import { departmentService, type Department, type Team } from '../../../services/departmentService';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';

interface EmployeeDialogProps {
  isOpen: boolean;
  isClosing: boolean;
  isEditMode: boolean;
  isDetailMode?: boolean;
  onClose: () => void;
  formState: Partial<Employee>;
  setFormField: <K extends keyof Employee>(key: K, value: Employee[K]) => void;
  onSave: () => Promise<void>;
}

const EmployeeDialog: React.FC<EmployeeDialogProps> = ({
  isOpen,
  isClosing,
  isEditMode,
  isDetailMode = false,
  onClose,
  formState,
  setFormField,
  onSave
}) => {
  const { error } = useToastContext();
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [allTeams, setAllTeams] = React.useState<Team[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const depts = await departmentService.getDepartments();
      setDepartments(depts);
      const teams = await departmentService.getTeams();
      setAllTeams(teams);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (formState.department_code) {
      setTeams(allTeams.filter(t => t.department_code === formState.department_code));
    } else {
      setTeams([]);
    }
  }, [formState.department_code, allTeams]);

  if (!isOpen && !isClosing) return null;

  const handleFileClick = () => {
    if (isDetailMode) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const result = await apiFetch<{ url: string }>('/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      if (result && result.url) {
        setFormField('avatar_url', result.url);
      } else {
        throw new Error('Upload succeeded but no URL was returned');
      }
    } catch (err: any) {
      console.error('File upload failed:', err);
      error('Failed to upload image: ' + (err.message || 'Please try again.'));
    } finally {
      setIsUploading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Backdrop */}
      <div
        className={clsx(
          "fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-all duration-350 ease-out",
          isClosing ? "opacity-0" : "animate-in fade-in duration-300"
        )}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={clsx(
          "relative w-full max-w-[500px] bg-[#f8fafc] h-full shadow-2xl flex flex-col border-l border-border transition-transform duration-350 ease-out",
          isClosing ? "translate-x-full" : "translate-x-0 animate-in slide-in-from-right duration-350"
        )}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 leading-tight">
                {isDetailMode ? 'Employee Details' : isEditMode ? 'Edit Employee' : 'Create New Employee'}
              </h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {isDetailMode ? 'View employee profile information' : isEditMode ? 'Update employee profile details' : 'Add a new member to your organization'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-slate-100 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isDetailMode}
              />
              <div
                onClick={handleFileClick}
                className={clsx(
                  "w-24 h-24 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center overflow-hidden transition-all",
                  !isDetailMode && "group-hover:border-primary/50 cursor-pointer"
                )}
              >
                {isUploading ? (
                  <Loader2 size={24} className="animate-spin text-primary" />
                ) : formState.avatar_url ? (
                  <img src={formState.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-slate-400" />
                )}
              </div>
              {!isDetailMode && (
                <button
                  onClick={handleFileClick}
                  disabled={isUploading}
                  className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl border border-border shadow-md text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                >
                  <Camera size={16} />
                </button>
              )}
            </div>
            <div className="text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employee Avatar</span>
            </div>
          </div>

          <div className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-700 flex items-center gap-2">
                <User size={14} className="text-primary/60" />
                Full Name <span className="text-red-500 font-normal opacity-70">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Nguyen Van A"
                value={formState.full_name || ''}
                onChange={(e) => setFormField('full_name', e.target.value)}
                disabled={isDetailMode}
                className="w-full px-4 py-2 bg-white border border-border rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all disabled:opacity-70"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 flex items-center gap-2">
                  <Briefcase size={14} className="text-primary/60" />
                  Department
                </label>
                <SearchableSelect
                  options={departments.map(d => ({ value: d.code, label: d.name }))}
                  value={formState.department_code || ''}
                  onValueChange={(val) => {
                    setFormField('department_code', val);
                    setFormField('team_code', ''); 
                  }}
                  disabled={isDetailMode}
                  placeholder="Select Department"
                  hideSearch={true}
                />
              </div>

              {/* Team */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 flex items-center gap-2">
                  <Users size={14} className="text-primary/60" />
                  Team
                </label>
                <SearchableSelect
                  options={teams.map(t => ({ value: t.code, label: t.name }))}
                  value={formState.team_code || ''}
                  onValueChange={(val) => setFormField('team_code', val)}
                  disabled={isDetailMode || !formState.department_code}
                  placeholder="Select Team"
                  hideSearch={true}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 flex items-center gap-2">
                  <Lock size={14} className="text-primary/60" />
                  System Role
                </label>
                <SearchableSelect
                  options={[
                    { value: 'staff', label: 'Staff' },
                    { value: 'senior_staff', label: 'Senior Staff' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'director', label: 'Director' },
                    { value: 'ceo', label: 'CEO' },
                    { value: 'admin', label: 'Admin' },
                  ]}
                  value={formState.role || 'staff'}
                  onValueChange={(val) => setFormField('role', val)}
                  disabled={isDetailMode}
                  hideSearch={true}
                />
              </div>

              {/* Position (General Title) */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 flex items-center gap-2">
                  <User size={14} className="text-primary/60" />
                  General Position
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Accountant"
                  value={formState.position || ''}
                  onChange={(e) => setFormField('position', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-white border border-border rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all disabled:opacity-70"
                />
              </div>
            </div>

            {/* Spending Limit */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-700 flex items-center gap-2">
                <Banknote size={14} className="text-primary/60" />
                Spending Limit (VND)
              </label>
              <input
                type="number"
                placeholder="0"
                value={formState.spending_limit || 0}
                onChange={(e) => setFormField('spending_limit', Number(e.target.value))}
                disabled={isDetailMode}
                className="w-full px-4 py-2 bg-white border border-border rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all disabled:opacity-70"
              />
              <p className="text-[10px] text-muted-foreground italic">Employees cannot create payment requests exceeding this amount without approval.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 flex items-center gap-2">
                  <Mail size={14} className="text-primary/60" />
                  Email <span className="text-red-500 font-normal opacity-70">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. name@company.com"
                  value={formState.email || ''}
                  onChange={(e) => setFormField('email', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-white border border-border rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all disabled:opacity-70"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 flex items-center gap-2">
                  <Phone size={14} className="text-primary/60" />
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. +84 123 456 789"
                  value={formState.phone || ''}
                  onChange={(e) => setFormField('phone', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-white border border-border rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all disabled:opacity-70"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-700 flex items-center gap-2">
                <MapPin size={14} className="text-primary/60" />
                Address
              </label>
              <textarea
                rows={2}
                placeholder="Residential address..."
                value={formState.address || ''}
                onChange={(e) => setFormField('address', e.target.value)}
                disabled={isDetailMode}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all resize-none disabled:opacity-70"
              />
            </div>

            {!isDetailMode && (
              /* Password */
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 flex items-center gap-2">
                  <Lock size={14} className="text-primary/60" />
                  {isEditMode ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder={isEditMode ? 'Leave blank to keep current password' : 'Set temporary password'}
                    value={formState.password || ''}
                    onChange={(e) => setFormField('password', e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-border rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock size={14} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-white flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-border bg-white text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all font-inter"
          >
            Cancel
          </button>
          {!isDetailMode && (
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-8 py-2 rounded-xl bg-primary text-white text-[13px] font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all group active:scale-95 font-inter"
            >
              <Plus size={18} />
              {isEditMode ? 'Update Employee' : 'Create Employee'}
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EmployeeDialog;
