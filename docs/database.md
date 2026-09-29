# Database Architecture & Data Models

FlowOps Memory uses an asynchronous SQLAlchemy ORM architecture designed to run on **SQLite (local/demo)** and seamlessly scale to **PostgreSQL / Supabase (production with Row Level Security)**.

---

## Entity Relationship Overview

```mermaid
erDiagram
    INCIDENTS ||--o{ INCIDENT_TELEMETRY : records
    INCIDENTS ||--o{ INCIDENT_CHANGES : tracks
    INCIDENTS ||--o{ INCIDENT_LOGS : collects
    INCIDENTS ||--o{ INVESTIGATION_STEPS : logs
    INCIDENTS ||--o{ INVESTIGATION_ACTIONS : executes
    ORGANIZATIONAL_MEMORIES ||--o{ INVESTIGATION_STEPS : references

    INCIDENTS {
        string id PK
        string service
        string severity
        string status
        string current_signal
        float error_rate
        float latency_ms
        int db_connections
        int db_pool_max
        string recent_deployment
        string traffic_change
        datetime created_at
        datetime resolved_at
    }

    INCIDENT_TELEMETRY {
        int id PK
        string incident_id FK
        string timestamp
        float latency_p99
        float error_rate
        float db_pool_usage
        float cpu_usage
    }

    INVESTIGATION_STEPS {
        int id PK
        string incident_id FK
        int step_number
        string action
        string expected_result
        string actual_result
        string observation
        string status
        datetime created_at
    }

    INVESTIGATION_ACTIONS {
        int id PK
        string incident_id FK
        string action_type
        string description
        string executed_by
        string status
        string result_message
        datetime created_at
    }

    ORGANIZATIONAL_MEMORIES {
        string id PK
        string bank_id
        string service
        string incident_type
        string root_cause
        string what_worked
        string what_failed
        string key_lesson
        json troubleshooting_history
        datetime created_at
    }
```

---

## Data Ingestion & Indexing

- **High-throughput Incident Ingestion:** Incidents are indexed on `service`, `status`, and `created_at` for rapid querying during active triage.
- **Time-Series Telemetry:** Telemetry points are partitioned and queried by `incident_id` with sub-millisecond retrieval.
- **Audit Compliance:** Every remediation action is recorded with an immutable timestamp and the executing operator's identifier.
