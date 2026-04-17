import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();

  const isCEO = user?.role === 'ceo' || user?.role === 'admin' || user?.position === 'Admin' || user?.department_code === 'bod';
  const isAdmin = isCEO || user?.role === 'director';
  const isManager = isAdmin || user?.role === 'manager';

  const canAccessModule = (module: string): boolean => {
    if (isCEO) return true;
    
    switch (module) {
      case 'hr':
      case 'employees':
        return isAdmin; // only CEO and Directors can manage employees
      case 'sales':
        return user?.department_code === 'sales' || user?.department_code === 'finance';
      case 'procurement':
      case 'purchasing':
        return user?.department_code === 'procurement' || user?.department_code === 'finance';
      case 'finance':
        return user?.department_code === 'finance';
      case 'logistics':
        return user?.department_code === 'logistics' || user?.department_code === 'finance';
      default:
        return true; // Assume general modules are accessible
    }
  };

  const canApprove = (amount: number = 0): boolean => {
    if (isCEO) return true;
    if (!user?.spending_limit) return false;
    return amount <= user.spending_limit;
  };

  return {
    user,
    role: user?.role,
    department: user?.department_code,
    isCEO,
    isAdmin,
    isManager,
    canAccessModule,
    canApprove,
    spendingLimit: user?.spending_limit || 0
  };
};
