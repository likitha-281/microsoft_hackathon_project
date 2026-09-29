from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class TelemetrySnapshotSchema(BaseModel):
    timestamp: str
    error_rate: float
    latency_ms: float
    db_connections: int
    db_pool_max: int = 500
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    request_rate: int = 0

    class Config:
        from_attributes = True

class RecentChangeSchema(BaseModel):
    timestamp: str
    description: str
    change_type: str = "deployment"

    class Config:
        from_attributes = True

class RecentLogSchema(BaseModel):
    timestamp: str
    level: str
    service: str
    message: str

    class Config:
        from_attributes = True

class IncidentListItem(BaseModel):
    id: str # e.g. INC-2026-0917
    service: str # e.g. Checkout API
    severity: str # SEV-1, SEV-2, SEV-3
    status: str # Investigating, Monitoring, Resolved
    started: str # e.g. 12 min
    current_signal: str # e.g. 503 errors
    title: str
    error_rate: float
    latency_ms: float
    db_connections: int
    deployment_version: Optional[str] = None

    class Config:
        from_attributes = True

class IncidentDetail(BaseModel):
    id: str
    title: str
    service: str
    severity: str
    status: str
    started_at: str
    started_relative: str
    current_signal: str
    error_rate: float
    latency_ms: float
    db_connections: int
    db_pool_max: int
    traffic_change: str
    deployment_version: Optional[str] = None
    summary: Optional[str] = None
    telemetry: List[TelemetrySnapshotSchema] = []
    recent_changes: List[RecentChangeSchema] = []
    recent_logs: List[RecentLogSchema] = []

    class Config:
        from_attributes = True

class IncidentCreate(BaseModel):
    service: str = Field(..., example="Checkout API")
    severity: str = Field("SEV-1", example="SEV-1")
    title: Optional[str] = None
    current_signal: str = Field(..., example="503 errors")
    error_rate: float = Field(23.4, example=23.4)
    latency_ms: float = Field(8720.0, example=8720.0)
    db_connections: int = Field(498, example=498)
    db_pool_max: int = Field(500, example=500)
    recent_deployment: Optional[str] = Field("v4.8.2", example="v4.8.2")
    traffic_change: Optional[str] = Field("+31%", example="+31%")
    log_excerpt: Optional[str] = None
