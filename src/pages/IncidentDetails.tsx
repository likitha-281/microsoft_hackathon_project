import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { IncidentDetail, InvestigationActionPayload, ResolutionPayload, InvestigationActionItem } from '../types/incident';
import { AgentInvestigationResponse, RelevantExperience } from '../types/experience';
import { fetchIncident, fetchInvestigation, fetchActions, recordAction, resolveIncident } from '../services/api';
import { IncidentOverview } from '../components/IncidentOverview';
import { InvestigationTimeline } from '../components/InvestigationTimeline';
import { HypothesisPanel } from '../components/HypothesisPanel';
import { RecommendationPanel } from '../components/RecommendationPanel';
import { ExperienceCard } from '../components/ExperienceCard';
import { ExperienceComparison } from '../components/ExperienceComparison';
import { ArrowLeft, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';

export const IncidentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [investigation, setInvestigation] = useState<AgentInvestigationResponse | null>(null);
  const [actions, setActions] = useState<InvestigationActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Experience comparison modal
  const [comparingExperience, setComparingExperience] = useState<RelevantExperience | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setError(null);
      const [incData, invData, actData] = await Promise.all([
        fetchIncident(id),
        fetchInvestigation(id),
        fetchActions(id)
      ]);
      setIncident(incData);
      setInvestigation(invData);
      setActions(actData);
    } catch (err: any) {
      setError(err.message || 'Failed to load incident investigation.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleRecordAction = async (payload: InvestigationActionPayload) => {
    if (!id) return;
    await recordAction(id, payload);
    const updatedActions = await fetchActions(id);
    setActions(updatedActions);
  };

  const handleResolveIncident = async (payload: ResolutionPayload) => {
    if (!id) return;
    await resolveIncident(id, payload);
    await loadData();
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-zinc-500">
        Loading incident context and searching organizational memory...
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="space-y-4">
        <Link to="/incidents" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Incidents
        </Link>
        <div className="bg-red-950/40 border border-red-800 p-4 rounded-lg text-xs text-red-300 font-mono">
          {error || 'Incident could not be found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Incident Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <Link
            to="/incidents"
            className="p-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Back to Incidents"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-zinc-100">{incident.id}</span>
              <span className="text-zinc-500">·</span>
              <h1 className="text-sm font-semibold text-zinc-200">{incident.title}</h1>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Service: {incident.service} · Signal: {incident.current_signal}
            </p>
          </div>
        </div>

        <button
          onClick={() => { setIsRefreshing(true); loadData(); }}
          disabled={isRefreshing}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main 3-Column Incident Investigation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Incident Context (Col 1-3) */}
        <div className="lg:col-span-3 bg-zinc-900/30 border border-zinc-800 rounded-lg p-4">
          <IncidentOverview incident={incident} />
        </div>

        {/* CENTER COLUMN: Investigation Panel (Col 4-8) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Section Title */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">
              Investigation
            </h2>
            <span className="text-[11px] font-mono text-zinc-400">
              FlowOps Incident Agent
            </span>
          </div>

          {/* Structured Investigation Progress Steps */}
          {investigation?.steps && (
            <InvestigationTimeline steps={investigation.steps} />
          )}

          {/* Current Assessment */}
          {investigation && (
            <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-lg p-3.5 text-xs space-y-2">
              <h3 className="font-mono text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                Current Assessment
              </h3>
              <p className="text-zinc-100 font-medium text-sm leading-snug">
                {investigation.assessment}
              </p>
              <div className="pt-1 space-y-1">
                <span className="text-zinc-500 font-mono text-[11px] block">Evidence:</span>
                <ul className="space-y-0.5 text-zinc-300 text-xs">
                  {investigation.evidence.map((ev, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Hypotheses */}
          {investigation?.hypotheses && (
            <HypothesisPanel hypotheses={investigation.hypotheses} />
          )}

          {/* Recommended Next Step & Human-in-the-Loop Action Recorder */}
          {investigation && (
            <RecommendationPanel
              recommendation={investigation.recommendation}
              reason={investigation.reason}
              evidenceCount={investigation.relevant_experiences.length}
              failedApproaches={investigation.failed_approaches}
              successfulApproaches={investigation.successful_approaches}
              risk={investigation.risk}
              onRecordAction={handleRecordAction}
              onResolveIncident={handleResolveIncident}
              isResolved={incident.status === 'Resolved'}
            />
          )}

          {/* Recorded Actions Timeline */}
          {actions.length > 0 && (
            <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-lg p-3.5 text-xs space-y-2">
              <h3 className="font-mono text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                Recorded Actions ({actions.length})
              </h3>
              <div className="space-y-2 pt-1 font-mono text-[11px]">
                {actions.map((act) => (
                  <div key={act.id} className="bg-zinc-900/60 border border-zinc-800/60 p-2.5 rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-100">{act.action}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-800/40">
                        {act.status}
                      </span>
                    </div>
                    <div className="text-zinc-400">
                      <span className="text-zinc-500">Expected: </span>{act.expected_result}
                    </div>
                    <div className="text-zinc-300">
                      <span className="text-zinc-500">Actual: </span>{act.actual_result}
                    </div>
                    {act.observation && (
                      <div className="text-zinc-400">
                        <span className="text-zinc-500">Observation: </span>{act.observation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Relevant Organizational Experience (Col 9-12) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">
              Relevant past experience
            </h2>
            <span className="text-[11px] font-mono text-blue-400">
              Hindsight Memory
            </span>
          </div>

          <div className="space-y-3">
            {!investigation || investigation.relevant_experiences.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 font-mono text-xs border border-zinc-800 rounded-lg bg-zinc-950/30">
                No prior incidents match this symptom profile.
              </div>
            ) : (
              investigation.relevant_experiences.map((exp) => (
                <ExperienceCard
                  key={exp.incident_id}
                  experience={exp}
                  onCompare={(e) => setComparingExperience(e)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Experience Comparison Side-by-Side Modal */}
      {comparingExperience && (
        <ExperienceComparison
          currentIncident={incident}
          previousIncident={comparingExperience}
          onClose={() => setComparingExperience(null)}
        />
      )}
    </div>
  );
};
