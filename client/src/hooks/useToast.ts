import { useToastContext } from '../contexts/ToastContext';

export const useToast = () => {
  const context = useToastContext();
  
  return {
    toast: context.showToast,
    success: context.success,
    error: context.error,
    warning: context.warning,
    info: context.info,
  };
};
