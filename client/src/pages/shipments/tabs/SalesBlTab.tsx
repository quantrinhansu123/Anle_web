import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, Ship, Loader2, Save } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DateInput } from '../../../components/ui/DateInput';
import { useToastContext } from '../../../contexts/ToastContext';
import { employeeService, type Employee } from '../../../services/employeeService';
import { salesService } from '../../../services/salesService';
import { shipmentService } from '../../../services/shipmentService';
import type { ShipmentFormState, ShipmentBlLine } from '../types';
import type { Sales } from '../../sales/types';

/** Operators must be choosable only from Logistics department (see departments.code = logistics). */
function isLogisticsEmployee(e: Employee): boolean {
  const code = (e.department_code || '').toLowerCase();
  if (code === 'logistics') return true;
  const rel = e.departments;
  if (rel && typeof rel === 'object') {
    const name = 'name' in rel && typeof rel.name === 'string' ? rel.name : '';
    const nameVi = 'name_vi' in rel && typeof rel.name_vi === 'string' ? rel.name_vi : '';
    if (/logistics/i.test(name) || /logistic/i.test(nameVi)) return true;
  }
  if (e.department && /logistic/i.test(e.department)) return true;
  return false;
}

function Section({
  title,
  children,
  fillHeight = true,
}: {
  title: string;
  children: React.ReactNode;
  fillHeight?: boolean;
}) {
  return (
    <section
      className={
        fillHeight
          ? 'flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm'
          : 'flex w-full flex-col overflow-visible rounded-2xl border border-border bg-white shadow-sm'
      }
    >
      <div className="shrink-0 border-b border-border bg-slate-50/80 px-4 py-3">
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">{title}</h2>
      </div>
      <div
        className={
          fillHeight
            ? 'flex min-h-min flex-1 flex-col space-y-3 p-4'
            : 'flex flex-col space-y-3 p-4'
        }
      >
        {children}
      </div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight block mb-1">{children}</label>;
}

const emptyBlLine = (order: number): ShipmentBlLine => ({
  sort_order: order,
  name_1: '',
  sea_customer: '',
  air_customer: '',
  name_2: '',
  package_text: '',
  unit_text: '',
  sea_etd: '',
  sea_eta: '',
  air_etd: '',
  air_eta: '',
  loading_date: '',
  delivery_date: '',
});

interface SalesBlTabProps {
  form: ShipmentFormState;
  setField: <K extends keyof ShipmentFormState>(key: K, value: ShipmentFormState[K]) => void;
  shipmentId?: string;
}

const SalesBlTab: React.FC<SalesBlTabProps> = ({ form, setField, shipmentId }) => {
  const navigate = useNavigate();
  const { success: toastOk, error: toastErr } = useToastContext();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [quotations, setQuotations] = useState<Sales[]>([]);
  const [blLines, setBlLines] = useState<ShipmentBlLine[]>([]);
  const [loadingLines, setLoadingLines] = useState(false);
  const [savingLines, setSavingLines] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [emp, sales] = await Promise.all([
          employeeService.getEmployees(),
          salesService.getSalesItems(1, 150),
        ]);
        setEmployees(emp || []);
        setQuotations(Array.isArray(sales) ? sales : []);
      } catch (e) {
        console.error(e);
        toastErr('Could not load lookup data');
      }
    })();
  }, [toastErr]);

  useEffect(() => {
    if (!shipmentId) {
      setBlLines([emptyBlLine(0)]);
      return;
    }
    void (async () => {
      try {
        setLoadingLines(true);
        const lines = await shipmentService.getBlLines(shipmentId);
        if (lines && lines.length > 0) {
          setBlLines(lines.map((l, i) => ({
            ...l,
            sort_order: l.sort_order ?? i,
            name_1: l.name_1 ?? '',
            sea_customer: l.sea_customer ?? '',
            air_customer: l.air_customer ?? '',
            name_2: l.name_2 ?? '',
            package_text: l.package_text ?? '',
            unit_text: l.unit_text ?? '',
            sea_etd: l.sea_etd ? String(l.sea_etd).slice(0, 10) : '',
            sea_eta: l.sea_eta ? String(l.sea_eta).slice(0, 10) : '',
            air_etd: l.air_etd ? String(l.air_etd).slice(0, 10) : '',
            air_eta: l.air_eta ? String(l.air_eta).slice(0, 10) : '',
            loading_date: l.loading_date ? String(l.loading_date).slice(0, 10) : '',
            delivery_date: l.delivery_date ? String(l.delivery_date).slice(0, 10) : '',
          })));
        } else {
          setBlLines([emptyBlLine(0)]);
        }
      } catch (e) {
        console.error(e);
        toastErr('Failed to load B/L lines');
      } finally {
        setLoadingLines(false);
      }
    })();
  }, [shipmentId, toastErr]);

  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: e.full_name })),
    [employees],
  );

  const logisticsEmployees = useMemo(
    () => employees.filter(isLogisticsEmployee),
    [employees],
  );

  const logisticsOperatorOptions = useMemo(
    () => logisticsEmployees.map((e) => ({ value: e.id, label: e.full_name })),
    [logisticsEmployees],
  );

  const operatorsSelectValue = useMemo(() => {
    const op = (form.operators || '').trim();
    if (!op) return undefined;
    const match = logisticsEmployees.find((e) => e.full_name === op);
    return match?.id;
  }, [form.operators, logisticsEmployees]);

  const operatorsLegacyHint = useMemo(() => {
    const op = (form.operators || '').trim();
    if (!op) return null;
    if (logisticsEmployees.some((e) => e.full_name === op)) return null;
    return op;
  }, [form.operators, logisticsEmployees]);

  const quotationOptions = useMemo(
    () =>
      quotations.map((q) => ({
        value: q.id,
        label: q.no_doc || `Q-${q.id.slice(0, 8)}`,
      })),
    [quotations],
  );

  const updateBlLine = (index: number, patch: Partial<ShipmentBlLine>) => {
    setBlLines((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addBlLine = () => setBlLines((rows) => [...rows, emptyBlLine(rows.length)]);
  const removeBlLine = (index: number) =>
    setBlLines((rows) => (rows.length <= 1 ? rows : rows.filter((_, i) => i !== index)));

  const handleSaveBlLines = async () => {
    if (!shipmentId) {
      toastErr('Please save the shipment first');
      return;
    }
    setSavingLines(true);
    try {
      const payload = blLines.map((l, i) => ({
        sort_order: i,
        name_1: l.name_1 || null,
        sea_customer: l.sea_customer || null,
        air_customer: l.air_customer || null,
        name_2: l.name_2 || null,
        package_text: l.package_text || null,
        unit_text: l.unit_text || null,
        sea_etd: l.sea_etd || null,
        sea_eta: l.sea_eta || null,
        air_etd: l.air_etd || null,
        air_eta: l.air_eta || null,
        loading_date: l.loading_date || null,
        delivery_date: l.delivery_date || null,
      }));
      await shipmentService.replaceBlLines(shipmentId, payload);
      toastOk('B/L lines saved successfully');
    } catch (e) {
      console.error(e);
      toastErr('Failed to save B/L lines');
    } finally {
      setSavingLines(false);
    }
  };

  const handleQuotationChange = async (id: string) => {
    setField('quotation_id', id);
    if (!id) return;
    try {
      const sale = await salesService.getSalesItemById(id);
      if (sale.sales_person_id) setField('salesperson_id', sale.sales_person_id);
      if (sale.sales_person?.team || sale.business_team) setField('sales_team', sale.sales_person?.team || sale.business_team || '');
      if (sale.business_department) setField('sales_department', sale.business_department);
    } catch {
      toastErr('Could not load quotation details');
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 lg:gap-5">
      <div className="min-w-0 w-full">
        <Section fillHeight={false} title="Sales information">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start md:gap-6">
            <div className="flex min-w-0 flex-col gap-3">
              <div>
                <FieldLabel>
                  <div className="flex items-center justify-between">
                    <span>Quotation</span>
                    {form.quotation_id && (
                      <a
                        href={`/financials/sales/${form.quotation_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-primary hover:underline"
                      >
                        View Quotation
                      </a>
                    )}
                  </div>
                </FieldLabel>
                <SearchableSelect
                  options={quotationOptions}
                  value={form.quotation_id || undefined}
                  onValueChange={(v) => void handleQuotationChange(v)}
                  placeholder="Select quotation"
                  searchPlaceholder="Search quotations…"
                />
              </div>
              <div>
                <FieldLabel>Product PIC</FieldLabel>
                <SearchableSelect
                  options={employeeOptions}
                  value={form.product_pic_id || undefined}
                  onValueChange={(v) => setField('product_pic_id', v)}
                  placeholder="Select"
                />
              </div>
              <div>
                <FieldLabel>Operators</FieldLabel>
                <SearchableSelect
                  options={logisticsOperatorOptions}
                  value={operatorsSelectValue}
                  onValueChange={(id) => {
                    const emp = logisticsEmployees.find((e) => e.id === id);
                    setField('operators', emp?.full_name ?? '');
                  }}
                  placeholder="Chọn nhân sự Logistics"
                  searchPlaceholder="Tìm theo tên…"
                />
                {operatorsLegacyHint && (
                  <p className="mt-1 text-[11px] text-amber-700">
                    Giá trị đang lưu: &quot;{operatorsLegacyHint}&quot; — không thuộc danh sách Logistics; chọn lại để cập nhật.
                  </p>
                )}
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-3">
              <div>
                <FieldLabel>Salesperson</FieldLabel>
                <SearchableSelect
                  options={employeeOptions}
                  value={form.salesperson_id || undefined}
                  onValueChange={(v) => setField('salesperson_id', v)}
                  placeholder="Select"
                />
              </div>
              <div>
                <FieldLabel>Sales team</FieldLabel>
                <input
                  value={form.sales_team || ''}
                  onChange={(e) => setField('sales_team', e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
                />
              </div>
              <div>
                <FieldLabel>Sales department</FieldLabel>
                <input
                  value={form.sales_department || ''}
                  onChange={(e) => setField('sales_department', e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
                />
              </div>
            </div>
          </div>
        </Section>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-4">
        <Section fillHeight={false} title="B/L information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>
                <div className="flex items-center gap-2">
                  Status
                  {form.bl_status && (
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[9px] font-bold uppercase tracking-wider border border-blue-200">
                      {form.bl_status}
                    </span>
                  )}
                </div>
              </FieldLabel>
              <input
                value={form.bl_status || ''}
                onChange={(e) => setField('bl_status', e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
              />
            </div>
            <div>
              <FieldLabel>Status detail</FieldLabel>
              <input
                value={form.bl_status_detail || ''}
                onChange={(e) => setField('bl_status_detail', e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
              />
            </div>
          </div>
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">B/L lines</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveBlLines}
                disabled={savingLines || !shipmentId}
                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
              >
                {savingLines ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Lines
              </button>
              <button
                type="button"
                onClick={addBlLine}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
              >
                <Plus size={14} />
                Add row
              </button>
            </div>
          </div>
          <div className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden rounded-xl border border-border">
            {loadingLines ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : (
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 border-b border-border">
                  <tr>
                    {['Name', 'Sea customer', 'Air customer', 'Name', 'Package', 'Unit', 'Sea ETD', 'Sea ETA', 'Air ETD', 'Air ETA', 'Loading Date', 'Delivery Date', ''].map((h) => (
                      <th key={h} className="px-2 py-2 font-bold text-muted-foreground uppercase whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blLines.map((row, idx) => (
                    <tr key={idx} className="border-b border-border/60 last:border-0">
                      <td className="p-1 align-middle">
                        <input
                          value={row.name_1 || ''}
                          onChange={(e) => updateBlLine(idx, { name_1: e.target.value })}
                          className="box-border h-8 w-[100px] min-w-0 rounded border border-border px-1.5 text-[11px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <input
                          value={row.sea_customer || ''}
                          onChange={(e) => updateBlLine(idx, { sea_customer: e.target.value })}
                          className="box-border h-8 w-[100px] min-w-0 rounded border border-border px-1.5 text-[11px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <input
                          value={row.air_customer || ''}
                          onChange={(e) => updateBlLine(idx, { air_customer: e.target.value })}
                          className="box-border h-8 w-[100px] min-w-0 rounded border border-border px-1.5 text-[11px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <input
                          value={row.name_2 || ''}
                          onChange={(e) => updateBlLine(idx, { name_2: e.target.value })}
                          className="box-border h-8 w-[100px] min-w-0 rounded border border-border px-1.5 text-[11px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <input
                          value={row.package_text || ''}
                          onChange={(e) => updateBlLine(idx, { package_text: e.target.value })}
                          className="box-border h-8 w-[72px] min-w-0 rounded border border-border px-1.5 text-[11px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <input
                          value={row.unit_text || ''}
                          onChange={(e) => updateBlLine(idx, { unit_text: e.target.value })}
                          className="box-border h-8 w-[56px] min-w-0 rounded border border-border px-1.5 text-[11px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <DateInput
                          dense
                          value={row.sea_etd || ''}
                          onChange={(v) => updateBlLine(idx, { sea_etd: v })}
                          className="min-w-[108px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <DateInput
                          dense
                          value={row.sea_eta || ''}
                          onChange={(v) => updateBlLine(idx, { sea_eta: v })}
                          className="min-w-[108px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <DateInput
                          dense
                          value={row.air_etd || ''}
                          onChange={(v) => updateBlLine(idx, { air_etd: v })}
                          className="min-w-[108px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <DateInput
                          dense
                          value={row.air_eta || ''}
                          onChange={(v) => updateBlLine(idx, { air_eta: v })}
                          className="min-w-[108px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <DateInput
                          dense
                          value={row.loading_date || ''}
                          onChange={(v) => updateBlLine(idx, { loading_date: v })}
                          className="min-w-[108px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <DateInput
                          dense
                          value={row.delivery_date || ''}
                          onChange={(v) => updateBlLine(idx, { delivery_date: v })}
                          className="min-w-[108px]"
                        />
                      </td>
                      <td className="p-1 align-middle">
                        <button
                          type="button"
                          onClick={() => removeBlLine(idx)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="pt-3 flex justify-end">
            <button
              type="button"
              onClick={() => shipmentId && navigate(`/shipments/sop/${shipmentId}/sea-house-bl`)}
              disabled={!shipmentId}
              className="inline-flex items-center justify-center gap-1.5 min-h-9 px-4 py-2 rounded-lg border border-teal-300 bg-teal-50 text-teal-700 text-[11px] font-bold uppercase tracking-wide shadow-sm hover:bg-teal-100 hover:border-teal-400 transition-colors disabled:opacity-45 disabled:pointer-events-none"
            >
              <Ship size={13} />
              Create Sea House B/L
            </button>
          </div>
        </Section>

        <Section fillHeight={false} title="Master B/L information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Master B/L no.</FieldLabel>
              <input
                value={form.master_bl_number || ''}
                onChange={(e) => setField('master_bl_number', e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
              />
            </div>
            <div>
              <FieldLabel>Carrier</FieldLabel>
              <input
                value={form.master_bl_carrier || ''}
                onChange={(e) => setField('master_bl_carrier', e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium"
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Remarks</FieldLabel>
              <textarea
                value={form.master_bl_remarks || ''}
                onChange={(e) => setField('master_bl_remarks', e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium resize-y"
              />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default SalesBlTab;
