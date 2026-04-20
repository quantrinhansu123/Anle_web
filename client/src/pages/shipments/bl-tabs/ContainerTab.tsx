import { Plus, Trash2 } from 'lucide-react';
import { FieldLabel, SectionCard, inputClass } from './blSharedHelpers';

interface VolumeInfoRow {
  size: string;
  type: string;
  quantity: string;
  part: string;
}

interface ContainerRow {
  containerNo: string;
  packages: string;
  unit: string;
  type: string;
  size: string;
  seal1: string;
  seal2: string;
  grossWeight: string;
  measure: string;
  part: string;
  main: boolean;
}

export interface ContainerTabState {
  packageQuantity: string;
  grossWT: string;
  volume: string;
  pkgUnit: string;
  weightUnit: string;
  volumeUnit: string;
  volumeInfoRows: VolumeInfoRow[];
  inWords: string;
  containerRows: ContainerRow[];
}

export function emptyContainerState(): ContainerTabState {
  return {
    packageQuantity: '',
    grossWT: '',
    volume: '',
    pkgUnit: '',
    weightUnit: '',
    volumeUnit: '',
    volumeInfoRows: [],
    inWords: '',
    containerRows: [],
  };
}

const emptyVolumeInfoRow = (): VolumeInfoRow => ({ size: '', type: '', quantity: '', part: '' });
const emptyContainerRow = (): ContainerRow => ({
  containerNo: '', packages: '', unit: '', type: '', size: '',
  seal1: '', seal2: '', grossWeight: '', measure: '', part: '', main: false,
});

