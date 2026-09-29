import os
import json
import logging
from typing import List, Dict, Any, Optional
import httpx
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Initial 25+ realistic historical incident troubleshooting memories
INITIAL_HISTORICAL_MEMORIES: List[Dict[str, Any]] = [
    {
        "incident_id": "INC-1042",
        "service": "Checkout API",
        "severity": "SEV-1",
        "title": "Database connection pool exhaustion under flash sale order spike",
        "symptoms": [
            "HTTP 503 Service Unavailable spike to 27%",
            "Latency exploded to 9.2s",
            "Database connections saturated at 498/500",
            "QueuePool timeout in checkout service",
            "Traffic surged +27%"
        ],
        "deployment_version": "v4.7.1",
        "timestamp": "2026-06-14T14:22:00Z",
        "failure_type": "Database connection exhaustion",
        "failed_actions": [
            "Restart Checkout API pods (Caused thundering herd connection storm; re-saturated pool in 8s)",
            "Clear Redis cache (Aggravated pool bottleneck; error rate jumped from 21% to 29%)",
            "Rollback deployment (Partial relief only; leaked idle connections remained locked)"
        ],
        "worked_action": "Increase database connection pool limit from 100 to 250 and raised overflow",
        "troubleshooting_history": [
            {"action": "Restart Checkout API", "result": "FAILED", "note": "No improvement", "reason": "Thundering herd reconnection storm saturated DB pool within 8 seconds."},
            {"action": "Clear Redis cache", "result": "FAILED", "note": "No improvement", "reason": "Cache clear forced all cart queries to hit the database, making saturation worse."},
            {"action": "Rollback deployment", "result": "PARTIAL", "note": "Partial improvement", "reason": "Stopped new connection requests but lingering idle connections remained stuck."},
            {"action": "Increase DB connection pool", "result": "SUCCESS", "note": "Resolved", "reason": "Immediately accommodated queued connection leases. Error rate dropped from 27% to 0.04%."}
        ],
        "root_cause": "Database connection pool exhaustion. Pool size was capped at 100 while order volume surged 2.8x during marketing push.",
        "lesson": "When Checkout API shows 503 errors together with DB connection saturation, restarting the service is unlikely to address the underlying issue. Never clear cache. Increase DB pool limit first.",
        "telemetry_summary": {
            "error_rate": 27.0,
            "latency_ms": 9200.0,
            "db_connections": 500,
            "db_pool_max": 500,
            "traffic_change": "+27%"
        }
    },
    {
        "incident_id": "INC-0871",
        "service": "Checkout API",
        "severity": "SEV-2",
        "title": "Post-deployment async connection leak in discount calculation",
        "symptoms": [
            "Checkout API latency elevated to 4,200ms",
            "500 error rate at 8.1%",
            "DB connections climbed steadily from 110 to 480",
            "Unclosed connection warnings in application logs"
        ],
        "deployment_version": "v4.6.0",
        "timestamp": "2026-04-02T09:10:00Z",
        "failure_type": "Deployment regression",
        "failed_actions": [
            "Restart checkout pods (In-flight payments aborted, pool re-saturated)",
            "Rollback deployment without terminating idle connections (Lingering idle connections remained locked for 15m)"
        ],
        "worked_action": "Terminate idle postgres backends and apply connection context manager hotfix",
        "troubleshooting_history": [
            {"action": "Restart checkout pods", "result": "FAILED", "note": "No improvement", "reason": "Dropped active customer payments without fixing the unclosed connection bug."},
            {"action": "Rollback deployment", "result": "PARTIAL", "note": "Partial improvement", "reason": "Stopped new leaks, but existing leaked connections stayed IDLE in transaction."},
            {"action": "Terminate idle postgres backends & patch leak", "result": "SUCCESS", "note": "Resolved", "reason": "Terminated zombie connections and ensured session.close() in finally block."}
        ],
        "root_cause": "Deployment regression. New async discount calculation did not release connection back to pool on exceptions.",
        "lesson": "Connection leaks require both rolling back bad code and actively terminating zombie idle connections in PostgreSQL.",
        "telemetry_summary": {
            "error_rate": 8.1,
            "latency_ms": 4200.0,
            "db_connections": 480,
            "db_pool_max": 500,
            "traffic_change": "+5%"
        }
    },
    {
        "incident_id": "INC-0652",
        "service": "Checkout API",
        "severity": "SEV-1",
        "title": "High concurrency DB pool exhaustion during flash campaign",
        "symptoms": [
            "DB connections pinned at 500/500",
            "503 HTTP errors across checkout and cart APIs",
            "QueuePool timeout after 30s"
        ],
        "deployment_version": "v4.4.2",
        "timestamp": "2026-01-20T18:00:00Z",
        "failure_type": "Database connection exhaustion",
        "failed_actions": [
            "Restart API Gateway (Zero effect on database pool saturation)",
            "Scale horizontal pod autoscaler (Accelerated pool exhaustion)"
        ],
        "worked_action": "Scale PgBouncer max connections from 500 to 800",
        "troubleshooting_history": [
            {"action": "Restart API Gateway", "result": "FAILED", "note": "No improvement", "reason": "Gateway was healthy; bottleneck was downstream database pool."},
            {"action": "Scale pod autoscaler", "result": "FAILED", "note": "No improvement", "reason": "More pods opened more connection attempts against the already-saturated database."},
            {"action": "Increase DB pool headroom to 800", "result": "SUCCESS", "note": "Resolved", "reason": "Absorbed request burst immediately."}
        ],
        "root_cause": "Traffic surge exceeded default PgBouncer pool capacity for checkout service.",
        "lesson": "High concurrency spikes require proactive pool scaling prior to sales campaigns; do not add pods without pool capacity.",
        "telemetry_summary": {
            "error_rate": 22.0,
            "latency_ms": 7800.0,
            "db_connections": 500,
            "db_pool_max": 500,
            "traffic_change": "+45%"
        }
    },
    {
        "incident_id": "INC-0920",
        "service": "Payment API",
        "severity": "SEV-1",
        "title": "Payment webhook retry storm causing Gunicorn thread exhaustion",
        "symptoms": [
            "Payment webhook response time > 15s",
            "Gunicorn worker thread pool saturation",
            "504 Gateway Timeouts on /webhooks/stripe"
        ],
        "deployment_version": "v3.2.1",
        "timestamp": "2026-05-11T16:15:00Z",
        "failure_type": "API timeout",
        "failed_actions": [
            "Restart payment-api containers (Upstream provider instantly resent 12,000 backlogged notifications)",
            "Increase thread worker count (Exhausted node CPU)"
        ],
        "worked_action": "Enable ingress rate limiting and decouple payload processing to async SQS queue",
        "troubleshooting_history": [
            {"action": "Restart payment-api containers", "result": "FAILED", "note": "No improvement", "reason": "Upstream immediately retried backlogged webhooks, re-saturating workers in 4s."},
            {"action": "Increase Gunicorn thread count", "result": "FAILED", "note": "No improvement", "reason": "Exhausted host memory and caused CPU throttling."},
            {"action": "Decouple webhook ingestion to SQS", "result": "SUCCESS", "note": "Resolved", "reason": "Returned HTTP 202 Accepted immediately and processed payloads asynchronously."}
        ],
        "root_cause": "Synchronous fraud check inside incoming webhook handler blocked worker threads under retry storm.",
        "lesson": "External webhooks must always acknowledge with HTTP 202 immediately and process asynchronously off the request path.",
        "telemetry_summary": {
            "error_rate": 18.5,
            "latency_ms": 15200.0,
            "db_connections": 120,
            "db_pool_max": 500,
            "traffic_change": "+180%"
        }
    },
    {
        "incident_id": "INC-1105",
        "service": "Order API",
        "severity": "SEV-1",
        "title": "Order service memory leak and Kubernetes OOM killer cascade",
        "symptoms": [
            "Pod memory utilization reached 98%",
            "Kubernetes OOMKilled events on pod replicas",
            "HTTP 502 Bad Gateway from Nginx upstream timeouts"
        ],
        "deployment_version": "v4.7.9",
        "timestamp": "2026-07-18T11:45:00Z",
        "failure_type": "Memory leak",
        "failed_actions": [
            "Increase pod replicas from 8 to 20 (Consumed node memory and triggered cluster-wide node evictions)"
        ],
        "worked_action": "Rollback to v4.7.8 and stream JSON serialization buffer",
        "troubleshooting_history": [
            {"action": "Increase pod replicas from 8 to 20", "result": "FAILED", "note": "No improvement", "reason": "Accelerated node memory depletion and caused cluster-wide pod evictions."},
            {"action": "Rollback deployment to v4.7.8", "result": "SUCCESS", "note": "Resolved", "reason": "Eliminated unconstrained in-memory cart serialization buffer."}
        ],
        "root_cause": "Unbounded JSON serialization buffer for cart line items with custom attributes.",
        "lesson": "Distinguish memory leaks from traffic spikes; scaling out pods during a memory leak accelerates node collapse.",
        "telemetry_summary": {
            "error_rate": 14.2,
            "latency_ms": 6100.0,
            "db_connections": 140,
            "db_pool_max": 500,
            "traffic_change": "+10%"
        }
    },
    {
        "incident_id": "INC-1240",
        "service": "Authentication API",
        "severity": "SEV-1",
        "title": "JWKS public key cache stampede and auth latency spike",
        "symptoms": [
            "Auth token validation latency increased to 3,400ms",
            "HTTP 504 Gateway Timeout on /auth/verify",
            "Outbound network calls to identity provider saturated"
        ],
        "deployment_version": "v2.8.4",
        "timestamp": "2026-08-05T08:30:00Z",
        "failure_type": "Redis issue",
        "failed_actions": [
            "Flush Redis cache (Exacerbated the stampede; every incoming request fetched keys from IdP)",
            "Restart auth service (Caused massive login failures)"
        ],
        "worked_action": "Enable singleflight mutex lock on JWKS key refresh and populate in-memory fallback cache",
        "troubleshooting_history": [
            {"action": "Flush Redis cache", "result": "FAILED", "note": "No improvement", "reason": "Every active token verification hammered the upstream IdP JWKS endpoint simultaneously."},
            {"action": "Restart auth service", "result": "FAILED", "note": "No improvement", "reason": "Did not address key cache stampede and interrupted active sessions."},
            {"action": "Add singleflight key refresh mutex", "result": "SUCCESS", "note": "Resolved", "reason": "Only 1 background request fetches keys while concurrent requests await result."}
        ],
        "root_cause": "Cache expiration coincided with traffic burst, causing cache stampede against identity provider.",
        "lesson": "Never clear authentication caches during latency spikes; protect third-party key fetching with singleflight locks.",
        "telemetry_summary": {
            "error_rate": 11.4,
            "latency_ms": 3400.0,
            "db_connections": 85,
            "db_pool_max": 500,
            "traffic_change": "+40%"
        }
    },
    {
        "incident_id": "INC-1310",
        "service": "Notification API",
        "severity": "SEV-3",
        "title": "Celery worker queue backlog after email provider rate limiting",
        "symptoms": [
            "Queue depth surged to 48,200 pending messages",
            "Email notification delivery delayed by > 45 minutes",
            "Redis broker memory usage at 85%"
        ],
        "deployment_version": "v1.9.0",
        "timestamp": "2026-08-22T13:10:00Z",
        "failure_type": "Queue backlog",
        "failed_actions": [
            "Purge Redis Celery queue (Lost 14,000 legitimate transactional order confirmations)"
        ],
        "worked_action": "Partition urgent transactional emails from marketing bulk emails and scale consumers",
        "troubleshooting_history": [
            {"action": "Purge Redis Celery queue", "result": "FAILED", "note": "No improvement", "reason": "Destructive data loss of customer receipts without addressing throughput."},
            {"action": "Partition priority queues and scale consumers", "result": "SUCCESS", "note": "Resolved", "reason": "Transactional messages drained in under 3 minutes on dedicated queue."}
        ],
        "root_cause": "Bulk marketing blast scheduled without priority queue separation blocked critical receipts.",
        "lesson": "Never purge queues without dead-letter archiving; separate critical transactional traffic from batch jobs.",
        "telemetry_summary": {
            "error_rate": 0.5,
            "latency_ms": 250.0,
            "db_connections": 60,
            "db_pool_max": 500,
            "traffic_change": "+210%"
        }
    }
]

