import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.incident import Incident, TelemetrySnapshot, RecentChange, RecentLog
from backend.app.models.investigation import InvestigationStep, InvestigationAction, ResolutionRecord
from backend.app.schemas.incident import IncidentCreate
from backend.app.schemas.investigation import InvestigationActionCreate, ResolutionCreate
from backend.app.services.hindsight import hindsight_service

logger = logging.getLogger(__name__)

SEED_INCIDENTS = [
    {
        "id": "INC-2026-0917",
        "service": "Checkout API",
        "severity": "SEV-1",
        "status": "Investigating",
        "started_at": "20:42",
        "started_relative": "12 min",
        "current_signal": "503 errors",
        "title": "Checkout API HTTP 503 Spike & Database Connection Saturation",
        "error_rate": 23.4,
        "latency_ms": 8720.0,
        "db_connections": 498,
        "db_pool_max": 500,
        "traffic_change": "+31%",
        "cpu_percent": 44.2,
        "memory_percent": 71.8,
        "deployment_version": "v4.8.2",
        "summary": "Checkout API is returning HTTP 503 for 23.4% of purchase finalization requests with database connection acquisition timeouts.",
        "recent_changes": [
            {"timestamp": "20:37", "description": "Deployment v4.8.2", "change_type": "deployment"},
            {"timestamp": "20:41", "description": "Latency increased", "change_type": "alert"},
            {"timestamp": "20:42", "description": "503 errors increased", "change_type": "alert"}
        ],
        "recent_logs": [
            {"timestamp": "20:42:13", "level": "ERROR", "service": "checkout-api", "message": "database connection acquisition timeout"},
            {"timestamp": "20:42:14", "level": "ERROR", "service": "checkout-api", "message": "HTTP 503 /checkout"},
            {"timestamp": "20:42:15", "level": "WARN", "service": "database", "message": "connection pool 498/500"},
            {"timestamp": "20:42:18", "level": "ERROR", "service": "checkout-api", "message": "sqlalchemy.exc.TimeoutError: QueuePool limit of size 50 overflow 450 reached, connection timed out"},
            {"timestamp": "20:42:22", "level": "INFO", "service": "checkout-api", "message": "Traffic surge detected: +31% transactions/min over baseline"}
        ],
        "telemetry": [
            {"timestamp": "20:30:00", "error_rate": 0.05, "latency_ms": 115.0, "db_connections": 85, "db_pool_max": 500, "cpu_percent": 30.0, "memory_percent": 64.0, "request_rate": 1320},
            {"timestamp": "20:35:00", "error_rate": 0.08, "latency_ms": 120.0, "db_connections": 92, "db_pool_max": 500, "cpu_percent": 32.0, "memory_percent": 65.0, "request_rate": 1360},
            {"timestamp": "20:37:00", "error_rate": 0.10, "latency_ms": 135.0, "db_connections": 110, "db_pool_max": 500, "cpu_percent": 34.0, "memory_percent": 66.0, "request_rate": 1410},
            {"timestamp": "20:40:00", "error_rate": 3.80, "latency_ms": 1450.0, "db_connections": 380, "db_pool_max": 500, "cpu_percent": 38.0, "memory_percent": 68.0, "request_rate": 1450},
            {"timestamp": "20:41:00", "error_rate": 15.6, "latency_ms": 5200.0, "db_connections": 470, "db_pool_max": 500, "cpu_percent": 42.0, "memory_percent": 70.0, "request_rate": 1470},
            {"timestamp": "20:42:00", "error_rate": 23.4, "latency_ms": 8720.0, "db_connections": 498, "db_pool_max": 500, "cpu_percent": 44.2, "memory_percent": 71.8, "request_rate": 1480}
        ],
        "steps": [
            {"step_number": 1, "title": "Incident context loaded", "status": "completed", "details": "Loaded symptoms and metrics for Checkout API."},
            {"step_number": 2, "title": "Current telemetry inspected", "status": "completed", "details": "Error rate 23.4%, latency 8.7s, pool 498/500."},
            {"step_number": 3, "title": "Recent deployment checked", "status": "completed", "details": "Deployment v4.8.2 rolled out 5 minutes prior."},
            {"step_number": 4, "title": "Historical experience searched", "status": "completed", "details": "Queried Hindsight memory bank for Checkout API DB saturation."},
            {"step_number": 5, "title": "Comparing previous incidents", "status": "active", "details": "Comparing current telemetry with INC-1042 and INC-0871."}
        ]
    },
    {
        "id": "INC-2026-0916",
        "service": "Payment API",
        "severity": "SEV-2",
        "status": "Monitoring",
        "started_at": "19:15",
        "started_relative": "31 min",
        "current_signal": "Latency",
        "title": "Payment Gateway Ingress Webhook Latency Degradation",
        "error_rate": 4.2,
        "latency_ms": 4850.0,
        "db_connections": 145,
        "db_pool_max": 500,
        "traffic_change": "+140%",
        "cpu_percent": 68.4,
        "memory_percent": 78.2,
        "deployment_version": "v3.3.0",
        "summary": "Payment webhook ingestion threads experiencing queue delays due to upstream partner retries.",
        "recent_changes": [
            {"timestamp": "19:10", "description": "Payment partner retry burst", "change_type": "alert"},
            {"timestamp": "19:15", "description": "Worker queue saturation alert", "change_type": "alert"}
        ],
        "recent_logs": [
            {"timestamp": "19:15:10", "level": "WARN", "service": "payment-api", "message": "Gunicorn worker thread backlog reached 850 requests"},
            {"timestamp": "19:15:22", "level": "WARN", "service": "payment-api", "message": "Stripe webhook endpoint latency P99 > 4.5s"}
        ],
        "telemetry": [
            {"timestamp": "19:00:00", "error_rate": 0.02, "latency_ms": 140.0, "db_connections": 110, "db_pool_max": 500, "cpu_percent": 35.0, "memory_percent": 60.0, "request_rate": 800},
            {"timestamp": "19:15:00", "error_rate": 4.20, "latency_ms": 4850.0, "db_connections": 145, "db_pool_max": 500, "cpu_percent": 68.4, "memory_percent": 78.2, "request_rate": 1950}
        ],
        "steps": [
            {"step_number": 1, "title": "Incident context loaded", "status": "completed", "details": "Payment API webhook latency."},
            {"step_number": 2, "title": "Current telemetry inspected", "status": "completed", "details": "Latency 4.8s, worker saturation."},
            {"step_number": 3, "title": "Historical experience searched", "status": "completed", "details": "Found match INC-0920 (Payment Webhook Retry Storm)."}
        ]
    },
    {
        "id": "INC-2026-0915",
        "service": "Notification API",
        "severity": "SEV-3",
        "status": "Resolved",
        "started_at": "18:20",
        "started_relative": "2 hr",
        "current_signal": "Queue backlog",
        "title": "Celery Notification Queue Depth Exceeded Threshold",
        "error_rate": 0.8,
        "latency_ms": 280.0,
        "db_connections": 75,
        "db_pool_max": 500,
        "traffic_change": "+185%",
        "cpu_percent": 32.1,
        "memory_percent": 64.5,
        "deployment_version": "v1.9.2",
        "summary": "Notification delivery delayed due to promotional email campaign queue contention.",
        "recent_changes": [
            {"timestamp": "18:00", "description": "Marketing blast campaign scheduled", "change_type": "event"}
        ],
        "recent_logs": [
            {"timestamp": "18:20:00", "level": "WARN", "service": "notification-api", "message": "Queue depth reached 34,000 tasks"}
        ],
        "telemetry": [
            {"timestamp": "18:00:00", "error_rate": 0.01, "latency_ms": 80.0, "db_connections": 50, "db_pool_max": 500, "cpu_percent": 25.0, "memory_percent": 50.0, "request_rate": 400},
            {"timestamp": "18:20:00", "error_rate": 0.80, "latency_ms": 280.0, "db_connections": 75, "db_pool_max": 500, "cpu_percent": 32.1, "memory_percent": 64.5, "request_rate": 1800}
        ],
        "steps": [
            {"step_number": 1, "title": "Incident context loaded", "status": "completed", "details": "Notification backlog."},
            {"step_number": 2, "title": "Historical experience searched", "status": "completed", "details": "Matched INC-1310 (Celery worker backlog)."},
            {"step_number": 3, "title": "Resolution recorded", "status": "completed", "details": "Partitioned transactional messages from bulk queue."}
        ]
    },
    {
        "id": "INC-2026-0914",
        "service": "Order API",
        "severity": "SEV-1",
        "status": "Resolved",
        "started_at": "14:10",
        "started_relative": "1 d",
        "current_signal": "Memory leak",
        "title": "Order Processing Service Container OOMKilled Cascade",
        "error_rate": 12.8,
        "latency_ms": 6400.0,
        "db_connections": 130,
        "db_pool_max": 500,
        "traffic_change": "+8%",
        "cpu_percent": 55.0,
        "memory_percent": 96.5,
        "deployment_version": "v4.8.0",
        "summary": "Unbounded memory growth in cart line-item serializer led to container evictions.",
        "recent_changes": [
            {"timestamp": "13:50", "description": "Deployment v4.8.0", "change_type": "deployment"}
        ],
        "recent_logs": [
            {"timestamp": "14:10:05", "level": "ERROR", "service": "kubernetes", "message": "Pod order-api-7d9f8c6b4-2x9wq received SIGKILL: OOMKilled"}
        ],
        "telemetry": [],
        "steps": []
    },
    {
        "id": "INC-2026-0913",
        "service": "Authentication API",
        "severity": "SEV-1",
        "status": "Resolved",
        "started_at": "11:05",
        "started_relative": "2 d",
        "current_signal": "Auth timeout",
        "title": "Token Validation Stampede on IdP Public Key Cache Expiry",
        "error_rate": 16.5,
        "latency_ms": 4100.0,
        "db_connections": 88,
        "db_pool_max": 500,
        "traffic_change": "+45%",
        "cpu_percent": 48.0,
        "memory_percent": 62.0,
        "deployment_version": "v2.8.5",
        "summary": "Simultaneous JWKS token validation attempts overwhelmed auth verification endpoint.",
        "recent_changes": [
            {"timestamp": "11:00", "description": "Redis key cache expired", "change_type": "event"}
        ],
        "recent_logs": [
            {"timestamp": "11:05:12", "level": "ERROR", "service": "auth-api", "message": "HTTP 504 Gateway Timeout on /auth/verify"}
        ],
        "telemetry": [],
        "steps": []
    }
]

