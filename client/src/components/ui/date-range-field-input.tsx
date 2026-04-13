/**
 * Three-field dd/MM/yyyy input used inside DateRangePicker.
 * From https://github.com/johnpolacek/date-range-picker-for-shadcn (date-input.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface DateRangeFieldInputProps {
  value?: Date;
  onChange: (date: Date) => void;
}

interface DateParts {
  day: number;
  month: number;
  year: number;
}

export const DateRangeFieldInput: React.FC<DateRangeFieldInputProps> = ({ value, onChange }) => {
  const [date, setDate] = React.useState<DateParts>(() => {
    const d = value ? new Date(value) : new Date();
    return {
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    };
  });

  const dayRef = useRef<HTMLInputElement | null>(null);
  const monthRef = useRef<HTMLInputElement | null>(null);
  const yearRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const d = value ? new Date(value) : new Date();
    setDate({
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
  }, [value]);

  const validateDate = (field: keyof DateParts, val: number): boolean => {
    if (
      (field === 'day' && (val < 1 || val > 31)) ||
      (field === 'month' && (val < 1 || val > 12)) ||
      (field === 'year' && (val < 1000 || val > 9999))
    ) {
      return false;
    }
    const newDate = { ...date, [field]: val };
    const d = new Date(newDate.year, newDate.month - 1, newDate.day);
    return (
      d.getFullYear() === newDate.year &&
      d.getMonth() + 1 === newDate.month &&
      d.getDate() === newDate.day
    );
  };

  const handleInputChange =
    (field: keyof DateParts) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value ? Number(e.target.value) : '';
      const isValid = typeof newValue === 'number' && validateDate(field, newValue);
      const newDate = { ...date, [field]: newValue };
      setDate(newDate);
      if (isValid) {
        onChange(new Date(newDate.year, newDate.month - 1, newDate.day));
      }
    };

  const initialDate = useRef<DateParts>(date);

  const handleBlur =
    (field: keyof DateParts) =>
    (e: React.FocusEvent<HTMLInputElement>): void => {
      if (!e.target.value) {
        setDate(initialDate.current);
        return;
      }
      const newValue = Number(e.target.value);
      const isValid = validateDate(field, newValue);
      if (!isValid) {
        setDate(initialDate.current);
      } else {
        initialDate.current = { ...date, [field]: newValue };
      }
    };

  const handleKeyDown =
    (field: keyof DateParts) =>
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.metaKey || e.ctrlKey) return;

      if (
        !/^[0-9]$/.test(e.key) &&
        ![
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'Delete',
          'Tab',
          'Backspace',
          'Enter',
        ].includes(e.key)
      ) {
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        let newDate = { ...date };
        if (field === 'day') {
          if (date[field] === new Date(date.year, date.month, 0).getDate()) {
            newDate = { ...newDate, day: 1, month: (date.month % 12) + 1 };
            if (newDate.month === 1) newDate.year += 1;
          } else {
            newDate.day += 1;
          }
        }
        if (field === 'month') {
          if (date[field] === 12) {
            newDate = { ...newDate, month: 1, year: date.year + 1 };
          } else {
            newDate.month += 1;
          }
        }
        if (field === 'year') {
          newDate.year += 1;
        }
        setDate(newDate);
        onChange(new Date(newDate.year, newDate.month - 1, newDate.day));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        let newDate = { ...date };
        if (field === 'day') {
          if (date[field] === 1) {
            newDate.month -= 1;
            if (newDate.month === 0) {
              newDate.month = 12;
              newDate.year -= 1;
            }
            newDate.day = new Date(newDate.year, newDate.month, 0).getDate();
          } else {
            newDate.day -= 1;
          }
        }
        if (field === 'month') {
          if (date[field] === 1) {
            newDate = { ...newDate, month: 12, year: date.year - 1 };
          } else {
            newDate.month -= 1;
          }
        }
        if (field === 'year') {
          newDate.year -= 1;
        }
        setDate(newDate);
        onChange(new Date(newDate.year, newDate.month - 1, newDate.day));
      }

      if (e.key === 'ArrowRight') {
        if (
          e.currentTarget.selectionStart === e.currentTarget.value.length ||
          (e.currentTarget.selectionStart === 0 &&
            e.currentTarget.selectionEnd === e.currentTarget.value.length)
        ) {
          e.preventDefault();
          if (field === 'day') monthRef.current?.focus();
          if (field === 'month') yearRef.current?.focus();
        }
      } else if (e.key === 'ArrowLeft') {
        if (
          e.currentTarget.selectionStart === 0 ||
          (e.currentTarget.selectionStart === 0 &&
            e.currentTarget.selectionEnd === e.currentTarget.value.length)
        ) {
          e.preventDefault();
          if (field === 'month') dayRef.current?.focus();
          if (field === 'year') monthRef.current?.focus();
        }
      }
    };

  return (
    <div className="flex border border-border rounded-lg items-center text-sm px-1 bg-card">
      <input
        type="text"
        ref={dayRef}
        maxLength={2}
        value={String(date.day).padStart(2, '0')}
        onChange={handleInputChange('day')}
        onKeyDown={handleKeyDown('day')}
        onFocus={(e) => {
          if (window.innerWidth > 1024) e.target.select();
        }}
        onBlur={handleBlur('day')}
        className="p-0 outline-none w-7 border-none text-center bg-transparent"
        placeholder="dd"
        aria-label="Day"
      />
      <span className="opacity-30 -mx-px select-none">/</span>
      <input
        type="text"
        ref={monthRef}
        maxLength={2}
        value={String(date.month).padStart(2, '0')}
        onChange={handleInputChange('month')}
        onKeyDown={handleKeyDown('month')}
        onFocus={(e) => {
          if (window.innerWidth > 1024) e.target.select();
        }}
        onBlur={handleBlur('month')}
        className="p-0 outline-none w-6 border-none text-center bg-transparent"
        placeholder="MM"
        aria-label="Month"
      />
      <span className="opacity-30 -mx-px select-none">/</span>
      <input
        type="text"
        ref={yearRef}
        maxLength={4}
        value={date.year.toString()}
        onChange={handleInputChange('year')}
        onKeyDown={handleKeyDown('year')}
        onFocus={(e) => {
          if (window.innerWidth > 1024) e.target.select();
        }}
        onBlur={handleBlur('year')}
        className="p-0 outline-none w-12 border-none text-center bg-transparent"
        placeholder="yyyy"
        aria-label="Year"
      />
    </div>
  );
};

DateRangeFieldInput.displayName = 'DateRangeFieldInput';
