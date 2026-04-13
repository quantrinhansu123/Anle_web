import { defineStepper } from '@stepperize/react';

/**
 * Quotation lifecycle steps for [@stepperize/react](https://github.com/damianricobelli/stepperize).
 * IDs align with {@link QuotationStatus} in ./types.
 */
export const quotationStatusStepper = defineStepper(
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'converted', label: 'Converted' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'final', label: 'Final' },
);

export const { Stepper, steps: QUOTATION_STATUS_STEPS, useStepper } = quotationStatusStepper;
