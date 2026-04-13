import { Plus, Trash2 } from 'lucide-react';
import { FieldLabel, SectionCard, inputClass } from './blSharedHelpers';

interface SellingRow {
  customer: string;
  service: string;
  fare: string;
  fareName: string;
  currency: string;
  exchangeRate: string;
  unit: string;
  rate: string;
  amtForeign: string;
  vat: string;
}

export interface BuyingRow {
  vendor: string;
  vendorName: string;
  payer: string;
  service: string;
  employee: string;
  expense: string;
  fare: string;
  fareName: string;
  tax: string;
  fareType: string;
  currency: string;
  exchangeRate: string;
  unit: string;
}

export interface FreightTabState {
  currency: string;
  date: string;
  rate: string;
  totalLocalSelling: string;
  totalLocalBuying: string;
  grossMargin: string;
  percentMargin: string;
  sellingRows: SellingRow[];
  buyingRows: BuyingRow[];
}

export function emptyFreightState(): FreightTabState {
  return {
    currency: '',
    date: '',
    rate: '',
    totalLocalSelling: '',
    totalLocalBuying: '',
    grossMargin: '',
    percentMargin: '',
    sellingRows: [],
    buyingRows: [],
  };
}

const emptySellingRow = (): SellingRow => ({
  customer: '',
  service: '',
  fare: '',
  fareName: '',
  currency: '',
  exchangeRate: '',
  unit: '',
  rate: '',
  amtForeign: '',
  vat: '',
});

const emptyBuyingRow = (): BuyingRow => ({
  vendor: '',
  vendorName: '',
  payer: '',
  service: '',
  employee: '',
  expense: '',
  fare: '',
  fareName: '',
  tax: '',
  fareType: '',
  currency: '',
  exchangeRate: '',
  unit: '',
});

