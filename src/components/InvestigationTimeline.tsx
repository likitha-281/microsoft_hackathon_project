import React from 'react';
import { InvestigationStepProgress } from '../types/experience';
import { Check, ArrowRight, Loader2 } from 'lucide-react';

interface InvestigationTimelineProps {
  steps: InvestigationStepProgress[];
}

export const InvestigationTimeline: React.FC<InvestigationTimelineProps> = ({ steps }) => {
  return (
    <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3 font-mono text-xs">
      <div className="space-y-1.5">
        {steps.map((step) => {
          const isDone = step.status === 'completed';
          const isActive = step.status === 'in_progress' || step.status === 'active';

          return (
            <div key={step.step_number} className="flex items-center gap-2">
              {isDone ? (
                <span className="text-emerald-400 font-bold flex items-center justify-center w-4 h-4">
                  <Check className="w-3.5 h-3.5" />
                </span>
              ) : isActive ? (
                <span className="text-blue-400 font-bold flex items-center justify-center w-4 h-4">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="text-zinc-600 font-medium flex items-center justify-center w-4 h-4">
                  ○
                </span>
              )}

              <span className={`${
                isDone ? 'text-zinc-300' :
                isActive ? 'text-blue-300 font-medium' :
                'text-zinc-500'
              }`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
