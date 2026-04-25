import type { DnLineSeed } from './mapQuotationToDebitNoteLines';

export interface ShipmentCostSnapshot {
  trucking: number;
  agent: number;
  customs: number;
  other: number;
}

/**
 * Build debit-note line seeds from planned vs actual variance plus explicit incurred fees.
 * Only positive variance (actual − planned) becomes a line, plus any `incurred` amount.
 */
export function buildDebitLineSeedsFromApprovedCosts(
  planned: ShipmentCostSnapshot,
  actual: ShipmentCostSnapshot,
  incurred: number,
): DnLineSeed[] {
  const seeds: DnLineSeed[] = [];
  const keys = ['trucking', 'customs', 'agent', 'other'] as const;
  const labels: Record<(typeof keys)[number], string> = {
    trucking: 'Phát sinh — Trucking',
    customs: 'Phát sinh — Customs',
    agent: 'Phát sinh — Agent',
    other: 'Phát sinh — Chi phí khác',
  };
  const fareType: Record<(typeof keys)[number], string> = {
    trucking: 'freight',
    customs: 'customs',
    agent: 'handling',
    other: 'other',
  };

  for (const k of keys) {
    const diff = Math.max(0, (Number(actual[k]) || 0) - (Number(planned[k]) || 0));
    if (diff > 0) {
      seeds.push({
        service_code: 'COST-VAR',
        fare: 'surcharge',
        fare_type: fareType[k],
        fare_name: labels[k],
        tax: 'exempt',
        currency: 'VND',
        exchange_rate: 1,
        unit: 'Job',
        qty: 1,
        rate: diff,
      });
    }
  }

  const extra = Math.max(0, Number(incurred) || 0);
  if (extra > 0) {
    seeds.push({
      service_code: 'INCURRED',
      fare: 'surcharge',
      fare_type: 'other',
      fare_name: 'Phí phát sinh (đã duyệt Sales)',
      tax: 'exempt',
      currency: 'VND',
      exchange_rate: 1,
      unit: 'Job',
      qty: 1,
      rate: extra,
    });
  }

  return seeds;
}
