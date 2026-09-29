from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.schemas.agent import AgentInvestigationResponse
from backend.app.schemas.investigation import (
    InvestigationActionCreate,
    InvestigationActionSchema,
    ResolutionCreate,
    ResolutionSchema
)
from backend.app.services import incident_service
from backend.app.services.agent import incident_agent
from backend.app.models.investigation import InvestigationAction

router = APIRouter(prefix="/incidents", tags=["Investigation"])

@router.get("/{incident_id}/investigation", response_model=AgentInvestigationResponse)
async def get_incident_investigation(incident_id: str, db: Session = Depends(get_db)):
    """
    Triggers FlowOps Incident Agent investigation:
    1. Collects incident signals, logs, and deployment events
    2. Recalls relevant previous experiences from Hindsight
    3. Surfaces failed vs successful approaches and detects differences
    4. Recommends the next investigation step with evidence
    """
    inc = incident_service.get_incident(db, incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    response = await incident_agent.investigate(db, inc)
    return response

@router.get("/{incident_id}/actions", response_model=List[InvestigationActionSchema])
def list_actions(incident_id: str, db: Session = Depends(get_db)):
    """Returns recorded investigation actions for this incident."""
    inc = incident_service.get_incident(db, incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    
    actions = db.query(InvestigationAction).filter(
        InvestigationAction.incident_id == incident_id
    ).order_by(InvestigationAction.created_at.desc()).all()
    
    return actions

@router.post("/{incident_id}/actions", response_model=InvestigationActionSchema)
def record_investigation_action(
    incident_id: str,
    action_data: InvestigationActionCreate,
    db: Session = Depends(get_db)
):
    """
    Human-in-the-loop: Records what an engineer actually tried,
    including expected result, actual result, and observation.
    """
    inc = incident_service.get_incident(db, incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    action = incident_service.add_investigation_action(db, incident_id, action_data)
    return action

@router.post("/{incident_id}/resolve")
async def resolve_incident(
    incident_id: str,
    res_data: ResolutionCreate,
    db: Session = Depends(get_db)
):
    """
    Incident Resolution & Learning Loop:
    1. Captures lightweight post-incident summary (root cause, what worked, what failed, lesson)
    2. Marks incident status as Resolved
    3. Stores structured troubleshooting experience in Hindsight memory bank
    4. Makes experience immediately retrievable for future incidents
    """
    try:
        result = await incident_service.resolve_incident_and_save_experience(db, incident_id, res_data)
        return {
            "status": "success",
            "message": f"Incident {incident_id} resolved and organizational experience permanently stored in Hindsight.",
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resolution error: {str(e)}")
