export type IncidentSeverity = 'SEV-1' | 'SEV-2' | 'SEV-3';
export type IncidentStatus = 'Investigating' | 'Monitoring' | 'Resolved';

export interface TelemetryPoint {
  timestamp: string;
  error_rate: number;
  latency_ms: number;
  db_connections: number;
  db_pool_max: number;
  cpu_percent?: number;
  memory_percent?: number;
  request_rate?: number;
}

export interface RecentChange {
  timestamp: string;
  description: string;
  change_type: string;
}

export interface RecentLog {
  timestamp: string;
  level: string;
  service: string;
  message: string;
}

export interface IncidentListItem {
  id: string; // e.g. INC-2026-0917
  service: string; // e.g. Checkout API
  severity: IncidentSeverity;
  status: IncidentStatus;
  started: string; // e.g. 12 min
  current_signal: string; // e.g. 503 errors
  title: string;
  error_rate: number;
  latency_ms: number;
  db_connections: number;
  deployment_version?: string;
}

export interface IncidentDetail {
  id: string;
  title: string;
  service: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  started_at: string;
  started_relative: string;
  current_signal: string;
  error_rate: number;
  latency_ms: number;
  db_connections: number;
  db_pool_max: number;
  traffic_change: string;
  deployment_version?: string;
  summary?: string;
  telemetry: TelemetryPoint[];
  recent_changes: RecentChange[];
  recent_logs: RecentLog[];
}

export interface IncidentCreatePayload {
  service: string;
  severity: string;
  title?: string;
  current_signal: string;
  error_rate: number;
  latency_ms: number;
  db_connections: number;
  db_pool_max?: number;
  recent_deployment?: string;
  traffic_change?: string;
  log_excerpt?: string;
}

export interface InvestigationActionPayload {
  action: string;
  expected_result: string;
  actual_result: string;
  observation?: string;
}

export interface InvestigationActionItem {
  id: number;
  incident_id: string;
  action: string;
  expected_result: string;
  actual_result: string;
  observation?: string;
  status: string;
  created_at: string;
}

export interface ResolutionPayload {
  root_cause: string;
  what_worked: string;
  what_failed: string;
  lesson: string;
}
