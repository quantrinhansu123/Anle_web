import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Printer, ArrowLeft, Loader2, ChevronsDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { salesService } from '../../services/salesService';
import { exchangeRateService, type ExchangeRate } from '../../services/exchangeRateService';
import { formatDate } from '../../lib/utils';
import { useToastContext } from '../../contexts/ToastContext';
import type { ChargeGroup, SalesChargeItem } from './types';

type Lang = 'vi' | 'en';

const COPY: Record<
  Lang,
  {
    docTitle: string;
    generalInfo: string;
    refNo: string;
    customer: string;
    service: string;
    commodities: string;
    volume: string;
    term: string;
    responsible: string;
    logisticsDept: string;
    pol: string;
    pod: string;
    etd: string;
    eta: string;
    vessel: string;
    currencyLabel: string;
    progress: string;
    colDesc: string;
    colRate: string;
    colQty: string;
    colUnit: string;
    colTotal: string;
    emptyRows: string;
    totalPrefix: string;
    datePrefix: string;
  }
> = {
  vi: {
    docTitle: 'Báo giá dịch vụ logistics',
    generalInfo: 'Thông tin chung',
    refNo: 'Mã Báo Giá',
    customer: 'Khách hàng',
    service: 'Dịch vụ',
    commodities: 'Mặt hàng',
    volume: 'Khối lượng',
    term: 'Điều kiện',
    responsible: 'Người phụ trách',
    logisticsDept: 'Phòng Logistics',
    pol: 'Cảng đi',
    pod: 'Cảng đến',
    etd: 'Ngày tàu chạy',
    eta: 'Ngày tàu đến',
    vessel: 'Tên tàu/ Số chuyến',
    currencyLabel: 'Đơn vị tiền tệ',
    progress: 'Tiến độ xử lý',
    colDesc: '',
    colRate: 'Đơn Giá',
    colQty: 'Số lượng',
    colUnit: 'Đơn vị tính',
    colTotal: 'Tổng',
    emptyRows: 'Chưa có dòng phí / báo giá chi tiết.',
    totalPrefix: 'Tổng :',
    datePrefix: 'Ngày',
  },
  en: {
    docTitle: 'Logistics service quotation',
    generalInfo: 'General information',
    refNo: 'Reference no.',
    customer: 'Customer',
    service: 'Service',
    commodities: 'Commodities',
    volume: 'Volume',
    term: 'Terms',
    responsible: 'Responsible',
    logisticsDept: 'Logistics department',
    pol: 'POL',
    pod: 'POD',
    etd: 'ETD',
    eta: 'ETA',
    vessel: 'Vessel / Voyage',
    currencyLabel: 'Currency',
    progress: 'Processing progress',
    colDesc: 'Description',
    colRate: 'Rate',
    colQty: 'Quantity',
    colUnit: 'Units',
    colTotal: 'Total',
    emptyRows: 'No charge lines.',
    totalPrefix: 'Total:',
    datePrefix: 'Date',
  },
};

/** English hints in parentheses — shown only for Vietnamese document */
const COPY_VI_HINTS = {
  refNo: '(Reference No.)',
  customer: '(Customer)',
  service: '(Service)',
  commodities: '(Commodities)',
  volume: '(Volume)',
  term: '(Term)',
  pol: '(POL)',
  pod: '(POD)',
  etd: '(ETD)',
  eta: '(ETA)',
  colRate: '(Rate)',
  colQty: '(Quantity)',
  colUnit: '(Units)',
  colTotal: '(Total)',
} as const;

interface LegacyItemRow {
  kind: 'legacy';
  description: string;
  rate: number;
  quantity: number | string;
  unit: string;
  total: number;
  exchange_rate: number;
}

interface ChargeItemRow {
  kind: 'charge';
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineCurrency: string;
  lineTotal: number;
}

type ProgressRow = LegacyItemRow | ChargeItemRow;

export interface QuotationData {
  referenceNo: string;
  customer: string;
  service: string;
  commodities: string;
  volume: string;
  term: string;
  pol: string;
  pod: string;
  etd: string;
  eta: string;
  vessel: string;
  /** ISO date string for quote_date */
  quoteDateIso: string;
  progressRows: ProgressRow[];
  currency: string;
}

export interface DisplayedProgressRow {
  description: string;
  displayRate: number;
  quantity: string | number;
  unit: string;
  displayTotal: number;
}

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

