import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const typeStyles = {
  success: {
    container: 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/20',
    icon: CheckCircle2,
    bar: 'bg-white/40',
  },
  error: {
    container: 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/20',
    icon: AlertCircle,
    bar: 'bg-white/40',
  },
  warning: {
    container: 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20',
    icon: AlertTriangle,
    bar: 'bg-white/40',
  },
  info: {
    container: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20',
    icon: Info,
    bar: 'bg-white/40',
  },
};

export const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 4000, onClose }) => {
  const Icon = typeStyles[type].icon;
  const [isPaused, setIsPaused] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(duration);

  React.useEffect(() => {
    if (duration <= 0) return;

    const interval = setInterval(() => {
      if (!isPaused) {
        setTimeLeft((prev) => {
          const next = prev - 10;
          if (next <= 0) {
            clearInterval(interval);
            onClose(id);
            return 0;
          }
          return next;
        });
      }
    }, 10);

    return () => clearInterval(interval);
  }, [isPaused, duration, id, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={clsx(
        "relative flex items-center gap-4 min-w-[320px] max-w-md p-4 pb-5 rounded-[20px] text-white shadow-xl pointer-events-auto overflow-hidden",
        typeStyles[type].container
      )}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-[14px] bg-white/20 flex items-center justify-center backdrop-blur-sm">
        <Icon size={22} strokeWidth={2.5} />
      </div>
      
      <div className="flex-1 pr-6">
        <p className="text-[14.5px] font-medium leading-tight">
          {message}
        </p>
      </div>

      <button
        onClick={() => onClose(id)}
        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
      >
        <X size={16} strokeWidth={2.5} />
      </button>

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
          <div 
            className={clsx("h-full transition-all duration-100 ease-linear", typeStyles[type].bar)}
            style={{ width: `${(timeLeft / duration) * 100}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};
