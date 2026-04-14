/** B02-DN style P&L — sample figures for UI (English). */

import type { BalanceSheetNode } from './balanceSheetMock';

export const PROFIT_LOSS_MOCK: BalanceSheetNode[] = [
  {
    id: '01',
    label: 'Revenue from sales and services',
    code: '01',
    balance: 972_501_990,
    children: [
      { id: '01-1', label: 'Goods revenue', code: '01.1', balance: 620_000_000 },
      { id: '01-2', label: 'Service revenue', code: '01.2', balance: 352_501_990 },
    ],
  },
  {
    id: '02',
    label: 'Revenue deductions',
    code: '02',
    balance: null,
    children: [{ id: '02-1', label: 'Trade discounts', code: '02.1', balance: null }],
  },
  {
    id: '10',
    label: 'Net revenue from sales and services (10 = 01 − 02)',
    code: '10',
    balance: 972_501_990,
    section: true,
  },
  {
    id: '11',
    label: 'Cost of goods sold',
    code: '11',
    balance: 112_641_000,
    children: [
      { id: '11-1', label: 'Raw materials and supplies', code: '11.1', balance: 85_000_000 },
      { id: '11-2', label: 'Direct labor and manufacturing overhead', code: '11.2', balance: 27_641_000 },
    ],
  },
  {
    id: '20',
    label: 'Gross profit from sales and services (20 = 10 − 11)',
    code: '20',
    balance: 859_860_990,
    section: true,
  },
  {
    id: '21',
    label: 'Financial income',
    code: '21',
    balance: 84_880,
    children: [{ id: '21-1', label: 'Interest income', code: '21.1', balance: 84_880 }],
  },
  {
    id: '22',
    label: 'Financial expenses',
    code: '22',
    balance: 1_700_670,
    children: [
      { id: '23', label: 'Of which: Interest expense', code: '23', balance: null },
      { id: '22-1', label: 'Bank and financing charges', code: '22.1', balance: 1_700_670 },
    ],
  },
  { id: '25', label: 'Selling expenses', code: '25', balance: null },
  { id: '26', label: 'General and administrative expenses', code: '26', balance: null },
  {
    id: '30',
    label: 'Net operating profit {30 = 20 + (21 − 22) − (25 + 26)}',
    code: '30',
    balance: 858_245_200,
    section: true,
  },
  { id: '31', label: 'Other income', code: '31', balance: null },
  { id: '32', label: 'Other expenses', code: '32', balance: null },
  {
    id: '40',
    label: 'Other profit (40 = 31 − 32)',
    code: '40',
    balance: null,
  },
  {
    id: '50',
    label: 'Total accounting profit before tax (50 = 30 + 40)',
    code: '50',
    balance: 858_245_200,
    section: true,
  },
  { id: '51', label: 'Current corporate income tax expense', code: '51', balance: null },
  { id: '52', label: 'Deferred corporate income tax expense', code: '52', balance: null },
  {
    id: '60',
    label: 'Net profit after tax (60 = 50 − 51 − 52)',
    code: '60',
    balance: 858_245_200,
    section: true,
  },
];
