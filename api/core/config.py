"""
ResonanceDB API Configuration

Loads settings from environment variables with sensible defaults for development.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "ResonanceDB API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    # For local dev, use SQLite: sqlite+aiosqlite:///./resonancedb.db
    # For production, use PostgreSQL: postgresql+asyncpg://user:pass@host:5432/db
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./resonancedb.db",
        description="Async database connection string"
    )
    
    # Security
    API_KEY_SECRET: str = Field(
        ...,  # Required - no default, must be set via environment
        description="Secret for hashing API keys (REQUIRED - generate with: openssl rand -hex 32)"
    )
    API_KEY_PREFIX: str = "rdb_live_"
    
    # Rate Limiting (requests per hour by tier)
    RATE_LIMIT_STARTER: int = 100
    RATE_LIMIT_BRONZE: int = 500
    RATE_LIMIT_SILVER: int = 2000
    RATE_LIMIT_GOLD: int = 10000  # Effectively unlimited
    
    # S3 (Optional - for raw data archival)
    S3_BUCKET: str | None = None
    S3_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    
    # Models
    DEFAULT_MODEL_PATH: str = "models/material_model.pkl"
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:8000"]
    
    # Redis (for rate limiting in production)
    REDIS_URL: str | None = Field(
        default=None,
        description="Redis URL for rate limiting (e.g., redis://localhost:6379). If not set, uses in-memory storage."
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Convenient alias
settings = get_settings()
