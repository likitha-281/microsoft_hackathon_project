import React from 'react';
import { IncidentDetail } from '../types/incident';
import { RelevantExperience } from '../types/experience';
import { X, AlertTriangle, Check, ArrowRightLeft } from 'lucide-react';

interface ExperienceComparisonProps {
  currentIncident: IncidentDetail;
  previousIncident: RelevantExperience;
  onClose: () => void;
}

export const ExperienceComparison: React.FC<ExperienceComparisonProps> = ({
  currentIncident,
  previousIncident,
  onClose
}) => {
  const prevSummary = previousIncident.telemetry_summary || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 max-w-2xl w-full rounded-lg p-5 text-xs text-zinc-200 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Compare Incidents: {currentIncident.id} vs {previousIncident.incident_id}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Side-by-Side Comparison Table */}
        <div className="border border-zinc-800 rounded-md overflow-hidden bg-zinc-950/60">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-zinc-800/80 border-b border-zinc-700 text-zinc-400">
                <th className="p-2.5 w-1/3">Signal</th>
                <th className="p-2.5 w-1/3 text-blue-300">CURRENT ({currentIncident.id})</th>
                <th className="p-2.5 w-1/3 text-zinc-300">PREVIOUS ({previousIncident.incident_id})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              <tr>
                <td className="p-2.5 text-zinc-400">Service</td>
                <td className="p-2.5 font-semibold text-zinc-100">{currentIncident.service}</td>
                <td className="p-2.5 font-semibold text-zinc-100">{previousIncident.service}</td>
              </tr>
              <tr>
                <td className="p-2.5 text-zinc-400">Error pattern</td>
                <td className="p-2.5 text-red-400">{currentIncident.current_signal} ({currentIncident.error_rate}%)</td>
                <td className="p-2.5 text-red-400">503 errors ({prevSummary.error_rate || 27}%)</td>
              </tr>
              <tr>
                <td className="p-2.5 text-zinc-400">DB connections</td>
                <td className="p-2.5 text-amber-400">{currentIncident.db_connections} / {currentIncident.db_pool_max}</td>
                <td className="p-2.5 text-amber-400">{prevSummary.db_connections || 500} / {prevSummary.db_pool_max || 500}</td>
              </tr>
              <tr>
                <td className="p-2.5 text-zinc-400">Latency behavior</td>
                <td className="p-2.5 text-zinc-300">{(currentIncident.latency_ms / 1000).toFixed(1)}s (elevated)</td>
                <td className="p-2.5 text-zinc-300">{((prevSummary.latency_ms || 9200) / 1000).toFixed(1)}s (elevated)</td>
              </tr>
              <tr>
                <td className="p-2.5 text-zinc-400">Traffic change</td>
                <td className="p-2.5 text-zinc-300">{currentIncident.traffic_change}</td>
                <td className="p-2.5 text-zinc-300">{prevSummary.traffic_change || '+27%'}</td>
              </tr>
              <tr className="bg-amber-950/20 font-bold">
                <td className="p-2.5 text-amber-400">Deployment version</td>
                <td className="p-2.5 text-amber-300">{currentIncident.deployment_version || 'None'}</td>
                <td className="p-2.5 text-zinc-400">{previousIncident.deployment_version || 'v4.7.1'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Same vs Different Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Same */}
          <div className="bg-zinc-950/70 border border-zinc-800 p-3 rounded-md space-y-2">
            <h4 className="font-mono text-zinc-300 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Same
            </h4>
            <ul className="space-y-1 text-zinc-400 text-[11px]">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Service ({currentIncident.service})
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Error pattern ({currentIncident.current_signal})
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Database saturation (&gt;95% lease capacity)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Latency degradation
              </li>
            </ul>
          </div>

          {/* Different */}
          <div className="bg-zinc-950/70 border border-amber-900/50 p-3 rounded-md space-y-2">
            <h4 className="font-mono text-amber-300 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Different
            </h4>
            <ul className="space-y-1 text-zinc-300 text-[11px]">
              <li className="flex items-start gap-1.5 text-amber-200">
                <span className="text-amber-400 font-bold">⚠</span>
                <span>Deployment version: {currentIncident.deployment_version || 'Current'} vs {previousIncident.deployment_version || 'v4.7.1'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Memory Should Not Blindly Copy the Past Banner */}
        <div className="bg-blue-950/40 border border-blue-800/60 p-3 rounded-md text-xs leading-relaxed text-zinc-200 space-y-1">
          <span className="font-mono text-blue-400 font-semibold uppercase tracking-wider text-[11px] block">
            Memory Principle: Do not blindly copy the past
          </span>
          <p className="text-zinc-300">
            The previous incident ({previousIncident.incident_id}) strongly matches the current telemetry, but the current deployment is different.
            Treat the previous database remediation as evidence rather than immediately applying it. Verify active query leases before applying pool expansion.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium"
          >
            Close comparison
          </button>
        </div>
      </div>
    </div>
  );
};
