-- ==============================================================================
-- FlowOps Memory: Production Schema (PostgreSQL / Supabase compatible)
-- Failure-Aware Organizational Memory for SRE Incident Response
-- ==============================================================================

-- 1. Core Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY,
    service VARCHAR(128) NOT NULL,
    severity VARCHAR(16) NOT NULL, -- SEV-1, SEV-2, SEV-3
    status VARCHAR(32) NOT NULL DEFAULT 'Investigating', -- Investigating, Mitigated, Resolved
    summary TEXT,
    current_signal VARCHAR(256),
    error_rate FLOAT DEFAULT 0.0,
    latency_ms FLOAT DEFAULT 0.0,
    db_connections INT DEFAULT 0,
    db_pool_max INT DEFAULT 500,
    recent_deployment VARCHAR(64),
    traffic_change VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_incidents_service ON incidents(service);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);

-- 2. Incident Telemetry Time-Series
CREATE TABLE IF NOT EXISTS incident_telemetry (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    timestamp VARCHAR(32) NOT NULL,
    latency_p99 FLOAT NOT NULL,
    error_rate FLOAT NOT NULL,
    db_pool_usage FLOAT NOT NULL,
    cpu_usage FLOAT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telemetry_incident ON incident_telemetry(incident_id);

-- 3. Incident Deployments & Infrastructure Changes
CREATE TABLE IF NOT EXISTS incident_changes (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    time VARCHAR(32) NOT NULL,
    description TEXT NOT NULL,
    author VARCHAR(128),
    commit_sha VARCHAR(40)
);

-- 4. Incident Log Excerpts
CREATE TABLE IF NOT EXISTS incident_logs (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    time VARCHAR(32) NOT NULL,
    level VARCHAR(16) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(64)
);

-- 5. Human & Agent Investigation Steps
CREATE TABLE IF NOT EXISTS investigation_steps (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    action TEXT NOT NULL,
    expected_result TEXT NOT NULL,
    actual_result TEXT NOT NULL,
    observation TEXT,
    status VARCHAR(32) NOT NULL, -- SUCCESS, FAILED, INCONCLUSIVE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Executed Actions (Human-in-the-loop audit trail)
CREATE TABLE IF NOT EXISTS investigation_actions (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    action_type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    executed_by VARCHAR(64) NOT NULL DEFAULT 'sre-engineer',
    status VARCHAR(32) NOT NULL DEFAULT 'EXECUTED',
    result_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Organizational Memory Bank (Hindsight Local Persistence)
CREATE TABLE IF NOT EXISTS organizational_memories (
    id VARCHAR(64) PRIMARY KEY,
    bank_id VARCHAR(64) NOT NULL DEFAULT 'flowops-sre-memory',
    service VARCHAR(128) NOT NULL,
    incident_type VARCHAR(128) NOT NULL,
    root_cause TEXT NOT NULL,
    what_worked TEXT NOT NULL,
    what_failed TEXT NOT NULL,
    key_lesson TEXT NOT NULL,
    troubleshooting_history JSONB,
    tags JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memories_service ON organizational_memories(service);
CREATE INDEX IF NOT EXISTS idx_memories_bank ON organizational_memories(bank_id);

-- 8. Recurring Anti-Patterns Catalog
CREATE TABLE IF NOT EXISTS anti_patterns (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    trigger_context TEXT NOT NULL,
    ineffective_action TEXT NOT NULL,
    why_it_fails TEXT NOT NULL,
    correct_approach TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