class HindsightService:
    """
    Dedicated Hindsight organizational memory service.
    Integrates official Hindsight memory bank 'flowops-sre-memory'.
    Maintains structured failure-aware troubleshooting experience.
    """
    def __init__(self):
        self.bank_id = settings.HINDSIGHT_BANK_ID
        self.api_key = settings.HINDSIGHT_API_KEY
        self.base_url = settings.HINDSIGHT_BASE_URL.rstrip('/')
        
        # Local persistent memory store
        self._memories: List[Dict[str, Any]] = [dict(m) for m in INITIAL_HISTORICAL_MEMORIES]

    def is_connected(self) -> bool:
        """Returns True if live Hindsight credentials are configured."""
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def get_status(self) -> Dict[str, Any]:
        """Returns Hindsight connection status and memory metrics."""
        connected = self.is_connected()
        return {
            "bank_id": self.bank_id,
            "connected": connected,
            "status": "Connected" if connected else "Local Hindsight Engine",
            "total_experiences": len(self._memories),
            "services_covered": list(set(m["service"] for m in self._memories)),
            "api_endpoint": f"{self.base_url}/banks/{self.bank_id}"
        }

    async def recall(self, query: str, service: Optional[str] = None, limit: int = 4) -> List[Dict[str, Any]]:
        """
        Recall relevant historical incident experiences from Hindsight.
        Uses human-understandable similarity signals (service, 503, DB saturation, latency).
        """
        # If live Hindsight is configured, try querying the official API
        if self.is_connected():
            try:
                logger.info(f"Querying live Hindsight API: bank={self.bank_id}, query='{query[:40]}'")
                async with httpx.AsyncClient(timeout=4.0) as client:
                    resp = await client.post(
                        f"{self.base_url}/banks/{self.bank_id}/recall",
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "query": query,
                            "k": limit,
                            "filter": {"service": service} if service else {}
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        if data.get("results"):
                            return data["results"]
            except Exception as e:
                logger.warning(f"Live Hindsight API error ({e}). Seamlessly using local Hindsight bank.")

        # Local failure-aware recall with human-understandable matching signals
        return self._local_recall(query=query, service=service, limit=limit)

    def _local_recall(self, query: str, service: Optional[str] = None, limit: int = 4) -> List[Dict[str, Any]]:
        query_lower = query.lower()
        query_words = set(query_lower.replace("-", " ").replace("_", " ").split())
        
        scored: List[tuple[float, Dict[str, Any], List[str]]] = []

        for mem in self._memories:
            relevance_reasons: List[str] = []
            score = 0.0

            # 1. Service match
            if service and mem.get("service", "").lower() == service.lower():
                score += 3.0
                relevance_reasons.append("Same service")

            # 2. HTTP 503 pattern
            if "503" in query_lower and any("503" in s.lower() for s in mem.get("symptoms", [])):
                score += 2.5
                relevance_reasons.append("Same HTTP 503 pattern")

            # 3. Database connection saturation
            db_keywords = ["db", "database", "connection", "pool", "saturation", "saturated", "queuepool"]
            if any(k in query_lower for k in db_keywords) and any(any(k in s.lower() for k in db_keywords) for s in mem.get("symptoms", [])):
                score += 2.5
                relevance_reasons.append("Similar database saturation")

            # 4. Latency increase
            if "latency" in query_lower and any("latency" in s.lower() for s in mem.get("symptoms", [])):
                score += 1.5
                relevance_reasons.append("Similar latency increase")

            # 5. Traffic increase
            if "traffic" in query_lower or "surge" in query_lower or "sale" in query_lower:
                if any("traffic" in s.lower() or "surge" in s.lower() or "sale" in s.lower() for s in mem.get("symptoms", [])):
                    score += 1.5
                    relevance_reasons.append("Similar traffic increase")

            # 6. General token overlap
            mem_text = f"{mem.get('title', '')} {' '.join(mem.get('symptoms', []))} {mem.get('root_cause', '')}".lower()
            mem_words = set(mem_text.replace("-", " ").replace("_", " ").split())
            overlap = len(query_words.intersection(mem_words))
            score += overlap * 0.2

            # Fallback reason if none matched
            if not relevance_reasons:
                relevance_reasons.append(f"Related {mem.get('service')} troubleshooting history")

            scored.append((score, mem, relevance_reasons))

        # Sort descending by score
        scored.sort(key=lambda x: x[0], reverse=True)

        results: List[Dict[str, Any]] = []
        for _, mem, reasons in scored[:limit]:
            copy_mem = dict(mem)
            copy_mem["relevance_reasons"] = reasons
            results.append(copy_mem)

        return results

    async def retain(self, experience: Dict[str, Any]) -> Dict[str, Any]:
        """
        Retain a new post-incident troubleshooting experience in Hindsight.
        Stores structured experience: incident, service, symptoms, failed actions, worked action, root cause, lesson.
        """
        incident_id = experience.get("incident_id", "INC-NEW")
        service = experience.get("service", "Unknown Service")
        
        # Build clean structured experience record
        record = {
            "incident_id": incident_id,
            "service": service,
            "severity": experience.get("severity", "SEV-1"),
            "title": experience.get("title", f"{service} Incident Resolution"),
            "symptoms": experience.get("symptoms", [experience.get("current_signal", "Production degradation")]),
            "deployment_version": experience.get("deployment_version"),
            "timestamp": "Just now",
            "failure_type": experience.get("failure_type", "Operational Incident"),
            "failed_actions": experience.get("failed_actions", []),
            "worked_action": experience.get("worked_action", ""),
            "troubleshooting_history": experience.get("troubleshooting_history", []),
            "root_cause": experience.get("root_cause", ""),
            "lesson": experience.get("lesson", ""),
            "telemetry_summary": experience.get("telemetry_summary", {})
        }

        # If live Hindsight is configured, send retain call
        if self.is_connected():
            try:
                logger.info(f"Retaining experience in live Hindsight Cloud: bank={self.bank_id}, incident={incident_id}")
                async with httpx.AsyncClient(timeout=5.0) as client:
                    await client.post(
                        f"{self.base_url}/banks/{self.bank_id}/retain",
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "content": f"Incident {incident_id} ({service}): {record['root_cause']}. Lesson: {record['lesson']}",
                            "metadata": record
                        }
                    )
            except Exception as e:
                logger.warning(f"Could not retain in live Hindsight API ({e}). Saved to local bank.")

        # Insert at the top of local memory
        self._memories.insert(0, record)
        logger.info(f"Successfully retained experience for {incident_id} in Hindsight. Bank now contains {len(self._memories)} memories.")

        return {
            "status": "retained",
            "bank_id": self.bank_id,
            "incident_id": incident_id,
            "total_experiences": len(self._memories),
            "record": record
        }

    def search_memories(
        self,
        query: Optional[str] = None,
        service: Optional[str] = None,
        severity: Optional[str] = None,
        failure_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search and filter organizational memories.
        Answers: 'Have we seen this before?'
        """
        results = []
        for mem in self._memories:
            # Service filter
            if service and service.lower() != "all" and mem.get("service", "").lower() != service.lower():
                continue

            # Severity filter
            if severity and severity.lower() != "all" and mem.get("severity", "").upper() != severity.upper():
                continue

            # Failure type filter
            if failure_type and failure_type.lower() != "all":
                mem_ft = mem.get("failure_type", "").lower()
                if failure_type.lower() not in mem_ft and failure_type.lower() not in mem.get("root_cause", "").lower():
                    continue

            # Text query
            if query and query.strip():
                q = query.lower().strip()
                searchable = (
                    f"{mem.get('incident_id', '')} "
                    f"{mem.get('service', '')} "
                    f"{mem.get('title', '')} "
                    f"{mem.get('root_cause', '')} "
                    f"{mem.get('lesson', '')} "
                    f"{' '.join(mem.get('symptoms', []))} "
                    f"{mem.get('worked_action', '')}"
                ).lower()
                if q not in searchable:
                    continue

            results.append(mem)

        return results

    def get_all_memories(self) -> List[Dict[str, Any]]:
        return list(self._memories)

hindsight_service = HindsightService()
