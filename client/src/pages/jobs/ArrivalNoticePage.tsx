import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Printer, ArrowLeft, Loader2, ChevronsDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { jobService } from '../../services/jobService';
import { salesService } from '../../services/salesService';
import { exchangeRateService, type ExchangeRate } from '../../services/exchangeRateService';
import { formatDate } from '../../lib/utils';
import { useToastContext } from '../../contexts/ToastContext';
import type { ChargeGroup, Sales, SalesChargeItem } from '../sales/types';
import type { FmsJob } from './types';
import { parseSeaHouseBlV1, emptyTopBar } from './seaHouseBlPersistence';
import type { SeaHouseBlTopBar } from './seaHouseBlPersistence';
import { emptyHeaderState, type HeaderTabState } from './tabs/HeaderTab';
import { emptyContainerState, type ContainerTabState } from './tabs/ContainerTab';
import { emptyMarksDescriptionState, type MarksDescriptionTabState } from './tabs/MarksDescriptionTab';

const CHARGE_GROUP_ORDER: ChargeGroup[] = ['freight', 'other', 'on_behalf'];

const ztrim = (s?: string) => (s || '').replace(/[\u200b-\u200d\ufeff]/g, '').trim();

const isBlankChargeLine = (c: SalesChargeItem) =>
  !ztrim(c.freight_code) &&
  !ztrim(c.charge_name) &&
  !ztrim(c.charge_type) &&
  !ztrim(c.unit) &&
  (Number(c.quantity) || 0) === 0 &&
  (Number(c.unit_price) || 0) === 0 &&
  (Number(c.vat_percent) || 0) === 0;

const chargeLineLabel = (c: SalesChargeItem) => {
  const name = ztrim(c.charge_name);
  const code = ztrim(c.freight_code);
  if (name && code) return `[${code}] ${name}`;
  if (name) return name;
  if (code) return code;
  const t = ztrim(c.charge_type);
  return t || '—';
};

const normCurrencyCode = (c?: string) => {
  const u = (c || 'VND').trim().toUpperCase();
  return u || 'VND';
};

function quotationLogoSrc(): string {
  if (import.meta.env.DEV) return '/appsheet-brand-logo';
  return 'https://www.appsheet.com/template/gettablefileurl?appName=Appsheet-325045268&tableName=Kho%20%E1%BA%A3nh&fileName=Kho%20%E1%BA%A3nh_Images%2Fe6a56fae.%E1%BA%A2nh.064359.png';
}

async function downloadPdfFromElement(el: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc) => {
      clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((node) => node.remove());
    },
  });
  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }
  pdf.save(filename);
}

const vndPerUnit = (currency: string | undefined, rateByCode: Map<string, number>): number | null => {
  const code = normCurrencyCode(currency);
  if (code === 'VND') return 1;
  const r = rateByCode.get(code);
  if (r == null || !(r > 0)) return null;
  return r;
};

const amountToVnd = (
  amount: number,
  currency: string | undefined,
  rateByCode: Map<string, number>,
): number | null => {
  const mult = vndPerUnit(currency, rateByCode);
  if (mult == null) return null;
  return amount * mult;
};

export interface ArrivalChargeRow {
  code: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  currency: string;
  vatPercent: number;
  lineTotalForeign: number;
}

export interface ArrivalNoticeViewModel {
  masterJobNo: string;
  docDateLabel: string;
  toAddress: string;
  shipper: string;
  masterBl: string;
  houseBl: string;
  pol: string;
  pod: string;
  placeOfReceipt: string;
  arrivalDate: string;
  vessel: string;
  voyage: string;
  marks: string;
  packages: string;
  goodsDescription: string;
  weight: string;
  volume: string;
  showSurrenderedBill: boolean;
  chargeRows: ArrivalChargeRow[];
  refRateCurrency: string;
  refRateVnd: number | null;
}

