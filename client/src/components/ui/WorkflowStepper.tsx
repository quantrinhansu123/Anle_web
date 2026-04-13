import { clsx } from 'clsx';
import { type LucideIcon } from 'lucide-react';

export interface WorkflowStep<T extends string = string> {
  id: T;
  label: string;
  icon: LucideIcon;
  isCancel?: boolean;
}

export interface WorkflowStepperProps<T extends string = string> {
  steps: WorkflowStep<T>[];
  currentStep: T;
  onStepChange?: (stepId: T) => void;
  variant?: 'mobile' | 'desktop';
}

export function WorkflowStepper<T extends string>({
  steps,
  currentStep,
  onStepChange,
  variant = 'desktop',
}: WorkflowStepperProps<T>) {
  const currentIdx = steps.findIndex((s) => s.id === currentStep);

  return (
    <div
      role="list"
      aria-label="Workflow Stepper"
      className={clsx(
        'm-0 flex list-none flex-row items-stretch p-0',
        variant === 'desktop' && 'w-max shrink-0',
        variant === 'mobile' && 'w-full min-w-0 overflow-x-auto pb-1',
      )}
    >
      {steps.map((step, index) => {
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;
        const isCompleted = index < currentIdx;
        const isActive = index === currentIdx;
        const isInactive = index > currentIdx;
        const isCancel = step.isCancel;
        const Icon = step.icon;

        const leftConnectorLit = !isFirst && currentIdx >= index;
        const rightConnectorLit = !isLast && currentIdx > index;

        const circleSize = variant === 'desktop' ? 'size-10' : 'size-9';
        const iconSize = variant === 'desktop' ? 'size-[18px]' : 'size-4';

        const segmentCls = (lit: boolean) =>
          clsx(
            'h-0.5 w-full min-w-0 rounded-full transition-colors',
            lit
              ? isCancel && isActive
                ? 'bg-red-400/40'
                : 'bg-primary/40'
              : 'bg-slate-200',
          );

        const activeColor = isCancel
          ? 'border-red-500 bg-red-500 text-white shadow-md shadow-red-500/25'
          : 'border-primary bg-primary text-white shadow-md shadow-primary/25';
        const completedColor = isCancel
          ? 'border-red-500/40 bg-red-500/15 text-slate-700 shadow-sm'
          : 'border-primary/40 bg-primary/15 text-slate-700 shadow-sm';

        return (
          <div
            key={String(step.id)}
            className={clsx(
              'flex shrink-0 list-none min-w-[5.25rem] flex-1',
              variant === 'desktop' && 'min-w-[6rem]',
            )}
          >
            <div
              className={clsx(
                'flex w-full min-w-0 flex-col items-stretch group',
                onStepChange && 'cursor-pointer',
              )}
              onClick={() => onStepChange?.(step.id)}
            >
              <div className="flex w-full min-h-10 items-center">
                <div className="flex min-h-[2px] flex-1 basis-0 items-center pe-0.5">
                  {!isFirst && (
                    <div className={segmentCls(leftConnectorLit)} aria-hidden />
                  )}
                </div>
                <div
                  className={clsx(
                    'relative z-1 flex shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    circleSize,
                    isActive && activeColor,
                    isCompleted && !isActive && completedColor,
                    isInactive &&
                    'border-slate-200 bg-white text-slate-500 group-hover:border-slate-300',
                  )}
                >
                  <Icon className={iconSize} strokeWidth={2} aria-hidden />
                </div>
                <div className="flex min-h-[2px] flex-1 basis-0 items-center ps-0.5">
                  {!isLast && (
                    <div className={segmentCls(rightConnectorLit)} aria-hidden />
                  )}
                </div>
              </div>
              <p
                className={clsx(
                  'mt-2 w-full text-center leading-tight',
                  variant === 'desktop' ? 'text-[11px]' : 'text-[10px]',
                  isActive && 'font-bold text-slate-900',
                  isCompleted && !isActive && 'font-semibold text-slate-700',
                  isInactive &&
                  'font-medium text-slate-500 group-hover:text-slate-700',
                )}
              >
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
