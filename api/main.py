"""
ResonanceDB API - Main Application

FastAPI application entry point with all routers mounted.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.core.config import settings
from api.core.database import init_db, close_db
from api.core.rate_limit import limiter, rate_limit_exceeded_handler
from api.routers import auth, samples, predict, contributors

# Import models to register them with Base before init_db
from api.models.contributor import Contributor  # noqa: F401
from api.models.sample import Sample  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - handles startup and shutdown."""
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
# ResonanceDB API

**The Open Database of How Everything Vibrates**

ResonanceDB enables AI, robots, and IoT devices to identify materials, 
detect structural flaws, and understand physical properties through vibration analysis.

## Features

- **Submit vibration samples** with metadata (material, temperature, device)
- **Get ML predictions** for material classification
- **Query the database** with filters and pagination
- **Track contributions** with a tier-based reward system

## Authentication

All endpoints require an API key in the `Authorization` header:

```
Authorization: Bearer rdb_live_your_key_here
```

Get your API key by registering at `/api/v1/auth/register`.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(samples.router, prefix="/api/v1/samples")
app.include_router(predict.router, prefix="/api/v1/predict")
app.include_router(contributors.router, prefix="/api/v1/contributors")


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - health check."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "healthy",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for load balancers."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