def seed_default_incidents(db: Session):
    """Seed initial incidents if database is empty."""
    existing_count = db.query(Incident).count()
    if existing_count > 0:
        return

    logger.info("Seeding initial realistic SRE incidents into database...")
    for inc_data in SEED_INCIDENTS:
        incident = Incident(
            id=inc_data["id"],
            service=inc_data["service"],
            severity=inc_data["severity"],
            status=inc_data["status"],
            started_at=inc_data["started_at"],
            started_relative=inc_data["started_relative"],
            current_signal=inc_data["current_signal"],
            title=inc_data["title"],
            error_rate=inc_data.get("error_rate", 0.0),
            latency_ms=inc_data.get("latency_ms", 0.0),
            db_connections=inc_data.get("db_connections", 0),
            db_pool_max=inc_data.get("db_pool_max", 500),
            traffic_change=inc_data.get("traffic_change", "+0%"),
            cpu_percent=inc_data.get("cpu_percent", 0.0),
            memory_percent=inc_data.get("memory_percent", 0.0),
            deployment_version=inc_data.get("deployment_version"),
            summary=inc_data.get("summary")
        )
        db.add(incident)
        db.flush()

        # Telemetry
        for t in inc_data.get("telemetry", []):
            db.add(TelemetrySnapshot(
                incident_id=incident.id,
                timestamp=t["timestamp"],
                error_rate=t["error_rate"],
                latency_ms=t["latency_ms"],
                db_connections=t["db_connections"],
                db_pool_max=t.get("db_pool_max", 500),
                cpu_percent=t.get("cpu_percent", 0.0),
                memory_percent=t.get("memory_percent", 0.0),
                request_rate=t.get("request_rate", 0)
            ))

        # Recent Changes
        for c in inc_data.get("recent_changes", []):
            db.add(RecentChange(
                incident_id=incident.id,
                timestamp=c["timestamp"],
                description=c["description"],
                change_type=c.get("change_type", "deployment")
            ))

        # Recent Logs
        for log in inc_data.get("recent_logs", []):
            db.add(RecentLog(
                incident_id=incident.id,
                timestamp=log["timestamp"],
                level=log["level"],
                service=log["service"],
                message=log["message"]
            ))

        # Investigation Steps
        for step in inc_data.get("steps", []):
            db.add(InvestigationStep(
                incident_id=incident.id,
                step_number=step["step_number"],
                title=step["title"],
                status=step["status"],
                details=step.get("details")
            ))

        # If already resolved, create a resolution record
        if inc_data["status"] == "Resolved":
            db.add(ResolutionRecord(
                incident_id=incident.id,
                root_cause=f"{inc_data['service']} operational bottleneck resolved.",
                what_worked="Targeted configuration adjustments and resource scaling.",
                what_failed="Generic restarts without diagnosing bottleneck.",
                lesson_learned=f"Inspect system metrics and queue saturation before restarting {inc_data['service']}."
            ))

    db.commit()
    logger.info("Successfully seeded incidents into database.")


