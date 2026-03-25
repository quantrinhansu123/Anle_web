import { toast as rtToast, type ToastOptions } from 'react-toastify';

const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
};

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return rtToast.success(message, { ...defaultOptions, ...options });
  },
  error: (message: string, options?: ToastOptions) => {
    return rtToast.error(message, { ...defaultOptions, ...options });
  },
  info: (message: string, options?: ToastOptions) => {
    return rtToast.info(message, { ...defaultOptions, ...options });
  },
  warning: (message: string, options?: ToastOptions) => {
    return rtToast.warning(message, { ...defaultOptions, ...options });
  },
  loading: (message: string, options?: ToastOptions) => {
    return rtToast.loading(message, { ...defaultOptions, ...options });
  },
  dismiss: (id?: string | number) => {
    return rtToast.dismiss(id);
  },
};
