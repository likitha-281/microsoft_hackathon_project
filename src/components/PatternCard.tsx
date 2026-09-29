import React from 'react';
import { PatternItem } from '../types/experience';
import { AlertOctagon, Check, X, Layers } from 'lucide-react';

interface PatternCardProps {
  pattern: PatternItem;
}

export const PatternCard: React.FC<PatternCardProps> = ({ pattern }) => {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-300 space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 border-b border-zinc-800/80 pb-2.5">
        <h3 className="text-sm font-semibold text-zinc-100 font-sans flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400 shrink-0" />
          {pattern.name}
        </h3>
        <span className="font-mono text-zinc-400 text-[11px] bg-zinc-800/70 border border-zinc-700/60 px-2 py-0.5 rounded">
          Seen in <strong className="text-zinc-100">{pattern.incident_count}</strong> {pattern.incident_count === 1 ? 'incident' : 'incidents'}
        </span>
      </div>

      {/* Incident Refs & Services */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-zinc-500">
        <span>Incidents:</span>
        {pattern.incident_ids.map((id) => (
          <span key={id} className="text-zinc-300 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
            {id}
          </span>
        ))}
        <span className="mx-1">·</span>
        <span>Services:</span>
        <span className="text-zinc-300">{pattern.services.join(', ')}</span>
      </div>

      {/* Summary */}
      <p className="text-zinc-300 text-[11px] leading-relaxed">
        {pattern.summary}
      </p>

      {/* Breakdown: Common Signals, Common Failed Action, Common Successful Action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-[11px]">
        {/* Common Signals */}
        <div className="bg-zinc-950/60 border border-zinc-800/70 rounded p-2.5 space-y-1.5">
          <span className="font-mono text-zinc-400 font-semibold block uppercase tracking-wider text-[10px]">
            Common signals
          </span>
          <ul className="space-y-1 text-zinc-300">
            {pattern.common_signals.map((sig, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-blue-400 font-bold shrink-0">•</span>
                <span>{sig}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Common Failed Action */}
        <div className="bg-zinc-950/60 border border-red-950/60 rounded p-2.5 space-y-1.5">
          <span className="font-mono text-red-400 font-semibold block uppercase tracking-wider text-[10px]">
            Common failed action
          </span>
          <ul className="space-y-1 text-zinc-300">
            {pattern.common_failed_actions.map((act, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-red-400 font-bold shrink-0">❌</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Common Successful Action */}
        <div className="bg-zinc-950/60 border border-emerald-950/60 rounded p-2.5 space-y-1.5">
          <span className="font-mono text-emerald-400 font-semibold block uppercase tracking-wider text-[10px]">
            Common successful action
          </span>
          <ul className="space-y-1 text-zinc-300">
            {pattern.common_successful_actions.map((act, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span className="font-medium text-zinc-200">{act}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
