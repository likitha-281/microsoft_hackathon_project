import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IncidentListItem, IncidentSeverity, IncidentStatus } from '../types/incident';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Activity, ArrowRight } from 'lucide-react';

interface IncidentListProps {
  incidents: IncidentListItem[];
  isLoading: boolean;
  selectedStatus: string;
  selectedService: string;
  onStatusChange: (status: string) => void;
  onServiceChange: (service: string) => void;
  onOpenCreateModal: () => void;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  isLoading,
  selectedStatus,
  selectedService,
  onStatusChange,
  onServiceChange,
  onOpenCreateModal
}) => {
  const navigate = useNavigate();

  const getSeverityBadge = (sev: IncidentSeverity) => {
    switch (sev) {
      case 'SEV-1':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-red-950/80 text-red-400 border border-red-800/60">SEV-1</span>;
      case 'SEV-2':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-amber-950/80 text-amber-400 border border-amber-800/60">SEV-2</span>;
      case 'SEV-3':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">SEV-3</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono text-zinc-400">{sev}</span>;
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'Investigating':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-red-950/50 text-red-300 border border-red-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Investigating
          </span>
        );
      case 'Monitoring':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-950/50 text-amber-300 border border-amber-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Monitoring
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/50 text-emerald-300 border border-emerald-800/40">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Resolved
          </span>
        );
      default:
        return <span className="text-xs text-zinc-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400 font-medium">Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-zinc-500"
          >
            <option value="all">All statuses</option>
            <option value="Investigating">Investigating</option>
            <option value="Monitoring">Monitoring</option>
            <option value="Resolved">Resolved</option>
          </select>

          <label className="text-xs text-zinc-400 font-medium ml-2">Service:</label>
          <select
            value={selectedService}
            onChange={(e) => onServiceChange(e.target.value)}
            className="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-zinc-500"
          >
            <option value="all">All services</option>
            <option value="Checkout API">Checkout API</option>
            <option value="Payment API">Payment API</option>
            <option value="Notification API">Notification API</option>
            <option value="Order API">Order API</option>
            <option value="Authentication API">Authentication API</option>
          </select>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium border border-zinc-700 transition-colors"
        >
          <span>+ Create Incident</span>
        </button>
      </div>

      {/* Main Incidents Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/40">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 font-mono font-medium">
              <th className="py-2.5 px-3">Incident</th>
              <th className="py-2.5 px-3">Service</th>
              <th className="py-2.5 px-3">Severity</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Started</th>
              <th className="py-2.5 px-3">Current signal</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500 font-mono">
                  Loading operational incidents...
                </td>
              </tr>
            ) : incidents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500 font-mono">
                  No incidents match the selected filters.
                </td>
              </tr>
            ) : (
              incidents.map((inc) => (
                <tr
                  key={inc.id}
                  onClick={() => navigate(`/incidents/${inc.id}`)}
                  className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-3 font-mono font-semibold text-zinc-200 group-hover:text-blue-400">
                    {inc.id}
                  </td>
                  <td className="py-3 px-3 font-medium text-zinc-300">
                    {inc.service}
                  </td>
                  <td className="py-3 px-3">
                    {getSeverityBadge(inc.severity)}
                  </td>
                  <td className="py-3 px-3">
                    {getStatusBadge(inc.status)}
                  </td>
                  <td className="py-3 px-3 font-mono text-zinc-400">
                    {inc.started}
                  </td>
                  <td className="py-3 px-3 text-zinc-300 font-mono">
                    {inc.current_signal}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center text-zinc-500 group-hover:text-zinc-200 transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