def list_incidents(db: Session, status: Optional[str] = None, service: Optional[str] = None) -> List[Incident]:
    query = db.query(Incident)
    if status and status.lower() != "all":
        query = query.filter(Incident.status == status)
    if service and service.lower() != "all":
        query = query.filter(Incident.service == service)
    return query.order_by(Incident.created_at.desc()).all()


def get_incident(db: Session, incident_id: str) -> Optional[Incident]:
    return db.query(Incident).filter(Incident.id == incident_id).first()


def create_incident(db: Session, data: IncidentCreate) -> Incident:
    now = datetime.utcnow()
    # Generate realistic incident ID
    today_str = now.strftime("%Y-%m%d")
    count = db.query(Incident).count() + 1
    inc_id = f"INC-{today_str}-{count:02d}"

    title = data.title or f"{data.service} - {data.current_signal} Spike"

    incident = Incident(
        id=inc_id,
        service=data.service,
        severity=data.severity,
        status="Investigating",
        started_at=now.strftime("%H:%M"),
        started_relative="Just now",
        current_signal=data.current_signal,
        title=title,
        error_rate=data.error_rate,
        latency_ms=data.latency_ms,
        db_connections=data.db_connections,
        db_pool_max=data.db_pool_max,
        traffic_change=data.traffic_change or "+0%",
        deployment_version=data.recent_deployment,
        summary=f"{data.service} reporting {data.current_signal} under investigation."
    )
    db.add(incident)
    db.flush()

    # Add initial telemetry snapshot
    db.add(TelemetrySnapshot(
        incident_id=incident.id,
        timestamp=incident.started_at,
        error_rate=data.error_rate,
        latency_ms=data.latency_ms,
        db_connections=data.db_connections,
        db_pool_max=data.db_pool_max,
        cpu_percent=45.0,
        memory_percent=70.0,
        request_rate=1450
    ))

    # Add recent deployment change if specified
    if data.recent_deployment:
        db.add(RecentChange(
            incident_id=incident.id,
            timestamp=incident.started_at,
            description=f"Deployment {data.recent_deployment}",
            change_type="deployment"
        ))

    # Add log excerpt if provided
    if data.log_excerpt:
        for line in data.log_excerpt.strip().split("\n")[:5]:
            db.add(RecentLog(
                incident_id=incident.id,
                timestamp=incident.started_at,
                level="ERROR" if "error" in line.lower() else "WARN",
                service=data.service.lower().replace(" ", "-"),
                message=line.strip()
            ))
    else:
        db.add(RecentLog(
            incident_id=incident.id,
            timestamp=incident.started_at,
            level="ERROR",
            service=data.service.lower().replace(" ", "-"),
            message=f"{data.current_signal} detected: error rate {data.error_rate}%"
        ))

    # Add initial investigation steps
    steps = [
        {"num": 1, "title": "Incident context loaded", "status": "completed"},
        {"num": 2, "title": "Current telemetry inspected", "status": "completed"},
        {"num": 3, "title": "Recent deployment checked", "status": "completed"},
        {"num": 4, "title": "Historical experience searched", "status": "completed"},
        {"num": 5, "title": "Comparing previous incidents", "status": "active"}
    ]
    for s in steps:
        db.add(InvestigationStep(
            incident_id=incident.id,
            step_number=s["num"],
            title=s["title"],
            status=s["status"]
        ))

    db.commit()
    db.refresh(incident)
    logger.info(f"Created new incident {incident.id} for {incident.service}")
    return incident


