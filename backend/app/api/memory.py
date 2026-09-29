from typing import List, Optional
from fastapi import APIRouter, Query
from backend.app.schemas.agent import MemoryItem, MemorySearchResponse
from backend.app.services.hindsight import hindsight_service

router = APIRouter(prefix="/memory", tags=["Memory"])

@router.get("", response_model=MemorySearchResponse)
def search_memory(
    q: Optional[str] = Query(None, description="Search incidents, services, symptoms or lessons..."),
    service: Optional[str] = Query(None, description="Filter by service name or all"),
    severity: Optional[str] = Query(None, description="Filter by severity: SEV-1, SEV-2, SEV-3, or all"),
    failure_type: Optional[str] = Query(None, description="Filter by failure type or all")
):
    """
    Searchable organizational troubleshooting knowledge base.
    Answers: 'Have we seen this before?'
    Shows what engineers suspected, what failed, what worked, and the lesson learned.
    """
    results = hindsight_service.search_memories(
        query=q,
        service=service,
        severity=severity,
        failure_type=failure_type
    )

    items = []
    for r in results:
        items.append(MemoryItem(
            incident_id=r.get("incident_id", ""),
            service=r.get("service", ""),
            severity=r.get("severity", "SEV-1"),
            root_cause=r.get("root_cause", ""),
            failed_actions=r.get("failed_actions", []),
            worked_action=r.get("worked_action", ""),
            lesson=r.get("lesson", ""),
            deployment_version=r.get("deployment_version"),
            timestamp=r.get("timestamp"),
            symptoms=r.get("symptoms", [])
        ))

    return MemorySearchResponse(
        query=q or "",
        total=len(items),
        memories=items
    )

@router.get("/status")
def get_memory_status():
    """Returns Hindsight connection status and memory bank details."""
    return hindsight_service.get_status()
