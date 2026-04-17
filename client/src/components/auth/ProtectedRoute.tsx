import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredDepartments?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles,
  requiredDepartments
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-full min-h-0 w-full bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-[13px] font-bold text-slate-400 animate-pulse uppercase tracking-widest">Verifying Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    if (!user.role || !requiredRoles.includes(user.role)) {
      // CEO/Admin bypass role list check
      if (user.role !== 'ceo' && user.role !== 'admin' && user.position !== 'Admin') {
        return <Navigate to="/" replace />;
      }
    }
  }

  // Check departments
  if (requiredDepartments && requiredDepartments.length > 0) {
    if (!user.department_code || !requiredDepartments.includes(user.department_code)) {
      // CEO/Admin/BOD bypass department check
      if (user.role !== 'ceo' && user.role !== 'admin' && user.position !== 'Admin' && user.department_code !== 'bod') {
        return <Navigate to="/" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
