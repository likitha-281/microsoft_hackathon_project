from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.schemas.incident import IncidentListItem, IncidentDetail, IncidentCreate
from backend.app.services import incident_service

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentListItem])
def list_incidents(
    status: Optional[str] = Query(None, description="Filter by status: Investigating, Monitoring, Resolved, or all"),
    service: Optional[str] = Query(None, description="Filter by service name or all"),
    db: Session = Depends(get_db)
):
    """
    Returns list of production incidents requiring investigation.
    Columns: Incident, Service, Severity, Status, Started, Current signal.
    """
    incidents = incident_service.list_incidents(db, status=status, service=service)
    result = []
    for inc in incidents:
        result.append(IncidentListItem(
            id=inc.id,
            service=inc.service,
            severity=inc.severity,
            status=inc.status,
            started=inc.started_relative or inc.started_at,
            current_signal=inc.current_signal,
            title=inc.title,
            error_rate=inc.error_rate,
            latency_ms=inc.latency_ms,
            db_connections=inc.db_connections,
            deployment_version=inc.deployment_version
        ))
    return result

@router.get("/{incident_id}", response_model=IncidentDetail)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    """
    Returns detailed incident workspace context:
    Current Signals, Recent Changes, and Recent Monospace Logs.
    """
    inc = incident_service.get_incident(db, incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    
    return IncidentDetail(
        id=inc.id,
        title=inc.title,
        service=inc.service,
        severity=inc.severity,
        status=inc.status,
        started_at=inc.started_at,
        started_relative=inc.started_relative or "Just now",
        current_signal=inc.current_signal,
        error_rate=inc.error_rate,
        latency_ms=inc.latency_ms,
        db_connections=inc.db_connections,
        db_pool_max=inc.db_pool_max,
        traffic_change=inc.traffic_change or "+0%",
        deployment_version=inc.deployment_version,
        summary=inc.summary,
        telemetry=[
            {
                "timestamp": t.timestamp,
                "error_rate": t.error_rate,
                "latency_ms": t.latency_ms,
                "db_connections": t.db_connections,
                "db_pool_max": t.db_pool_max,
                "cpu_percent": t.cpu_percent,
                "memory_percent": t.memory_percent,
                "request_rate": t.request_rate
            } for t in inc.telemetry
        ],
        recent_changes=[
            {
                "timestamp": c.timestamp,
                "description": c.description,
                "change_type": c.change_type
            } for c in inc.recent_changes
        ],
        recent_logs=[
            {
                "timestamp": l.timestamp,
                "level": l.level,
                "service": l.service,
                "message": l.message
            } for l in inc.recent_logs
        ]
    )

@router.post("", response_model=IncidentDetail)
def create_incident(data: IncidentCreate, db: Session = Depends(get_db)):
    """
    Manually create an operational incident.
    FlowOps immediately prepares it for AI failure-aware investigation.
    """
    inc = incident_service.create_incident(db, data)
    return get_incident(inc.id, db)
