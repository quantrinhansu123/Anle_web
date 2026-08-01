/** Standard job titles shown in employee Position dropdown (English). */
export const EMPLOYEE_POSITION_OPTIONS = [
  'Director',
  'Vice Director',
  'Advisor - Assistant',
  'Internal Accountant',
  'Cleaner',
  'Administration - Legal',
  'Cashier',
  'Tax Accountant',
  'Purchasing',
  'Documentation',
  'Field Operations',
] as const;

/** Map legacy Vietnamese (and variants) → English. Already-English values are omitted. */
export const POSITION_VI_TO_EN: Record<string, string> = {
  'Giám Đốc': 'Director',
  'Giám đốc': 'Director',
  'Phó Giám Đốc': 'Vice Director',
  'Phó Giám đốc': 'Vice Director',
  'Phó giám đốc': 'Vice Director',
  'Deputy Director': 'Vice Director',
  'Assistant Director': 'Vice Director',
  'Cố vấn - Trợ lí': 'Advisor - Assistant',
  'Cố vấn - Trợ lý': 'Advisor - Assistant',
  'Cố Vấn - Trợ Lí': 'Advisor - Assistant',
  'Kế Toán Nội Bộ': 'Internal Accountant',
  'Kế toán nội bộ': 'Internal Accountant',
  'Lao Công': 'Cleaner',
  'Lao công': 'Cleaner',
  'Hành Chính- Pháp Chế': 'Administration - Legal',
  'Hành Chính - Pháp Chế': 'Administration - Legal',
  'Hành chính - Pháp chế': 'Administration - Legal',
  'Hành Chính-Pháp Chế': 'Administration - Legal',
  'Thủ Quỹ': 'Cashier',
  'Thủ quỹ': 'Cashier',
  'Kế Toán Thuế': 'Tax Accountant',
  'Kế toán thuế': 'Tax Accountant',
  'Mua Hàng': 'Purchasing',
  'Mua hàng': 'Purchasing',
  'Chứng Từ': 'Documentation',
  'Chứng từ': 'Documentation',
  'Hiện Trường': 'Field Operations',
  'Hiện trường': 'Field Operations',
};

export function toEnglishPosition(value: string | null | undefined): string {
  const trimmed = (value || '').replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  return POSITION_VI_TO_EN[trimmed] || trimmed;
}
