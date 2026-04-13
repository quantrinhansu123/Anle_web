/**
 * Date range picker based on https://github.com/johnpolacek/date-range-picker-for-shadcn
 * Adapted for react-day-picker v9, lucide-react icons, and this project's paths.
 */
import React, { type FC, useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar } from './calendar';
import { DateRangeFieldInput } from './date-range-field-input';
import { Label } from './label';
import { Switch } from './switch';
import { cn } from '../../lib/utils';

export interface DateRangePickerRange {
  from: Date;
  to: Date | undefined;
}

export interface DateRangePickerProps {
  onUpdate?: (values: { range: DateRangePickerRange; rangeCompare?: DateRangePickerRange }) => void;
  initialDateFrom?: Date | string;
  initialDateTo?: Date | string;
  initialCompareFrom?: Date | string;
  initialCompareTo?: Date | string;
  align?: 'start' | 'center' | 'end';
  locale?: string;
  showCompare?: boolean;
}

/** dd/MM/yyyy for trigger and compare line (fixed format). */
const formatDateDMY = (date: Date): string => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
};

const getDateAdjustedForTimezone = (dateInput: Date | string): Date => {
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('-').map((part) => parseInt(part, 10));
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return dateInput;
};

interface Preset {
  name: string;
  label: string;
}

const PRESETS: Preset[] = [
  { name: 'today', label: 'Today' },
  { name: 'yesterday', label: 'Yesterday' },
  { name: 'last7', label: 'Last 7 days' },
  { name: 'last14', label: 'Last 14 days' },
  { name: 'last30', label: 'Last 30 days' },
  { name: 'thisWeek', label: 'This week' },
  { name: 'lastWeek', label: 'Last week' },
  { name: 'thisMonth', label: 'This month' },
  { name: 'lastMonth', label: 'Last month' },
  { name: 'q1', label: 'Q1' },
  { name: 'q2', label: 'Q2' },
  { name: 'q3', label: 'Q3' },
  { name: 'q4', label: 'Q4' },
  { name: 'thisYear', label: 'This year' },
  { name: 'lastYear', label: 'Last year' },
];

const CUSTOM_YEAR_OPTIONS: number[] = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);

function isFullCalendarYearRange(r: DateRangePickerRange, year: number): boolean {
  if (!r.to) return false;
  const start = new Date(year, 0, 1, 0, 0, 0, 0).getTime();
  const end = new Date(year, 11, 31, 23, 59, 59, 999).getTime();
  return r.from.getTime() === start && r.to.getTime() === end;
}

function matchedCustomYearPreset(range: DateRangePickerRange): string | undefined {
  for (const y of CUSTOM_YEAR_OPTIONS) {
    if (isFullCalendarYearRange(range, y)) return `year_${y}`;
  }
  return undefined;
}

