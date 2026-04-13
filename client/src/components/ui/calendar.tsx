import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import type { DayPickerProps } from 'react-day-picker';
import { cn } from '../../lib/utils';
import 'react-day-picker/style.css';

export type CalendarProps = DayPickerProps;

/** Shadcn-style calendar wrapper around react-day-picker v9 (default stylesheet). */
function Calendar({ className, ...props }: CalendarProps) {
  return <DayPicker className={cn('rdp-root', className)} {...props} />;
}

Calendar.displayName = 'Calendar';

export { Calendar };
