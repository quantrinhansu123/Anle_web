import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { format, parseISO, isValid } from 'date-fns';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  disabled,
  placeholder = 'dd/mm/yyyy',
  className
}) => {
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const displayValue = value && isValid(parseISO(value)) 
    ? format(parseISO(value), 'dd/MM/yyyy') 
    : '';

  const handleDisplayClick = () => {
    if (disabled) return;
    hiddenInputRef.current?.showPicker();
  };

  return (
    <div className={clsx("relative group", className)}>
      <div 
        onClick={handleDisplayClick}
        className={clsx(
          "w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] transition-all font-medium flex items-center justify-between cursor-pointer",
          disabled ? "opacity-70 cursor-not-allowed bg-slate-50" : "hover:border-primary/40 group-focus-within:ring-2 group-focus-within:ring-primary/10 group-focus-within:border-primary/40"
        )}
      >
        <span className={clsx(displayValue ? "text-slate-900" : "text-muted-foreground/60")}>
          {displayValue || placeholder}
        </span>
        <Calendar size={16} className="text-muted-foreground/50 group-hover:text-primary transition-colors" />
      </div>
      
      {/* Hidden native date input to use its picker */}
      <input
        ref={hiddenInputRef}
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="absolute inset-x-0 bottom-0 h-0 w-full opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
};
