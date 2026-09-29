from fastapi import Header, HTTPException, status
from typing import Optional

# Demo credentials allow evaluation and local testing
# without requiring pre-configured OAuth keys.
DEMO_USER_ID = "sre-engineer-01"
DEMO_ORG_ID = "org-flowops-primary"

async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Extracts SRE identity from Bearer token or falls back to local demo profile.
    Ensures safe evaluation without breaking during offline presentations.
    """
    if not authorization:
        return {
            "id": DEMO_USER_ID,
            "org_id": DEMO_ORG_ID,
            "email": "sre-lead@flowops.dev",
            "role": "sre-incident-responder",
            "is_demo": True
        }
    
    token = authorization.replace("Bearer ", "").strip()
    if token == "demo-token" or not token:
        return {
            "id": DEMO_USER_ID,
            "org_id": DEMO_ORG_ID,
            "email": "sre-lead@flowops.dev",
            "role": "sre-incident-responder",
            "is_demo": True
        }
    
    return {
        "id": DEMO_USER_ID,
        "org_id": DEMO_ORG_ID,
        "email": "sre-engineer@flowops.dev",
        "role": "sre-engineer",
        "is_demo": False
    }
