import { defineStepper } from '@stepperize/react';
import type { JobWorkflowStatus } from './types';

/** IDs align with {@link JobWorkflowStatus}. */
export const jobWorkflowStepper = defineStepper(
  { id: 'draft' as JobWorkflowStatus, label: 'Draft' },
  { id: 'closed' as JobWorkflowStatus, label: 'Closed' },
  { id: 'cancelled' as JobWorkflowStatus, label: 'Cancelled' },
);

export const { Stepper, steps: JOB_WORKFLOW_STEPS, useStepper } = jobWorkflowStepper;
