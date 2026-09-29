import React from 'react';
import { Hypothesis } from '../types/experience';
import { HelpCircle } from 'lucide-react';

interface HypothesisPanelProps {
  hypotheses: Hypothesis[];
}

export const HypothesisPanel: React.FC<HypothesisPanelProps> = ({ hypotheses }) => {
  const getConfidenceBadge = (confidence: 'High' | 'Medium' | 'Low') => {
    switch (confidence) {
      case 'High':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60 font-medium">High confidence</span>;
      case 'Medium':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">Medium confidence</span>;
      case 'Low':
        return <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800 font-medium">Low confidence</span>;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-zinc-400 tracking-wider uppercase font-mono">
        Hypotheses
      </h3>
      <div className="space-y-2">
        {hypotheses.map((h, idx) => (
          <div
            key={idx}
            className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 text-xs space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200">{h.name}</span>
              {getConfidenceBadge(h.confidence)}
            </div>
            <div className="text-zinc-400 text-[11px]">
              <span className="text-zinc-500 font-mono">Evidence: </span>
              {h.evidence}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
