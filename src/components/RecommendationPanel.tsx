import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Plus, Check } from 'lucide-react';
import { InvestigationActionPayload, ResolutionPayload } from '../types/incident';

interface RecommendationPanelProps {
  recommendation: string;
  reason: string;
  evidenceCount: number;
  failedApproaches: string[];
  successfulApproaches: string[];
  risk: string;
  onRecordAction: (action: InvestigationActionPayload) => Promise<void>;
  onResolveIncident: (resolution: ResolutionPayload) => Promise<void>;
  isResolved: boolean;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  recommendation,
  reason,
  evidenceCount,
  failedApproaches,
  successfulApproaches,
  risk,
  onRecordAction,
  onResolveIncident,
  isResolved
}) => {
  const [showActionModal, setShowActionModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Form states for Recording an action
  const [actionName, setActionName] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [actualResult, setActualResult] = useState('');
  const [observation, setObservation] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Form states for Resolving
  const [rootCause, setRootCause] = useState('Database connection pool exhaustion');
  const [whatWorked, setWhatWorked] = useState('Increase DB connection pool');
  const [whatFailed, setWhatFailed] = useState('Restart, Cache clear');
  const [lesson, setLesson] = useState('Check DB saturation before restarting the service.');
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionName || !expectedResult || !actualResult) return;
    setIsSubmittingAction(true);
    try {
      await onRecordAction({
        action: actionName,
        expected_result: expectedResult,
        actual_result: actualResult,
        observation: observation || undefined
      });
      setActionName('');
      setExpectedResult('');
      setActualResult('');
      setObservation('');
      setShowActionModal(false);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootCause || !whatWorked || !lesson) return;
    setIsSubmittingResolve(true);
    try {
      await onResolveIncident({
        root_cause: rootCause,
        what_worked: whatWorked,
        what_failed: whatFailed,
        lesson: lesson
      });
      setShowResolveModal(false);
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Recommended Next Step Box */}
      <div className="bg-zinc-950/90 border border-blue-900/50 rounded-lg p-4 text-xs space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 font-mono tracking-wider uppercase font-semibold text-[11px]">
            Recommended next step
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
            Risk: {risk}
          </span>
        </div>

        <h4 className="text-sm font-semibold text-zinc-100 leading-snug">
          {recommendation}
        </h4>

        <div className="text-zinc-300 leading-relaxed bg-zinc-900/70 border border-zinc-800/60 p-2.5 rounded">
          <span className="text-zinc-400 font-mono font-medium">Reason: </span>
          {reason}
        </div>

        {/* Evidence & Historical Troubleshooting Footprint */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
          <div className="bg-zinc-900/40 border border-zinc-800/60 p-2 rounded">
            <span className="text-zinc-500 block">Evidence:</span>
            <span className="text-zinc-200 font-semibold">{evidenceCount} comparable incidents</span>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/60 p-2 rounded">
            <span className="text-red-400/90 block">Failed approaches:</span>
            <span className="text-zinc-300 truncate block">
              {failedApproaches.length > 0 ? failedApproaches.join(', ') : 'None'}
            </span>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/60 p-2 rounded">
            <span className="text-emerald-400/90 block">Successful approach:</span>
            <span className="text-zinc-200 font-medium truncate block">
              {successfulApproaches.length > 0 ? successfulApproaches[0] : 'Pool increase'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {!isResolved && (
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setShowActionModal(true)}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium border border-zinc-700 transition-colors"
            >
              [ Record investigation step ]
            </button>
            <button
              onClick={() => setShowResolveModal(true)}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium border border-blue-500 transition-colors"
            >
              [ Resolve with this action ]
            </button>
          </div>
        )}
      </div>

      {/* Record Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 max-w-md w-full rounded-lg p-5 text-xs text-zinc-200 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-semibold text-zinc-100">Record Investigation Action</h3>
              <button onClick={() => setShowActionModal(false)} className="text-zinc-400 hover:text-zinc-100">✕</button>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-3">
              <div>
                <label className="block text-zinc-400 font-mono mb-1">Action</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Increase DB connection pool"
                  value={actionName}
                  onChange={(e) => setActionName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono mb-1">Expected result</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reduce connection acquisition failures"
                  value={expectedResult}
                  onChange={(e) => setExpectedResult(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono mb-1">Actual result</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Error rate dropped from 23% to 3%"
                  value={actualResult}
                  onChange={(e) => setActualResult(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono mb-1">Observation</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Connection usage returned below 80%."
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50"
                >
                  {isSubmittingAction ? 'Saving step...' : 'Save investigation step'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Incident & Retain in Hindsight Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 max-w-lg w-full rounded-lg p-5 text-xs text-zinc-200 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-semibold text-zinc-100">Resolve Incident & Save Experience</h3>
              <button onClick={() => setShowResolveModal(false)} className="text-zinc-400 hover:text-zinc-100">✕</button>
            </div>

            <p className="text-zinc-400 text-[11px]">
              Capture the troubleshooting experience so FlowOps stores it in Hindsight memory for future incidents.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-3">
              <div>
                <label className="block text-zinc-400 font-mono mb-1">Root cause</label>
                <input
                  type="text"
                  required
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono mb-1">What worked</label>
                <input
                  type="text"
                  required
                  value={whatWorked}
                  onChange={(e) => setWhatWorked(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono mb-1">What failed</label>
                <input
                  type="text"
                  value={whatFailed}
                  onChange={(e) => setWhatFailed(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono mb-1">Lesson</label>
                <textarea
                  rows={2}
                  required
                  value={lesson}
                  onChange={(e) => setLesson(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResolve}
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50"
                >
                  {isSubmittingResolve ? 'Saving experience...' : 'Save experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