export const DateRangePicker: FC<DateRangePickerProps> = ({
  initialDateFrom = new Date(new Date().setHours(0, 0, 0, 0)),
  initialDateTo,
  initialCompareFrom,
  initialCompareTo,
  onUpdate,
  align = 'end',
  locale = 'en-US',
  showCompare = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const [range, setRange] = useState<DateRangePickerRange>({
    from: getDateAdjustedForTimezone(initialDateFrom),
    to: initialDateTo
      ? getDateAdjustedForTimezone(initialDateTo)
      : getDateAdjustedForTimezone(initialDateFrom),
  });

  const [rangeCompare, setRangeCompare] = useState<DateRangePickerRange | undefined>(
    initialCompareFrom
      ? {
          from: new Date(new Date(initialCompareFrom).setHours(0, 0, 0, 0)),
          to: initialCompareTo
            ? new Date(new Date(initialCompareTo).setHours(0, 0, 0, 0))
            : new Date(new Date(initialCompareFrom).setHours(0, 0, 0, 0)),
        }
      : undefined,
  );

  const openedRangeRef = useRef<DateRangePickerRange | undefined>(undefined);
  const openedRangeCompareRef = useRef<DateRangePickerRange | undefined>(undefined);

  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(undefined);

  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 960 : false,
  );

  useEffect(() => {
    const handleResize = (): void => {
      setIsSmallScreen(window.innerWidth < 960);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPresetRange = (presetName: string): DateRangePickerRange => {
    const preset = PRESETS.find(({ name }) => name === presetName);
    if (!preset) throw new Error(`Unknown date range preset: ${presetName}`);
    const now = new Date();
    const y = now.getFullYear();

    switch (preset.name) {
      case 'q1':
        return {
          from: new Date(y, 0, 1, 0, 0, 0, 0),
          to: new Date(y, 2, 31, 23, 59, 59, 999),
        };
      case 'q2':
        return {
          from: new Date(y, 3, 1, 0, 0, 0, 0),
          to: new Date(y, 5, 30, 23, 59, 59, 999),
        };
      case 'q3':
        return {
          from: new Date(y, 6, 1, 0, 0, 0, 0),
          to: new Date(y, 8, 30, 23, 59, 59, 999),
        };
      case 'q4':
        return {
          from: new Date(y, 9, 1, 0, 0, 0, 0),
          to: new Date(y, 11, 31, 23, 59, 59, 999),
        };
      case 'thisYear': {
        const from = new Date(y, 0, 1, 0, 0, 0, 0);
        const to = new Date(now);
        to.setHours(23, 59, 59, 999);
        return { from, to };
      }
      case 'lastYear': {
        const ly = y - 1;
        return {
          from: new Date(ly, 0, 1, 0, 0, 0, 0),
          to: new Date(ly, 11, 31, 23, 59, 59, 999),
        };
      }
      default:
        break;
    }

    const from = new Date();
    const to = new Date();
    const first = from.getDate() - from.getDay();

    switch (preset.name) {
      case 'today':
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to.setDate(to.getDate() - 1);
        to.setHours(23, 59, 59, 999);
        break;
      case 'last7':
        from.setDate(from.getDate() - 6);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'last14':
        from.setDate(from.getDate() - 13);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'last30':
        from.setDate(from.getDate() - 29);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'thisWeek':
        from.setDate(first);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'lastWeek':
        from.setDate(from.getDate() - 7 - from.getDay());
        to.setDate(to.getDate() - to.getDay() - 1);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'lastMonth':
        from.setMonth(from.getMonth() - 1);
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        to.setDate(0);
        to.setHours(23, 59, 59, 999);
        break;
      default:
        break;
    }

    return { from, to };
  };

  const applyFullYear = (year: number): void => {
    const next: DateRangePickerRange = {
      from: new Date(year, 0, 1, 0, 0, 0, 0),
      to: new Date(year, 11, 31, 23, 59, 59, 999),
    };
    setRange(next);
    if (rangeCompare) {
      setRangeCompare({
        from: new Date(next.from.getFullYear() - 1, next.from.getMonth(), next.from.getDate()),
        to: next.to
          ? new Date(next.to.getFullYear() - 1, next.to.getMonth(), next.to.getDate())
          : undefined,
      });
    }
    setSelectedPreset(`year_${year}`);
  };

  const setPreset = (preset: string): void => {
    const next = getPresetRange(preset);
    setRange(next);
    if (rangeCompare) {
      setRangeCompare({
        from: new Date(next.from.getFullYear() - 1, next.from.getMonth(), next.from.getDate()),
        to: next.to
          ? new Date(next.to.getFullYear() - 1, next.to.getMonth(), next.to.getDate())
          : undefined,
      });
    }
  };

  const checkPreset = (): void => {
    for (const preset of PRESETS) {
      const presetRange = getPresetRange(preset.name);

      if (preset.name === 'thisYear') {
        const pr = getPresetRange('thisYear');
        if (
          range.from.getTime() === pr.from.getTime() &&
          range.to &&
          pr.to &&
          range.to.getTime() === pr.to.getTime()
        ) {
          setSelectedPreset('thisYear');
          return;
        }
        continue;
      }

      const normalizedRangeFrom = new Date(range.from);
      normalizedRangeFrom.setHours(0, 0, 0, 0);
      const normalizedPresetFrom = new Date(presetRange.from);
      normalizedPresetFrom.setHours(0, 0, 0, 0);

      const normalizedRangeTo = new Date(range.to ?? range.from);
      normalizedRangeTo.setHours(0, 0, 0, 0);
      const normalizedPresetTo = new Date(presetRange.to ?? presetRange.from);
      normalizedPresetTo.setHours(0, 0, 0, 0);

      if (
        normalizedRangeFrom.getTime() === normalizedPresetFrom.getTime() &&
        normalizedRangeTo.getTime() === normalizedPresetTo.getTime()
      ) {
        setSelectedPreset(preset.name);
        return;
      }
    }

    const yMatch = matchedCustomYearPreset(range);
    if (yMatch) {
      setSelectedPreset(yMatch);
      return;
    }
    setSelectedPreset(undefined);
  };

  const resetValues = (): void => {
    setRange({
      from:
        typeof initialDateFrom === 'string'
          ? getDateAdjustedForTimezone(initialDateFrom)
          : initialDateFrom,
      to: initialDateTo
        ? typeof initialDateTo === 'string'
          ? getDateAdjustedForTimezone(initialDateTo)
          : initialDateTo
        : typeof initialDateFrom === 'string'
          ? getDateAdjustedForTimezone(initialDateFrom)
          : initialDateFrom,
    });
    setRangeCompare(
      initialCompareFrom
        ? {
            from:
              typeof initialCompareFrom === 'string'
                ? getDateAdjustedForTimezone(initialCompareFrom)
                : initialCompareFrom,
            to: initialCompareTo
              ? typeof initialCompareTo === 'string'
                ? getDateAdjustedForTimezone(initialCompareTo)
                : initialCompareTo
              : typeof initialCompareFrom === 'string'
                ? getDateAdjustedForTimezone(initialCompareFrom)
                : initialCompareFrom,
          }
        : undefined,
    );
  };

  useEffect(() => {
    checkPreset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mirror upstream: react only to range changes
  }, [range]);

  const PresetButton = ({
    preset,
    label,
    isSelected,
  }: {
    preset: string;
    label: string;
    isSelected: boolean;
  }): React.JSX.Element => (
    <Button
      className={cn('justify-start', isSelected && 'pointer-events-none')}
      variant="ghost"
      type="button"
      onClick={() => setPreset(preset)}
    >
      <span className={cn('pr-2 opacity-0', isSelected && 'opacity-70')}>
        <Check className="h-4 w-4" strokeWidth={2} />
      </span>
      {label}
    </Button>
  );

  const areRangesEqual = (a?: DateRangePickerRange, b?: DateRangePickerRange): boolean => {
    if (!a || !b) return a === b;
    return (
      a.from.getTime() === b.from.getTime() &&
      (!a.to || !b.to || a.to.getTime() === b.to.getTime())
    );
  };

  const defaultMonth = new Date(
    new Date().setMonth(new Date().getMonth() - (isSmallScreen ? 0 : 1)),
  );

  return (
    <Popover
      modal
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (open) {
          openedRangeRef.current = range;
          openedRangeCompareRef.current = rangeCompare;
        } else {
          resetValues();
        }
        setIsOpen(open);
      }}
    >
      <PopoverTrigger asChild>
        <Button size="lg" variant="outline" type="button" className="min-w-[200px] justify-between">
          <div className="text-left">
            <div className="py-1 text-[13px] font-semibold">
              {`${formatDateDMY(range.from)}${
                range.to != null ? ` – ${formatDateDMY(range.to)}` : ''
              }`}
            </div>
            {rangeCompare != null && (
              <div className="opacity-60 text-[11px] -mt-0.5">
                vs. {formatDateDMY(rangeCompare.from)}
                {rangeCompare.to != null ? ` – ${formatDateDMY(rangeCompare.to)}` : ''}
              </div>
            )}
          </div>
          <div className="pl-1 opacity-60 -mr-1">
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-auto max-w-[calc(100vw-1.5rem)] border-0 bg-card p-0 shadow-xl outline-none ring-1 ring-border/40"
      >
        <div className="flex flex-col lg:flex-row lg:items-start py-2">
          <div className="flex flex-col min-w-0 shrink-0">
            <div className="flex flex-col lg:flex-row gap-2 px-3 justify-end items-center lg:items-start pb-4 lg:pb-0">
              {showCompare && (
                <div className="flex items-center gap-2 pr-4 py-1 w-full lg:w-auto justify-center lg:justify-end">
                  <Switch
                    checked={Boolean(rangeCompare)}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        if (!range.to) {
                          setRange({ from: range.from, to: range.from });
                        }
                        setRangeCompare({
                          from: new Date(
                            range.from.getFullYear(),
                            range.from.getMonth(),
                            range.from.getDate() - 365,
                          ),
                          to: range.to
                            ? new Date(
                                range.to.getFullYear() - 1,
                                range.to.getMonth(),
                                range.to.getDate(),
                              )
                            : new Date(
                                range.from.getFullYear() - 1,
                                range.from.getMonth(),
                                range.from.getDate(),
                              ),
                        });
                      } else {
                        setRangeCompare(undefined);
                      }
                    }}
                    id="compare-mode"
                  />
                  <Label htmlFor="compare-mode">Compare</Label>
                </div>
              )}
              <div className="flex flex-col gap-2 w-full">
                <div className="flex flex-wrap gap-2 items-center justify-center lg:justify-end">
                  <DateRangeFieldInput
                    value={range.from}
                    onChange={(date) => {
                      const toDate = range.to == null || date > range.to ? date : range.to;
                      setRange((prev) => ({
                        ...prev,
                        from: date,
                        to: toDate,
                      }));
                    }}
                  />
                  <span className="text-muted-foreground py-1">–</span>
                  <DateRangeFieldInput
                    value={range.to ?? range.from}
                    onChange={(date) => {
                      const fromDate = date < range.from ? date : range.from;
                      setRange((prev) => ({
                        ...prev,
                        from: fromDate,
                        to: date,
                      }));
                    }}
                  />
                </div>
                {rangeCompare != null && (
                  <div className="flex flex-wrap gap-2 items-center justify-center lg:justify-end">
                    <DateRangeFieldInput
                      value={rangeCompare.from}
                      onChange={(date) => {
                        if (rangeCompare) {
                          const compareToDate =
                            rangeCompare.to == null || date > rangeCompare.to ? date : rangeCompare.to;
                          setRangeCompare((prev) =>
                            prev
                              ? { ...prev, from: date, to: compareToDate }
                              : { from: date, to: new Date() },
                          );
                        } else {
                          setRangeCompare({ from: date, to: new Date() });
                        }
                      }}
                    />
                    <span className="text-muted-foreground py-1">–</span>
                    <DateRangeFieldInput
                      value={rangeCompare.to ?? rangeCompare.from}
                      onChange={(date) => {
                        if (rangeCompare?.from) {
                          const compareFromDate = date < rangeCompare.from ? date : rangeCompare.from;
                          setRangeCompare({
                            ...rangeCompare,
                            from: compareFromDate,
                            to: date,
                          });
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            {isSmallScreen && (
              <div className="px-3 mb-2">
                <select
                  className="w-full max-w-[220px] mx-auto block h-10 rounded-md border border-border bg-card px-3 text-[13px] font-medium"
                  value={
                    selectedPreset?.startsWith('year_')
                      ? `year:${selectedPreset.slice(5)}`
                      : (selectedPreset ?? '')
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    if (v.startsWith('year:')) {
                      applyFullYear(parseInt(v.slice(5), 10));
                      return;
                    }
                    setPreset(v);
                  }}
                >
                  <option value="">Preset ranges…</option>
                  {PRESETS.map((preset) => (
                    <option key={preset.name} value={preset.name}>
                      {preset.label}
                    </option>
                  ))}
                  <optgroup label="Custom year">
                    {CUSTOM_YEAR_OPTIONS.map((yr) => (
                      <option key={yr} value={`year:${yr}`}>
                        {yr}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}
            <div className="pl-4 pr-1 overflow-x-auto" lang={locale}>
              <Calendar
                className="text-xs [&_.rdp-caption_label]:text-xs [&_.rdp-weekday]:text-[0.65rem] [--rdp-day-height:34px] [--rdp-day-width:34px] [--rdp-day_button-height:32px] [--rdp-day_button-width:32px] [--rdp-nav_button-height:1.75rem] [--rdp-nav_button-width:1.75rem] [--rdp-nav-height:2.25rem] [--rdp-months-gap:1.25rem] [--rdp-weekday-padding:0.2rem_0]"
                mode="range"
                selected={range}
                onSelect={(next) => {
                  if (next?.from != null) {
                    setRange({ from: next.from, to: next.to });
                  }
                }}
                numberOfMonths={isSmallScreen ? 1 : 2}
                defaultMonth={defaultMonth}
              />
            </div>
          </div>
          {!isSmallScreen && (
            <div className="flex flex-col items-stretch gap-0.5 pr-2 pl-4 pb-2 border-l border-border/60 min-w-[160px] max-h-[min(22rem,58vh)] overflow-y-auto overscroll-y-contain">
              {PRESETS.map((preset) => (
                <PresetButton
                  key={preset.name}
                  preset={preset.name}
                  label={preset.label}
                  isSelected={selectedPreset === preset.name}
                />
              ))}
              <div className="border-t border-border/40 mt-2 pt-2 space-y-1.5">
                <p className="text-[11px] text-muted-foreground px-2 font-semibold">Custom year</p>
                <select
                  className="w-full h-9 rounded-md border border-border bg-card text-[12px] px-2 font-medium"
                  value={selectedPreset?.startsWith('year_') ? selectedPreset.slice(5) : ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    applyFullYear(parseInt(v, 10));
                  }}
                >
                  <option value="">Select year…</option>
                  {CUSTOM_YEAR_OPTIONS.map((yr) => (
                    <option key={yr} value={String(yr)}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 py-2 px-3 border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsOpen(false);
              resetValues();
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              setIsOpen(false);
              if (
                !areRangesEqual(range, openedRangeRef.current) ||
                !areRangesEqual(rangeCompare, openedRangeCompareRef.current)
              ) {
                onUpdate?.({ range, rangeCompare });
              }
            }}
          >
            Update
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

DateRangePicker.displayName = 'DateRangePicker';
