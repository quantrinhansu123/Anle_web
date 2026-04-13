import React, { useState } from 'react';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { DateInput } from '../../components/ui/DateInput';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { useToastContext } from '../../contexts/ToastContext';
import { apiFetch } from '../../lib/api';
import type { JobBound } from './types';
import {
  emptyCustomsAttachmentRow,
  emptyCustomsContainerRow,
  emptyCustomsScheduleRow,
  type CustomsTabState,
} from './jobCustomsTabTypes';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
      {children}
    </label>
  );
}

function textInputClass() {
  return 'w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium';
}

const cell = 'box-border h-8 min-w-0 rounded border border-border px-1.5 text-[11px]';

function CuCardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex h-full min-w-0 flex-col overflow-visible rounded-2xl border border-border bg-white shadow-sm">
      <div className="shrink-0 border-b border-border bg-slate-50/80 px-4 py-3">
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">{title}</h2>
      </div>
      <div className="flex flex-col space-y-3 p-4">{children}</div>
    </section>
  );
}

export interface JobCustomsTabPanelProps {
  customs: CustomsTabState;
  setCustoms: React.Dispatch<React.SetStateAction<CustomsTabState>>;
  boundOptions: { value: string; label: string }[];
}

export const JobCustomsTabPanel: React.FC<JobCustomsTabPanelProps> = ({
  customs,
  setCustoms,
  boundOptions,
}) => {
  const { success, error: toastError } = useToastContext();
  const [uploadingAttachmentIdx, setUploadingAttachmentIdx] = useState<number | null>(null);

  const setField = <K extends keyof CustomsTabState>(key: K, value: CustomsTabState[K]) => {
    setCustoms((prev) => ({ ...prev, [key]: value }));
  };

  const handleAttachmentFile = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setUploadingAttachmentIdx(index);
      const formData = new FormData();
      formData.append('file', file);
      const data = await apiFetch<{ url: string }>('/upload', {
        method: 'POST',
        body: formData,
      });
      setCustoms((t) => ({
        ...t,
        attachments: t.attachments.map((r, j) =>
          j === index ? { ...r, file_name: file.name, file_url: data.url } : r,
        ),
      }));
      success('File uploaded');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toastError(msg);
    } finally {
      setUploadingAttachmentIdx(null);
    }
  };

  const scheduleHeaders = [
    { key: 'from' as const, label: 'From' },
    { key: 'etd' as const, label: 'ETD', date: true },
    { key: 'departure_time_to' as const, label: 'Departure Time to' },
    { key: 'eta' as const, label: 'ETA', date: true },
    { key: 'arrival_time' as const, label: 'Arrival Time' },
    { key: 'carrier' as const, label: 'Carrier' },
    { key: 'carrier_name' as const, label: 'Carrier Name' },
  ];

  return (
    <div className="w-full min-w-0 space-y-6 p-2 sm:p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0">
          <FieldLabel>Inner Job No.</FieldLabel>
          <input
            value={customs.inner_job_no}
            onChange={(e) => setField('inner_job_no', e.target.value)}
            className={textInputClass()}
          />
        </div>
        <div className="min-w-0">
          <FieldLabel>Area</FieldLabel>
          <input value={customs.area} onChange={(e) => setField('area', e.target.value)} className={textInputClass()} />
        </div>
        <div className="min-w-0">
          <FieldLabel>Bound</FieldLabel>
          <SearchableSelect
            options={boundOptions}
            value={customs.bound || undefined}
            onValueChange={(v) => setField('bound', (v as JobBound) || '')}
            placeholder="Select bound"
            searchPlaceholder="Search bound…"
            hideSearch
          />
        </div>
        <div className="min-w-0">
          <FieldLabel>Incoterms</FieldLabel>
          <input
            value={customs.incoterms}
            onChange={(e) => setField('incoterms', e.target.value)}
            className={textInputClass()}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4 xl:items-stretch">
        <div className="min-h-0 min-w-0 xl:col-span-2">
          <CuCardSection title="Party information">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel>Shipper</FieldLabel>
                <textarea
                  value={customs.shipper}
                  onChange={(e) => setField('shipper', e.target.value)}
                  rows={2}
                  className={`${textInputClass()} resize-y`}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Consignee</FieldLabel>
                <textarea
                  value={customs.consignee}
                  onChange={(e) => setField('consignee', e.target.value)}
                  rows={2}
                  className={`${textInputClass()} resize-y`}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Customer</FieldLabel>
                <textarea
                  value={customs.customer}
                  onChange={(e) => setField('customer', e.target.value)}
                  rows={2}
                  className={`${textInputClass()} resize-y`}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Co-loader</FieldLabel>
                <input
                  value={customs.co_loader}
                  onChange={(e) => setField('co_loader', e.target.value)}
                  className={textInputClass()}
                />
              </div>
              <div>
                <FieldLabel>PIC</FieldLabel>
                <input value={customs.pic} onChange={(e) => setField('pic', e.target.value)} className={textInputClass()} />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <input
                  value={customs.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  className={textInputClass()}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Email</FieldLabel>
                <input
                  type="email"
                  value={customs.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className={textInputClass()}
                />
              </div>
            </div>
          </CuCardSection>
        </div>

        <div className="min-h-0 min-w-0 xl:col-span-2">
          <CuCardSection title="Total Container Volume">
            <div className="mb-0 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setCustoms((t) => ({
                    ...t,
                    container_volumes: [...t.container_volumes, emptyCustomsContainerRow()],
                  }))
                }
                className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
              >
                <Plus size={14} />
                Add row
              </button>
            </div>
            <div className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-border">
              <table className="w-full text-left text-[11px]">
                <thead className="border-b border-border bg-slate-50">
                  <tr>
                    {(['Type', 'Size', 'Total Quantity'] as const).map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-2 py-2 font-bold uppercase text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                    <th className="w-10 px-1" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {customs.container_volumes.map((row, idx) => (
                    <tr key={idx} className="border-b border-border/60 last:border-0">
                      <td className="p-1 align-middle">
                        <input
                          value={row.type}
                          onChange={(e) =>
                            setCustoms((t) => ({
                              ...t,
                              container_volumes: t.container_volumes.map((r, j) =>
                                j === idx ? { ...r, type: e.target.value } : r,
                              ),
                            }))
                          }
                          className={`${cell} w-[100px]`}
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <input
                          value={row.size}
                          onChange={(e) =>
                            setCustoms((t) => ({
                              ...t,
                              container_volumes: t.container_volumes.map((r, j) =>
                                j === idx ? { ...r, size: e.target.value } : r,
                              ),
                            }))
                          }
                          className={`${cell} w-[80px]`}
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <input
                          value={row.total_quantity}
                          onChange={(e) =>
                            setCustoms((t) => ({
                              ...t,
                              container_volumes: t.container_volumes.map((r, j) =>
                                j === idx ? { ...r, total_quantity: e.target.value } : r,
                              ),
                            }))
                          }
                          className={`${cell} w-[100px]`}
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <button
                          type="button"
                          disabled={customs.container_volumes.length <= 1}
                          onClick={() =>
                            setCustoms((t) =>
                              t.container_volumes.length <= 1
                                ? t
                                : { ...t, container_volumes: t.container_volumes.filter((_, j) => j !== idx) },
                            )
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"
                          aria-label="Remove row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CuCardSection>
        </div>

        <div className="min-h-0 min-w-0 xl:col-span-2">
          <CuCardSection title="Cargo Information">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel>Commodity</FieldLabel>
                <input
                  value={customs.commodity}
                  onChange={(e) => setField('commodity', e.target.value)}
                  className={textInputClass()}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Commodity in Vietnamese</FieldLabel>
                <input
                  value={customs.commodity_vi}
                  onChange={(e) => setField('commodity_vi', e.target.value)}
                  className={textInputClass()}
                />
              </div>
              <div>
                <FieldLabel>Procedure Code</FieldLabel>
                <input
                  value={customs.procedure_code}
                  onChange={(e) => setField('procedure_code', e.target.value)}
                  className={textInputClass()}
                />
              </div>
              <div>
                <FieldLabel>HS code</FieldLabel>
                <input value={customs.hs_code} onChange={(e) => setField('hs_code', e.target.value)} className={textInputClass()} />
              </div>
              <div>
                <FieldLabel>CDs Quantity</FieldLabel>
                <input
                  value={customs.cds_quantity}
                  onChange={(e) => setField('cds_quantity', e.target.value)}
                  className={textInputClass()}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Custom Remark</FieldLabel>
                <textarea
                  value={customs.custom_remark}
                  onChange={(e) => setField('custom_remark', e.target.value)}
                  rows={3}
                  className={`${textInputClass()} resize-y`}
                />
              </div>
            </div>
          </CuCardSection>
        </div>

        <div className="min-h-0 min-w-0 xl:col-span-2">
          <CuCardSection title="Attachment">
            <div className="mb-0 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setCustoms((t) => ({
                    ...t,
                    attachments: [...t.attachments, emptyCustomsAttachmentRow()],
                  }))
                }
                className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
              >
                <Plus size={14} />
                Add row
              </button>
            </div>
            <div className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-border">
              <table className="w-full text-left text-[11px]">
                <thead className="border-b border-border bg-slate-50">
                  <tr>
                    {(['Attachments', 'File Name', 'Action'] as const).map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-2 py-2 font-bold uppercase text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customs.attachments.map((row, idx) => (
                    <tr key={idx} className="border-b border-border/60 last:border-0">
                      <td className="p-1 align-middle">
                        <input
                          value={row.label}
                          onChange={(e) =>
                            setCustoms((t) => ({
                              ...t,
                              attachments: t.attachments.map((r, j) =>
                                j === idx ? { ...r, label: e.target.value } : r,
                              ),
                            }))
                          }
                          className={`${cell} w-[180px]`}
                          placeholder="Description"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <span
                          className="block max-w-[220px] truncate px-1 text-[11px] text-muted-foreground"
                          title={row.file_name}
                        >
                          {row.file_name || '—'}
                        </span>
                      </td>
                      <td className="p-1 align-middle">
                        <div className="flex flex-wrap items-center gap-1">
                          <input
                            id={`customs-att-file-${idx}`}
                            type="file"
                            className="sr-only"
                            onChange={(e) => void handleAttachmentFile(idx, e)}
                          />
                          <label
                            htmlFor={`customs-att-file-${idx}`}
                            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded border border-border px-2 text-[11px] font-semibold hover:bg-muted/30"
                          >
                            {uploadingAttachmentIdx === idx ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Upload size={14} />
                            )}
                            Choose file
                          </label>
                          <button
                            type="button"
                            disabled={customs.attachments.length <= 1}
                            onClick={() =>
                              setCustoms((t) =>
                                t.attachments.length <= 1
                                  ? t
                                  : { ...t, attachments: t.attachments.filter((_, j) => j !== idx) },
                              )
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"
                            aria-label="Remove row"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CuCardSection>
        </div>

        <div className="min-h-0 min-w-0 xl:col-span-4">
          <CuCardSection title="Schedule">
            <div className="mb-0 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setCustoms((t) => ({
                    ...t,
                    schedule_rows: [...t.schedule_rows, emptyCustomsScheduleRow()],
                  }))
                }
                className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
              >
                <Plus size={14} />
                Add row
              </button>
            </div>
            <div className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-border">
              <table className="w-full text-left text-[11px]">
                <thead className="border-b border-border bg-slate-50">
                  <tr>
                    {scheduleHeaders.map(({ label }) => (
                      <th
                        key={label}
                        className="whitespace-nowrap px-2 py-2 font-bold uppercase text-muted-foreground"
                      >
                        {label}
                      </th>
                    ))}
                    <th className="w-10 px-1" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {customs.schedule_rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-border/60 last:border-0">
                      {scheduleHeaders.map(({ key, date }) => (
                        <td key={key} className="p-1 align-middle">
                          {date ? (
                            <DateInput
                              dense
                              value={row[key] as string}
                              onChange={(v) =>
                                setCustoms((t) => ({
                                  ...t,
                                  schedule_rows: t.schedule_rows.map((r, j) =>
                                    j === idx ? { ...r, [key]: v } : r,
                                  ),
                                }))
                              }
                              className="min-w-[108px]"
                            />
                          ) : (
                            <input
                              value={row[key]}
                              onChange={(e) =>
                                setCustoms((t) => ({
                                  ...t,
                                  schedule_rows: t.schedule_rows.map((r, j) =>
                                    j === idx ? { ...r, [key]: e.target.value } : r,
                                  ),
                                }))
                              }
                              className={`${cell} min-w-[88px]`}
                            />
                          )}
                        </td>
                      ))}
                      <td className="p-1 align-middle">
                        <button
                          type="button"
                          disabled={customs.schedule_rows.length <= 1}
                          onClick={() =>
                            setCustoms((t) =>
                              t.schedule_rows.length <= 1
                                ? t
                                : { ...t, schedule_rows: t.schedule_rows.filter((_, j) => j !== idx) },
                            )
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"
                          aria-label="Remove row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CuCardSection>
        </div>
      </div>
    </div>
  );
};
