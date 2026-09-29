import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.database import init_db, SessionLocal
from backend.app.services.incident_service import seed_default_incidents
from backend.app.services.hindsight import hindsight_service

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()
    with SessionLocal() as db:
        seed_default_incidents(db)

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["service"] == "FLOWOPS"
    assert "hindsight" in data

def test_list_incidents(client):
    resp = client.get("/api/incidents")
    assert resp.status_code == 200
    incidents = resp.json()
    assert len(incidents) >= 1
    hero = next((i for i in incidents if i["id"] == "INC-2026-0917"), None)
    assert hero is not None
    assert hero["service"] == "Checkout API"
    assert hero["severity"] == "SEV-1"
    assert hero["status"] == "Investigating"

def test_get_incident_detail(client):
    resp = client.get("/api/incidents/INC-2026-0917")
    assert resp.status_code == 200
    detail = resp.json()
    assert detail["id"] == "INC-2026-0917"
    assert detail["service"] == "Checkout API"
    assert detail["db_connections"] == 498
    assert len(detail["telemetry"]) > 0
    assert len(detail["recent_changes"]) > 0
    assert len(detail["recent_logs"]) > 0

def test_create_incident(client):
    payload = {
        "service": "Checkout API",
        "severity": "SEV-1",
        "current_signal": "503 errors",
        "error_rate": 25.0,
        "latency_ms": 9100.0,
        "db_connections": 499,
        "db_pool_max": 500,
        "recent_deployment": "v4.8.3",
        "traffic_change": "+35%",
        "log_excerpt": "ERROR checkout-api database connection acquisition timeout\nHTTP 503 /checkout"
    }
    resp = client.post("/api/incidents", json=payload)
    assert resp.status_code == 200
    new_inc = resp.json()
    assert new_inc["service"] == "Checkout API"
    assert new_inc["status"] == "Investigating"
    assert new_inc["db_connections"] == 499

def test_agent_investigation_and_hindsight_recall(client):
    resp = client.get("/api/incidents/INC-2026-0917/investigation")
    assert resp.status_code == 200
    data = resp.json()
    assert "assessment" in data
    assert "hypotheses" in data
    assert len(data["hypotheses"]) >= 2
    assert "evidence" in data
    assert "relevant_experiences" in data
    assert len(data["relevant_experiences"]) >= 1
    # Check that INC-1042 was recalled with human-readable relevance
    inc1042 = next((e for e in data["relevant_experiences"] if e["incident_id"] == "INC-1042"), None)
    assert inc1042 is not None
    assert len(inc1042["relevance_reasons"]) > 0
    assert any("Same service" in r for r in inc1042["relevance_reasons"])
    assert "recommendation" in data
    assert "reason" in data

def test_record_investigation_action(client):
    action_payload = {
        "action": "Increase DB connection pool",
        "expected_result": "Reduce connection acquisition failures",
        "actual_result": "Error rate dropped from 23% to 3%",
        "observation": "Connection usage returned below 80%."
    }
    resp = client.post("/api/incidents/INC-2026-0917/actions", json=action_payload)
    assert resp.status_code == 200
    action = resp.json()
    assert action["action"] == "Increase DB connection pool"
    assert action["status"] == "SUCCESS"

    # Verify action appears in list
    actions_resp = client.get("/api/incidents/INC-2026-0917/actions")
    assert actions_resp.status_code == 200
    actions = actions_resp.json()
    assert len(actions) >= 1

def test_resolve_incident_and_hindsight_retain(client):
    # Create a fresh incident to resolve
    payload = {
        "service": "Payment API",
        "severity": "SEV-2",
        "current_signal": "Webhook retry storm",
        "error_rate": 8.0,
        "latency_ms": 4200.0,
        "db_connections": 120,
        "db_pool_max": 500
    }
    inc_resp = client.post("/api/incidents", json=payload)
    inc_id = inc_resp.json()["id"]

    # Resolve incident and store experience in Hindsight
    resolve_payload = {
        "root_cause": "Payment partner webhook retry storm saturated Gunicorn worker threads",
        "what_worked": "Decoupled webhook ingestion to asynchronous SQS queue with HTTP 202 response",
        "what_failed": "Restarting payment-api containers, increasing worker thread pool",
        "lesson": "External webhooks must always acknowledge with 202 immediately and process asynchronously."
    }
    res_resp = client.post(f"/api/incidents/{inc_id}/resolve", json=resolve_payload)
    assert res_resp.status_code == 200
    res_data = res_resp.json()
    assert res_data["status"] == "success"

    # Verify newly retained memory is queryable in Hindsight memory search
    mem_resp = client.get("/api/memory?q=webhook")
    assert mem_resp.status_code == 200
    mem_data = mem_resp.json()
    assert mem_data["total"] >= 1
    found = any(m["incident_id"] == inc_id for m in mem_data["memories"])
    assert found is True

def test_patterns(client):
    resp = client.get("/api/patterns")
    assert resp.status_code == 200
    patterns = resp.json()
    assert len(patterns) >= 1
    db_pattern = next((p for p in patterns if "Database connection exhaustion" in p["name"]), None)
    assert db_pattern is not None
    assert db_pattern["incident_count"] >= 1
    assert len(db_pattern["common_signals"]) > 0
    assert len(db_pattern["common_failed_actions"]) > 0
    assert len(db_pattern["common_successful_actions"]) > 0
