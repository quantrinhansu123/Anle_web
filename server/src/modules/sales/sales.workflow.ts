import { AppError } from '../../middlewares/error.middleware';

export const CANONICAL_STATUS = ['draft', 'confirmed', 'sent', 'won', 'lost'] as const;
export type CanonicalStatus = (typeof CANONICAL_STATUS)[number];

export const normalizeStatus = (status?: string | null): CanonicalStatus => {
  const current = String(status || 'draft').toLowerCase();
  if (current === 'converted') return 'won';
  if (current === 'final') return 'sent';
  if ((CANONICAL_STATUS as readonly string[]).includes(current)) return current as CanonicalStatus;
  return 'draft';
};

export const ALLOWED_STATUS_TRANSITIONS: Record<CanonicalStatus, CanonicalStatus[]> = {
  draft: ['confirmed'],
  confirmed: ['sent'],
  sent: ['won', 'lost'],
  won: [],
  lost: [],
};

export const assertStatusTransition = (current: CanonicalStatus, next: CanonicalStatus): void => {
  if (current === next) return;
  const allowed = ALLOWED_STATUS_TRANSITIONS[current];
  if (!allowed.includes(next)) {
    throw new AppError(`Invalid quotation status transition from ${current} to ${next}`, 400);
  }
};
