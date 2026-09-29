from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Hypothesis(BaseModel):
    name: str # e.g. "Database connection exhaustion"
    confidence: str # "High", "Medium", "Low"
    evidence: str # e.g. "DB pool saturation + timeout errors"

class TroubleshootingAttempt(BaseModel):
    action: str # e.g. "Restart Checkout API"
    result: str # "FAILED", "PARTIAL", "SUCCESS"
    note: str # e.g. "No improvement", "Resolved"
    reason: Optional[str] = None

class RelevantExperience(BaseModel):
    incident_id: str # e.g. "INC-1042"
    service: str # e.g. "Checkout API"
    title: str
    relevance_reasons: List[str] # ["Same service", "Same HTTP 503 pattern", "Similar database saturation"]
    troubleshooting_history: List[TroubleshootingAttempt]
    root_cause: str # "Database connection pool exhaustion"
    lesson: str # "When Checkout API shows 503 errors together with DB connection saturation..."
    deployment_version: Optional[str] = None
    telemetry_summary: Optional[Dict[str, Any]] = None
    same_signals: List[str] = []
    different_signals: List[str] = []

class InvestigationStepProgress(BaseModel):
    step_number: int
    title: str
    status: str # "completed", "in_progress", "pending"
    details: Optional[str] = None

class AgentInvestigationResponse(BaseModel):
    assessment: str
    evidence: List[str]
    hypotheses: List[Hypothesis]
    steps: List[InvestigationStepProgress]
    relevant_experiences: List[RelevantExperience]
    matching_signals: List[str]
    differences: List[str]
    failed_approaches: List[str]
    successful_approaches: List[str]
    recommendation: str
    reason: str
    risk: str = "Low" # "Low", "Medium", "High"

class MemoryItem(BaseModel):
    incident_id: str
    service: str
    severity: str
    root_cause: str
    failed_actions: List[str]
    worked_action: str
    lesson: str
    deployment_version: Optional[str] = None
    timestamp: Optional[str] = None
    symptoms: List[str] = []

class MemorySearchResponse(BaseModel):
    query: str
    total: int
    memories: List[MemoryItem]

class PatternItem(BaseModel):
    name: str # e.g. "Database connection exhaustion"
    incident_count: int # e.g. 4
    incident_ids: List[str] # ["INC-1042", "INC-0871", "INC-0652", "INC-2048"]
    services: List[str] # ["Checkout API"]
    common_signals: List[str] # ["503 errors", "connection pool near capacity", "latency increase"]
    common_failed_actions: List[str] # ["Restart service", "Clear cache"]
    common_successful_actions: List[str] # ["Increase DB pool limit"]
    summary: str
