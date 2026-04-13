import React, { useState } from 'react';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { DateInput } from '../../components/ui/DateInput';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { useToastContext } from '../../contexts/ToastContext';
import { apiFetch } from '../../lib/api';
import {
  emptySeaAttachmentRow,
  emptySeaBookingRow,
  emptySeaCargoRow,
  emptySeaContainerVolumeRow,
  type JobSeaTabFields,
  type SeaTabTablesState,
} from './jobSeaTabTypes';

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

/** Same shell as JobEditorPage `Section` with fillHeight=false (div wrapper + bordered card). */
function SeaCardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex w-full min-w-0 flex-col overflow-visible rounded-2xl border border-border bg-white shadow-sm">
      <div className="shrink-0 border-b border-border bg-slate-50/80 px-4 py-3">
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">{title}</h2>
      </div>
      <div className="flex flex-col space-y-3 p-4">{children}</div>
    </section>
  );
}

export interface JobSeaTabPanelProps {
  sea: JobSeaTabFields;
  setSea: React.Dispatch<React.SetStateAction<JobSeaTabFields>>;
  seaTables: SeaTabTablesState;
  setSeaTables: React.Dispatch<React.SetStateAction<SeaTabTablesState>>;
  productPicId: string;
  onProductPicChange: (id: string) => void;
  employeeOptions: { value: string; label: string }[];
}

