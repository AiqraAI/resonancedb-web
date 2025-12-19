"""
Authentication Router

Handles contributor registration and API key management.
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from api.core.security import generate_api_key, hash_api_key
from api.deps import DBSession, CurrentContributor
from api.models.contributor import Contributor
from api.models.tier import ContributorTier
from api.schemas.contributor import (
    ContributorCreate,
    ContributorWithKey,
    ContributorResponse,
)

router = APIRouter(tags=["Authentication"])


@router.post(
    "/register",
    response_model=ContributorWithKey,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new contributor",
    description="Create a new account and receive your API key. Save it securely - it won't be shown again!",
)
async def register(
    data: ContributorCreate,
    db: DBSession,
) -> ContributorWithKey:
    """
    Register a new contributor.
    
    Returns the API key which should be saved securely - it cannot be retrieved later.
    """
    # Check if email already exists
    result = await db.execute(
        select(Contributor).where(Contributor.email == data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    
    # Generate API key
    api_key, key_hash = generate_api_key()
    
    # Create contributor
    contributor = Contributor(
        email=data.email,
        github_username=data.github_username,
        display_name=data.display_name,
        api_key_hash=key_hash,
        tier=ContributorTier.STARTER,
        total_submissions=0,
        validated_submissions=0,
    )
    
    db.add(contributor)
    await db.flush()
    await db.refresh(contributor)
    
    return ContributorWithKey(
        id=contributor.id,
        email=contributor.email,
        api_key=api_key,
        tier=contributor.tier,
        message="Welcome to ResonanceDB! Save your API key securely - it won't be shown again.",
    )


@router.post(
    "/regenerate-key",
    response_model=ContributorWithKey,
    summary="Regenerate API key",
    description="Generate a new API key. The old key will be invalidated immediately.",
)
async def regenerate_key(
    contributor: CurrentContributor,
    db: DBSession,
) -> ContributorWithKey:
    """
    Regenerate the API key for the authenticated contributor.
    
    The old key is immediately invalidated.
    """
    # Generate new key
    api_key, key_hash = generate_api_key()
    
    # Update contributor
    contributor.api_key_hash = key_hash
    contributor.last_activity_at = datetime.utcnow()
    
    await db.flush()
    
    return ContributorWithKey(
        id=contributor.id,
        email=contributor.email,
        api_key=api_key,
        tier=contributor.tier,
        message="New API key generated. Your old key is now invalid.",
    )


@router.get(
    "/me",
    response_model=ContributorResponse,
    summary="Get current contributor info",
)
async def get_me(
    contributor: CurrentContributor,
) -> ContributorResponse:
    """Get the authenticated contributor's profile."""
    return ContributorResponse.model_validate(contributor)
