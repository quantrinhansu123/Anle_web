import { useMemo } from 'react';
import { Plus, Trash2, Clock3, MapPin, MessageSquareText, BadgeCheck } from 'lucide-react';
import { FieldLabel, SectionCard, inputClass } from './blSharedHelpers';

export type TrackingUpdate = {
  at: string; // ISO-ish datetime-local string (YYYY-MM-DDTHH:mm)
  status: string;
  location: string;
  note: string;
};

export type TrackingTabState = {
  updates: TrackingUpdate[];
};

export function emptyTrackingState(): TrackingTabState {
  return { updates: [] };
}

const emptyUpdate = (): TrackingUpdate => ({
  at: new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
  status: '',
  location: '',
  note: '',
});

export function TrackingTab({
  state,
  onChange,
}: {
  state: TrackingTabState;
  onChange: (patch: Partial<TrackingTabState>) => void;
}) {
  const statusDatalistId = 'sea-hbl-tracking-status';
  const locationDatalistId = 'sea-hbl-tracking-location';

  const statusSuggestions = [
    'Booked',
    'Picked up',
    'Gate in',
    'Loaded',
    'Departed',
    'In transit',
    'Arrived',
    'Customs clearance',
    'Out for delivery',
    'Delivered',
    'Delayed',
    'Cancelled',
  ];

  const locationSuggestions = [
    'POL',
    'POD',
    'Warehouse',
    'Port',
    'Airport',
    'Customs',
    'Customer site',
  ];

  const updates = state.updates || [];

  const normalized = useMemo(() => {
    return updates.map((u) => ({
      at: u.at || '',
      status: u.status || '',
      location: u.location || '',
      note: u.note || '',
    }));
  }, [updates]);

  const addUpdate = () => onChange({ updates: [emptyUpdate(), ...normalized] });
  const removeUpdate = (idx: number) => onChange({ updates: normalized.filter((_, i) => i !== idx) });
  const updateRow = (idx: number, patch: Partial<TrackingUpdate>) =>
    onChange({ updates: normalized.map((r, i) => (i === idx ? { ...r, ...patch } : r)) });

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4">
      <SectionCard title="Tracking timeline">
        <datalist id={statusDatalistId}>
          {statusSuggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <datalist id={locationDatalistId}>
          {locationSuggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-slate-700">
              Add timestamped updates to track shipment progress over time.
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Updates are autosaved with Sea House B/L.
            </p>
          </div>
          <button
            type="button"
            onClick={addUpdate}
            className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-[12px] font-black uppercase tracking-wide text-primary transition-colors hover:bg-primary/10"
          >
            <Plus size={16} />
            Add update
          </button>
        </div>

        {normalized.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-8 text-center">
            <p className="text-[12px] font-semibold text-slate-600">No updates yet.</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Click “Add update” to create the first status.</p>
          </div>
        ) : (
          <div className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-border">
            <table className="min-w-[980px] w-full text-left text-[11px]">
              <thead className="bg-slate-50 border-b border-border">
                <tr>
                  <th className="px-2 py-2 font-bold text-muted-foreground uppercase whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 size={12} /> Time
                    </span>
                  </th>
                  <th className="px-2 py-2 font-bold text-muted-foreground uppercase whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <BadgeCheck size={12} /> Status
                    </span>
                  </th>
                  <th className="px-2 py-2 font-bold text-muted-foreground uppercase whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={12} /> Location
                    </span>
                  </th>
                  <th className="px-2 py-2 font-bold text-muted-foreground uppercase whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquareText size={12} /> Note
                    </span>
                  </th>
                  <th className="w-12 px-2 py-2" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {normalized.map((u, idx) => (
                  <tr key={`${u.at}-${idx}`} className="border-b border-border/60 last:border-0">
                    <td className="p-2 align-top">
                      <FieldLabel>
                        <span className="sr-only">Time</span>
                      </FieldLabel>
                      <input
                        type="datetime-local"
                        value={u.at}
                        onChange={(e) => updateRow(idx, { at: e.target.value })}
                        className={inputClass}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <FieldLabel>
                        <span className="sr-only">Status</span>
                      </FieldLabel>
                      <input
                        value={u.status}
                        onChange={(e) => updateRow(idx, { status: e.target.value })}
                        list={statusDatalistId}
                        placeholder="e.g. Booked / Departed / Arrived / Delivered"
                        className={inputClass}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <FieldLabel>
                        <span className="sr-only">Location</span>
                      </FieldLabel>
                      <input
                        value={u.location}
                        onChange={(e) => updateRow(idx, { location: e.target.value })}
                        list={locationDatalistId}
                        placeholder="Port / Warehouse / City"
                        className={inputClass}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <FieldLabel>
                        <span className="sr-only">Note</span>
                      </FieldLabel>
                      <textarea
                        value={u.note}
                        onChange={(e) => updateRow(idx, { note: e.target.value })}
                        rows={2}
                        placeholder="Optional details…"
                        className={`${inputClass} resize-y`}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <button
                        type="button"
                        onClick={() => removeUpdate(idx)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/40 hover:text-red-600"
                        aria-label="Remove update"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

