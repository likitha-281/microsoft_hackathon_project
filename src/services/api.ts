import {
  IncidentListItem,
  IncidentDetail,
  IncidentCreatePayload,
  InvestigationActionPayload,
  InvestigationActionItem,
  ResolutionPayload
} from '../types/incident';
import {
  AgentInvestigationResponse,
  MemorySearchResponse,
  PatternItem,
  HindsightStatus
} from '../types/experience';

const BASE_URL = '/api';

export async function fetchIncidents(status?: string, service?: string): Promise<IncidentListItem[]> {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  if (service && service !== 'all') params.append('service', service);
  
  const res = await fetch(`${BASE_URL}/incidents?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load incidents');
  return res.json();
}

export async function fetchIncident(id: string): Promise<IncidentDetail> {
  const res = await fetch(`${BASE_URL}/incidents/${id}`);
  if (!res.ok) throw new Error(`Failed to load incident ${id}`);
  return res.json();
}

export async function createIncident(payload: IncidentCreatePayload): Promise<IncidentDetail> {
  const res = await fetch(`${BASE_URL}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create incident');
  return res.json();
}

export async function fetchInvestigation(id: string): Promise<AgentInvestigationResponse> {
  const res = await fetch(`${BASE_URL}/incidents/${id}/investigation`);
  if (!res.ok) throw new Error(`Failed to load investigation for ${id}`);
  return res.json();
}

export async function fetchActions(id: string): Promise<InvestigationActionItem[]> {
  const res = await fetch(`${BASE_URL}/incidents/${id}/actions`);
  if (!res.ok) throw new Error(`Failed to load actions for ${id}`);
  return res.json();
}

export async function recordAction(id: string, payload: InvestigationActionPayload): Promise<InvestigationActionItem> {
  const res = await fetch(`${BASE_URL}/incidents/${id}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to record action');
  return res.json();
}

export async function resolveIncident(id: string, payload: ResolutionPayload): Promise<any> {
  const res = await fetch(`${BASE_URL}/incidents/${id}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to resolve incident');
  return res.json();
}

export async function searchMemory(params?: {
  q?: string;
  service?: string;
  severity?: string;
  failure_type?: string;
}): Promise<MemorySearchResponse> {
  const qp = new URLSearchParams();
  if (params?.q) qp.append('q', params.q);
  if (params?.service && params.service !== 'all') qp.append('service', params.service);
  if (params?.severity && params.severity !== 'all') qp.append('severity', params.severity);
  if (params?.failure_type && params.failure_type !== 'all') qp.append('failure_type', params.failure_type);

  const res = await fetch(`${BASE_URL}/memory?${qp.toString()}`);
  if (!res.ok) throw new Error('Failed to search memory');
  return res.json();
}

export async function fetchPatterns(): Promise<PatternItem[]> {
  const res = await fetch(`${BASE_URL}/patterns`);
  if (!res.ok) throw new Error('Failed to load failure patterns');
  return res.json();
}

export async function fetchHindsightStatus(): Promise<HindsightStatus> {
  const res = await fetch(`${BASE_URL}/memory/status`);
  if (!res.ok) throw new Error('Failed to check Hindsight status');
  return res.json();
}
