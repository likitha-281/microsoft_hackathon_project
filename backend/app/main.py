import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.db.database import init_db, SessionLocal
from backend.app.services.incident_service import seed_default_incidents
from backend.app.services.hindsight import hindsight_service
from backend.app.api import incidents, investigations, memory, patterns

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("flowops")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== Starting FlowOps Engine ===")
    init_db()
    with SessionLocal() as db:
        seed_default_incidents(db)
    
    h_status = hindsight_service.get_status()
    logger.info(f"Hindsight Bank: {h_status['bank_id']} (Status: {h_status['status']})")
    logger.info(f"Loaded {h_status['total_experiences']} organizational incident memories.")
    yield
    logger.info("=== FlowOps Engine Stopped ===")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.DESCRIPTION,
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(investigations.router, prefix=settings.API_V1_STR)
app.include_router(memory.router, prefix=settings.API_V1_STR)
app.include_router(patterns.router, prefix=settings.API_V1_STR)

# Also mount under /api/v1 for strict v1 clients
app.include_router(incidents.router, prefix="/api/v1")
app.include_router(investigations.router, prefix="/api/v1")
app.include_router(memory.router, prefix="/api/v1")
app.include_router(patterns.router, prefix="/api/v1")


@app.get("/health")
@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "hindsight": hindsight_service.get_status()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
