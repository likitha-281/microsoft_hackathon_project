from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True, index=True) # e.g. INC-2026-0917
    title = Column(String(256), nullable=False)
    service = Column(String(128), nullable=False, index=True) # e.g. Checkout API
    severity = Column(String(32), nullable=False, index=True) # SEV-1, SEV-2, SEV-3
    status = Column(String(32), nullable=False, default="Investigating", index=True) # Investigating, Monitoring, Resolved
    started_at = Column(String(32), nullable=False) # e.g. "20:42" or ISO
    started_relative = Column(String(64), nullable=True) # e.g. "12 min"
    current_signal = Column(String(128), nullable=False) # e.g. "503 errors"
    
    # Telemetry metrics
    error_rate = Column(Float, default=0.0) # percentage e.g. 23.4
    latency_ms = Column(Float, default=0.0) # ms e.g. 8720
    db_connections = Column(Integer, default=0) # e.g. 498
    db_pool_max = Column(Integer, default=500) # e.g. 500
    traffic_change = Column(String(32), default="+0%") # e.g. "+31%"
    cpu_percent = Column(Float, default=0.0)
    memory_percent = Column(Float, default=0.0)
    deployment_version = Column(String(64), nullable=True) # e.g. "v4.8.2"
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    telemetry = relationship("TelemetrySnapshot", back_populates="incident", cascade="all, delete-orphan", order_by="TelemetrySnapshot.id")
    recent_changes = relationship("RecentChange", back_populates="incident", cascade="all, delete-orphan", order_by="RecentChange.id")
    recent_logs = relationship("RecentLog", back_populates="incident", cascade="all, delete-orphan", order_by="RecentLog.id")
    steps = relationship("InvestigationStep", back_populates="incident", cascade="all, delete-orphan", order_by="InvestigationStep.step_number")
    actions = relationship("InvestigationAction", back_populates="incident", cascade="all, delete-orphan", order_by="InvestigationAction.created_at.desc()")
    resolution = relationship("ResolutionRecord", back_populates="incident", uselist=False, cascade="all, delete-orphan")


class TelemetrySnapshot(Base):
    __tablename__ = "telemetry_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(String(32), nullable=False)
    error_rate = Column(Float, default=0.0)
    latency_ms = Column(Float, default=0.0)
    db_connections = Column(Integer, default=0)
    db_pool_max = Column(Integer, default=500)
    cpu_percent = Column(Float, default=0.0)
    memory_percent = Column(Float, default=0.0)
    request_rate = Column(Integer, default=0)

    incident = relationship("Incident", back_populates="telemetry")


class RecentChange(Base):
    __tablename__ = "recent_changes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(String(32), nullable=False) # e.g. "20:37"
    description = Column(String(256), nullable=False) # e.g. "Deployment v4.8.2"
    change_type = Column(String(32), default="deployment")

    incident = relationship("Incident", back_populates="recent_changes")


class RecentLog(Base):
    __tablename__ = "recent_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(String(32), nullable=False) # e.g. "20:42:13"
    level = Column(String(16), nullable=False, default="ERROR") # ERROR, WARN, INFO
    service = Column(String(64), nullable=False) # e.g. "checkout-api"
    message = Column(Text, nullable=False)

    incident = relationship("Incident", back_populates="recent_logs")
