import { Search } from 'lucide-react';
import { clsx } from 'clsx';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterDropdownProps {
  isOpen: boolean;
  options: FilterOption[];
  selected: string[];
  onToggle: (id: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function FilterDropdown({
  isOpen,
  options,
  selected,
  onToggle,
  searchValue,
  onSearchChange
}: FilterDropdownProps) {
  if (!isOpen) return null;

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-border z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top ring-1 ring-black/5">
      <div className="p-3 border-b border-border bg-muted/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
          <input
            autoFocus
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-border rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/10 font-medium transition-all"
          />
        </div>
      </div>
      <div className="max-h-60 overflow-y-auto p-1 py-1 no-scrollbar">
        {filteredOptions.length > 0 ? (
          <div className="grid grid-cols-1 gap-px">
            {filteredOptions.map(opt => (
              <label
                key={opt.id}
                className={clsx(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer group transition-all mx-1 my-0.5",
                  selected.includes(opt.id) ? "bg-primary/5 shadow-sm" : "hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "w-4 h-4 rounded border transition-all flex items-center justify-center shrink-0",
                    selected.includes(opt.id) ? "bg-primary border-primary" : "border-border bg-white group-hover:border-primary/40"
                  )}>
                    {selected.includes(opt.id) && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-in zoom-in-50 duration-200" />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selected.includes(opt.id)}
                    onChange={() => onToggle(opt.id)}
                  />
                  <span className={clsx(
                    "text-[13px] font-medium tracking-tight line-clamp-1 transition-colors",
                    selected.includes(opt.id) ? "text-primary font-bold" : "text-slate-600 group-hover:text-foreground"
                  )}>
                    {opt.label}
                  </span>
                </div>
                {opt.count !== undefined && (
                  <span className={clsx(
                    "text-[11px] font-bold px-1.5 py-0.5 rounded-lg transition-all",
                    selected.includes(opt.id) ? "bg-primary/10 text-primary" : "text-slate-400 group-hover:text-primary/60"
                  )}>
                    {opt.count}
                  </span>
                )}
              </label>
            ))}
          </div>
        ) : (
          <div className="px-4 py-10 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
              <Search className="text-muted-foreground/30" size={16} />
            </div>
            <span className="text-[12px] font-medium text-muted-foreground opacity-60 italic">No matches found</span>
          </div>
        )}
      </div>
    </div>
  );
}