export const JobSeaTabPanel: React.FC<JobSeaTabPanelProps> = ({
  sea,
  setSea,
  seaTables,
  setSeaTables,
  productPicId,
  onProductPicChange,
  employeeOptions,
}) => {
  const { success, error: toastError, info } = useToastContext();
  const [uploadingAttachmentIdx, setUploadingAttachmentIdx] = useState<number | null>(null);

  const set = <K extends keyof JobSeaTabFields>(key: K, value: string) => {
    setSea((prev) => ({ ...prev, [key]: value }));
  };

  const onSchedulesClick = () => {
    info('Schedules — under development');
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
      setSeaTables((t) => ({
        ...t,
        sea_attachments: t.sea_attachments.map((r, j) =>
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

  /* Content only: outer white rounded card is JobEditorPage tab shell (same as Header tab). */
  return (
    <div className="w-full min-w-0 space-y-6 p-2 sm:p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <FieldLabel>Freight Term</FieldLabel>
            <input value={sea.freight_term} onChange={(e) => set('freight_term', e.target.value)} className={textInputClass()} />
          </div>
          <div>
            <FieldLabel>Load Type</FieldLabel>
            <input value={sea.load_type} onChange={(e) => set('load_type', e.target.value)} className={textInputClass()} />
          </div>
          <div>
            <FieldLabel>Service Terms</FieldLabel>
            <input value={sea.service_terms} onChange={(e) => set('service_terms', e.target.value)} className={textInputClass()} />
          </div>
          <div>
            <FieldLabel>Incoterm</FieldLabel>
            <input value={sea.incoterm} onChange={(e) => set('incoterm', e.target.value)} className={textInputClass()} />
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-4">
          <div className="min-h-0 min-w-0 xl:col-span-2">
            <SeaCardSection title="Party Information">
              <div className="space-y-3">
                <div>
                  <FieldLabel>Shipper</FieldLabel>
                  <textarea
                    value={sea.shipper}
                    onChange={(e) => set('shipper', e.target.value)}
                    rows={2}
                    className={`${textInputClass()} resize-y`}
                  />
                </div>
                <div>
                  <FieldLabel>Consignee</FieldLabel>
                  <textarea
                    value={sea.consignee}
                    onChange={(e) => set('consignee', e.target.value)}
                    rows={2}
                    className={`${textInputClass()} resize-y`}
                  />
                </div>
                <div>
                  <FieldLabel>Delivery Agent</FieldLabel>
                  <textarea
                    value={sea.delivery_agent}
                    onChange={(e) => set('delivery_agent', e.target.value)}
                    rows={2}
                    className={`${textInputClass()} resize-y`}
                  />
                </div>
                <div>
                  <FieldLabel>Vendor</FieldLabel>
                  <textarea value={sea.vendor} onChange={(e) => set('vendor', e.target.value)} rows={2} className={`${textInputClass()} resize-y`} />
                </div>
                <div>
                  <FieldLabel>Co-loader</FieldLabel>
                  <textarea
                    value={sea.co_loader}
                    onChange={(e) => set('co_loader', e.target.value)}
                    rows={2}
                    className={`${textInputClass()} resize-y`}
                  />
                </div>
              </div>
            </SeaCardSection>
          </div>

          <div className="min-h-0 min-w-0 xl:col-span-2">
            <SeaCardSection title="Internal Information">
              <div className="space-y-3">
                <div>
                  <FieldLabel>Product PIC</FieldLabel>
                  <SearchableSelect
                    options={employeeOptions}
                    value={productPicId || undefined}
                    onValueChange={onProductPicChange}
                    placeholder="Select"
                  />
                </div>
                <div>
                  <FieldLabel>Remark</FieldLabel>
                  <textarea
                    value={sea.sea_internal_remark}
                    onChange={(e) => set('sea_internal_remark', e.target.value)}
                    rows={4}
                    className={`${textInputClass()} resize-y`}
                  />
                </div>
              </div>
            </SeaCardSection>
          </div>
        </div>

        <div className="min-w-0 w-full">
          <SeaCardSection title="Shipping Information">
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-3">
                <div>
                  <FieldLabel>Carrier</FieldLabel>
                  <input value={sea.sea_carrier} onChange={(e) => set('sea_carrier', e.target.value)} className={textInputClass()} />
                </div>
                <div>
                  <FieldLabel>First Vessel</FieldLabel>
                  <input value={sea.first_vessel} onChange={(e) => set('first_vessel', e.target.value)} className={textInputClass()} />
                </div>
                <div>
                  <FieldLabel>M.VVD</FieldLabel>
                  <input value={sea.mvvd} onChange={(e) => set('mvvd', e.target.value)} className={textInputClass()} />
                </div>
                <div>
                  <FieldLabel>POR</FieldLabel>
                  <input value={sea.por} onChange={(e) => set('por', e.target.value)} className={textInputClass()} />
                </div>
                <div>
                  <FieldLabel>POL</FieldLabel>
                  <input value={sea.pol} onChange={(e) => set('pol', e.target.value)} className={textInputClass()} />
                </div>
                <div>
                  <FieldLabel>T/S</FieldLabel>
                  <input value={sea.ts} onChange={(e) => set('ts', e.target.value)} className={textInputClass()} />
                </div>
                <div>
                  <FieldLabel>POD</FieldLabel>
                  <input value={sea.pod} onChange={(e) => set('pod', e.target.value)} className={textInputClass()} />
                </div>
                <div>
                  <FieldLabel>PVT</FieldLabel>
                  <input value={sea.pvt} onChange={(e) => set('pvt', e.target.value)} className={textInputClass()} />
                </div>
                <div>
                  <FieldLabel>Warehouse</FieldLabel>
                  <input value={sea.warehouse} onChange={(e) => set('warehouse', e.target.value)} className={textInputClass()} />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <FieldLabel>Liner Booking No.</FieldLabel>
                  <input
                    value={sea.liner_booking_no}
                    onChange={(e) => set('liner_booking_no', e.target.value)}
                    className={textInputClass()}
                  />
                </div>
                <div>
                  <FieldLabel>Voy</FieldLabel>
                  <input value={sea.voy_1} onChange={(e) => set('voy_1', e.target.value)} className={textInputClass()} />
                </div>
                <div>
                  <FieldLabel>Voy 2</FieldLabel>
                  <input value={sea.voy_2} onChange={(e) => set('voy_2', e.target.value)} className={textInputClass()} />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <FieldLabel>ETD</FieldLabel>
                  <DateInput value={sea.etd} onChange={(v) => set('etd', v)} className="w-full" />
                </div>
                <div>
                  <FieldLabel>ETA</FieldLabel>
                  <DateInput value={sea.eta} onChange={(v) => set('eta', v)} className="w-full" />
                </div>
                <div>
                  <FieldLabel>S/I Close at</FieldLabel>
                  <DateInput value={sea.si_close_at} onChange={(v) => set('si_close_at', v)} className="w-full" />
                </div>
                <div>
                  <FieldLabel>Cargo close at</FieldLabel>
                  <DateInput value={sea.cargo_close_at} onChange={(v) => set('cargo_close_at', v)} className="w-full" />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <FieldLabel>ATD</FieldLabel>
                  <DateInput value={sea.atd} onChange={(v) => set('atd', v)} className="w-full" />
                </div>
                <div>
                  <FieldLabel>ATA</FieldLabel>
                  <DateInput value={sea.ata} onChange={(v) => set('ata', v)} className="w-full" />
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={onSchedulesClick}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-primary bg-white px-4 text-[12px] font-bold text-primary shadow-sm transition-colors hover:bg-primary/5"
              >
                Schedules
              </button>
            </div>
          </SeaCardSection>
        </div>

        {/* Booking Confirmation */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-primary">Booking Confirmation</h3>
            <button
              type="button"
              onClick={() =>
                setSeaTables((t) => ({
                  ...t,
                  booking_confirmations: [...t.booking_confirmations, emptySeaBookingRow()],
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
                  {['Booking', 'Type', 'Shipper', 'Consignee', 'Package', 'Num', 'Gross', 'Measure', ''].map((h) => (
                    <th key={h} className="whitespace-nowrap px-2 py-2 font-bold uppercase text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seaTables.booking_confirmations.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/60 last:border-0">
                    {(
                      [
                        ['booking', row.booking],
                        ['type', row.type],
                        ['shipper', row.shipper],
                        ['consignee', row.consignee],
                        ['package', row.package],
                        ['num', row.num],
                        ['gross', row.gross],
                        ['measure', row.measure],
                      ] as const
                    ).map(([k, val]) => (
                      <td key={k} className="p-1 align-middle">
                        <input
                          value={val}
                          onChange={(e) =>
                            setSeaTables((t) => ({
                              ...t,
                              booking_confirmations: t.booking_confirmations.map((r, j) =>
                                j === idx ? { ...r, [k]: e.target.value } : r,
                              ),
                            }))
                          }
                          className={`${cell} w-[100px]`}
                        />
                      </td>
                    ))}
                    <td className="p-1 align-middle">
                      <button
                        type="button"
                        disabled={seaTables.booking_confirmations.length <= 1}
                        onClick={() =>
                          setSeaTables((t) =>
                            t.booking_confirmations.length <= 1
                              ? t
                              : { ...t, booking_confirmations: t.booking_confirmations.filter((_, j) => j !== idx) },
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
        </div>

        {/* Attachments */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-primary">Attachment</h3>
            <button
              type="button"
              onClick={() =>
                setSeaTables((t) => ({
                  ...t,
                  sea_attachments: [...t.sea_attachments, emptySeaAttachmentRow()],
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
                  {['Attachments', 'File Name', 'Action'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-2 py-2 font-bold uppercase text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seaTables.sea_attachments.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/60 last:border-0">
                    <td className="p-1 align-middle">
                      <input
                        value={row.label}
                        onChange={(e) =>
                          setSeaTables((t) => ({
                            ...t,
                            sea_attachments: t.sea_attachments.map((r, j) =>
                              j === idx ? { ...r, label: e.target.value } : r,
                            ),
                          }))
                        }
                        className={`${cell} w-[180px]`}
                        placeholder="Description"
                      />
                    </td>
                    <td className="p-1 align-middle">
                      <span className="block max-w-[220px] truncate px-1 text-[11px] text-muted-foreground" title={row.file_name}>
                        {row.file_name || '—'}
                      </span>
                    </td>
                    <td className="p-1 align-middle">
                      <div className="flex flex-wrap items-center gap-1">
                        <input
                          id={`sea-att-file-${idx}`}
                          type="file"
                          className="sr-only"
                          onChange={(e) => void handleAttachmentFile(idx, e)}
                        />
                        <label
                          htmlFor={`sea-att-file-${idx}`}
                          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded border border-border px-2 text-[11px] font-semibold hover:bg-muted/30"
                        >
                          {uploadingAttachmentIdx === idx ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          Choose file
                        </label>
                        <button
                          type="button"
                          disabled={seaTables.sea_attachments.length <= 1}
                          onClick={() =>
                            setSeaTables((t) =>
                              t.sea_attachments.length <= 1
                                ? t
                                : { ...t, sea_attachments: t.sea_attachments.filter((_, j) => j !== idx) },
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
        </div>

        {/* Total Container volume */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-primary">Total Container volume</h3>
            <button
              type="button"
              onClick={() =>
                setSeaTables((t) => ({
                  ...t,
                  container_volumes: [...t.container_volumes, emptySeaContainerVolumeRow()],
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
                  {['Type', 'Size', 'Total Quantity', ''].map((h) => (
                    <th key={h} className="whitespace-nowrap px-2 py-2 font-bold uppercase text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seaTables.container_volumes.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/60 last:border-0">
                    <td className="p-1 align-middle">
                      <input
                        value={row.type}
                        onChange={(e) =>
                          setSeaTables((t) => ({
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
                          setSeaTables((t) => ({
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
                          setSeaTables((t) => ({
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
                        disabled={seaTables.container_volumes.length <= 1}
                        onClick={() =>
                          setSeaTables((t) =>
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
        </div>

        {/* Cargo Information */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-primary">Cargo Information</h3>
            <button
              type="button"
              onClick={() =>
                setSeaTables((t) => ({
                  ...t,
                  cargo_information: [...t.cargo_information, emptySeaCargoRow()],
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
                  {[
                    'Type of Commodities',
                    'Commodity',
                    'Size',
                    'Type',
                    'Quantity',
                    'SOC',
                    'Pkg Qty',
                    'Pkg Type',
                    'Total',
                    '',
                  ].map((h) => (
                    <th key={h} className="whitespace-nowrap px-2 py-2 font-bold uppercase text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seaTables.cargo_information.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/60 last:border-0">
                    <td className="p-1 align-middle">
                      <input
                        value={row.type_of_commodities}
                        onChange={(e) =>
                          setSeaTables((t) => ({
                            ...t,
                            cargo_information: t.cargo_information.map((r, j) =>
                              j === idx ? { ...r, type_of_commodities: e.target.value } : r,
                            ),
                          }))
                        }
                        className={`${cell} w-[120px]`}
                      />
                    </td>
                    <td className="p-1 align-middle">
                      <input
                        value={row.commodity}
                        onChange={(e) =>
                          setSeaTables((t) => ({
                            ...t,
                            cargo_information: t.cargo_information.map((r, j) =>
                              j === idx ? { ...r, commodity: e.target.value } : r,
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
                          setSeaTables((t) => ({
                            ...t,
                            cargo_information: t.cargo_information.map((r, j) =>
                              j === idx ? { ...r, size: e.target.value } : r,
                            ),
                          }))
                        }
                        className={`${cell} w-[72px]`}
                      />
                    </td>
                    <td className="p-1 align-middle">
                      <input
                        value={row.type}
                        onChange={(e) =>
                          setSeaTables((t) => ({
                            ...t,
                            cargo_information: t.cargo_information.map((r, j) =>
                              j === idx ? { ...r, type: e.target.value } : r,
                            ),
                          }))
                        }
                        className={`${cell} w-[72px]`}
                      />
                    </td>
                    <td className="p-1 align-middle">
                      <input
                        value={row.quantity}
                        onChange={(e) =>
                          setSeaTables((t) => ({
                            ...t,
                            cargo_information: t.cargo_information.map((r, j) =>
                              j === idx ? { ...r, quantity: e.target.value } : r,
                            ),
                          }))
                        }
                        className={`${cell} w-[72px]`}
                      />
                    </td>
                    <td className="p-1 align-middle">
                      <input
                        value={row.soc}
                        onChange={(e) =>
                          setSeaTables((t) => ({
                            ...t,
                            cargo_information: t.cargo_information.map((r, j) =>
                              j === idx ? { ...r, soc: e.target.value } : r,
                            ),
                          }))
                        }
                        className={`${cell} w-[56px]`}
                      />
                    </td>
                    <td className="p-1 align-middle">
                      <input
                        value={row.package_qty}
                        onChange={(e) =>
                          setSeaTables((t) => ({
                            ...t,
                            cargo_information: t.cargo_information.map((r, j) =>
                              j === idx ? { ...r, package_qty: e.target.value } : r,
                            ),
                          }))
                        }
                        className={`${cell} w-[72px]`}
                      />
                    </td>
                    <td className="p-1 align-middle">
                      <input
                        value={row.package_type}
                        onChange={(e) =>
                          setSeaTables((t) => ({
                            ...t,
                            cargo_information: t.cargo_information.map((r, j) =>
                              j === idx ? { ...r, package_type: e.target.value } : r,
                            ),
                          }))
                        }
                        className={`${cell} w-[80px]`}
                      />
                    </td>
                    <td className="p-1 align-middle">
                      <input
                        value={row.total}
                        onChange={(e) =>
                          setSeaTables((t) => ({
                            ...t,
                            cargo_information: t.cargo_information.map((r, j) =>
                              j === idx ? { ...r, total: e.target.value } : r,
                            ),
                          }))
                        }
                        className={`${cell} w-[80px]`}
                      />
                    </td>
                    <td className="p-1 align-middle">
                      <button
                        type="button"
                        disabled={seaTables.cargo_information.length <= 1}
                        onClick={() =>
                          setSeaTables((t) =>
                            t.cargo_information.length <= 1
                              ? t
                              : { ...t, cargo_information: t.cargo_information.filter((_, j) => j !== idx) },
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
        </div>
    </div>
  );
};
