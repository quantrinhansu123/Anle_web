import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { hasAllowedRole } from '../../data/employeeRoles';

interface PermissionGateProps {
  children: React.ReactNode;
  roles?: string[];
  departments?: string[];
  module?: string;
  fallback?: React.ReactNode;
}

const PermissionGate: React.FC<PermissionGateProps> = ({ 
  children, 
  roles, 
  departments,
  module,
  fallback = null 
}) => {
  const { user, canAccessModule } = usePermissions();

  if (!user) return <>{fallback}</>;

  // Check role requirement
  if (roles && roles.length > 0) {
    if (!hasAllowedRole(user.role, roles, { position: user.position, departmentCode: user.department_code })) {
      return <>{fallback}</>;
    }
  }

  // Check department requirement
  if (departments && departments.length > 0) {
    if (!user.department_code || !departments.includes(user.department_code)) {
      // CEO/Admin/BOD bypass department check
      if (user.role !== 'ceo' && user.role !== 'admin' && user.position !== 'Admin' && user.department_code !== 'bod') {
        return <>{fallback}</>;
      }
    }
  }

  // Check module access
  if (module) {
    if (!canAccessModule(module)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default PermissionGate;
