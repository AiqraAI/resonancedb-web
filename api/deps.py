"""
FastAPI Dependencies

Provides reusable dependencies for authentication, database sessions, and rate limiting.
"""

from typing import Annotated
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.database import get_db
from api.core.security import hash_api_key, is_valid_api_key_format
from api.models.contributor import Contributor


async def get_current_contributor(
    authorization: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_db),
) -> Contributor:
    """
    Dependency that validates the API key and returns the current contributor.
    
    Usage:
        @app.get("/protected")
        async def protected_route(contributor: Contributor = Depends(get_current_contributor)):
            return {"email": contributor.email}
    
    Raises:
        HTTPException 401: If no API key, invalid format, or not found
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract Bearer token
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Use: Bearer <api_key>",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    api_key = authorization[7:]  # Remove "Bearer " prefix
    
    # Validate format
    if not is_valid_api_key_format(api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Hash and lookup
    key_hash = hash_api_key(api_key)
    result = await db.execute(
        select(Contributor).where(Contributor.api_key_hash == key_hash)
    )
    contributor = result.scalar_one_or_none()
    
    if contributor is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return contributor


async def get_optional_contributor(
    authorization: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_db),
) -> Contributor | None:
    """
    Dependency that optionally validates API key.
    
    Returns Contributor if valid key provided, None otherwise.
    Does not raise errors for missing/invalid keys.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    api_key = authorization[7:]
    
    if not is_valid_api_key_format(api_key):
        return None
    
    key_hash = hash_api_key(api_key)
    result = await db.execute(
        select(Contributor).where(Contributor.api_key_hash == key_hash)
    )
    return result.scalar_one_or_none()


# Type aliases for cleaner route signatures
CurrentContributor = Annotated[Contributor, Depends(get_current_contributor)]
OptionalContributor = Annotated[Contributor | None, Depends(get_optional_contributor)]
DBSession = Annotated[AsyncSession, Depends(get_db)]
