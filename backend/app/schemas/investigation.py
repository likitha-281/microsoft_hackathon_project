from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class InvestigationStepSchema(BaseModel):
    step_number: int
    title: str
    status: str # completed, active, pending
    details: Optional[str] = None

    class Config:
        from_attributes = True

class InvestigationActionCreate(BaseModel):
    action: str = Field(..., example="Increase DB connection pool")
    expected_result: str = Field(..., example="Reduce connection acquisition failures")
    actual_result: str = Field(..., example="Error rate dropped from 23% to 3%")
    observation: Optional[str] = Field(None, example="Connection usage returned below 80%.")

class InvestigationActionSchema(BaseModel):
    id: int
    incident_id: str
    action: str
    expected_result: str
    actual_result: str
    observation: Optional[str] = None
    status: str = "SUCCESS"
    created_at: datetime

    class Config:
        from_attributes = True

class ResolutionCreate(BaseModel):
    root_cause: str = Field(..., example="Database connection pool exhaustion")
    what_worked: str = Field(..., example="Increase DB connection pool")
    what_failed: str = Field(..., example="Restart, Cache clear")
    lesson: str = Field(..., example="Check DB saturation before restarting the service.")

class ResolutionSchema(BaseModel):
    incident_id: str
    root_cause: str
    what_worked: str
    what_failed: str
    lesson_learned: str
    resolved_at: datetime

    class Config:
        from_attributes = True
