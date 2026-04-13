import { Plus, Trash2 } from 'lucide-react';
import { FieldLabel, SectionCard, inputClass } from './blSharedHelpers';

interface SellingLine {
  fare: string;
  fareName: string;
  fareType: string;
  currency: string;
  rate: string;
  unit: string;
  qty: string;
  foreignAmount: string;
}

export interface MarksDescriptionTabState {
  markAndNumbers: string;
  suggest1: string;
  suggest2: string;
  descriptionOfGoods: string;
  containerInfoPrint: string;
  type: string;
  freightTermForPrinting: string;
  onboardDateOption: string;
  displayFreightAmount: string;
  blRemark: string;
  devanningRemark: string;
  blTextPrint: string;
  showServiceTerms: boolean;
  showReceiveDate: boolean;
  isNonNegotiable: boolean;
  printAsAgent: boolean;
  stampPrint: boolean;
  containerDetail: boolean;
  sellingLines: SellingLine[];
}

export function emptyMarksDescriptionState(): MarksDescriptionTabState {
  return {
    markAndNumbers: '',
    suggest1: '',
    suggest2: '',
    descriptionOfGoods: '',
    containerInfoPrint: '',
    type: '',
    freightTermForPrinting: '',
    onboardDateOption: '',
    displayFreightAmount: '',
    blRemark: '',
    devanningRemark: '',
    blTextPrint: '',
    showServiceTerms: false,
    showReceiveDate: false,
    isNonNegotiable: false,
    printAsAgent: false,
    stampPrint: false,
    containerDetail: false,
    sellingLines: [],
  };
}

const emptySellingLine = (): SellingLine => ({
  fare: '',
  fareName: '',
  fareType: '',
  currency: '',
  rate: '',
  unit: '',
  qty: '',
  foreignAmount: '',
});

