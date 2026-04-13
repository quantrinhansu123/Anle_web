import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import {
  format,
  parseISO,
  isValid,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addYears,
  subYears,
  setMonth,
} from 'date-fns';
import { cn } from '../../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface DateTimePicker24hProps {
  /** ISO 8601 string from parent, or empty */
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => 23 - i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function parseToDate(value: string): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

function cloneDate(d: Date): Date {
  return new Date(d.getTime());
}

export const DateTimePicker24h: React.FC<DateTimePicker24hProps> = ({
  value,
  onChange,
  disabled,
  placeholder = 'dd/MM/yyyy HH:mm',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months'>('days');
  const parsed = parseToDate(value);
  const [currentMonth, setCurrentMonth] = useState<Date>(parsed || new Date());

  useEffect(() => {
    const p = parseToDate(value);
    if (p) setCurrentMonth(cloneDate(p));
  }, [value]);

  const effective = parsed || new Date();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const emit = (d: Date) => onChange(d.toISOString());

  const handleDayClick = (day: Date) => {
    const next = cloneDate(parsed || new Date());
    next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    emit(next);
  };

  const handleHour = (hour: number) => {
    const next = cloneDate(parsed || new Date());
    next.setHours(hour);
    emit(next);
  };

  const handleMinute = (minute: number) => {
    const next = cloneDate(parsed || new Date());
    next.setMinutes(minute, 0, 0);
    emit(next);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setViewMode('days');
  };

  const handleNow = () => {
    const n = new Date();
    setCurrentMonth(n);
    emit(n);
    setViewMode('days');
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setTimeout(() => setViewMode('days'), 200);
  };

  const displayLabel = parsed ? format(parsed, 'dd/MM/yyyy HH:mm') : '';

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        <div className={cn('relative w-full', className)}>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'w-full px-3 py-2 bg-white border border-border rounded-lg text-[13px] transition-all font-medium flex items-center justify-between text-left',
              disabled ? 'opacity-70 cursor-not-allowed bg-slate-50' : 'hover:border-primary/40',
              isOpen && 'border-primary/40 ring-2 ring-primary/10',
              !parsed && 'text-muted-foreground',
            )}
          >
            <span className={cn('truncate', parsed && 'text-slate-900')}>
              {parsed ? displayLabel : placeholder}
            </span>
            <CalendarIcon size={16} className={cn('shrink-0', isOpen ? 'text-primary' : 'text-muted-foreground/50')} />
          </button>
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          'w-auto max-w-[calc(100vw-1rem)] p-0 rounded-2xl shadow-xl border border-border overflow-hidden',
        )}
      >
        <div className="flex flex-col md:flex-row">
          {/* Calendar (same structure as DateInput) */}
          <div className="p-3 md:p-4 border-b md:border-b-0 md:border-r border-border shrink-0 w-[280px] max-w-full">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setViewMode((v) => (v === 'days' ? 'months' : 'days'))}
                className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <span className="font-bold text-[15px] text-slate-900">
                  {viewMode === 'days' ? format(currentMonth, 'MMMM yyyy') : format(currentMonth, 'yyyy')}
                </span>
                <ChevronDown
                  size={14}
                  className={cn('text-slate-900 mt-0.5 transition-transform duration-200', viewMode === 'months' && 'rotate-180')}
                />
              </button>
              <div className="flex items-center gap-2 pr-1">
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
                <div className="grid grid-cols-7 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-center font-bold text-[12px] text-slate-900 h-7 flex items-center justify-center">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-0.5">
                  {calendarDays.map((day, i) => {
                    const isSelected = parsed && isSameDay(day, parsed);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isTodayDate = isToday(day);
                    return (
                      <div key={i} className="flex justify-center items-center h-8">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDayClick(day);
                          }}
                          className={cn(
                            'w-7 h-7 rounded shrink-0 flex items-center justify-center text-[12px] transition-all',
                            isSelected
                              ? 'bg-slate-900 text-white font-medium'
                              : 'hover:bg-slate-100',
                            !isSelected && !isCurrentMonth && 'text-slate-400',
                            !isSelected && isCurrentMonth && !isTodayDate && 'text-slate-900',
                            !isSelected && isTodayDate && 'text-primary font-bold',
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
              <div className="grid grid-cols-3 gap-2 mb-2">
                {Array.from({ length: 12 }).map((_, i) => {
                  const viewMonth = setMonth(currentMonth, i);
                  const isSelectedMonth = parsed && isSameMonth(viewMonth, parsed);
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
                      className={cn(
                        'h-9 rounded-xl text-[12px] font-medium transition-all flex items-center justify-center',
                        isSelectedMonth
                          ? 'bg-slate-900 text-white'
                          : isTodayMonth
                            ? 'text-primary font-bold bg-primary/5 hover:bg-primary/10'
                            : 'hover:bg-slate-100 text-slate-700',
                      )}
                    >
                      {format(viewMonth, 'MMM')}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center mt-3 px-1 pt-2 border-t border-border/60">
              <button type="button" onClick={(e) => { e.preventDefault(); handleClear(); }} className="text-[12px] font-medium text-primary hover:text-primary/80">
                Clear
              </button>
              <button type="button" onClick={(e) => { e.preventDefault(); handleNow(); }} className="text-[12px] font-medium text-primary hover:text-primary/80">
                Now
              </button>
            </div>
          </div>

          {/* Time columns */}
          <div className="flex flex-row md:flex-row md:h-[min(300px,50vh)] divide-x divide-border min-h-[120px]">
            <div className="flex-1 md:w-[72px] overflow-x-auto md:overflow-y-auto md:overflow-x-hidden overscroll-contain">
              <div className="flex flex-row md:flex-col p-2 gap-1 min-w-max md:min-w-0">
                {HOURS.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleHour(hour)}
                    className={cn(
                      'h-9 w-9 md:w-full md:min-w-0 rounded-lg text-[13px] font-medium shrink-0 flex items-center justify-center transition-colors',
                      effective.getHours() === hour ? 'bg-primary text-white' : 'hover:bg-muted text-slate-800',
                    )}
                  >
                    {String(hour).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 md:w-[72px] overflow-x-auto md:overflow-y-auto md:overflow-x-hidden overscroll-contain">
              <div className="flex flex-row md:flex-col p-2 gap-1 min-w-max md:min-w-0">
                {MINUTES.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleMinute(minute)}
                    className={cn(
                      'h-9 w-9 md:w-full md:min-w-0 rounded-lg text-[13px] font-medium shrink-0 flex items-center justify-center transition-colors',
                      effective.getMinutes() === minute ? 'bg-primary text-white' : 'hover:bg-muted text-slate-800',
                    )}
                  >
                    {String(minute).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/** Alias */
export const DateTimePicker = DateTimePicker24h;
