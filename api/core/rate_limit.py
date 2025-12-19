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


# Create limiter instance
limiter = Limiter(
    key_func=get_api_key_or_ip,
    default_limits=["100/hour"],  # Default for unauthenticated requests
    storage_uri="memory://",  # Use Redis in production: "redis://localhost:6379"
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