export function MarksDescriptionTab({
  state,
  onChange,
}: {
  state: MarksDescriptionTabState;
  onChange: (patch: Partial<MarksDescriptionTabState>) => void;
}) {
  const updateLine = (idx: number, patch: Partial<SellingLine>) => {
    onChange({
      sellingLines: state.sellingLines.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    });
  };
  const addLine = () => onChange({ sellingLines: [...state.sellingLines, emptySellingLine()] });
  const removeLine = (idx: number) =>
    onChange({ sellingLines: state.sellingLines.filter((_, i) => i !== idx) });

  const checkboxClass =
    'h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30 accent-primary cursor-pointer';

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4">
      {/* Mark And Numbers (full width) */}
      <div>
        <FieldLabel>Mark And Numbers</FieldLabel>
        <textarea
          value={state.markAndNumbers}
          onChange={(e) => onChange({ markAndNumbers: e.target.value })}
          rows={3}
          className={inputClass + ' resize-y'}
          placeholder="Mark and numbers"
        />
      </div>

      {/* Suggest #1, Suggest #2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FieldLabel>Suggest #1</FieldLabel>
          <input
            value={state.suggest1}
            onChange={(e) => onChange({ suggest1: e.target.value })}
            className={inputClass}
            placeholder="Suggest #1"
          />
        </div>
        <div>
          <FieldLabel>Suggest #2</FieldLabel>
          <input
            value={state.suggest2}
            onChange={(e) => onChange({ suggest2: e.target.value })}
            className={inputClass}
            placeholder="Suggest #2"
          />
        </div>
      </div>

      {/* Description Of Goods (full width) */}
      <div>
        <FieldLabel>Description Of Goods</FieldLabel>
        <textarea
          value={state.descriptionOfGoods}
          onChange={(e) => onChange({ descriptionOfGoods: e.target.value })}
          rows={3}
          className={inputClass + ' resize-y'}
          placeholder="Description of goods"
        />
      </div>

      {/* HBL PRINT OPTION section */}
      <SectionCard title="HBL Print Option">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left column */}
          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel>Container Info Print</FieldLabel>
              <input
                value={state.containerInfoPrint}
                onChange={(e) => onChange({ containerInfoPrint: e.target.value })}
                className={inputClass}
                placeholder="Container info print"
              />
            </div>
            <div>
              <FieldLabel>Type</FieldLabel>
              <input
                value={state.type}
                onChange={(e) => onChange({ type: e.target.value })}
                className={inputClass}
                placeholder="Type"
              />
            </div>
            <div>
              <FieldLabel>Freight Term For Printing</FieldLabel>
              <input
                value={state.freightTermForPrinting}
                onChange={(e) => onChange({ freightTermForPrinting: e.target.value })}
                className={inputClass}
                placeholder="Freight term"
              />
            </div>
            <div>
              <FieldLabel>Onboard Date Option</FieldLabel>
              <input
                value={state.onboardDateOption}
                onChange={(e) => onChange({ onboardDateOption: e.target.value })}
                className={inputClass}
                placeholder="Onboard date option"
              />
            </div>
            <div>
              <FieldLabel>Display Freight Amount</FieldLabel>
              <input
                value={state.displayFreightAmount}
                onChange={(e) => onChange({ displayFreightAmount: e.target.value })}
                className={inputClass}
                placeholder="Display freight amount"
              />
            </div>
            <div>
              <FieldLabel>BL Remark</FieldLabel>
              <textarea
                value={state.blRemark}
                onChange={(e) => onChange({ blRemark: e.target.value })}
                rows={2}
                className={inputClass + ' resize-y'}
                placeholder="B/L remark"
              />
            </div>
            <div>
              <FieldLabel>Devanning Remark</FieldLabel>
              <textarea
                value={state.devanningRemark}
                onChange={(e) => onChange({ devanningRemark: e.target.value })}
                rows={2}
                className={inputClass + ' resize-y'}
                placeholder="Devanning remark"
              />
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel>BL Text Print</FieldLabel>
              <textarea
                value={state.blTextPrint}
                onChange={(e) => onChange({ blTextPrint: e.target.value })}
                rows={4}
                className={inputClass + ' resize-y'}
                placeholder="B/L text print"
              />
            </div>

            <div className="flex flex-col gap-1 pt-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-[12px] font-semibold text-slate-700 w-[140px]">Show Service Terms</span>
                <input type="checkbox" checked={state.showServiceTerms} onChange={(e) => onChange({ showServiceTerms: e.target.checked })} className={checkboxClass} />
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-[12px] font-semibold text-slate-700 w-[140px]">Show Receive Date</span>
                <input type="checkbox" checked={state.showReceiveDate} onChange={(e) => onChange({ showReceiveDate: e.target.checked })} className={checkboxClass} />
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-[12px] font-semibold text-slate-700 w-[140px]">Is Non Negotiable</span>
                <input type="checkbox" checked={state.isNonNegotiable} onChange={(e) => onChange({ isNonNegotiable: e.target.checked })} className={checkboxClass} />
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-[12px] font-semibold text-slate-700 w-[140px]">Print As Agent</span>
                <input type="checkbox" checked={state.printAsAgent} onChange={(e) => onChange({ printAsAgent: e.target.checked })} className={checkboxClass} />
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-[12px] font-semibold text-slate-700 w-[140px]">Stamp Print</span>
                <input type="checkbox" checked={state.stampPrint} onChange={(e) => onChange({ stampPrint: e.target.checked })} className={checkboxClass} />
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-[12px] font-semibold text-slate-700 w-[140px]">Container Detail</span>
                <input type="checkbox" checked={state.containerDetail} onChange={(e) => onChange({ containerDetail: e.target.checked })} className={checkboxClass} />
              </label>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Print Preview section */}
      <SectionCard title="Print Preview">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-muted-foreground uppercase">Print Sea Selling Lines</span>
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
          >
            <Plus size={14} />
            Add row
          </button>
        </div>
        <div className="min-w-0 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-50 border-b border-border">
              <tr>
                {['Fare', 'Fare Name', 'Fare Type', 'Currency', 'Rate', 'Unit', 'Qty', 'Foreign Amount', ''].map((h) => (
                  <th key={h} className="px-2 py-2 font-bold text-muted-foreground uppercase whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.sellingLines.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-[12px] text-muted-foreground">
                    No selling lines yet. Click "Add row" to start.
                  </td>
                </tr>
              ) : (
                state.sellingLines.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/60 last:border-0">
                    <td className="p-1 align-middle">
                      <input value={row.fare} onChange={(e) => updateLine(idx, { fare: e.target.value })} className="box-border h-8 w-[80px] min-w-0 rounded border border-border px-1.5 text-[11px]" />
                    </td>
                    <td className="p-1 align-middle">
                      <input value={row.fareName} onChange={(e) => updateLine(idx, { fareName: e.target.value })} className="box-border h-8 w-[110px] min-w-0 rounded border border-border px-1.5 text-[11px]" />
                    </td>
                    <td className="p-1 align-middle">
                      <input value={row.fareType} onChange={(e) => updateLine(idx, { fareType: e.target.value })} className="box-border h-8 w-[80px] min-w-0 rounded border border-border px-1.5 text-[11px]" />
                    </td>
                    <td className="p-1 align-middle">
                      <input value={row.currency} onChange={(e) => updateLine(idx, { currency: e.target.value })} className="box-border h-8 w-[60px] min-w-0 rounded border border-border px-1.5 text-[11px]" />
                    </td>
                    <td className="p-1 align-middle">
                      <input value={row.rate} onChange={(e) => updateLine(idx, { rate: e.target.value })} className="box-border h-8 w-[70px] min-w-0 rounded border border-border px-1.5 text-[11px]" />
                    </td>
                    <td className="p-1 align-middle">
                      <input value={row.unit} onChange={(e) => updateLine(idx, { unit: e.target.value })} className="box-border h-8 w-[56px] min-w-0 rounded border border-border px-1.5 text-[11px]" />
                    </td>
                    <td className="p-1 align-middle">
                      <input value={row.qty} onChange={(e) => updateLine(idx, { qty: e.target.value })} className="box-border h-8 w-[50px] min-w-0 rounded border border-border px-1.5 text-[11px]" />
                    </td>
                    <td className="p-1 align-middle">
                      <input value={row.foreignAmount} onChange={(e) => updateLine(idx, { foreignAmount: e.target.value })} className="box-border h-8 w-[100px] min-w-0 rounded border border-border px-1.5 text-[11px]" />
                    </td>
                    <td className="p-1 align-middle">
                      <button type="button" onClick={() => removeLine(idx)} className="inline-flex h-8 w-8 items-center justify-center rounded text-red-500 hover:bg-red-50">
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
