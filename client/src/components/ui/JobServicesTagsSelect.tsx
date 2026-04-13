import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Command, CommandGroup, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export const JOB_SERVICE_TAGS = ['SEA', 'AIR', 'Trucking', 'Customs', 'Others'] as const;
export type JobServiceTag = (typeof JOB_SERVICE_TAGS)[number];

const CANONICAL = new Map(JOB_SERVICE_TAGS.map((o) => [o.toLowerCase(), o]));

/** Parse stored `fms_jobs.services` (comma / semicolon / middle dot / pipe) into known tags. */
export function parseJobServicesStored(raw: string | null | undefined): JobServiceTag[] {
  if (!raw?.trim()) return [];
  const parts = raw.split(/[,;·|]/g).map((p) => p.trim()).filter(Boolean);
  const out: JobServiceTag[] = [];
  for (const p of parts) {
    const c = CANONICAL.get(p.toLowerCase());
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

export function serializeJobServices(tags: readonly string[]): string {
  return tags.filter(Boolean).join(', ');
}

export function JobServicesTagsSelect({
  value,
  onChange,
  disabled,
  className,
}: {
  value: JobServiceTag[];
  onChange: (next: JobServiceTag[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const toggle = (tag: JobServiceTag) => {
    if (value.includes(tag)) onChange(value.filter((t) => t !== tag));
    else onChange([...value, tag]);
  };

  const remove = (tag: JobServiceTag, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex min-h-[42px] w-full items-start gap-2 rounded-xl border border-border bg-muted/10 px-2 py-1.5 text-left text-[13px] font-medium transition-all hover:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/10',
            open && 'border-primary ring-2 ring-primary/5',
            disabled && 'pointer-events-none opacity-45',
            className,
          )}
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {value.length === 0 ? (
              <span className="text-muted-foreground/60 px-1 py-0.5">Select services…</span>
            ) : (
              value.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex max-w-full items-center gap-0.5 rounded-full border border-border bg-white px-2 py-0.5 text-[12px] font-semibold text-slate-700 shadow-sm"
                >
                  <span className="truncate">{tag}</span>
                  {!disabled && (
                    <button
                      type="button"
                      className="shrink-0 rounded p-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      aria-label={`Remove ${tag}`}
                      onClick={(e) => remove(tag, e)}
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  )}
                </span>
              ))
            )}
          </div>
          <ChevronDown className="mt-1 shrink-0 text-muted-foreground" size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] border-0 p-0 shadow-lg outline-none ring-1 ring-border/50"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command
          shouldFilter={false}
          className="rounded-xl border-0 bg-transparent shadow-none outline-none ring-0 [&_[cmdk-list]]:outline-none"
        >
          <CommandList className="outline-none">
            <CommandGroup>
              {JOB_SERVICE_TAGS.map((tag) => {
                const selected = value.includes(tag);
                return (
                  <CommandItem
                    key={tag}
                    value={tag}
                    onSelect={() => toggle(tag)}
                    onPointerDown={(e) => e.preventDefault()}
                    className="cursor-pointer outline-none ring-0 focus-visible:ring-0"
                  >
                    <Check
                      className={cn('mr-2 size-4 shrink-0', selected ? 'opacity-100' : 'opacity-20')}
                    />
                    {tag}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
