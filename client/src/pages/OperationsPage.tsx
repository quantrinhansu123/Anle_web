import React, { useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ModuleCard } from '../components/ui/ModuleCard';
import { moduleData } from '../data/moduleData';
import { usePermissions } from '../hooks/usePermissions';

const OperationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = usePermissions();

  const sections = moduleData['/operations'] || [];

  const trading = useMemo(() => {
    const sec = sections.find((s) => s.section === 'Trading');
    if (!sec) return null;

    const items = sec.items.filter((item) => {
      if (!user) return false;
      if (user.role === 'ceo' || user.role === 'admin' || user.position === 'Admin' || user.department_code === 'bod') return true;
      if (item.requiredRoles && !item.requiredRoles.includes(user.role || '')) return false;
      if (item.requiredDepartments && !item.requiredDepartments.includes(user.department_code || '')) return false;
      return true;
    });

    return { ...sec, items };
  }, [sections, user]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 text-muted-foreground hover:bg-accent rounded-lg flex items-center justify-center bg-card border border-border shadow-sm"
          aria-label="Back"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-black text-foreground truncate">Trading</h1>
          <p className="text-[12px] text-muted-foreground font-medium">
            Sales, quotations, purchasing, contracts, approvals.
          </p>
        </div>
      </div>

      {trading && trading.items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {trading.items.map((item, idx) => (
            <ModuleCard key={idx} {...item} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card/50 px-6 py-12 text-center text-muted-foreground">
          No available modules for your account.
        </div>
      )}
    </div>
  );
};

export default OperationsPage;

