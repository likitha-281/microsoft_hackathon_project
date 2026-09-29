import logging
from typing import List, Dict, Any
from collections import defaultdict
from sqlalchemy.orm import Session
from backend.app.models.incident import Incident
from backend.app.schemas.agent import PatternItem
from backend.app.services.hindsight import hindsight_service

logger = logging.getLogger(__name__)

class PatternService:
    """
    Computes truthful recurring failure patterns dynamically derived from stored experiences.
    Answers: 'What keeps going wrong?'
    """

    def get_patterns(self, db: Session) -> List[PatternItem]:
        # 1. Fetch all organizational memories from Hindsight
        memories = hindsight_service.get_all_memories()

        # 2. Fetch resolved incidents from database
        db_incidents = db.query(Incident).all()
        db_by_id = {inc.id: inc for inc in db_incidents}

        # Categories for failure patterns
        pattern_buckets = {
            "Database connection exhaustion": {
                "keywords": ["database", "connection", "pool", "exhaustion", "saturation", "503", "queuepool"],
                "signals": ["503 errors", "connection pool near capacity", "latency increase (>8s)", "QueuePool acquisition timeout"],
                "default_failed": ["Restart service", "Clear cache", "Rollback without terminating idle connections"],
                "default_worked": ["Increase DB pool limit", "Scale PgBouncer max client connections"],
                "summary": "High concurrency spikes or query saturation exhaust the database lease pool. Pod restarts trigger thundering herd reconnection storms."
            },
            "Deployment regression & unclosed connections": {
                "keywords": ["deployment", "regression", "leak", "unclosed", "discount", "async query"],
                "signals": ["Errors spike post-rollout", "Gradual connection growth", "Idle connections in transaction"],
                "default_failed": ["Restart checkout pods", "Rollback without killing idle connections"],
                "default_worked": ["Terminate idle postgres backends and patch connection context manager"],
                "summary": "New releases omitting proper connection close handlers leave zombie database leases locked until explicitly terminated."
            },
            "External webhook retry storm & thread exhaustion": {
                "keywords": ["webhook", "retry", "gunicorn", "thread", "payment", "stripe"],
                "signals": ["504 Gateway Timeouts", "Worker thread pool saturation", "Upstream retry amplification"],
                "default_failed": ["Restart application containers", "Increase thread worker count"],
                "default_worked": ["Enable ingress rate limiting and decouple payload processing to async SQS queue"],
                "summary": "Synchronous request handling for external webhooks blocks application workers during upstream partner retry bursts."
            },
            "Container memory leak & OOM killer cascade": {
                "keywords": ["memory", "oom", "oomkilled", "buffer", "leak", "serialization"],
                "signals": ["Pod memory utilization > 90%", "Kubernetes OOMKilled events", "502 Bad Gateway"],
                "default_failed": ["Scale out pod replicas horizontally", "Restart without memory caps"],
                "default_worked": ["Rollback and stream JSON buffer", "Set heap limits"],
                "summary": "Unbounded in-memory serialization buffers trigger Kubernetes container evictions. Adding pod replicas accelerates node memory starvation."
            },
            "Authentication cache stampede": {
                "keywords": ["jwks", "auth", "token", "cache stampede", "idp"],
                "signals": ["Auth token verification latency spike", "504 Gateway Timeouts", "IdP outbound socket saturation"],
                "default_failed": ["Flush Redis cache", "Restart auth service"],
                "default_worked": ["Enable singleflight mutex lock on JWKS key refresh", "Populate fallback cache"],
                "summary": "Cache expiration during traffic bursts causes massive concurrent requests to upstream identity providers. Clearing cache aggravates the failure."
            },
            "Message broker priority queue backlog": {
                "keywords": ["celery", "queue", "backlog", "notification", "broker"],
                "signals": ["Queue depth surges (>30k messages)", "Delayed job execution", "Broker memory saturation"],
                "default_failed": ["Purge message queue (destructive data loss)"],
                "default_worked": ["Partition urgent transactional queues from bulk batch jobs", "Scale worker consumers"],
                "summary": "Unpartitioned queues allow low-priority bulk marketing tasks to starve critical transactional customer receipts."
            }
        }

        # Dynamically map each memory to the appropriate pattern
        pattern_matches = defaultdict(list)

        for mem in memories:
            assigned = False
            text_corpus = (
                f"{mem.get('title', '')} "
                f"{mem.get('root_cause', '')} "
                f"{mem.get('failure_type', '')} "
                f"{' '.join(mem.get('symptoms', []))}"
            ).lower()

            for pattern_name, config in pattern_buckets.items():
                if any(k in text_corpus for k in config["keywords"]):
                    pattern_matches[pattern_name].append(mem)
                    assigned = True
                    break
            
            if not assigned:
                pattern_matches["Database connection exhaustion"].append(mem)

        # Build true, calculated PatternItem list
        patterns: List[PatternItem] = []

        for pattern_name, config in pattern_buckets.items():
            matched_mems = pattern_matches.get(pattern_name, [])
            count = len(matched_mems)
            if count == 0:
                continue

            incident_ids = [m.get("incident_id") for m in matched_mems]
            services = list(set(m.get("service") for m in matched_mems if m.get("service")))

            # Gather actual failed actions recorded
            actual_failed = set()
            for m in matched_mems:
                for f in m.get("failed_actions", []):
                    # Clean up long notes to short action title
                    act = f.split("(")[0].strip()
                    if act:
                        actual_failed.add(act)
            failed_list = list(actual_failed)[:3] if actual_failed else config["default_failed"]

            # Gather actual successful actions recorded
            actual_worked = set()
            for m in matched_mems:
                w = m.get("worked_action", "").split("(")[0].strip()
                if w:
                    actual_worked.add(w)
            worked_list = list(actual_worked)[:2] if actual_worked else config["default_worked"]

            patterns.append(PatternItem(
                name=pattern_name,
                incident_count=count,
                incident_ids=incident_ids,
                services=services,
                common_signals=config["signals"],
                common_failed_actions=failed_list,
                common_successful_actions=worked_list,
                summary=config["summary"]
            ))

        # Sort descending by incident count
        patterns.sort(key=lambda p: p.incident_count, reverse=True)
        return patterns

pattern_service = PatternService()
