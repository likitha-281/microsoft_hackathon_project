import React from 'react';
import { MemoryItem } from '../types/experience';
import { Search, Filter, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MemoryListProps {
  memories: MemoryItem[];
  isLoading: boolean;
  searchQuery: string;
  selectedService: string;
  selectedSeverity: string;
  selectedFailureType: string;
  onSearchChange: (q: string) => void;
  onServiceChange: (service: string) => void;
  onSeverityChange: (severity: string) => void;
  onFailureTypeChange: (ft: string) => void;
}

export const MemoryList: React.FC<MemoryListProps> = ({
  memories,
  isLoading,
  searchQuery,
  selectedService,
  selectedSeverity,
  selectedFailureType,
  onSearchChange,
  onServiceChange,
  onSeverityChange,
  onFailureTypeChange
}) => {
  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-lg space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incidents, services, symptoms or lessons..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-sans"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <label className="text-zinc-500 font-mono text-[11px]">Service:</label>
            <select
              value={selectedService}
              onChange={(e) => onServiceChange(e.target.value)}
              className="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs focus:outline-none"
            >
              <option value="all">All services</option>
              <option value="Checkout API">Checkout API</option>
              <option value="Payment API">Payment API</option>
              <option value="Notification API">Notification API</option>
              <option value="Order API">Order API</option>
              <option value="Authentication API">Authentication API</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-zinc-500 font-mono text-[11px]">Severity:</label>
            <select
              value={selectedSeverity}
              onChange={(e) => onSeverityChange(e.target.value)}
              className="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs focus:outline-none"
            >
              <option value="all">All severities</option>
              <option value="SEV-1">SEV-1</option>
              <option value="SEV-2">SEV-2</option>
              <option value="SEV-3">SEV-3</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-zinc-500 font-mono text-[11px]">Failure type:</label>
            <select
              value={selectedFailureType}
              onChange={(e) => onFailureTypeChange(e.target.value)}
              className="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-xs focus:outline-none"
            >
              <option value="all">All failure types</option>
              <option value="Database">Database exhaustion</option>
              <option value="Deployment">Deployment regression</option>
              <option value="Webhook">Webhook retry storm</option>
              <option value="Memory">Memory leak</option>
              <option value="Queue">Queue backlog</option>
              <option value="Stampede">Cache stampede</option>
            </select>
          </div>
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-zinc-500 font-mono text-xs">
            Searching organizational troubleshooting memories...
          </div>
        ) : memories.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 font-mono text-xs border border-zinc-800 rounded-lg bg-zinc-900/30">
            No memories match your query or filters.
          </div>
        ) : (
          memories.map((mem) => (
            <div
              key={mem.incident_id}
              className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 text-xs space-y-3 hover:border-zinc-700 transition-colors"
            >
              {/* Header */}
              <div className="flex items-baseline justify-between border-b border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-semibold text-zinc-100">{mem.incident_id}</span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-zinc-300 font-medium">{mem.service}</span>
                  <span className="text-zinc-500">·</span>
                  <span className={`px-1.5 py-0.2 rounded text-[11px] font-medium ${
                    mem.severity === 'SEV-1' ? 'bg-red-950/80 text-red-400 border border-red-800/50' :
                    mem.severity === 'SEV-2' ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50' :
                    'bg-zinc-800 text-zinc-300'
                  }`}>
                    {mem.severity}
                  </span>
                </div>
                {mem.deployment_version && (
                  <span className="text-zinc-500 font-mono text-[11px]">
                    {mem.deployment_version}
                  </span>
                )}
              </div>

              {/* Root Cause */}
              <div className="text-sm font-semibold text-zinc-200">
                {mem.root_cause}
              </div>

              {/* Troubleshooting Experience: Failed vs Worked */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Failed */}
                <div className="bg-zinc-950/50 border border-red-950/60 rounded p-2.5 space-y-1">
                  <span className="text-red-400 font-mono text-[11px] font-semibold uppercase tracking-wider block">
                    Failed:
                  </span>
                  <ul className="space-y-1 text-zinc-400 text-[11px]">
                    {mem.failed_actions.length > 0 ? (
                      mem.failed_actions.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-red-500 font-bold shrink-0">❌</span>
                          <span>{f}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-zinc-600 italic">None recorded</li>
                    )}
                  </ul>
                </div>

                {/* Worked */}
                <div className="bg-zinc-950/50 border border-emerald-950/60 rounded p-2.5 space-y-1">
                  <span className="text-emerald-400 font-mono text-[11px] font-semibold uppercase tracking-wider block">
                    Worked:
                  </span>
                  <div className="flex items-start gap-1.5 text-zinc-200 text-[11px]">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span className="font-medium">{mem.worked_action}</span>
                  </div>
                </div>
              </div>

              {/* Lesson */}
              <div className="bg-zinc-950/60 border-l-2 border-blue-500 p-2.5 rounded-r text-zinc-300 text-[11px] leading-relaxed">
                <span className="font-mono text-blue-400 font-semibold block mb-0.5">Lesson:</span>
                <p>{mem.lesson}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