export function ContainerTab({
  state,
  onChange,
}: {
  state: ContainerTabState;
  onChange: (patch: Partial<ContainerTabState>) => void;
}) {
  const updateVolRow = (idx: number, patch: Partial<VolumeInfoRow>) =>
    onChange({ volumeInfoRows: state.volumeInfoRows.map((r, i) => (i === idx ? { ...r, ...patch } : r)) });
  const addVolRow = () => onChange({ volumeInfoRows: [...state.volumeInfoRows, emptyVolumeInfoRow()] });
  const removeVolRow = (idx: number) => onChange({ volumeInfoRows: state.volumeInfoRows.filter((_, i) => i !== idx) });

  const updateCtnRow = (idx: number, patch: Partial<ContainerRow>) =>
    onChange({ containerRows: state.containerRows.map((r, i) => (i === idx ? { ...r, ...patch } : r)) });
  const addCtnRow = () => onChange({ containerRows: [...state.containerRows, emptyContainerRow()] });
  const removeCtnRow = (idx: number) => onChange({ containerRows: state.containerRows.filter((_, i) => i !== idx) });

  const tblInput = 'box-border h-8 min-w-0 rounded border border-border px-1.5 text-[11px] w-full';

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4">
      {/* Volume Information */}
      <SectionCard title="Volume Information">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Col 1 */}
          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel>Package Quantity</FieldLabel>
              <input value={state.packageQuantity} onChange={(e) => onChange({ packageQuantity: e.target.value })} className={inputClass} placeholder="0" />
            </div>
            <div>
              <FieldLabel>Gross W/T</FieldLabel>
              <input value={state.grossWT} onChange={(e) => onChange({ grossWT: e.target.value })} className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <FieldLabel>Volume</FieldLabel>
              <input value={state.volume} onChange={(e) => onChange({ volume: e.target.value })} className={inputClass} placeholder="0.00" />
            </div>
          </div>
          {/* Col 2 */}
          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel>PKG Unit</FieldLabel>
              <input value={state.pkgUnit} onChange={(e) => onChange({ pkgUnit: e.target.value })} className={inputClass} placeholder="PKG" />
            </div>
            <div>
              <FieldLabel>Weight Unit</FieldLabel>
              <input value={state.weightUnit} onChange={(e) => onChange({ weightUnit: e.target.value })} className={inputClass} placeholder="KGS" />
            </div>
            <div>
              <FieldLabel>Volume Unit</FieldLabel>
              <input value={state.volumeUnit} onChange={(e) => onChange({ volumeUnit: e.target.value })} className={inputClass} placeholder="CBM" />
            </div>
          </div>
          {/* Col 3-4: Size/Type/Qty/Part table */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Size / Type / Quantity</FieldLabel>
              <button type="button" onClick={addVolRow} className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline">
                <Plus size={14} /> Add
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 border-b border-border">
                  <tr>
                    {['Size', 'Type', 'Quantity', 'Part', ''].map((h) => (
                      <th key={h} className="px-2 py-2 font-bold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {state.volumeInfoRows.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-4 text-center text-[12px] text-muted-foreground">No rows yet.</td></tr>
                  ) : state.volumeInfoRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-border/60 last:border-0">
                      <td className="p-1"><input value={row.size} onChange={(e) => updateVolRow(idx, { size: e.target.value })} className={tblInput} /></td>
                      <td className="p-1"><input value={row.type} onChange={(e) => updateVolRow(idx, { type: e.target.value })} className={tblInput} /></td>
                      <td className="p-1"><input value={row.quantity} onChange={(e) => updateVolRow(idx, { quantity: e.target.value })} className={tblInput} /></td>
                      <td className="p-1"><input value={row.part} onChange={(e) => updateVolRow(idx, { part: e.target.value })} className={tblInput} /></td>
                      <td className="p-1"><button type="button" onClick={() => removeVolRow(idx)} className="inline-flex h-8 w-8 items-center justify-center rounded text-red-500 hover:bg-red-50"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Container Volume */}
      <SectionCard title="Container Volume">
        <div>
          <FieldLabel>In Words</FieldLabel>
          <input value={state.inWords} onChange={(e) => onChange({ inWords: e.target.value })} className={inputClass} placeholder="e.g. TEN PACKAGES ONLY" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-muted-foreground uppercase">Containers</span>
          <button type="button" onClick={addCtnRow} className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline">
            <Plus size={14} /> Add row
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-50 border-b border-border">
              <tr>
                {['Container No.', 'Package', 'Unit', 'Type', 'Size', 'Seal #1', 'Seal #2', 'Gross Weight', 'Measure', 'Part', 'Main', ''].map((h) => (
                  <th key={h} className="px-2 py-2 font-bold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.containerRows.length === 0 ? (
                <tr><td colSpan={12} className="px-4 py-6 text-center text-[12px] text-muted-foreground">No containers yet. Click "Add row" to start.</td></tr>
              ) : state.containerRows.map((row, idx) => (
                <tr key={idx} className="border-b border-border/60 last:border-0">
                  <td className="p-1"><input value={row.containerNo} onChange={(e) => updateCtnRow(idx, { containerNo: e.target.value })} className={tblInput + ' !w-[110px]'} /></td>
                  <td className="p-1"><input value={row.packages} onChange={(e) => updateCtnRow(idx, { packages: e.target.value })} className={tblInput + ' !w-[70px]'} /></td>
                  <td className="p-1"><input value={row.unit} onChange={(e) => updateCtnRow(idx, { unit: e.target.value })} className={tblInput + ' !w-[50px]'} /></td>
                  <td className="p-1"><input value={row.type} onChange={(e) => updateCtnRow(idx, { type: e.target.value })} className={tblInput + ' !w-[60px]'} /></td>
                  <td className="p-1"><input value={row.size} onChange={(e) => updateCtnRow(idx, { size: e.target.value })} className={tblInput + ' !w-[50px]'} /></td>
                  <td className="p-1"><input value={row.seal1} onChange={(e) => updateCtnRow(idx, { seal1: e.target.value })} className={tblInput + ' !w-[80px]'} /></td>
                  <td className="p-1"><input value={row.seal2} onChange={(e) => updateCtnRow(idx, { seal2: e.target.value })} className={tblInput + ' !w-[80px]'} /></td>
                  <td className="p-1"><input value={row.grossWeight} onChange={(e) => updateCtnRow(idx, { grossWeight: e.target.value })} className={tblInput + ' !w-[80px]'} /></td>
                  <td className="p-1"><input value={row.measure} onChange={(e) => updateCtnRow(idx, { measure: e.target.value })} className={tblInput + ' !w-[70px]'} /></td>
                  <td className="p-1"><input value={row.part} onChange={(e) => updateCtnRow(idx, { part: e.target.value })} className={tblInput + ' !w-[50px]'} /></td>
                  <td className="p-1 text-center"><input type="checkbox" checked={row.main} onChange={(e) => updateCtnRow(idx, { main: e.target.checked })} className="h-4 w-4 accent-primary cursor-pointer" /></td>
                  <td className="p-1"><button type="button" onClick={() => removeCtnRow(idx)} className="inline-flex h-8 w-8 items-center justify-center rounded text-red-500 hover:bg-red-50"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
