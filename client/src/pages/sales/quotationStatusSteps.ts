import { CheckCircle2, CheckSquare, Edit3, FileCheck, Send } from 'lucide-react';
import type { WorkflowStep } from '../../components/ui/WorkflowStepper';
import type { QuotationStatus } from './types';

export const QUOTATION_STATUS_STEPS: WorkflowStep<QuotationStatus>[] = [
  { id: 'draft', label: 'Draft', icon: Edit3 },
  { id: 'confirmed', label: 'Confirmed', icon: CheckSquare },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'won', label: 'Won', icon: CheckCircle2 },
  { id: 'lost', label: 'Lost', icon: FileCheck },
];
