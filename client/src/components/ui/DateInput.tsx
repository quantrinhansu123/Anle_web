import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import {
  format, parseISO, isValid, addMonths, subMonths,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  addYears, subYears, setMonth
} from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';

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
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months'>('days');
  const [currentMonth, setCurrentMonth] = useState<Date>(
    value && isValid(parseISO(value)) ? parseISO(value) : new Date()
  );

  const parsedValue = value && isValid(parseISO(value)) ? parseISO(value) : null;

  const [inputValue, setInputValue] = useState('');

  // Sync external value to inputValue when it changes legitimately
  useEffect(() => {
    if (value && isValid(parseISO(value))) {
      setInputValue(format(parseISO(value), 'dd/MM/yyyy'));
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const inputType = (e.nativeEvent as any).inputType;
    const isDeleting = inputType === 'deleteContentBackward' || inputType === 'deleteContentForward';

    let digits = val.replace(/\D/g, '');

    // Auto-pad first digit for smarter typing (e.g., typing '4' becomes '04')
    if (!isDeleting) {
      if (digits.length === 1 && digits[0] > '3') {
        digits = '0' + digits;
      }
      if (digits.length === 3 && digits[2] > '1') {
        digits = digits.slice(0, 2) + '0' + digits.slice(2);
      }
    }

    // Limit maximum digits to 8
    digits = digits.slice(0, 8);

    // 1. Strict Day Validation
    if (digits.length >= 2) {
      const dd = parseInt(digits.slice(0, 2), 10);
      if (dd > 31 || dd === 0) return; // Prevent setting state
    }

    // 2. Strict Month & Month/Day Combination Validation
    if (digits.length >= 4) {
      const dd = parseInt(digits.slice(0, 2), 10);
      const mm = parseInt(digits.slice(2, 4), 10);

      if (mm > 12 || mm === 0) return;
      if (mm === 2 && dd > 29) return;
      if ([4, 6, 9, 11].includes(mm) && dd > 30) return;
    }

    // 3. Strict Full Date (Leap Year) Validation when fully typed
    if (digits.length === 8) {
      const dd = parseInt(digits.slice(0, 2), 10);
      const mm = parseInt(digits.slice(2, 4), 10);
      const yy = parseInt(digits.slice(4, 8), 10);

      const parsedDate = new Date();
      parsedDate.setFullYear(yy, mm - 1, dd);
      parsedDate.setHours(0, 0, 0, 0);

      // If JS rolls the date over, it means it's invalid (e.g. 29/02/2023 rolls to March 1)
      if (parsedDate.getFullYear() !== yy || parsedDate.getMonth() !== mm - 1 || parsedDate.getDate() !== dd) {
        return;
      }
    }

    let formatted = digits;

    if (!isDeleting) {
      if (digits.length >= 2 && digits.length < 4) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else if (digits.length >= 4) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
      }
    } else {
      if (digits.length > 4) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
      } else if (digits.length > 2) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else {
        formatted = digits;
      }
    }

    setInputValue(formatted);

    // If completely cleared
    if (digits.length === 0) {
      onChange('');
    }

    // If we have a fully formed date, let's parse and send it!
    if (formatted.length === 10) {
      const [dd, mm, yyyy] = formatted.split('/');
      const d = parseInt(dd, 10);
      const m = parseInt(mm, 10);
      const y = parseInt(yyyy, 10);

      const parsedDate = new Date(y, m - 1, d);
      if (parsedDate.getFullYear() === y && parsedDate.getMonth() === m - 1 && parsedDate.getDate() === d) {
        onChange(format(parsedDate, 'yyyy-MM-dd'));
        setCurrentMonth(parsedDate);
      }
    }
  };

  // Calendar logic
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "yyyy-MM-dd";
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleDateClick = (day: Date) => {
    onChange(format(day, dateFormat));
    setIsOpen(false);
    setViewMode('days');
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setViewMode('days');
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onChange(format(today, dateFormat));
    setIsOpen(false);
    setViewMode('days');
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => setViewMode('days'), 200); // Reset after fade out
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        <div className={clsx("relative group w-full", className)}>
          <div
            className={clsx(
              "w-full px-3 py-2 bg-white border border-border rounded-lg text-[13px] transition-all font-medium flex items-center justify-between cursor-text",
              disabled ? "opacity-70 cursor-not-allowed bg-slate-50" : "hover:border-primary/40 group-focus-within:ring-2 group-focus-within:ring-primary/10 group-focus-within:border-primary/40",
              isOpen && "border-primary/40 ring-2 ring-primary/10"
            )}
          >
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={placeholder}
              disabled={disabled}
              className="bg-transparent border-none outline-none w-full text-slate-900 placeholder:text-muted-foreground/60 focus:ring-0 p-0 text-[13px]"
            />
            <CalendarIcon size={16} className={clsx(
              "transition-colors cursor-pointer",
              isOpen ? "text-primary" : "text-muted-foreground/50 group-hover:text-primary"
            )} />
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-[280px] p-4 bg-white rounded-2xl shadow-xl border-none outline-none select-none"
        align="start"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div
            onClick={() => setViewMode(v => v === 'days' ? 'months' : 'days')}
            className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span className="font-bold text-[15px] text-slate-900">
              {viewMode === 'days' ? format(currentMonth, 'MMMM yyyy') : format(currentMonth, 'yyyy')}
            </span>
            <ChevronDown size={14} className={clsx(
              "text-slate-900 mt-0.5 transition-transform duration-200",
              viewMode === 'months' && "rotate-180"
            )} />
          </div>
          <div className="flex items-center gap-3 pr-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (viewMode === 'days') prevMonth();
                else setCurrentMonth(subYears(currentMonth, 1));
              }}
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowUp size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (viewMode === 'days') nextMonth();
                else setCurrentMonth(addYears(currentMonth, 1));
              }}
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowDown size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {viewMode === 'days' ? (
          <>
            {/* Days of week */}
            <div className="grid grid-cols-7 mb-2">
              {days.map((day) => (
                <div key={day} className="text-center font-bold text-[13px] text-slate-900 h-8 flex items-center justify-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {calendarDays.map((day, i) => {
                const isSelected = parsedValue && isSameDay(day, parsedValue);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);

                return (
                  <div key={i} className="flex justify-center items-center h-9">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDateClick(day);
                      }}
                      className={clsx(
                        "w-8 h-8 rounded shrink-0 flex items-center justify-center text-[13px] transition-all relative",
                        isSelected
                          ? "bg-slate-900 text-white font-medium"
                          : "hover:bg-slate-100",
                        !isSelected && !isCurrentMonth && "text-slate-400 font-normal",
                        !isSelected && isCurrentMonth && !isTodayDate && "text-slate-900 font-normal",
                        !isSelected && isTodayDate && "text-primary font-bold"
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Months Grid */
          <div className="grid grid-cols-3 gap-2 mt-4 mb-2">
            {Array.from({ length: 12 }).map((_, i) => {
              const viewMonth = setMonth(currentMonth, i);
              const isSelectedMonth = parsedValue && isSameMonth(viewMonth, parsedValue);
              const isTodayMonth = isSameMonth(viewMonth, new Date());

              return (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentMonth(viewMonth);
                    setViewMode('days');
                  }}
                  className={clsx(
                    "h-10 rounded-xl text-[13px] font-medium transition-all flex items-center justify-center",
                    isSelectedMonth
                      ? "bg-slate-900 text-white"
                      : isTodayMonth
                        ? "text-primary font-bold bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-slate-100 text-slate-700"
                  )}
                >
                  {format(viewMonth, 'MMM')}
                </button>
              );
            })}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex justify-between items-center mt-5 px-2">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); handleClear(); }}
            className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); handleToday(); }}
            className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Today
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
