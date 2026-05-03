"""
Rate Limiting for ResonanceDB API

Uses slowapi with tier-based limits per contributor.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from fastapi.responses import JSONResponse

from .config import settings


def get_api_key_or_ip(request: Request) -> str:
    """
    Rate limit key function.
    
    Uses API key if present, otherwise falls back to IP address.
    This allows per-contributor rate limiting.
    """
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]  # Return the API key
    return get_remote_address(request)


# Get storage URI from settings - Redis is REQUIRED for production
# In-memory storage is only for local development
import os
is_production = os.getenv("NODE_ENV") == "production" or os.getenv("DEBUG", "false").lower() == "false"

if is_production and not settings.REDIS_URL:
    # In production, Redis should be configured
    # For now, fallback to memory but log warning
    import warnings
    warnings.warn(
        "Running in production without Redis for rate limiting. "
        "Rate limits will not be shared across instances. "
        "Set REDIS_URL environment variable to fix this.",
        RuntimeWarning,
    )

storage_uri = settings.REDIS_URL or "memory://"

# Create limiter instance
limiter = Limiter(
    key_func=get_api_key_or_ip,
    default_limits=["100/hour"],  # Default for unauthenticated requests
    storage_uri=storage_uri,
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """Custom handler for rate limit exceeded errors."""
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": f"Rate limit exceeded: {exc.detail}",
            "retry_after": getattr(exc, "retry_after", 60),
        },
    )


# Tier-based rate limit strings
TIER_LIMITS = {
    "STARTER": f"{settings.RATE_LIMIT_STARTER}/hour",
    "BRONZE": f"{settings.RATE_LIMIT_BRONZE}/hour",
    "SILVER": f"{settings.RATE_LIMIT_SILVER}/hour",
    "GOLD": f"{settings.RATE_LIMIT_GOLD}/hour",
}


def get_limit_for_tier(tier: str) -> str:
    """Get rate limit string for a given contributor tier."""
    return TIER_LIMITS.get(tier.upper(), TIER_LIMITS["STARTER"])


def get_limit_for_tier_from_request(request: Request) -> str:
    """
    Get rate limit string based on authenticated contributor's tier.
    Extracts API key from request and looks up tier.

    Note: This is a fallback for unauthenticated requests.
    For authenticated endpoints, use the tier from the contributor directly.
    """
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        # For authenticated requests, return default limit
        # Actual enforcement happens with contributor context
        return TIER_LIMITS["STARTER"]
    # Unauthenticated requests get default rate limit
    return "100/hour"