export function FreightTab({
  state,
  onChange,
}: {
  state: FreightTabState;
  onChange: (patch: Partial<FreightTabState>) => void;
}) {
  const updateRow = (idx: number, patch: Partial<SellingRow>) =>
    onChange({ sellingRows: state.sellingRows.map((r, i) => (i === idx ? { ...r, ...patch } : r)) });
  const addRow = () => onChange({ sellingRows: [...state.sellingRows, emptySellingRow()] });
  const removeRow = (idx: number) => onChange({ sellingRows: state.sellingRows.filter((_, i) => i !== idx) });

  const updateBuyingRow = (idx: number, patch: Partial<BuyingRow>) =>
    onChange({ buyingRows: state.buyingRows.map((r, i) => (i === idx ? { ...r, ...patch } : r)) });
  const addBuyingRow = () => onChange({ buyingRows: [...state.buyingRows, emptyBuyingRow()] });
  const removeBuyingRow = (idx: number) => onChange({ buyingRows: state.buyingRows.filter((_, i) => i !== idx) });

  const tblInput = 'box-border h-8 min-w-0 rounded border border-border px-1.5 text-[11px] w-full';

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4">
      {/* Exchange Rate + Total Margin side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exchange Rate */}
        <SectionCard title="Exchange Rate">
          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel>Currency</FieldLabel>
              <input
                value={state.currency}
                onChange={(e) => onChange({ currency: e.target.value })}
                className={inputClass}
                placeholder="USD"
              />
            </div>
            <div>
              <FieldLabel>Date</FieldLabel>
              <input
                type="date"
                value={state.date}
                onChange={(e) => onChange({ date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel>Rate</FieldLabel>
              <input
                value={state.rate}
                onChange={(e) => onChange({ rate: e.target.value })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
          </div>
        </SectionCard>

        {/* Total Margin */}
        <SectionCard title="Total Margin">
          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel>Total Local Selling</FieldLabel>
              <input
                value={state.totalLocalSelling}
                onChange={(e) => onChange({ totalLocalSelling: e.target.value })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <FieldLabel>Total Local Buying</FieldLabel>
              <input
                value={state.totalLocalBuying}
                onChange={(e) => onChange({ totalLocalBuying: e.target.value })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <FieldLabel>Gross Margin</FieldLabel>
              <input
                value={state.grossMargin}
                onChange={(e) => onChange({ grossMargin: e.target.value })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <FieldLabel>Percent Margin</FieldLabel>
              <input
                value={state.percentMargin}
                onChange={(e) => onChange({ percentMargin: e.target.value })}
                className={inputClass}
                placeholder="0.00%"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Selling section */}
      <SectionCard title="Selling">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-muted-foreground uppercase">Selling Lines</span>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
          >
            <Plus size={14} /> Get Carrier Local Charge
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-50 border-b border-border">
              <tr>
                {['Customer', 'Service', 'Fare', 'Fare Name', 'Currency', 'Exchange Rate', 'Unit', 'Rate', 'Amt (Foreign)', 'VAT', ''].map((h) => (
                  <th key={h} className="px-2 py-2 font-bold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.sellingRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-[12px] text-muted-foreground">
                    No selling lines yet. Click "Get Carrier Local Charge" to start.
                  </td>
                </tr>
              ) : (
                state.sellingRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/60 last:border-0">
                    <td className="p-1"><input value={row.customer} onChange={(e) => updateRow(idx, { customer: e.target.value })} className={tblInput + ' !w-[100px]'} /></td>
                    <td className="p-1"><input value={row.service} onChange={(e) => updateRow(idx, { service: e.target.value })} className={tblInput + ' !w-[80px]'} /></td>
                    <td className="p-1"><input value={row.fare} onChange={(e) => updateRow(idx, { fare: e.target.value })} className={tblInput + ' !w-[70px]'} /></td>
                    <td className="p-1"><input value={row.fareName} onChange={(e) => updateRow(idx, { fareName: e.target.value })} className={tblInput + ' !w-[110px]'} /></td>
                    <td className="p-1"><input value={row.currency} onChange={(e) => updateRow(idx, { currency: e.target.value })} className={tblInput + ' !w-[60px]'} /></td>
                    <td className="p-1"><input value={row.exchangeRate} onChange={(e) => updateRow(idx, { exchangeRate: e.target.value })} className={tblInput + ' !w-[80px]'} /></td>
                    <td className="p-1"><input value={row.unit} onChange={(e) => updateRow(idx, { unit: e.target.value })} className={tblInput + ' !w-[50px]'} /></td>
                    <td className="p-1"><input value={row.rate} onChange={(e) => updateRow(idx, { rate: e.target.value })} className={tblInput + ' !w-[70px]'} /></td>
                    <td className="p-1"><input value={row.amtForeign} onChange={(e) => updateRow(idx, { amtForeign: e.target.value })} className={tblInput + ' !w-[90px]'} /></td>
                    <td className="p-1"><input value={row.vat} onChange={(e) => updateRow(idx, { vat: e.target.value })} className={tblInput + ' !w-[50px]'} /></td>
                    <td className="p-1">
                      <button type="button" onClick={() => removeRow(idx)} className="inline-flex h-8 w-8 items-center justify-center rounded text-red-500 hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Buying section */}
      <SectionCard title="Buying">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-muted-foreground uppercase">Buying Lines</span>
          <button
            type="button"
            onClick={addBuyingRow}
            className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
          >
            <Plus size={14} /> Apply Vendor Local Charge
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-50 border-b border-border">
              <tr>
                {['Vendor', 'Vendor Name', 'Payer', 'Service', 'Employee', 'Expense', 'Fare', 'Fare Name', 'Tax', 'Fare Type', 'Currency', 'Exchange Rate', 'Unit', ''].map((h) => (
                  <th key={h} className="px-2 py-2 font-bold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.buyingRows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-6 text-center text-[12px] text-muted-foreground">
                    No buying lines yet. Click "Apply Vendor Local Charge" to start.
                  </td>
                </tr>
              ) : (
                state.buyingRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/60 last:border-0">
                    <td className="p-1"><input value={row.vendor} onChange={(e) => updateBuyingRow(idx, { vendor: e.target.value })} className={tblInput + ' !w-[80px]'} /></td>
                    <td className="p-1"><input value={row.vendorName} onChange={(e) => updateBuyingRow(idx, { vendorName: e.target.value })} className={tblInput + ' !w-[100px]'} /></td>
                    <td className="p-1"><input value={row.payer} onChange={(e) => updateBuyingRow(idx, { payer: e.target.value })} className={tblInput + ' !w-[80px]'} /></td>
                    <td className="p-1"><input value={row.service} onChange={(e) => updateBuyingRow(idx, { service: e.target.value })} className={tblInput + ' !w-[80px]'} /></td>
                    <td className="p-1"><input value={row.employee} onChange={(e) => updateBuyingRow(idx, { employee: e.target.value })} className={tblInput + ' !w-[80px]'} /></td>
                    <td className="p-1"><input value={row.expense} onChange={(e) => updateBuyingRow(idx, { expense: e.target.value })} className={tblInput + ' !w-[80px]'} /></td>
                    <td className="p-1"><input value={row.fare} onChange={(e) => updateBuyingRow(idx, { fare: e.target.value })} className={tblInput + ' !w-[70px]'} /></td>
                    <td className="p-1"><input value={row.fareName} onChange={(e) => updateBuyingRow(idx, { fareName: e.target.value })} className={tblInput + ' !w-[110px]'} /></td>
                    <td className="p-1"><input value={row.tax} onChange={(e) => updateBuyingRow(idx, { tax: e.target.value })} className={tblInput + ' !w-[60px]'} /></td>
                    <td className="p-1"><input value={row.fareType} onChange={(e) => updateBuyingRow(idx, { fareType: e.target.value })} className={tblInput + ' !w-[80px]'} /></td>
                    <td className="p-1"><input value={row.currency} onChange={(e) => updateBuyingRow(idx, { currency: e.target.value })} className={tblInput + ' !w-[60px]'} /></td>
                    <td className="p-1"><input value={row.exchangeRate} onChange={(e) => updateBuyingRow(idx, { exchangeRate: e.target.value })} className={tblInput + ' !w-[80px]'} /></td>
                    <td className="p-1"><input value={row.unit} onChange={(e) => updateBuyingRow(idx, { unit: e.target.value })} className={tblInput + ' !w-[50px]'} /></td>
                    <td className="p-1">
                      <button type="button" onClick={() => removeBuyingRow(idx)} className="inline-flex h-8 w-8 items-center justify-center rounded text-red-500 hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
