import { defineStepper } from '@stepperize/react';

/**
 * Customer lifecycle steps for [@stepperize/react](https://github.com/damianricobelli/stepperize).
 * IDs align with {@link CustomerStatus} in ../../services/customerService.
 */
export const customerStatusStepper = defineStepper(
  { id: 'new', label: 'New' },
  { id: 'follow_up', label: 'Follow Up' },
  { id: 'quotation_sent', label: 'Quotation Sent' },
  { id: 'meeting', label: 'Meeting' },
  { id: 'lost', label: 'Lost' },
);

export const { Stepper, steps: CUSTOMER_STATUS_STEPS, useStepper } = customerStatusStepper;
