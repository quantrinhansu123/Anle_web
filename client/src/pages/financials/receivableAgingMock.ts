/** Sample A/R aging — layout prototype (English). */

export type ReceivableAgingInvoice = {
  id: string;
  label: string;
  invoiceDate: string | null;
  currency: string;
  account: string;
  dueDate: string | null;
  onDate: string | null;
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  d5: number;
  total: number;
};

export type ReceivableAgingPartner = {
  id: string;
  name: string;
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  d5: number;
  total: number;
  invoices: ReceivableAgingInvoice[];
};

export const DEFAULT_ACCOUNT = { code: '131', label: 'Trade receivables' };

export const RECEIVABLE_AGING_PARTNERS: ReceivableAgingPartner[] = [
  {
    id: 'p-bliss',
    name: 'BLISS FOOD',
    d1: 45_000_000,
    d2: 28_500_000,
    d3: 12_000_000,
    d4: 5_200_000,
    d5: 2_852_985,
    total: 93_552_985,
    invoices: [
      {
        id: 'p-bliss-1',
        label: 'INV-2026-0142',
        invoiceDate: '2026-01-12',
        currency: 'VND',
        account: '131',
        dueDate: '2026-02-11',
        onDate: '2026-03-19',
        d1: 30_000_000,
        d2: 0,
        d3: 0,
        d4: 0,
        d5: 0,
        total: 30_000_000,
      },
      {
        id: 'p-bliss-2',
        label: 'INV-2025-0881',
        invoiceDate: '2025-11-20',
        currency: 'VND',
        account: '131',
        dueDate: '2025-12-20',
        onDate: '2026-03-19',
        d1: 0,
        d2: 18_500_000,
        d3: 12_000_000,
        d4: 0,
        d5: 0,
        total: 30_500_000,
      },
      {
        id: 'p-bliss-3',
        label: 'INV-2025-0603',
        invoiceDate: '2025-09-05',
        currency: 'VND',
        account: '131',
        dueDate: '2025-10-05',
        onDate: '2026-03-19',
        d1: 15_000_000,
        d2: 10_000_000,
        d3: 0,
        d4: 5_200_000,
        d5: 2_852_985,
        total: 33_052_985,
      },
    ],
  },
  {
    id: 'p-abc',
    name: 'ABC Company Ltd.',
    d1: 3_050_000,
    d2: 0,
    d3: 16_900_000,
    d4: 0,
    d5: 0,
    total: 19_950_000,
    invoices: [
      {
        id: 'p-abc-1',
        label: 'INV-2026-0098',
        invoiceDate: '2026-02-01',
        currency: 'VND',
        account: '131',
        dueDate: '2026-03-03',
        onDate: '2026-03-19',
        d1: 3_050_000,
        d2: 0,
        d3: 0,
        d4: 0,
        d5: 0,
        total: 3_050_000,
      },
      {
        id: 'p-abc-2',
        label: 'INV-2025-1204',
        invoiceDate: '2025-12-01',
        currency: 'VND',
        account: '131',
        dueDate: '2026-01-15',
        onDate: '2026-03-19',
        d1: 0,
        d2: 0,
        d3: 16_900_000,
        d4: 0,
        d5: 0,
        total: 16_900_000,
      },
    ],
  },
  {
    id: 'p-credit',
    name: 'Credit notes (unallocated)',
    d1: -96_552_000,
    d2: 0,
    d3: 0,
    d4: 0,
    d5: 0,
    total: -96_552_000,
    invoices: [
      {
        id: 'p-credit-1',
        label: 'CN-2026-0003',
        invoiceDate: '2026-03-01',
        currency: 'VND',
        account: '131',
        dueDate: null,
        onDate: '2026-03-19',
        d1: -96_552_000,
        d2: 0,
        d3: 0,
        d4: 0,
        d5: 0,
        total: -96_552_000,
      },
    ],
  },
  {
    id: 'p-north',
    name: 'Northwind Trading',
    d1: 0,
    d2: 7_200_000,
    d3: 0,
    d4: 4_100_000,
    d5: 1_000_000,
    total: 12_300_000,
    invoices: [
      {
        id: 'p-north-1',
        label: 'INV-2026-0011',
        invoiceDate: '2026-01-28',
        currency: 'VND',
        account: '131',
        dueDate: '2026-02-27',
        onDate: '2026-03-19',
        d1: 0,
        d2: 7_200_000,
        d3: 0,
        d4: 0,
        d5: 0,
        total: 7_200_000,
      },
      {
        id: 'p-north-2',
        label: 'INV-2025-0412',
        invoiceDate: '2025-08-10',
        currency: 'VND',
        account: '131',
        dueDate: '2025-09-25',
        onDate: '2026-03-19',
        d1: 0,
        d2: 0,
        d3: 0,
        d4: 4_100_000,
        d5: 1_000_000,
        total: 5_100_000,
      },
    ],
  },
];
