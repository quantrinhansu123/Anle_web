import React, { useState, useRef, useEffect } from 'react';
import { Columns, GripVertical, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

interface ColumnSettingsProps {
  columns: Record<string, { label: string }>;
  visibleColumns: string[];
  columnOrder: string[];
  onVisibleColumnsChange: (columns: string[]) => void;
  onColumnOrderChange: (order: string[]) => void;
  defaultOrder: string[];
}

export const ColumnSettings: React.FC<ColumnSettingsProps> = ({
  columns,
  visibleColumns,
  columnOrder,
  onVisibleColumnsChange,
  onColumnOrderChange,
  defaultOrder
}) => {
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const columnPickerRef = useRef<HTMLDivElement>(null);
  const dragColIdx = useRef<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnPickerRef.current && !columnPickerRef.current.contains(event.target as Node)) {
        setShowColumnPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = () => {
    onVisibleColumnsChange(defaultOrder);
    onColumnOrderChange(defaultOrder);
  };

  const handleToggleColumn = (colId: string) => {
    onVisibleColumnsChange(
      visibleColumns.includes(colId)
        ? visibleColumns.filter(id => id !== colId)
        : [...visibleColumns, colId]
    );
  };

  return (
    <div className="relative" ref={columnPickerRef}>
      <button
        onClick={() => setShowColumnPicker(v => !v)}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold shadow-sm',
          showColumnPicker
            ? 'bg-primary/5 border-primary text-primary'
            : 'bg-white border-border hover:bg-muted text-muted-foreground',
        )}
        title="Select visible columns"
      >
        <Columns size={15} />
        <span>Visible Columns</span>
        <span className="text-[10px] font-bold text-muted-foreground">
          {visibleColumns.length}/{columnOrder.length}
        </span>
      </button>

      {showColumnPicker && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="px-4 py-2.5 border-b border-border bg-muted/5 flex items-center justify-between pointer-events-auto">
            <span className="text-[12px] font-bold text-foreground">Visible Columns</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-medium">
                {visibleColumns.length}/{columnOrder.length}
              </span>
              <button
                onClick={handleReset}
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Reset"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
          <div className="py-1 max-h-72 overflow-y-auto pointer-events-auto">
            {columnOrder.map((colId, idx) => (
              <div
                key={colId}
                draggable
                onDragStart={() => {
                  dragColIdx.current = idx;
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIdx(idx);
                }}
                onDrop={() => {
                  if (dragColIdx.current === null || dragColIdx.current === idx) return;
                  const next = [...columnOrder];
                  const [removed] = next.splice(dragColIdx.current, 1);
                  next.splice(idx, 0, removed);
                  onColumnOrderChange(next);
                  dragColIdx.current = null;
                  setDragOverIdx(null);
                }}
                onDragEnd={() => {
                  dragColIdx.current = null;
                  setDragOverIdx(null);
                }}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 transition-colors select-none',
                  dragOverIdx === idx ? 'bg-primary/10 border-t-2 border-primary' : 'hover:bg-muted/20',
                )}
              >
                <GripVertical size={14} className="text-muted-foreground/30 cursor-grab shrink-0" />
                <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    className="rounded border-border text-primary focus:ring-primary/20 w-4 h-4 shrink-0"
                    checked={visibleColumns.includes(colId)}
                    onChange={() => handleToggleColumn(colId)}
                  />
                  <span className="text-[13px] font-medium text-foreground">{columns[colId].label}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
