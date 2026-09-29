import React, { useState, useEffect } from 'react';
import { IncidentListItem, IncidentCreatePayload } from '../types/incident';
import { fetchIncidents, createIncident } from '../services/api';
import { IncidentList } from '../components/IncidentList';
import { Plus, X } from 'lucide-react';

export const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedService, setSelectedService] = useState('all');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newService, setNewService] = useState('Checkout API');
  const [newSeverity, setNewSeverity] = useState('SEV-1');
  const [newSignal, setNewSignal] = useState('503 errors');
  const [newErrorRate, setNewErrorRate] = useState(24.5);
  const [newLatency, setNewLatency] = useState(8900);
  const [newDbConnections, setNewDbConnections] = useState(499);
  const [newDeployment, setNewDeployment] = useState('v4.8.4');
  const [newTraffic, setNewTraffic] = useState('+35%');
  const [newLogs, setNewLogs] = useState('ERROR checkout-api database connection acquisition timeout\nHTTP 503 /checkout');

  const loadIncidents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchIncidents(selectedStatus, selectedService);
      setIncidents(data);
    } catch (err: any) {
      setError(err.message || 'Incident data could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [selectedStatus, selectedService]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: IncidentCreatePayload = {
        service: newService,
        severity: newSeverity,
        current_signal: newSignal,
        error_rate: Number(newErrorRate),
        latency_ms: Number(newLatency),
        db_connections: Number(newDbConnections),
        db_pool_max: 500,
        recent_deployment: newDeployment,
        traffic_change: newTraffic,
        log_excerpt: newLogs
      };
      await createIncident(payload);
      setIsModalOpen(false);
      await loadIncidents();
    } catch (err: any) {
      alert(`Error creating incident: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl font-bold text-zinc-100 font-sans tracking-tight">
          Incidents
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Production incidents requiring investigation.
        </p>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 p-3 rounded-lg text-xs text-red-300 font-mono">
          {error}
        </div>
      )}

      {/* Incidents Table Component */}
      <IncidentList
        incidents={incidents}
        isLoading={isLoading}
        selectedStatus={selectedStatus}
        selectedService={selectedService}
        onStatusChange={setSelectedStatus}
        onServiceChange={setSelectedService}
        onOpenCreateModal={() => setIsModalOpen(true)}
      />

      {/* Create Incident Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 max-w-lg w-full rounded-lg p-5 text-xs text-zinc-200 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2.5">
              <h3 className="text-sm font-semibold text-zinc-100">Create Operational Incident</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">Service</label>
                  <select
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none"
                  >
                    <option value="Checkout API">Checkout API</option>
                    <option value="Payment API">Payment API</option>
                    <option value="Notification API">Notification API</option>
                    <option value="Order API">Order API</option>
                    <option value="Authentication API">Authentication API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none"
                  >
                    <option value="SEV-1">SEV-1 (Critical)</option>
                    <option value="SEV-2">SEV-2 (Major)</option>
                    <option value="SEV-3">SEV-3 (Minor)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">Current Signal</label>
                  <input
                    type="text"
                    required
                    value={newSignal}
                    onChange={(e) => setNewSignal(e.target.value)}
                    placeholder="e.g. 503 errors"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">Recent Deployment</label>
                  <input
                    type="text"
                    value={newDeployment}
                    onChange={(e) => setNewDeployment(e.target.value)}
                    placeholder="e.g. v4.8.4"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">Error rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newErrorRate}
                    onChange={(e) => setNewErrorRate(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">Latency (ms)</label>
                  <input
                    type="number"
                    value={newLatency}
                    onChange={(e) => setNewLatency(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">DB Connections</label>
                  <input
                    type="number"
                    value={newDbConnections}
                    onChange={(e) => setNewDbConnections(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">Log Excerpt</label>
                <textarea
                  rows={2}
                  value={newLogs}
                  onChange={(e) => setNewLogs(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
