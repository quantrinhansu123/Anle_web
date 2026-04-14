/** Static tree for UI prototype — B01-DN-style line items (English labels). */

export type BalanceSheetNode = {
  id: string;
  label: string;
  code: string | null;
  balance: number | null;
  /** Strong section row (gray band in reference UI). */
  section?: boolean;
  children?: BalanceSheetNode[];
};

export const BALANCE_SHEET_MOCK: BalanceSheetNode[] = [
  {
    id: '270',
    label: 'TOTAL ASSETS (270 = 100 + 200)',
    code: '270',
    balance: 528_364_648_801,
    section: true,
    children: [
      {
        id: '100',
        label: 'A — CURRENT ASSETS (100 = 110 + 120 + 130 + 140 + 150)',
        code: '100',
        balance: 528_364_648_801,
        section: true,
        children: [
          {
            id: '110',
            label: 'I. Cash and cash equivalents (110 = 111 + 112)',
            code: '110',
            balance: 192_005_500,
            children: [
              { id: '111', label: '1. Cash on hand', code: '111', balance: 180_000_000 },
              { id: '112', label: '2. Cash equivalents', code: '112', balance: 12_005_500 },
            ],
          },
          {
            id: '120',
            label: 'II. Short-term financial investments',
            code: '120',
            balance: null,
            children: [{ id: '121', label: '1. Trading securities', code: '121', balance: null }],
          },
          {
            id: '130',
            label: 'III. Short-term receivables',
            code: '130',
            balance: 1_529_812_603,
            children: [
              { id: '131', label: '1. Trade receivables', code: '131', balance: 1_400_000_000 },
              { id: '132', label: '2. Prepayments to suppliers (short-term)', code: '132', balance: 129_812_603 },
            ],
          },
          {
            id: '140',
            label: 'IV. Inventories (140 = 141 + 149)',
            code: '140',
            balance: 549_693_610,
            children: [
              { id: '141', label: '1. Inventories', code: '141', balance: 520_000_000 },
              { id: '141a', label: '1.a. Total inventories', code: '141a', balance: 510_000_000 },
              { id: '149', label: '2. Provision for decline in value of inventories', code: '149', balance: 29_693_610 },
            ],
          },
          {
            id: '150',
            label: 'V. Other current assets',
            code: '150',
            balance: 526_092_093_088,
            children: [{ id: '151', label: '1. Short-term prepaid expenses', code: '151', balance: 526_092_093_088 }],
          },
        ],
      },
      {
        id: '200',
        label: 'B — NON-CURRENT ASSETS',
        code: '200',
        balance: null,
        section: true,
        children: [
          { id: '210', label: 'I. Long-term receivables', code: '210', balance: null },
          { id: '220', label: 'II. Fixed assets', code: '220', balance: null },
          { id: '230', label: 'III. Investment property', code: '230', balance: null },
        ],
      },
    ],
  },
];

export function collectExpandableIds(nodes: BalanceSheetNode[], out = new Set<string>()): Set<string> {
  for (const n of nodes) {
    if (n.children?.length) {
      out.add(n.id);
      collectExpandableIds(n.children, out);
    }
  }
  return out;
}
