import React from 'react';
import { clsx } from 'clsx';
import {
  CirclePlus,
  PhoneCall,
  Send,
  Users,
  CircleX,
  type LucideIcon,
} from 'lucide-react';
import { useStepItemContext } from '@stepperize/react/primitives';
import type { CustomerStatus } from '../../services/customerService';
import { CUSTOMER_STATUS_STEPS, Stepper, useStepper } from './customerStatusStepper';

const STEP_ICONS: Record<CustomerStatus, LucideIcon> = {
  new: CirclePlus,
  follow_up: PhoneCall,
  quotation_sent: Send,
  meeting: Users,
  lost: CircleX,
};

const CustomerStepNode: React.FC<{
  stepId: CustomerStatus;
  label: string;
  index: number;
  total: number;
  variant: 'mobile' | 'desktop';
}> = ({ stepId, label, index, total, variant }) => {
  const item = useStepItemContext();
  const stepper = useStepper();
  const currentIdx = stepper.state.current.index;
  const stepStatus = item.status;
  const isActive = stepStatus === 'active';
  const isCompleted = stepStatus === 'success';
  const Icon = STEP_ICONS[stepId];
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const circleSize = variant === 'desktop' ? 'size-10' : 'size-9';
  const iconSize = variant === 'desktop' ? 'size-[18px]' : 'size-4';

  const leftConnectorLit = !isFirst && currentIdx >= index;
  const rightConnectorLit = !isLast && currentIdx > index;
  const segmentCls = (lit: boolean) =>
    clsx('h-0.5 w-full min-w-0 rounded-full transition-colors', lit ? 'bg-primary/40' : 'bg-slate-200');

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch">
      <div className="flex w-full min-h-10 items-center">
        <div className="flex min-h-[2px] flex-1 basis-0 items-center pe-0.5">
          {!isFirst && <div className={segmentCls(leftConnectorLit)} aria-hidden />}
        </div>
        <div
          className={clsx(
            'relative z-1 flex shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            circleSize,
            isActive &&
              'border-primary bg-primary text-white shadow-md shadow-primary/25',
            isCompleted &&
              !isActive &&
              'border-primary/40 bg-primary/15 text-slate-700 shadow-sm',
            stepStatus === 'inactive' && 'border-slate-200 bg-slate-100 text-slate-500',
          )}
        >
          <Icon className={iconSize} strokeWidth={2} aria-hidden />
        </div>
        <div className="flex min-h-[2px] flex-1 basis-0 items-center ps-0.5">
          {!isLast && <div className={segmentCls(rightConnectorLit)} aria-hidden />}
        </div>
      </div>
      <p
        className={clsx(
          'mt-2 w-full text-center leading-tight',
          variant === 'desktop' ? 'text-[11px]' : 'text-[10px]',
          isActive && 'font-bold text-slate-900',
          isCompleted && !isActive && 'font-semibold text-slate-700',
          stepStatus === 'inactive' && 'font-medium text-slate-500',
        )}
      >
        {label}
      </p>
    </div>
  );
};

export const CustomerStatusStepperView: React.FC<{
  currentStatus: CustomerStatus;
  variant: 'mobile' | 'desktop';
}> = ({ currentStatus, variant }) => {
  const steps = CUSTOMER_STATUS_STEPS;
  const total = steps.length;

  return (
    <Stepper.Root
      key={currentStatus}
      initialStep={currentStatus}
      className={clsx(
        variant === 'desktop' && 'w-max max-w-full shrink-0',
        variant === 'mobile' && 'min-w-0 w-full max-w-full',
      )}
    >
      <Stepper.List
        orientation="horizontal"
        role="list"
        aria-label="Customer status"
        className={clsx(
          'flex flex-row items-stretch p-0 m-0 list-none',
          variant === 'desktop' && 'w-max shrink-0',
          variant === 'mobile' && 'w-full min-w-0 overflow-x-auto pb-1',
        )}
      >
        {steps.map((step, index) => (
          <Stepper.Item
            key={step.id}
            step={step.id}
            className={clsx(
              'flex shrink-0 list-none',
              variant === 'desktop' && 'w-[5.25rem]',
              variant === 'mobile' && 'min-w-[3.25rem] w-[4.25rem]',
            )}
          >
            <CustomerStepNode
              stepId={step.id as CustomerStatus}
              label={step.label}
              index={index}
              total={total}
              variant={variant}
            />
          </Stepper.Item>
        ))}
      </Stepper.List>
    </Stepper.Root>
  );
};
