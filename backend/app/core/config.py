import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "FLOWOPS"
    TAGLINE: str = "Learn from every incident."
    DESCRIPTION: str = "AI-powered incident response assistant with failure-aware organizational memory."
    API_V1_STR: str = "/api"
    DEBUG: bool = True

    # Hindsight Configuration
    HINDSIGHT_API_KEY: str = os.getenv("HINDSIGHT_API_KEY", "")
    HINDSIGHT_BASE_URL: str = os.getenv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io/v1")
    HINDSIGHT_BANK_ID: str = os.getenv("HINDSIGHT_BANK_ID", "flowops-sre-memory")

    # Groq / LLM Configuration
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    GROQ_BASE_URL: str = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")

    # Database Configuration (supports PostgreSQL and SQLite fallback)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./flowops.db")

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

settings = Settings()
