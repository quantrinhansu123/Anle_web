import React from 'react';
import { CheckCircle2, Circle, Clock, User, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

export type StepStatus = 'pending' | 'current' | 'completed' | 'rejected' | 'skipped';

export interface WorkflowStep {
  department: string;
  name: string;
  status: StepStatus;
  approver?: string;
  date?: string;
}

interface ApprovalWorkflowProps {
  steps: WorkflowStep[];
}

const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({ steps }) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute top-[22px] left-0 right-0 h-0.5 bg-slate-100 -z-0" />
        
        {steps.map((step, idx) => {
          return (
            <div key={idx} className="flex flex-col items-center flex-1 relative z-10">
              {/* Step Circle */}
              <div className={clsx(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 shadow-sm",
                step.status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white" :
                step.status === 'current' ? "bg-primary border-primary text-white animate-pulse shadow-primary/20" :
                step.status === 'rejected' ? "bg-red-500 border-red-500 text-white" :
                "bg-white border-slate-200 text-slate-300"
              )}>
                {step.status === 'completed' ? <CheckCircle2 size={24} /> :
                 step.status === 'current' ? <Clock size={24} /> :
                 step.status === 'rejected' ? <ShieldCheck size={24} /> :
                 <Circle size={24} />}
              </div>

              {/* Step Label */}
              <div className="mt-3 text-center">
                <span className={clsx(
                  "text-[10px] font-bold uppercase tracking-wider block mb-0.5",
                  step.status === 'current' ? "text-primary" : "text-slate-400"
                )}>
                  {step.department}
                </span>
                <span className={clsx(
                  "text-[12px] font-bold block",
                  step.status === 'completed' ? "text-slate-900" :
                  step.status === 'current' ? "text-primary" : "text-slate-400"
                )}>
                  {step.name}
                </span>
              </div>

              {/* Approver Info (if completed) */}
              {step.approver && (
                <div className="mt-2 flex flex-col items-center animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <User size={10} />
                    <span>{step.approver}</span>
                  </div>
                  {step.date && (
                    <span className="text-[9px] text-slate-400">
                      {new Date(step.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApprovalWorkflow;
