import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatInputCurrency(value: string | number): string {
  if (value === undefined || value === null || value === '') return '';
  const stringValue = typeof value === 'number' ? value.toString() : value;
  const parts = stringValue.replace(/[^0-9.]/g, '').split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
}

export function formatCurrency(amount: number | string | undefined | null) {
  if (amount === undefined || amount === null || amount === '') return '0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export function parseCurrency(value: string | number): number {
  if (typeof value === 'number') return value;
  const cleanValue = value.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleanValue) || 0;
}

export function formatDate(date: string | Date | undefined | null) {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (err) {
    return '—';
  }
}