function mergeSeaState(blob: Record<string, unknown>): {
  topBar: SeaHouseBlTopBar;
  header: HeaderTabState;
  container: ContainerTabState;
  marks: MarksDescriptionTabState;
} {
  const parsed = parseSeaHouseBlV1(blob);
  if (parsed) return parsed;
  return {
    topBar: emptyTopBar(),
    header: emptyHeaderState(),
    container: emptyContainerState(),
    marks: emptyMarksDescriptionState(),
  };
}

function buildChargeRows(sales: Sales | null): ArrivalChargeRow[] {
  if (!sales?.sales_charge_items?.length) return [];
  const chargeList = sales.sales_charge_items
    .filter((c) => !isBlankChargeLine(c))
    .sort((a, b) => {
      const ga = CHARGE_GROUP_ORDER.indexOf(a.charge_group);
      const gb = CHARGE_GROUP_ORDER.indexOf(b.charge_group);
      const oa = ga === -1 ? 99 : ga;
      const ob = gb === -1 ? 99 : gb;
      if (oa !== ob) return oa - ob;
      return (a.display_order ?? 0) - (b.display_order ?? 0);
    });

  return chargeList.map((c) => {
    const q = Number(c.quantity) || 0;
    const p = Number(c.unit_price) || 0;
    const vat = Number(c.vat_percent) || 0;
    const exVat = q * p;
    const lineTotalForeign = exVat + (exVat * vat) / 100;
    const desc =
      c.charge_group === 'on_behalf'
        ? `Paid on behalf — ${chargeLineLabel(c)}`
        : chargeLineLabel(c);
    return {
      code: ztrim(c.freight_code) || '—',
      description: desc,
      quantity: q,
      unit: ztrim(c.unit) || '—',
      unitPrice: p,
      currency: normCurrencyCode(c.currency),
      vatPercent: vat,
      lineTotalForeign,
    };
  });
}

function buildViewModel(
  job: FmsJob,
  topBar: SeaHouseBlTopBar,
  header: HeaderTabState,
  container: ContainerTabState,
  marks: MarksDescriptionTabState,
  chargeRows: ArrivalChargeRow[],
  exchangeRates: ExchangeRate[],
): ArrivalNoticeViewModel {
  const shipper = ztrim(header.shipperName) || ztrim(header.shipper) || '—';
  const masterBl = ztrim(topBar.masterBl) || ztrim(job.master_bl_number || '') || '—';
  const houseBl = ztrim(topBar.hbl) || '—';
  const toAddress =
    ztrim(header.consigneeName) ||
    ztrim(header.consignee) ||
    ztrim(job.customers?.company_name || '') ||
    '—';
  const arrivalRaw = ztrim(header.ata) || ztrim(header.eta) || '';
  const docDate = arrivalRaw ? formatDate(arrivalRaw) : formatDate(new Date().toISOString());

  const pkgQty = ztrim(container.packageQuantity);
  const pkgUnit = ztrim(container.pkgUnit);
  const packages =
    pkgQty || pkgUnit ? [pkgQty, pkgUnit].filter(Boolean).join(' ') : '—';

  const gw = ztrim(container.grossWT);
  const wu = ztrim(container.weightUnit);
  const weight = gw || wu ? [gw, wu].filter(Boolean).join(' ') : '—';

  const vol = ztrim(container.volume);
  const vu = ztrim(container.volumeUnit);
  const volume = vol || vu ? [vol, vu].filter(Boolean).join(' ') : '—';

  const refUsd = exchangeRates.find((r) => r.currency_code.trim().toUpperCase() === 'USD');
  const refAny =
    refUsd ||
    exchangeRates.find((r) => r.currency_code.trim().toUpperCase() !== 'VND') ||
    null;
  const refRateCurrency = refAny?.currency_code.trim().toUpperCase() || 'USD';
  const refRateVnd = refAny && refAny.rate > 0 ? refAny.rate : null;

  return {
    masterJobNo: ztrim(job.master_job_no) || job.id.slice(0, 8).toUpperCase(),
    docDateLabel: docDate,
    toAddress,
    shipper,
    masterBl,
    houseBl,
    pol: ztrim(header.pol) || '—',
    pod: ztrim(header.pod) || '—',
    placeOfReceipt: ztrim(header.por) || '—',
    arrivalDate: arrivalRaw ? formatDate(arrivalRaw) : '—',
    vessel: ztrim(header.firstVessel) || '—',
    voyage: ztrim(header.mvvd) || '—',
    marks: ztrim(marks.markAndNumbers) || '—',
    packages,
    goodsDescription: ztrim(marks.descriptionOfGoods) || '—',
    weight,
    volume,
    showSurrenderedBill: ztrim(topBar.blReleaseStatus).toLowerCase() === 'surrendered',
    chargeRows,
    refRateCurrency,
    refRateVnd,
  };
}

function formatMoneyVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(n));
}

function formatAmountForeign(n: number, currency: string) {
  const c = normCurrencyCode(currency);
  if (c === 'VND') return formatMoneyVnd(n);
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

const AR_PRINT_CSS = `
.an-root {
  box-sizing: border-box;
  width: 800px;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  background: #ffffff;
  color: #000000;
  padding: 28px 40px 36px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 13px;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
}
.an-root *, .an-root *::before, .an-root *::after { box-sizing: border-box; }
.an-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.an-logo-wrap { width: 180px; flex-shrink: 0; padding-top: 4px; }
.an-logo-wrap img { width: 100%; height: auto; display: block; object-fit: contain; }
.an-company { text-align: right; font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.18em; line-height: 1.55; }
.an-company .an-co { font-weight: 600; color: #374151; }
.an-company p { margin: 0; }
.an-band { display: flex; align-items: center; justify-content: space-between; background: #f24b43; color: #ffffff; padding: 10px 14px; margin-bottom: 14px; min-height: 44px; }
.an-band-left { font-weight: 700; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; flex: 1; }
.an-band-mid { font-weight: 700; font-size: 11px; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.06em; text-align: center; flex: 2; }
.an-band-right { font-weight: 600; font-size: 12px; text-align: right; flex: 1; }
.an-to-wrap { margin-bottom: 16px; border: 1px solid #f24b43; position: relative; min-height: 72px; }
.an-to-label { text-align: center; font-weight: 700; color: #f24b43; text-transform: uppercase; font-size: 11px; padding: 6px 8px 0; }
.an-to-body { padding: 8px 12px 14px; min-height: 48px; white-space: pre-wrap; word-break: break-word; }
.an-to-accent { position: absolute; top: 0; right: 0; bottom: 0; width: 28px; background: #f24b43; }
.an-section-title { text-align: center; font-weight: 700; color: #f24b43; text-transform: uppercase; font-size: 12px; margin: 0 0 8px; letter-spacing: 0.06em; }
.an-grid { display: grid; border: 1px solid #f24b43; margin-bottom: 14px; }
.an-grid-r1 { display: grid; grid-template-columns: 1.4fr 0.8fr 0.8fr; border-bottom: 1px solid #f24b43; }
.an-grid-r2 { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #f24b43; }
.an-grid-r3 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; }
.an-cell { border-right: 1px solid #f24b43; padding: 8px 10px; min-height: 52px; vertical-align: top; }
.an-cell:last-child { border-right: none; }
.an-cell-label { font-weight: 700; color: #f24b43; text-transform: uppercase; font-size: 10px; margin-bottom: 4px; letter-spacing: 0.04em; }
.an-cell-val { font-weight: 600; font-size: 13px; white-space: pre-wrap; word-break: break-word; }
.an-cargo { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 12px; }
.an-cargo th, .an-cargo td { border: 1px solid #f24b43; padding: 8px 8px; vertical-align: top; }
.an-cargo th { background: #fff5f5; color: #f24b43; font-weight: 700; text-transform: uppercase; font-size: 10px; text-align: center; }
.an-cargo-badge { display: inline-block; background: #f24b43; color: #fff; font-size: 9px; font-weight: 700; padding: 4px 8px; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
.an-rate-row { display: flex; justify-content: flex-end; margin-bottom: 6px; font-size: 12px; }
.an-rate-row span { font-weight: 600; }
.an-charges { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
.an-charges thead th { background: #f24b43; color: #ffffff; font-weight: 700; text-transform: uppercase; font-size: 9px; padding: 8px 6px; border: 1px solid #d63d36; text-align: center; }
.an-charges tbody td { border: 1px solid rgba(242, 75, 67, 0.45); padding: 6px 6px; vertical-align: top; }
.an-charges .an-n { text-align: right; white-space: nowrap; }
.an-charges .an-c { text-align: center; }
.an-footer { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 16px; align-items: start; margin-top: 8px; }
.an-bank-title { font-weight: 700; color: #f24b43; text-transform: uppercase; font-size: 11px; margin-bottom: 8px; }
.an-bank p { margin: 0 0 4px; font-size: 12px; line-height: 1.45; }
.an-totals { font-size: 12px; }
.an-totals-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
.an-totals-row .an-l { font-weight: 700; color: #f24b43; }
.an-totals-row .an-v { font-weight: 600; }
.an-co-footer { text-align: right; font-weight: 800; color: #f24b43; text-transform: uppercase; font-size: 12px; margin-top: 12px; letter-spacing: 0.04em; }
.an-no-print { }
@media print {
  @page { margin: 0; size: auto; }
  html, body { margin: 0 !important; padding: 0 !important; }
  .an-root { box-shadow: none; width: 100%; padding: 20px 28px; }
  .an-no-print { display: none !important; }
}
`;

interface ArrivalNoticeDocumentBodyProps {
  data: ArrivalNoticeViewModel;
  subtotalVnd: number;
  vatVnd: number;
  totalVnd: number;
}

export const ArrivalNoticeDocumentBody = forwardRef<HTMLDivElement, ArrivalNoticeDocumentBodyProps>(
  function ArrivalNoticeDocumentBody({ data, subtotalVnd, vatVnd, totalVnd }, ref) {
    const minRows = Math.max(6, data.chargeRows.length);
    const fillers = Math.max(0, minRows - data.chargeRows.length);
    const rateLabel =
      data.refRateVnd != null
        ? `Exchange rate: VND ${formatMoneyVnd(data.refRateVnd)} / 1 ${data.refRateCurrency}`
        : 'Exchange rate: —';

    return (
      <div ref={ref} className="an-root">
        <style dangerouslySetInnerHTML={{ __html: AR_PRINT_CSS }} />

        <header className="an-header">
          <div className="an-logo-wrap">
            <img src={quotationLogoSrc()} alt="ANLE-SCM Logo" />
          </div>
          <div className="an-company">
            <p className="an-co">COMPANY LTD ANLE-SCM</p>
            <p>0519055056</p>
            <p>MGM@ANLE-SCM.COM</p>
            <p>ANLE-SCM.COM/HOME</p>
            <p>NO 1L, 7L STREET, TAN THUAN WARD, HO CHI MINH CITY, VIETNAM</p>
          </div>
        </header>

        <div className="an-band">
          <div className="an-band-left">ARRIVAL NOTICE</div>
          <div className="an-band-mid">ANLE-SUPPLY CHAIN MANAGEMENT</div>
          <div className="an-band-right">{data.docDateLabel}</div>
        </div>

        <div className="an-to-wrap">
          <div className="an-to-accent" aria-hidden />
          <div className="an-to-label">TO</div>
          <div className="an-to-body">{data.toAddress}</div>
        </div>

        <h2 className="an-section-title">SHIPMENT INFORMATION</h2>
        <div className="an-grid">
          <div className="an-grid-r1">
            <div className="an-cell">
              <div className="an-cell-label">SHIPPER</div>
              <div className="an-cell-val">{data.shipper}</div>
            </div>
            <div className="an-cell">
              <div className="an-cell-label">MASTER B/L</div>
              <div className="an-cell-val">{data.masterBl}</div>
            </div>
            <div className="an-cell">
              <div className="an-cell-label">HOUSE B/L</div>
              <div className="an-cell-val">{data.houseBl}</div>
            </div>
          </div>
          <div className="an-grid-r2">
            <div className="an-cell">
              <div className="an-cell-label">POL</div>
              <div className="an-cell-val">{data.pol}</div>
            </div>
            <div className="an-cell">
              <div className="an-cell-label">POD</div>
              <div className="an-cell-val">{data.pod}</div>
            </div>
          </div>
          <div className="an-grid-r3">
            <div className="an-cell">
              <div className="an-cell-label">PLACE OF RECEIPT</div>
              <div className="an-cell-val">{data.placeOfReceipt}</div>
            </div>
            <div className="an-cell">
              <div className="an-cell-label">ARRIVAL DATE</div>
              <div className="an-cell-val">{data.arrivalDate}</div>
            </div>
            <div className="an-cell">
              <div className="an-cell-label">VESSEL</div>
              <div className="an-cell-val">{data.vessel}</div>
            </div>
            <div className="an-cell">
              <div className="an-cell-label">VOYAGE</div>
              <div className="an-cell-val">{data.voyage}</div>
            </div>
          </div>
        </div>

        <table className="an-cargo">
          <thead>
            <tr>
              <th style={{ width: '14%' }}>MARKS</th>
              <th style={{ width: '16%' }}>QTY & KIND OF PKGS</th>
              <th style={{ width: '38%' }}>DESCRIPTION OF GOODS</th>
              <th style={{ width: '16%' }}>WEIGHT</th>
              <th style={{ width: '16%' }}>VOLUME</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {data.marks}
                {data.showSurrenderedBill ? <div className="an-cargo-badge">SURRENDERED BILL</div> : null}
              </td>
              <td>{data.packages}</td>
              <td>{data.goodsDescription}</td>
              <td>{data.weight}</td>
              <td>{data.volume}</td>
            </tr>
          </tbody>
        </table>

        <div className="an-rate-row">
          <span>{rateLabel}</span>
        </div>

        <table className="an-charges">
          <thead>
            <tr>
              <th style={{ width: '9%' }}>CODE</th>
              <th style={{ width: '28%' }}>DESCRIPTION OF CHARGES</th>
              <th style={{ width: '9%' }}>QTY</th>
              <th style={{ width: '8%' }}>UNIT</th>
              <th style={{ width: '11%' }}>UNIT PRICE</th>
              <th style={{ width: '9%' }}>CURRENCY</th>
              <th style={{ width: '7%' }}>VAT</th>
              <th style={{ width: '19%' }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {data.chargeRows.map((row, i) => (
              <tr key={i}>
                <td className="an-c">{row.code}</td>
                <td>{row.description}</td>
                <td className="an-n">{row.quantity}</td>
                <td className="an-c">{row.unit}</td>
                <td className="an-n">{formatAmountForeign(row.unitPrice, row.currency)}</td>
                <td className="an-c">{row.currency}</td>
                <td className="an-c">{row.vatPercent ? `${row.vatPercent}%` : '—'}</td>
                <td className="an-n">{formatAmountForeign(row.lineTotalForeign, row.currency)}</td>
              </tr>
            ))}
            {Array.from({ length: fillers }).map((_, i) => (
              <tr key={`f-${i}`}>
                <td className="an-c">&nbsp;</td>
                <td>&nbsp;</td>
                <td className="an-n">&nbsp;</td>
                <td className="an-c">&nbsp;</td>
                <td className="an-n">&nbsp;</td>
                <td className="an-c">&nbsp;</td>
                <td className="an-c">&nbsp;</td>
                <td className="an-n">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="an-footer">
          <div>
            <div className="an-bank-title">BANKING INFORMATION</div>
            <div className="an-bank">
              <p>Vietcombank - Joint Stock Commercial Bank for Foreign Trade of Vietnam</p>
              <p>
                <strong>Account Name:</strong> CONG TY TNHH ANLE-SCM
              </p>
              <p>
                <strong>Account No:</strong> 1061963391
              </p>
            </div>
          </div>
          <div className="an-totals">
            <div className="an-totals-row">
              <span className="an-l">Subtotal</span>
              <span className="an-v">VND {formatMoneyVnd(subtotalVnd)}</span>
            </div>
            <div className="an-totals-row">
              <span className="an-l">VAT</span>
              <span className="an-v">VND {formatMoneyVnd(vatVnd)}</span>
            </div>
            <div className="an-totals-row">
              <span className="an-l">Total</span>
              <span className="an-v">VND {formatMoneyVnd(totalVnd)}</span>
            </div>
            <div className="an-totals-row">
              <span className="an-l">Total</span>
              <span className="an-v">
                {data.refRateVnd != null && data.refRateVnd > 0
                  ? `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalVnd / data.refRateVnd)} ${data.refRateCurrency}`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
        <div className="an-co-footer">CONG TY TNHH ANLE - SCM</div>
      </div>
    );
  },
);

function computeVndTotals(rows: ArrivalChargeRow[], rateByCode: Map<string, number>) {
  let subtotalVnd = 0;
  let vatVnd = 0;
  for (const r of rows) {
    const q = r.quantity;
    const p = r.unitPrice;
    const vat = r.vatPercent;
    const exVat = q * p;
    const vatAmt = (exVat * vat) / 100;
    const exV = amountToVnd(exVat, r.currency, rateByCode);
    const vV = amountToVnd(vatAmt, r.currency, rateByCode);
    subtotalVnd += exV ?? 0;
    vatVnd += vV ?? 0;
  }
  return { subtotalVnd, vatVnd, totalVnd: subtotalVnd + vatVnd };
}

const ArrivalNoticePage: React.FC = () => {
  const navigate = useNavigate();
  const { id: jobId } = useParams<{ id: string }>();
  const { error: toastError } = useToastContext();
  const [vm, setVm] = useState<ArrivalNoticeViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const rateByCode = useMemo(() => {
    const m = new Map<string, number>();
    m.set('VND', 1);
    for (const r of exchangeRates) {
      m.set(r.currency_code.trim().toUpperCase(), r.rate);
    }
    return m;
  }, [exchangeRates]);

  const { subtotalVnd, vatVnd, totalVnd } = useMemo(() => {
    if (!vm) return { subtotalVnd: 0, vatVnd: 0, totalVnd: 0 };
    return computeVndTotals(vm.chargeRows, rateByCode);
  }, [vm, rateByCode]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!exportMenuOpen) return;
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [exportMenuOpen]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!jobId) {
        setLoading(false);
        return;
      }
      try {
        const [job, rates] = await Promise.all([
          jobService.getJob(jobId),
          exchangeRateService.getAll(),
        ]);
        if (cancelled) return;
        setExchangeRates(rates);

        let seaBlob: Record<string, unknown> = {};
        try {
          seaBlob = (await jobService.getSeaHouseBl(jobId)) as Record<string, unknown>;
        } catch {
          seaBlob = {};
        }
        if (cancelled) return;

        const { topBar: tb0, header: h0, container: c0, marks: m0 } = mergeSeaState(seaBlob);
        const topBar = { ...tb0, jobNo: ztrim(tb0.jobNo) || ztrim(job.master_job_no) || tb0.jobNo };

        let sales: Sales | null = null;
        if (job.quotation_id) {
          try {
            sales = await salesService.getSalesItemById(job.quotation_id);
          } catch {
            sales = null;
          }
        }
        if (cancelled) return;

        const chargeRows = buildChargeRows(sales);
        const nextVm = buildViewModel(job, topBar, h0, c0, m0, chargeRows, rates);
        setVm(nextVm);
      } catch {
        if (!cancelled) setVm(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const safeFileStem = useCallback(() => {
    if (!vm) return 'arrival-notice';
    return `ArrivalNotice_${vm.masterJobNo}`.replace(/[^\w.-]+/g, '_');
  }, [vm]);

  const handleExportExcel = useCallback(() => {
    if (!vm) return;
    const rows: (string | number)[][] = [
      ['ARRIVAL NOTICE', vm.masterJobNo],
      ['Date', vm.docDateLabel],
      ['TO', vm.toAddress],
      [],
      ['SHIPPER', vm.shipper],
      ['MASTER B/L', vm.masterBl],
      ['HOUSE B/L', vm.houseBl],
      ['POL', vm.pol],
      ['POD', vm.pod],
      ['PLACE OF RECEIPT', vm.placeOfReceipt],
      ['ARRIVAL DATE', vm.arrivalDate],
      ['VESSEL', vm.vessel],
      ['VOYAGE', vm.voyage],
      [],
      ['MARKS', vm.marks],
      ['QTY & KIND OF PKGS', vm.packages],
      ['DESCRIPTION OF GOODS', vm.goodsDescription],
      ['WEIGHT', vm.weight],
      ['VOLUME', vm.volume],
      [],
      ['CODE', 'DESCRIPTION OF CHARGES', 'QTY', 'UNIT', 'UNIT PRICE', 'CURRENCY', 'VAT %', 'AMOUNT'],
    ];
    for (const r of vm.chargeRows) {
      rows.push([
        r.code,
        r.description,
        r.quantity,
        r.unit,
        r.unitPrice,
        r.currency,
        r.vatPercent,
        r.lineTotalForeign,
      ]);
    }
    rows.push([]);
    rows.push(['Subtotal (VND)', subtotalVnd]);
    rows.push(['VAT (VND)', vatVnd]);
    rows.push(['Total (VND)', totalVnd]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ArrivalNotice');
    XLSX.writeFile(wb, `${safeFileStem()}.xlsx`);
    setExportMenuOpen(false);
  }, [vm, subtotalVnd, vatVnd, totalVnd, safeFileStem]);

  const handleExportPdf = useCallback(async () => {
    const el = printRef.current;
    if (!el) {
      queueMicrotask(() => toastError('Could not capture document for PDF.'));
      return;
    }
    setExportBusy(true);
    try {
      await downloadPdfFromElement(el, `${safeFileStem()}.pdf`);
      setExportMenuOpen(false);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'Failed to create PDF.';
      queueMicrotask(() => toastError(msg));
    } finally {
      setExportBusy(false);
    }
  }, [safeFileStem, toastError]);

  const handlePrint = useCallback(() => {
    setExportMenuOpen(false);
    window.print();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-[13px] font-bold text-muted-foreground animate-pulse">Loading arrival notice...</p>
        </div>
      </div>
    );
  }

  if (!vm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-2xl border border-border shadow-sm text-center max-w-md">
          <div className="w-16 h-16 bg-red-100/50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Printer size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Job not found</h3>
          <p className="text-[13px] text-muted-foreground mb-6">Cannot load job data or job does not exist.</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full py-2 bg-primary text-white font-bold rounded-xl active:scale-95 transition-all"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 print:bg-white print:py-0">
      <div className="max-w-[800px] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-border hover:bg-gray-50 transition-all font-bold text-[13px]"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="relative" ref={exportMenuRef}>
          <button
            type="button"
            disabled={exportBusy}
            onClick={() => setExportMenuOpen((o) => !o)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-md hover:bg-primary/90 transition-all font-bold text-[13px] disabled:opacity-60"
          >
            {exportBusy ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
            Print / Export
            <ChevronsDown size={16} className="opacity-90" />
          </button>
          {exportMenuOpen ? (
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[220px] rounded-xl border border-border bg-white py-1 shadow-lg">
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
                onClick={handleExportExcel}
              >
                Save as Excel
              </button>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
                onClick={() => void handleExportPdf()}
              >
                Save as PDF
              </button>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-50 border-t border-border"
                onClick={handlePrint}
              >
                In trang
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <ArrivalNoticeDocumentBody
        ref={printRef}
        data={vm}
        subtotalVnd={subtotalVnd}
        vatVnd={vatVnd}
        totalVnd={totalVnd}
      />
    </div>
  );
};

export default ArrivalNoticePage;