const vndPerUnit = (currency: string | undefined, rateByCode: Map<string, number>): number | null => {
  const code = normCurrencyCode(currency);
  if (code === 'VND') return 1;
  const r = rateByCode.get(code);
  if (r == null || !(r > 0)) return null;
  return r;
};

const amountToVnd = (amount: number, currency: string | undefined, rateByCode: Map<string, number>): number | null => {
  const mult = vndPerUnit(currency, rateByCode);
  if (mult == null) return null;
  return amount * mult;
};

const vndToDisplay = (amountVnd: number, viewCurrency: string, rateByCode: Map<string, number>): number => {
  const vc = normCurrencyCode(viewCurrency);
  if (vc === 'VND') return amountVnd;
  const mult = vndPerUnit(viewCurrency, rateByCode);
  if (mult == null || !(mult > 0)) return amountVnd;
  return amountVnd / mult;
};

function buildDisplayedRows(
  data: QuotationData,
  viewCurrency: string,
  rateByCode: Map<string, number>,
  exchangeRates: ExchangeRate[],
): DisplayedProgressRow[] {
  const targetRateObj =
    normCurrencyCode(viewCurrency) === 'VND'
      ? { rate: 1 }
      : exchangeRates.find((r) => r.currency_code === viewCurrency);
  const currentTargetRate = targetRateObj?.rate || 1;

  return data.progressRows.map((row) => {
    let displayRate: number;
    let displayTotal: number;

    if (row.kind === 'legacy') {
      const trRate = currentTargetRate || 1;
      displayRate = (row.rate * row.exchange_rate) / trRate;
      displayTotal = row.total / trRate;
    } else {
      const rateVnd = amountToVnd(row.unitPrice, row.lineCurrency, rateByCode);
      const totalVnd = amountToVnd(row.lineTotal, row.lineCurrency, rateByCode);
      displayRate =
        rateVnd == null ? row.unitPrice : vndToDisplay(rateVnd, viewCurrency, rateByCode);
      displayTotal =
        totalVnd == null ? row.lineTotal : vndToDisplay(totalVnd, viewCurrency, rateByCode);
    }

    return {
      description: row.description,
      displayRate,
      quantity: row.quantity,
      unit: row.unit,
      displayTotal,
    };
  });
}

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

interface QuotationDocumentBodyProps {
  lang: Lang;
  data: QuotationData;
  viewCurrency: string;
  displayedRows: DisplayedProgressRow[];
  totalAmount: number;
  formatProgressNumber: (n: number) => string;
}

