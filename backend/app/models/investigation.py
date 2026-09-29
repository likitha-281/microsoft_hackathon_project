from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.models.incident import Base

class InvestigationStep(Base):
    __tablename__ = "investigation_steps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    step_number = Column(Integer, nullable=False, default=1)
    title = Column(String(256), nullable=False) # e.g. "Incident context loaded"
    status = Column(String(32), nullable=False, default="completed") # completed, active, pending
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="steps")


class InvestigationAction(Base):
    __tablename__ = "investigation_actions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(256), nullable=False) # e.g. "Increase DB connection pool"
    expected_result = Column(Text, nullable=False) # e.g. "Reduce connection acquisition failures"
    actual_result = Column(Text, nullable=False) # e.g. "Error rate dropped from 23% to 3%"
    observation = Column(Text, nullable=True) # e.g. "Connection usage returned below 80%"
    status = Column(String(32), default="SUCCESS") # SUCCESS, FAILED, PARTIAL
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="actions")


class ResolutionRecord(Base):
    __tablename__ = "resolution_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    root_cause = Column(Text, nullable=False) # e.g. "Database connection pool exhaustion"
    what_worked = Column(Text, nullable=False) # e.g. "Increase DB connection pool"
    what_failed = Column(Text, nullable=False) # e.g. "Restart, Cache clear"
    lesson_learned = Column(Text, nullable=False) # e.g. "Check DB saturation before restarting the service."
    resolved_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="resolution")
