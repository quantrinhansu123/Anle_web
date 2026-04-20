import { CalendarDays } from 'lucide-react';
import { DateInput } from '../../../components/ui/DateInput';
import { FieldLabel, SectionCard, inputClass } from './blSharedHelpers';

export interface HeaderTabState {
  shipper: string;
  shipperName: string;
  consignee: string;
  consigneeName: string;
  notify: string;
  notifyName: string;

  carrier: string;
  firstVessel: string;
  mvvd: string;
  etd: string;
  eta: string;
  atd: string;
  ata: string;
  onboardDate: string;
  performanceDate: string;
  por: string;
  pol: string;
  ts: string;
  pod: string;
  pvy: string;

  issueDate: string;
  seaNoOfBL: string;

  vendor: string;
  deliveryAgent: string;
}

export function emptyHeaderState(): HeaderTabState {
  return {
    shipper: '',
    shipperName: '',
    consignee: '',
    consigneeName: '',
    notify: '',
    notifyName: '',
    carrier: '',
    firstVessel: '',
    mvvd: '',
    etd: '',
    eta: '',
    atd: '',
    ata: '',
    onboardDate: '',
    performanceDate: '',
    por: '',
    pol: '',
    ts: '',
    pod: '',
    pvy: '',
    issueDate: '',
    seaNoOfBL: '',
    vendor: '',
    deliveryAgent: '',
  };
}

export function HeaderTab({
  state,
  onChange,
}: {
  state: HeaderTabState;
  onChange: (patch: Partial<HeaderTabState>) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 sm:p-4">
      {/* Row 1: Party Information + Schedule Information */}
      <SectionCard title="Party Information">
        <div className="flex flex-col gap-3">
          <div>
            <FieldLabel>Shipper</FieldLabel>
            <input
              value={state.shipper}
              onChange={(e) => onChange({ shipper: e.target.value })}
              className={inputClass}
              placeholder="Enter shipper code"
            />
          </div>
          <div>
            <FieldLabel>Shipper Name</FieldLabel>
            <input
              value={state.shipperName}
              onChange={(e) => onChange({ shipperName: e.target.value })}
              className={inputClass}
              placeholder="Enter shipper name"
            />
          </div>
          <div>
            <FieldLabel>Consignee</FieldLabel>
            <input
              value={state.consignee}
              onChange={(e) => onChange({ consignee: e.target.value })}
              className={inputClass}
              placeholder="Enter consignee code"
            />
          </div>
          <div>
            <FieldLabel>Consignee Name</FieldLabel>
            <input
              value={state.consigneeName}
              onChange={(e) => onChange({ consigneeName: e.target.value })}
              className={inputClass}
              placeholder="Enter consignee name"
            />
          </div>
          <div>
            <FieldLabel>Notify</FieldLabel>
            <input
              value={state.notify}
              onChange={(e) => onChange({ notify: e.target.value })}
              className={inputClass}
              placeholder="Enter notify party"
            />
          </div>
          <div>
            <FieldLabel>Notify Name</FieldLabel>
            <input
              value={state.notifyName}
              onChange={(e) => onChange({ notifyName: e.target.value })}
              className={inputClass}
              placeholder="Enter notify name"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Schedule Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel>Carrier</FieldLabel>
            <input
              value={state.carrier}
              onChange={(e) => onChange({ carrier: e.target.value })}
              className={inputClass}
              placeholder="Carrier"
            />
          </div>
          <div>
            <FieldLabel>1st Vessel</FieldLabel>
            <input
              value={state.firstVessel}
              onChange={(e) => onChange({ firstVessel: e.target.value })}
              className={inputClass}
              placeholder="1st Vessel"
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>M.VVD</FieldLabel>
            <input
              value={state.mvvd}
              onChange={(e) => onChange({ mvvd: e.target.value })}
              className={inputClass}
              placeholder="M.VVD"
            />
          </div>
          <div>
            <FieldLabel>ETD</FieldLabel>
            <DateInput value={state.etd} onChange={(v) => onChange({ etd: v })} className="w-full" />
          </div>
          <div>
            <FieldLabel>ETA</FieldLabel>
            <DateInput value={state.eta} onChange={(v) => onChange({ eta: v })} className="w-full" />
          </div>
          <div>
            <FieldLabel>ATD</FieldLabel>
            <DateInput value={state.atd} onChange={(v) => onChange({ atd: v })} className="w-full" />
          </div>
          <div>
            <FieldLabel>ATA</FieldLabel>
            <DateInput value={state.ata} onChange={(v) => onChange({ ata: v })} className="w-full" />
          </div>
          <div>
            <FieldLabel>Onboard Date</FieldLabel>
            <DateInput
              value={state.onboardDate}
              onChange={(v) => onChange({ onboardDate: v })}
              className="w-full"
            />
          </div>
          <div>
            <FieldLabel>Performance Date</FieldLabel>
            <DateInput
              value={state.performanceDate}
              onChange={(v) => onChange({ performanceDate: v })}
              className="w-full"
            />
          </div>
          <div>
            <FieldLabel>POR</FieldLabel>
            <input
              value={state.por}
              onChange={(e) => onChange({ por: e.target.value })}
              className={inputClass}
              placeholder="Place of Receipt"
            />
          </div>
          <div>
            <FieldLabel>POL</FieldLabel>
            <input
              value={state.pol}
              onChange={(e) => onChange({ pol: e.target.value })}
              className={inputClass}
              placeholder="Port of Loading"
            />
          </div>
          <div>
            <FieldLabel>T/S</FieldLabel>
            <input
              value={state.ts}
              onChange={(e) => onChange({ ts: e.target.value })}
              className={inputClass}
              placeholder="Transshipment"
            />
          </div>
          <div>
            <FieldLabel>POD</FieldLabel>
            <input
              value={state.pod}
              onChange={(e) => onChange({ pod: e.target.value })}
              className={inputClass}
              placeholder="Port of Discharge"
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>PVY</FieldLabel>
            <input
              value={state.pvy}
              onChange={(e) => onChange({ pvy: e.target.value })}
              className={inputClass}
              placeholder="Place of Delivery"
            />
          </div>
          <div className="sm:col-span-2 pt-1">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-primary shadow-sm hover:bg-primary/10 transition-colors"
            >
              <CalendarDays size={13} />
              Schedules
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Row 2: Issue Information + Document Information */}
      <SectionCard title="Issue Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel>Issue Date</FieldLabel>
            <DateInput
              value={state.issueDate}
              onChange={(v) => onChange({ issueDate: v })}
              className="w-full"
            />
          </div>
          <div>
            <FieldLabel>Sea No of B/L</FieldLabel>
            <input
              value={state.seaNoOfBL}
              onChange={(e) => onChange({ seaNoOfBL: e.target.value })}
              className={inputClass}
              placeholder="No of B/L"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Document Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel>Vendor</FieldLabel>
            <input
              value={state.vendor}
              onChange={(e) => onChange({ vendor: e.target.value })}
              className={inputClass}
              placeholder="Select vendor"
            />
          </div>
          <div>
            <FieldLabel>Delivery Agent</FieldLabel>
            <input
              value={state.deliveryAgent}
              onChange={(e) => onChange({ deliveryAgent: e.target.value })}
              className={inputClass}
              placeholder="Select delivery agent"
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
