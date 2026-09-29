import React from 'react';
import { IncidentDetail } from '../types/incident';
import { Clock, GitCommit, Terminal, Activity } from 'lucide-react';

interface IncidentOverviewProps {
  incident: IncidentDetail;
}

export const IncidentOverview: React.FC<IncidentOverviewProps> = ({ incident }) => {
  return (
    <div className="space-y-5 text-xs text-zinc-300">
      {/* Service Header */}
      <div className="border-b border-zinc-800/80 pb-4">
        <h2 className="text-lg font-bold text-zinc-100 font-sans tracking-tight">
          {incident.service}
        </h2>
        <div className="flex items-center gap-2 mt-1 font-mono text-xs">
          <span className={`px-1.5 py-0.5 rounded font-medium ${
            incident.severity === 'SEV-1' ? 'bg-red-950/80 text-red-400 border border-red-800/60' :
            incident.severity === 'SEV-2' ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60' :
            'bg-zinc-800 text-zinc-300 border border-zinc-700'
          }`}>
            {incident.severity}
          </span>
          <span className="text-zinc-500">·</span>
          <span className={incident.status === 'Resolved' ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
            {incident.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-zinc-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>Started:</span>
          <span className="text-zinc-200">{incident.started_at}</span>
          <span className="text-zinc-500">({incident.started_relative})</span>
        </div>
      </div>

      {/* Current Signals */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 tracking-wider uppercase mb-2 font-mono flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          Current Signals
        </h3>
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-md p-3 font-mono space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Error rate</span>
            <span className={`font-semibold ${incident.error_rate > 10 ? 'text-red-400' : 'text-zinc-200'}`}>
              {incident.error_rate}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Latency</span>
            <span className={`font-semibold ${incident.latency_ms > 2000 ? 'text-red-400' : 'text-zinc-200'}`}>
              {(incident.latency_ms / 1000).toFixed(1)}s
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">DB connections</span>
            <span className={`font-semibold ${incident.db_connections >= 450 ? 'text-red-400' : 'text-zinc-200'}`}>
              {incident.db_connections} / {incident.db_pool_max}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Traffic</span>
            <span className="text-zinc-200 font-semibold">{incident.traffic_change}</span>
          </div>
        </div>
      </div>

      {/* Recent Changes */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 tracking-wider uppercase mb-2 font-mono flex items-center gap-1.5">
          <GitCommit className="w-3.5 h-3.5 text-zinc-400" />
          Recent Changes
        </h3>
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-md p-3 font-mono space-y-2">
          {incident.recent_changes.length === 0 ? (
            <p className="text-zinc-500 italic">No recent changes recorded.</p>
          ) : (
            incident.recent_changes.map((change, idx) => (
              <div key={idx} className="flex gap-2 items-baseline">
                <span className="text-zinc-500 text-[11px] shrink-0">{change.timestamp}</span>
                <span className={`${change.change_type === 'deployment' ? 'text-blue-300 font-medium' : 'text-zinc-300'}`}>
                  {change.description}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Logs (Monospace) */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 tracking-wider uppercase mb-2 font-mono flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          Recent Logs
        </h3>
        <div className="bg-zinc-950 border border-zinc-800/90 rounded-md p-2.5 font-mono text-[11px] space-y-1.5 max-h-60 overflow-y-auto leading-relaxed">
          {incident.recent_logs.length === 0 ? (
            <p className="text-zinc-500 italic">No log entries available.</p>
          ) : (
            incident.recent_logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-1.5 border-b border-zinc-900/60 pb-1 last:border-0 last:pb-0">
                <span className="text-zinc-500 shrink-0">{log.timestamp}</span>
                <span className={`shrink-0 px-1 py-0.2 rounded text-[10px] font-bold ${
                  log.level === 'ERROR' ? 'text-red-400 bg-red-950/60' :
                  log.level === 'WARN' ? 'text-amber-400 bg-amber-950/60' :
                  'text-zinc-400 bg-zinc-800/50'
                }`}>
                  {log.level}
                </span>
                <span className="text-zinc-400 shrink-0">{log.service}</span>
                <span className="text-zinc-300 break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