def add_investigation_action(db: Session, incident_id: str, action_data: InvestigationActionCreate) -> InvestigationAction:
    action = InvestigationAction(
        incident_id=incident_id,
        action=action_data.action,
        expected_result=action_data.expected_result,
        actual_result=action_data.actual_result,
        observation=action_data.observation,
        status="SUCCESS" if "drop" in action_data.actual_result.lower() or "resolv" in action_data.actual_result.lower() else "PARTIAL"
    )
    db.add(action)

    # Also add an investigation step to document the action
    steps_count = db.query(InvestigationStep).filter(InvestigationStep.incident_id == incident_id).count()
    db.add(InvestigationStep(
        incident_id=incident_id,
        step_number=steps_count + 1,
        title=f"Action: {action_data.action}",
        status="completed",
        details=f"Outcome: {action_data.actual_result}. Observation: {action_data.observation or 'N/A'}"
    ))

    db.commit()
    db.refresh(action)
    return action


async def resolve_incident_and_save_experience(db: Session, incident_id: str, res_data: ResolutionCreate) -> Dict[str, Any]:
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise ValueError(f"Incident {incident_id} not found")

    # Update incident status
    incident.status = "Resolved"
    
    # Store resolution record
    resolution = ResolutionRecord(
        incident_id=incident_id,
        root_cause=res_data.root_cause,
        what_worked=res_data.what_worked,
        what_failed=res_data.what_failed,
        lesson_learned=res_data.lesson,
        resolved_at=datetime.utcnow()
    )
    db.add(resolution)
    db.commit()

    # Extract all investigation actions for failed/worked breakdown
    actions = db.query(InvestigationAction).filter(InvestigationAction.incident_id == incident_id).all()
    failed_list = [f.strip() for f in res_data.what_failed.split(",") if f.strip()]
    if not failed_list:
        failed_list = [a.action for a in actions if a.status == "FAILED"]

    troubleshooting_history = []
    for f in failed_list:
        troubleshooting_history.append({
            "action": f,
            "result": "FAILED",
            "note": "No improvement",
            "reason": "Did not address underlying root cause."
        })
    troubleshooting_history.append({
        "action": res_data.what_worked,
        "result": "SUCCESS",
        "note": "Resolved",
        "reason": f"Directly mitigated {res_data.root_cause}."
    })

    # Retain directly into Hindsight memory bank!
    experience_record = {
        "incident_id": incident.id,
        "service": incident.service,
        "severity": incident.severity,
        "title": incident.title,
        "symptoms": [incident.current_signal, f"Latency {incident.latency_ms}ms", f"Error rate {incident.error_rate}%"],
        "deployment_version": incident.deployment_version,
        "failure_type": res_data.root_cause[:50],
        "failed_actions": failed_list,
        "worked_action": res_data.what_worked,
        "troubleshooting_history": troubleshooting_history,
        "root_cause": res_data.root_cause,
        "lesson": res_data.lesson,
        "telemetry_summary": {
            "error_rate": incident.error_rate,
            "latency_ms": incident.latency_ms,
            "db_connections": incident.db_connections,
            "db_pool_max": incident.db_pool_max,
            "traffic_change": incident.traffic_change
        }
    }

    hindsight_result = await hindsight_service.retain(experience_record)

    return {
        "incident_id": incident.id,
        "status": "Resolved",
        "hindsight_status": hindsight_result.get("status"),
        "bank_id": hindsight_result.get("bank_id"),
        "experience": experience_record
    }
