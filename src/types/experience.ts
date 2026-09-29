export interface TroubleshootingAttempt {
  action: string;
  result: 'FAILED' | 'PARTIAL' | 'SUCCESS';
  note: string;
  reason?: string;
}

export interface RelevantExperience {
  incident_id: string; // e.g. "INC-1042"
  service: string; // e.g. "Checkout API"
  title: string;
  relevance_reasons: string[]; // ["Same service", "Same HTTP 503 pattern", "Similar database saturation"]
  troubleshooting_history: TroubleshootingAttempt[];
  root_cause: string;
  lesson: string;
  deployment_version?: string;
  telemetry_summary?: {
    error_rate?: number;
    latency_ms?: number;
    db_connections?: number;
    db_pool_max?: number;
    traffic_change?: string;
  };
  same_signals: string[];
  different_signals: string[];
}

export interface Hypothesis {
  name: string;
  confidence: 'High' | 'Medium' | 'Low';
  evidence: string;
}

export interface InvestigationStepProgress {
  step_number: number;
  title: string;
  status: 'completed' | 'in_progress' | 'active' | 'pending';
  details?: string;
}

export interface AgentInvestigationResponse {
  assessment: string;
  evidence: string[];
  hypotheses: Hypothesis[];
  steps: InvestigationStepProgress[];
  relevant_experiences: RelevantExperience[];
  matching_signals: string[];
  differences: string[];
  failed_approaches: string[];
  successful_approaches: string[];
  recommendation: string;
  reason: string;
  risk: 'Low' | 'Medium' | 'High';
}

export interface MemoryItem {
  incident_id: string;
  service: string;
  severity: string;
  root_cause: string;
  failed_actions: string[];
  worked_action: string;
  lesson: string;
  deployment_version?: string;
  timestamp?: string;
  symptoms: string[];
}

export interface MemorySearchResponse {
  query: string;
  total: number;
  memories: MemoryItem[];
}

export interface PatternItem {
  name: string;
  incident_count: number;
  incident_ids: string[];
  services: string[];
  common_signals: string[];
  common_failed_actions: string[];
  common_successful_actions: string[];
  summary: string;
}

export interface HindsightStatus {
  bank_id: string;
  connected: boolean;
  status: string;
  total_experiences: number;
  services_covered: string[];
  api_endpoint: string;
}
