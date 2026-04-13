import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DateInput } from '../../components/ui/DateInput';
import { useToastContext } from '../../contexts/ToastContext';
import {
  emptyTruckingBillingLineRow,
  emptyTruckingQuotationRow,
  emptyTruckingTruckRow,
  type TruckingTabState,
} from './jobTruckingTabTypes';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
      {children}
    </label>
  );
}

const cell = 'box-border h-8 min-w-0 rounded border border-border px-1.5 text-[11px]';

function TrCardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex w-full min-w-0 flex-col overflow-visible rounded-2xl border border-border bg-white shadow-sm">
      <div className="shrink-0 border-b border-border bg-slate-50/80 px-4 py-3">
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">{title}</h2>
      </div>
      <div className="flex flex-col space-y-3 p-4">{children}</div>
    </section>
  );
}

export interface JobTruckingTabPanelProps {
  trucking: TruckingTabState;
  setTrucking: React.Dispatch<React.SetStateAction<TruckingTabState>>;
}

export const JobTruckingTabPanel: React.FC<JobTruckingTabPanelProps> = ({ trucking, setTrucking }) => {
  const { info } = useToastContext();

  const truckHeaders = [
    { key: 'house_bl', label: 'House B/L' },
    { key: 'pol', label: 'POL' },
    { key: 'pod', label: 'POD' },
    { key: 'plate_number', label: 'Plate Number' },
    { key: 'customs_declaration', label: 'Customs' },
    { key: 'salesman', label: 'Salesman' },
    { key: 'load_type', label: 'Load Type' },
    { key: 'service_terms', label: 'Service terms' },
    { key: 'bound', label: 'Bound' },
    { key: 'incoterm', label: 'Incoterm' },
    { key: 'transport_mode', label: 'Transport' },
    { key: 'area', label: 'Area' },
    { key: 'partner', label: 'Partner' },
  ] as const;

  const billingHeaders = [
    { key: 'customer', label: 'Customer' },
    { key: 'service', label: 'Service' },
    { key: 'truck', label: 'Truck' },
    { key: 'fare', label: 'Fare' },
    { key: 'fare_name', label: 'Fare Name' },
    { key: 'tax', label: 'Tax' },
    { key: 'fare_type', label: 'Fare Type' },
    { key: 'currency', label: 'Currency' },
    { key: 'exchange_rate', label: 'Exch. rate' },
    { key: 'unit', label: 'Unit' },
    { key: 'qty', label: 'Qty' },
    { key: 'rate', label: 'Rate' },
  ] as const;

  return (
    <div className="w-full min-w-0 space-y-6 p-2 sm:p-3">
      <div className="min-w-0 w-full">
        <TrCardSection title="Truck">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() =>
                setTrucking((t) => ({
                  ...t,
                  trucks: [...t.trucks, emptyTruckingTruckRow()],
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
                  {truckHeaders.map(({ label }) => (
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
                {trucking.trucks.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/60 last:border-0">
                    {truckHeaders.map(({ key }) => (
                      <td key={key} className="p-1 align-middle">
                        <input
                          value={row[key]}
                          onChange={(e) =>
                            setTrucking((t) => ({
                              ...t,
                              trucks: t.trucks.map((r, j) =>
                                j === idx ? { ...r, [key]: e.target.value } : r,
                              ),
                            }))
                          }
                          className={`${cell} w-[88px]`}
                        />
                      </td>
                    ))}
                    <td className="p-1 align-middle">
                      <button
                        type="button"
                        disabled={trucking.trucks.length <= 1}
                        onClick={() =>
                          setTrucking((t) =>
                            t.trucks.length <= 1
                              ? t
                              : { ...t, trucks: t.trucks.filter((_, j) => j !== idx) },
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
        </TrCardSection>
      </div>

      <div className="min-w-0 w-full">
        <TrCardSection title="Truck Summary">
          <div>
            <button
              type="button"
              onClick={() => info('Truck Summary — under development')}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-primary bg-white px-4 text-[12px] font-bold text-primary shadow-sm transition-colors hover:bg-primary/5"
            >
              Truck Summary
            </button>
          </div>
        </TrCardSection>
      </div>

      <div className="min-w-0 w-full">
        <TrCardSection title="Billing">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
            <div className="flex min-w-0 flex-col gap-4">
              <div className="mb-0 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Quotation
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setTrucking((t) => ({
                      ...t,
                      quotations: [...t.quotations, emptyTruckingQuotationRow()],
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
                      {(['Quotation', 'Customer', 'Status'] as const).map((h) => (
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
                    {trucking.quotations.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/60 last:border-0">
                        <td className="p-1 align-middle">
                          <input
                            value={row.quotation}
                            onChange={(e) =>
                              setTrucking((t) => ({
                                ...t,
                                quotations: t.quotations.map((r, j) =>
                                  j === idx ? { ...r, quotation: e.target.value } : r,
                                ),
                              }))
                            }
                            className={`${cell} w-[120px]`}
                          />
                        </td>
                        <td className="p-1 align-middle">
                          <input
                            value={row.customer}
                            onChange={(e) =>
                              setTrucking((t) => ({
                                ...t,
                                quotations: t.quotations.map((r, j) =>
                                  j === idx ? { ...r, customer: e.target.value } : r,
                                ),
                              }))
                            }
                            className={`${cell} w-[140px]`}
                          />
                        </td>
                        <td className="p-1 align-middle">
                          <input
                            value={row.status}
                            onChange={(e) =>
                              setTrucking((t) => ({
                                ...t,
                                quotations: t.quotations.map((r, j) =>
                                  j === idx ? { ...r, status: e.target.value } : r,
                                ),
                              }))
                            }
                            className={`${cell} w-[100px]`}
                          />
                        </td>
                        <td className="p-1 align-middle">
                          <button
                            type="button"
                            disabled={trucking.quotations.length <= 1}
                            onClick={() =>
                              setTrucking((t) =>
                                t.quotations.length <= 1
                                  ? t
                                  : { ...t, quotations: t.quotations.filter((_, j) => j !== idx) },
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

            <div className="min-w-0 flex flex-col gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Exchange rate
              </p>
              <div className="rounded-xl border border-border bg-slate-50/50 p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Date</FieldLabel>
                    <DateInput
                      value={trucking.exchange_date}
                      onChange={(v) => setTrucking((t) => ({ ...t, exchange_date: v }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <FieldLabel>Rate</FieldLabel>
                    <input
                      value={trucking.exchange_rate}
                      onChange={(e) => setTrucking((t) => ({ ...t, exchange_rate: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TrCardSection>
      </div>

      <div className="min-w-0 w-full">
        <TrCardSection title="Selling">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() =>
                setTrucking((t) => ({
                  ...t,
                  billing_lines: [...t.billing_lines, emptyTruckingBillingLineRow()],
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
                  {billingHeaders.map(({ label }) => (
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
                {trucking.billing_lines.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/60 last:border-0">
                    {billingHeaders.map(({ key }) => (
                      <td key={key} className="p-1 align-middle">
                        <input
                          value={row[key]}
                          onChange={(e) =>
                            setTrucking((t) => ({
                              ...t,
                              billing_lines: t.billing_lines.map((r, j) =>
                                j === idx ? { ...r, [key]: e.target.value } : r,
                              ),
                            }))
                          }
                          className={`${cell} w-[72px]`}
                        />
                      </td>
                    ))}
                    <td className="p-1 align-middle">
                      <button
                        type="button"
                        disabled={trucking.billing_lines.length <= 1}
                        onClick={() =>
                          setTrucking((t) =>
                            t.billing_lines.length <= 1
                              ? t
                              : { ...t, billing_lines: t.billing_lines.filter((_, j) => j !== idx) },
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
        </TrCardSection>
      </div>
    </div>
  );
};
