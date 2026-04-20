import React from 'react';

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight block mb-1">
      {children}
    </label>
  );
}

export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="shrink-0 border-b border-border bg-slate-50/80 px-4 py-3">
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">
          {title}
        </h2>
      </div>
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </div>
  );
}

export const inputClass =
  'w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-colors';
