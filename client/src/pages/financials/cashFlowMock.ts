/** B03-DN style statement of cash flows — sample data (English). */

import type { BalanceSheetNode } from './balanceSheetMock';

export const CASH_FLOW_MOCK: BalanceSheetNode[] = [
  {
    id: 'sec-I',
    label: 'I. Cash flows from operating activities',
    code: '20',
    balance: 192_005_500,
    section: true,
    children: [
      {
        id: '01',
        label: '1. Receipts from sales, provision of services, and other operating revenue',
        code: '01',
        balance: 890_000_000,
        children: [
          { id: '01-1', label: '1.1 Direct cash receipts', code: '01.1', balance: 600_000_000 },
          { id: '01-2', label: '1.2 Receipts via accounts receivable', code: '01.2', balance: 290_000_000 },
        ],
      },
      {
        id: '02',
        label: '2. Payments to suppliers of goods and services',
        code: '02',
        balance: -420_000_000,
      },
      {
        id: '03',
        label: '3. Payments to employees',
        code: '03',
        balance: -150_000_000,
      },
      {
        id: '04',
        label: '4. Interest paid',
        code: '04',
        balance: -12_000_000,
      },
      {
        id: '05',
        label: '5. Corporate income tax paid',
        code: '05',
        balance: -45_000_000,
      },
      {
        id: '06',
        label: '6. Other receipts from operating activities',
        code: '06',
        balance: 4_637_500,
      },
      {
        id: '07',
        label: '7. Other payments for operating activities',
        code: '07',
        balance: -75_632_000,
      },
    ],
  },
  {
    id: 'sec-II',
    label: 'II. Cash flows from investing activities',
    code: '30',
    balance: -48_500_000,
    section: true,
    children: [
      {
        id: '21',
        label: '1. Cash paid for acquisition and construction of fixed assets and other long-term assets',
        code: '21',
        balance: -60_000_000,
      },
      {
        id: '22',
        label: '2. Cash received from disposal of fixed assets and other long-term assets',
        code: '22',
        balance: 8_000_000,
        children: [
          {
            id: '22-1',
            label: '2.1 Proceeds from disposal (direct to Cash)',
            code: '22.1',
            balance: 10_000_000,
          },
          {
            id: '22-2',
            label: '2.2 Payments for liquidation costs (offset against Cash)',
            code: '22.2',
            balance: -1_500_000,
          },
          {
            id: '22-3',
            label: '2.3 Proceeds from liquidation (offset against receivables)',
            code: '22.3',
            balance: null,
          },
          {
            id: '22-4',
            label: '2.4 Payments for liquidation costs (offset against payables)',
            code: '22.4',
            balance: -500_000,
          },
        ],
      },
      {
        id: '23',
        label: '3. Cash paid for loans and purchase of debt instruments of other entities',
        code: '23',
        balance: null,
      },
      {
        id: '24',
        label: '4. Cash received from collection of loans and sale of debt instruments of other entities',
        code: '24',
        balance: null,
      },
      {
        id: '25',
        label: '5. Cash paid for equity investments in other entities',
        code: '25',
        balance: -15_000_000,
        children: [
          { id: '25-1', label: '5.1 Direct payment in cash', code: '25.1', balance: -10_000_000 },
          { id: '25-2', label: '5.2 Payment through liabilities', code: '25.2', balance: -5_000_000 },
        ],
      },
      {
        id: '26',
        label: '6. Cash received from recovery of equity investments in other entities',
        code: '26',
        balance: 3_500_000,
        children: [
          { id: '26-1', label: '6.1 Direct receipts in cash', code: '26.1', balance: 2_000_000 },
          { id: '26-2', label: '6.2 Receipts through liabilities', code: '26.2', balance: 1_500_000 },
        ],
      },
      {
        id: '27',
        label: '7. Interest, dividends, and profit shares received',
        code: '27',
        balance: 15_000_000,
        children: [
          { id: '27-1', label: '7.1 Direct receipts in cash', code: '27.1', balance: 9_000_000 },
          { id: '27-2', label: '7.2 Receipts through liabilities', code: '27.2', balance: 6_000_000 },
        ],
      },
    ],
  },
  {
    id: 'sec-III',
    label: 'III. Cash flows from financing activities',
    code: '40',
    balance: 88_000_000,
    section: true,
    children: [
      {
        id: '31',
        label: '1. Cash received from issuing shares and capital contributions from owners',
        code: '31',
        balance: 50_000_000,
      },
      {
        id: '32',
        label: '2. Cash paid to return capital to owners and repurchase of issued shares',
        code: '32',
        balance: null,
      },
      {
        id: '33',
        label: '3. Cash received from borrowings',
        code: '33',
        balance: 120_000_000,
      },
      {
        id: '34',
        label: '4. Cash paid for principal repayment of borrowings',
        code: '34',
        balance: -70_000_000,
      },
      {
        id: '35',
        label: '5. Cash paid for principal under finance leases',
        code: '35',
        balance: -8_000_000,
      },
      {
        id: '36',
        label: '6. Dividends and profits paid to owners',
        code: '36',
        balance: -4_000_000,
        children: [
          { id: '36-1', label: '6.1 Direct payment in cash', code: '36.1', balance: -3_000_000 },
          { id: '36-2', label: '6.2 Payment through liabilities', code: '36.2', balance: -1_000_000 },
        ],
      },
    ],
  },
];