/** PDF capture: no Tailwind on this subtree — html2canvas cannot parse oklch() from Tailwind v4. */
const QUOTATION_PRINT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
.quotation-print-root {
  box-sizing: border-box;
  width: 800px;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  background: #ffffff;
  color: #000000;
  padding: 40px 48px;
  min-height: 1131px;
  position: relative;
  overflow: hidden;
  font-family: Inter, system-ui, -apple-system, sans-serif;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
}
.quotation-print-root *, .quotation-print-root *::before, .quotation-print-root *::after { box-sizing: border-box; }
.qp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.qp-logo-wrap { width: 192px; padding-top: 8px; flex-shrink: 0; }
.qp-logo-wrap img { width: 100%; height: auto; display: block; object-fit: contain; }
.qp-company { text-align: right; font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.2em; line-height: 1.6; }
.qp-company .qp-co { font-weight: 600; color: #374151; }
.qp-company p { margin: 0; }
.qp-band { position: relative; width: 100%; margin-bottom: 32px; text-align: center; padding: 10px 0; }
.qp-band-line-t { position: absolute; top: 0; left: 0; right: 0; height: 0; border: 0; border-top: 1px dashed #d1d5db; }
.qp-band-line-b { position: absolute; bottom: 0; left: 0; right: 0; height: 0; border: 0; border-bottom: 1px solid #d1d5db; }
.qp-band-mid { font-size: 10px; color: #9ca3af; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500; position: relative; z-index: 1; }
.qp-title-block { margin-bottom: 32px; }
.qp-title { font-size: 1.875rem; font-weight: 700; color: #f24b43; text-align: center; text-transform: uppercase; letter-spacing: 0.025em; margin: 0; }
.qp-date { text-align: right; font-weight: 600; font-size: 0.875rem; color: #000000; margin-top: 12px; }
.qp-section { margin-bottom: 32px; }
.qp-section-title { color: #f24b43; text-transform: uppercase; font-weight: 700; font-size: 0.875rem; margin: 0 0 8px 0; }
.qp-grid-wrap { border-top: 1px solid #f24b43; border-bottom: 1px solid #f24b43; display: grid; grid-template-columns: 1fr 1fr; position: relative; padding: 8px 0; }
.qp-grid-vline { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: #f24b43; transform: translateX(-50%); }
.qp-col { font-size: 13px; color: #000000; }
.qp-col-left { padding-right: 24px; }
.qp-col-right { padding-left: 24px; }
.qp-col p { margin: 0 0 8px 0; }
.qp-col p:last-child { margin-bottom: 0; }
.qp-strong { font-weight: 700; }
.qp-italic { font-style: italic; }
.qp-currency-note { color: #f24b43; font-weight: 700; font-size: 0.875rem; margin-top: 8px; font-style: italic; }
.qp-hint { font-style: italic; color: #6b7280; font-weight: 400; }
.qp-th-stack { line-height: 1.25; }
.qp-th-hint { display: block; font-style: italic; color: #6b7280; font-size: 11px; font-weight: 400; margin-top: 2px; }
.qp-th-center .qp-th-stack { text-align: center; }
.qp-th-num .qp-th-stack { text-align: right; }
.qp-table { width: 100%; border-collapse: collapse; border-spacing: 0; font-size: 13px; color: #000000; }
.qp-th, .qp-td { padding: 8px 12px; vertical-align: top; }
.qp-th { font-weight: 400; text-align: left; }
/* Borders on cells — <tr> borders are unreliable with border-collapse: separate */
.qp-table thead th {
  border-top: 1px solid #f24b43;
  border-bottom: 1px solid #f24b43;
}
.qp-table tbody tr:last-child td {
  border-bottom: 1px solid rgba(242, 75, 67, 0.35);
}
.qp-th-num { text-align: right; }
.qp-th-center { text-align: center; }
.qp-border-l { border-left: 1px solid rgba(242, 75, 67, 0.35); }
.qp-td-num { text-align: right; }
.qp-td-center { text-align: center; }
.qp-tbody { font-weight: 500; }
.qp-td { padding-top: 6px; padding-bottom: 6px; }
.qp-empty { text-align: center; color: #6b7280; font-style: italic; font-size: 12px; padding: 24px 12px; }
.qp-total-row { display: flex; justify-content: flex-end; padding: 16px 12px 0; margin-top: 0; color: #000000; }
.qp-total { font-weight: 700; font-size: 16px; margin: 0; }
@media print {
  @page { margin: 0; size: auto; }
  body { margin: 0; padding: 0; }
  .quotation-print-root { box-shadow: none; width: 100%; min-height: auto; padding: 24px 32px; }
  .qp-print-no-break { break-inside: avoid; }
}
`;

export const QuotationDocumentBody = forwardRef<HTMLDivElement, QuotationDocumentBodyProps>(
  function QuotationDocumentBody(
    { lang, data, viewCurrency, displayedRows, totalAmount, formatProgressNumber },
    ref,
  ) {
    const L = COPY[lang];
    const H = lang === 'vi' ? COPY_VI_HINTS : null;
    const dateLine =
      lang === 'vi'
        ? `${L.datePrefix} ${formatDate(data.quoteDateIso)}`
        : `${L.datePrefix}: ${formatDate(data.quoteDateIso)}`;

    const viHint = (key: keyof typeof COPY_VI_HINTS) =>
      H ? (
        <>
          {' '}
          <i className="qp-hint">{H[key]}</i>{' '}
        </>
      ) : (
        ' '
      );

    const thLabel = (main: string, hintKey: keyof typeof COPY_VI_HINTS | null) => {
      if (lang !== 'vi' || !hintKey) return main;
      return (
        <span className="qp-th-stack">
          {main}
          <i className="qp-th-hint">{H![hintKey]}</i>
        </span>
      );
    };

    return (
      <div ref={ref} className="quotation-print-root">
        <style dangerouslySetInnerHTML={{ __html: QUOTATION_PRINT_CSS }} />

        <header className="qp-header">
          <div className="qp-logo-wrap">
            <img src={quotationLogoSrc()} alt="ANLE-SCM Logo" />
          </div>
          <div className="qp-company">
            <p className="qp-co">CÔNG TY TNHH ANLE-SCM</p>
            <p>0519055056</p>
            <p>MGM@ANLE-SCM.COM</p>
            <p>ANLE-SCM.COM/HOME</p>
            <p>NO 1L, 7L STREET, TAN THUAN WARD, HO CHI MINH CITY, VIETNAM</p>
          </div>
        </header>

        <div className="qp-band">
          <div className="qp-band-line-t" />
          <div className="qp-band-mid">ANLE-SUPPLY CHAIN MANAGEMENT</div>
          <div className="qp-band-line-b" />
        </div>

        <div className="qp-title-block">
          <h1 className="qp-title">{L.docTitle}</h1>
          <div className="qp-date">{dateLine}</div>
        </div>

        <div className="qp-section qp-print-no-break">
          <h2 className="qp-section-title">{L.generalInfo}</h2>
          <div className="qp-grid-wrap">
            <div className="qp-grid-vline" aria-hidden />
            <div className="qp-col qp-col-left">
              <p>
                {L.refNo}
                {viHint('refNo')}
                <span className="qp-strong">{data.referenceNo}</span>
              </p>
              <p>
                {L.customer}
                {viHint('customer')}
                <span className="qp-strong">{data.customer}</span>
              </p>
              <p>
                {L.service}
                {viHint('service')}
                <span className="qp-strong">{data.service}</span>
              </p>
              <p>
                {L.commodities}
                {viHint('commodities')}
                <span className="qp-strong">{data.commodities}</span>
              </p>
              <p>
                {L.volume}
                {viHint('volume')}
                <span className="qp-strong">{data.volume}</span>
              </p>
              <p>
                {L.term}
                {viHint('term')}
                <span className="qp-strong">{data.term}</span>
              </p>
            </div>
            <div className="qp-col qp-col-right">
              <p>
                {L.responsible} : <span className="qp-strong qp-italic">{L.logisticsDept}</span>
              </p>
              <p>
                {L.pol}
                {viHint('pol')}
                <span className="qp-strong">{data.pol}</span>
              </p>
              <p>
                {L.pod}
                {viHint('pod')}
                <span className="qp-strong">{data.pod}</span>
              </p>
              <p>
                {L.etd}
                {viHint('etd')}
                <span className="qp-strong">{data.etd}</span>
              </p>
              <p>
                {L.eta}
                {viHint('eta')}
                <span className="qp-strong">{data.eta}</span>
              </p>
              <p>
                {L.vessel} <span className="qp-strong">{data.vessel}</span>
              </p>
            </div>
          </div>
          <p className="qp-currency-note">
            {L.currencyLabel}: {viewCurrency}
          </p>
        </div>

        <div className="qp-section qp-print-no-break">
          <h2 className="qp-section-title">{L.progress}</h2>
          <table className="qp-table">
            <thead>
              <tr>
                <th className="qp-th" style={{ width: '40%' }}>
                  {L.colDesc}
                </th>
                <th className="qp-th qp-th-num qp-border-l" style={{ width: '15%' }}>
                  {thLabel(L.colRate, 'colRate')}
                </th>
                <th className="qp-th qp-th-num qp-border-l" style={{ width: '15%' }}>
                  {thLabel(L.colQty, 'colQty')}
                </th>
                <th className="qp-th qp-th-center qp-border-l" style={{ width: '15%' }}>
                  {thLabel(L.colUnit, 'colUnit')}
                </th>
                <th className="qp-th qp-th-num qp-border-l" style={{ width: '15%' }}>
                  {thLabel(L.colTotal, 'colTotal')}
                </th>
              </tr>
            </thead>
            <tbody className="qp-tbody">
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="qp-empty">
                    {L.emptyRows}
                  </td>
                </tr>
              ) : null}
              {displayedRows.map((row, index) => (
                <tr key={index}>
                  <td className="qp-td">{row.description}</td>
                  <td className="qp-td qp-td-num qp-border-l">{formatProgressNumber(row.displayRate)}</td>
                  <td className="qp-td qp-td-num qp-border-l">{row.quantity}</td>
                  <td className="qp-td qp-td-center qp-border-l">{row.unit}</td>
                  <td className="qp-td qp-td-num qp-border-l">{formatProgressNumber(row.displayTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="qp-total-row">
            <p className="qp-total">
              {L.totalPrefix} {formatProgressNumber(totalAmount)} {viewCurrency}
            </p>
          </div>
        </div>
      </div>
    );
  },
);

const HoadonAnle: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { error: toastError } = useToastContext();
  const [data, setData] = useState<QuotationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewCurrency, setViewCurrency] = useState<string>('');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const printRefVi = useRef<HTMLDivElement>(null);
  const printRefEn = useRef<HTMLDivElement>(null);

  const rateByCode = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of exchangeRates) {
      m.set(r.currency_code.trim().toUpperCase(), r.rate);
    }
    return m;
  }, [exchangeRates]);

  const displayedRows = useMemo(() => {
    if (!data) return [];
    return buildDisplayedRows(data, viewCurrency, rateByCode, exchangeRates);
  }, [data, viewCurrency, rateByCode, exchangeRates]);

  const totalAmount = useMemo(
    () => displayedRows.reduce((s, r) => s + r.displayTotal, 0),
    [displayedRows],
  );

  const formatProgressNumber = useCallback(
    (n: number) =>
      normCurrencyCode(viewCurrency) === 'VND'
        ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(n))
        : new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n),
    [viewCurrency],
  );

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
    const fetchData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const [item, rates] = await Promise.all([
          salesService.getSalesItemById(id),
          exchangeRateService.getAll(),
        ]);
        setExchangeRates(rates);

        if (item) {
          const headerCurrency = item.currency_code?.trim() || item.sales_items?.[0]?.currency || 'VND';
          const chargeList = (item.sales_charge_items || [])
            .filter((c) => !isBlankChargeLine(c))
            .sort((a, b) => {
              const ga = CHARGE_GROUP_ORDER.indexOf(a.charge_group);
              const gb = CHARGE_GROUP_ORDER.indexOf(b.charge_group);
              const oa = ga === -1 ? 99 : ga;
              const ob = gb === -1 ? 99 : gb;
              if (oa !== ob) return oa - ob;
              return (a.display_order ?? 0) - (b.display_order ?? 0);
            });

          const progressRows: ProgressRow[] =
            chargeList.length > 0
              ? chargeList.map((c) => {
                  const q = Number(c.quantity) || 0;
                  const p = Number(c.unit_price) || 0;
                  const vat = Number(c.vat_percent) || 0;
                  const exVat = q * p;
                  const lineTotal = exVat + (exVat * vat) / 100;
                  return {
                    kind: 'charge' as const,
                    description: chargeLineLabel(c),
                    quantity: q,
                    unit: ztrim(c.unit) || '—',
                    unitPrice: p,
                    lineCurrency: normCurrencyCode(c.currency),
                    lineTotal,
                  };
                })
              : (item.sales_items || []).map((si) => ({
                  kind: 'legacy' as const,
                  description: si.description,
                  rate: si.rate,
                  quantity: si.quantity,
                  unit: si.unit,
                  total: si.total || 0,
                  exchange_rate: si.exchange_rate || 1,
                }));

          const quoteDateIso = item.quote_date || new Date().toISOString().slice(0, 10);

          const mapped: QuotationData = {
            referenceNo: item.no_doc || item.id.slice(0, 10).toUpperCase(),
            customer:
              ztrim(item.customer_trade_name) ||
              item.shipments?.customers?.company_name ||
              'Individual / Regular',
            service: 'Logistics Service',
            commodities: item.goods?.trim() || item.sales_items?.[0]?.description || 'Multiple Items',
            volume: item.cargo_volume?.trim()
              ? item.cargo_volume
              : item.sales_items?.[0]
                ? `${item.sales_items[0].quantity} ${item.sales_items[0].unit}`
                : 'N/A',
            term: item.incoterms?.trim() || item.shipments?.term?.trim() || 'N/A',
            pol: item.shipments?.pol || 'N/A',
            pod: item.shipments?.pod || 'N/A',
            etd: formatDate(item.shipments?.etd),
            eta: formatDate(item.shipments?.eta),
            vessel: 'N/A',
            quoteDateIso,
            currency: headerCurrency,
            progressRows,
          };
          setData(mapped);
          setViewCurrency(headerCurrency);
        }
      } catch (err) {
        console.error('Failed to fetch quotation:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const safeFileStem = useCallback(() => {
    if (!data) return 'quotation';
    return data.referenceNo.replace(/[^\w.-]+/g, '_');
  }, [data]);

  const handleExportExcel = useCallback(() => {
    if (!data) return;
    const L = COPY.en;
    const rows: (string | number)[][] = [
      [L.refNo, data.referenceNo],
      [L.customer, data.customer],
      [L.service, data.service],
      [L.commodities, data.commodities],
      [L.volume, data.volume],
      [L.term, data.term],
      [L.pol, data.pol],
      [L.pod, data.pod],
      [L.etd, data.etd],
      [L.eta, data.eta],
      [L.vessel, data.vessel],
      [L.currencyLabel, viewCurrency],
      [],
      [L.colDesc || 'Description', `${L.colRate} (${viewCurrency})`, L.colQty, L.colUnit, `${L.colTotal} (${viewCurrency})`],
    ];
    for (const r of displayedRows) {
      rows.push([r.description, r.displayRate, r.quantity, r.unit, r.displayTotal]);
    }
    rows.push([]);
    rows.push([`${L.totalPrefix} ${viewCurrency}`, '', '', '', totalAmount]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quotation');
    XLSX.writeFile(wb, `${safeFileStem()}.xlsx`);
    setExportMenuOpen(false);
  }, [data, displayedRows, totalAmount, viewCurrency, safeFileStem]);

  const handleExportPdf = useCallback(
    async (lang: Lang) => {
      const ref = lang === 'vi' ? printRefVi : printRefEn;
      const el = ref.current;
      if (!el) {
        queueMicrotask(() => toastError('Could not capture document for PDF.'));
        return;
      }
      setExportBusy(true);
      try {
        await downloadPdfFromElement(el, `${safeFileStem()}_${lang === 'en' ? 'EN' : 'VI'}.pdf`);
        setExportMenuOpen(false);
      } catch (e) {
        console.error(e);
        const msg = e instanceof Error ? e.message : 'Failed to create PDF.';
        queueMicrotask(() => toastError(msg));
      } finally {
        setExportBusy(false);
      }
    },
    [safeFileStem, toastError],
  );

  const handlePrint = useCallback(() => {
    setExportMenuOpen(false);
    window.print();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-[13px] font-bold text-muted-foreground animate-pulse">Loading quotation…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-2xl border border-border shadow-sm text-center max-w-md">
          <div className="w-16 h-16 bg-red-100/50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Printer size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No quotation found</h3>
          <p className="text-[13px] text-muted-foreground mb-6">
            We could not find this quotation in the system.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2 bg-primary text-white font-bold rounded-xl active:scale-95 transition-all"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 print:bg-white print:py-0">
      <div className="max-w-[800px] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-border hover:bg-gray-50 transition-all font-bold text-[13px]"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="flex items-center gap-3">
          <select
            value={viewCurrency}
            onChange={(e) => setViewCurrency(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-white text-[13px] font-bold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 appearance-none min-w-[100px]"
          >
            <option value="VND">VND</option>
            {exchangeRates.map((r) => (
              <option key={r.id} value={r.currency_code}>
                {r.currency_code}
              </option>
            ))}
            {!exchangeRates.find((r) => r.currency_code === data.currency) && data.currency !== 'VND' && (
              <option value={data.currency}>{data.currency}</option>
            )}
          </select>
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              disabled={exportBusy}
              onClick={() => setExportMenuOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-md hover:bg-primary/90 transition-all font-bold text-[13px] disabled:opacity-60"
            >
              {exportBusy ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
              Print quotation
              <ChevronsDown size={16} className="opacity-90" />
            </button>
            {exportMenuOpen ? (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[220px] rounded-xl border border-border bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={handleExportExcel}
                >
                  Save to Excel
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={() => void handleExportPdf('en')}
                >
                  Save to PDF
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={() => void handleExportPdf('vi')}
                >
                  Save PDF (Vietnamese)
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-50 border-t border-border"
                  onClick={handlePrint}
                >
                  Print
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="print:block">
        <QuotationDocumentBody
          ref={printRefEn}
          lang="en"
          data={data}
          viewCurrency={viewCurrency}
          displayedRows={displayedRows}
          totalAmount={totalAmount}
          formatProgressNumber={formatProgressNumber}
        />
      </div>

      <div className="fixed left-[-10000px] top-0 print:hidden pointer-events-none w-[800px]" aria-hidden>
        <QuotationDocumentBody
          ref={printRefVi}
          lang="vi"
          data={data}
          viewCurrency={viewCurrency}
          displayedRows={displayedRows}
          totalAmount={totalAmount}
          formatProgressNumber={formatProgressNumber}
        />
      </div>
    </div>
  );
};

export default HoadonAnle;
