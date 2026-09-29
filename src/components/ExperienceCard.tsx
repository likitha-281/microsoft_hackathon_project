import React from 'react';
import { RelevantExperience } from '../types/experience';
import { Check, X, AlertTriangle, ArrowRightLeft } from 'lucide-react';

interface ExperienceCardProps {
  experience: RelevantExperience;
  onCompare?: (experience: RelevantExperience) => void;
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({ experience, onCompare }) => {
  return (
    <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-3.5 text-xs text-zinc-300 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="font-semibold text-zinc-100">{experience.incident_id}</span>
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-300">{experience.service}</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">{experience.title}</div>
        </div>

        {onCompare && (
          <button
            onClick={() => onCompare(experience)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 font-mono text-[11px] transition-colors"
            title="Compare side-by-side with current incident"
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>Compare</span>
          </button>
        )}
      </div>

      {/* Relevant Because (Human-understandable reasons instead of vector similarity %) */}
      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded p-2 text-[11px] space-y-1">
        <span className="font-mono text-zinc-400 font-medium block">Relevant because:</span>
        <div className="space-y-0.5">
          {experience.relevance_reasons.map((reason, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-zinc-300">
              <span className="text-blue-400 font-bold">✓</span>
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Troubleshooting History: What engineers actually tried */}
      <div className="space-y-1.5">
        <span className="font-mono text-zinc-400 font-medium text-[11px] uppercase tracking-wider block">
          Troubleshooting history
        </span>
        <div className="space-y-1 bg-zinc-900/40 border border-zinc-800/60 rounded p-2 font-mono text-[11px]">
          {experience.troubleshooting_history.map((t, idx) => {
            const isSuccess = t.result === 'SUCCESS';
            const isPartial = t.result === 'PARTIAL';
            const isFailed = t.result === 'FAILED';

            return (
              <div key={idx} className="flex items-start gap-1.5 py-0.5">
                <span className="shrink-0 mt-0.5">
                  {isSuccess ? (
                    <span className="text-emerald-400 font-bold">✓</span>
                  ) : isPartial ? (
                    <span className="text-amber-400 font-bold">⚠</span>
                  ) : (
                    <span className="text-red-400 font-bold">❌</span>
                  )}
                </span>
                <div className="leading-snug">
                  <span className="text-zinc-200">{t.action}</span>
                  <span className="text-zinc-500 mx-1">—</span>
                  <span className={isSuccess ? 'text-emerald-400' : isPartial ? 'text-amber-400' : 'text-zinc-400'}>
                    {t.note || (isSuccess ? 'Resolved' : 'No improvement')}
                  </span>
                  {t.reason && (
                    <p className="text-zinc-500 text-[10px] font-sans mt-0.5">{t.reason}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Root Cause */}
      <div className="text-[11px] leading-relaxed">
        <span className="font-mono text-zinc-500 font-medium">Root cause: </span>
        <span className="text-zinc-300">{experience.root_cause}</span>
      </div>

      {/* Lesson */}
      <div className="text-[11px] leading-relaxed bg-zinc-900/80 border-l-2 border-blue-500 p-2 rounded-r">
        <span className="font-mono text-blue-400 font-medium">Lesson: </span>
        <span className="text-zinc-300">{experience.lesson}</span>
      </div>
    </div>
  );
};
