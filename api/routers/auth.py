"""
Authentication Router

Handles contributor registration and API key management.
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Header, status
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
        select(Contributor).where(Contributor.email == data.email.lower())
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
        email=data.email.lower(),
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


from pydantic import BaseModel

class OAuthLoginRequest(BaseModel):
    email: str
    name: str | None = None
    provider: str  # "google" or "github"
    token: str | None = None # For server-side verification


class OAuthLoginResponse(BaseModel):
    id: str
    email: str
    api_key: str | None  # Only returned for first-time users or verified sessions
    tier: str
    display_name: str | None
    is_new_user: bool
    message: str


@router.post(
    "/oauth-login",
    response_model=OAuthLoginResponse,
    summary="OAuth login/register",
    description="Find or create a contributor from OAuth login. Returns API key for new users.",
)
async def oauth_login(
    data: OAuthLoginRequest,
    db: DBSession,
) -> OAuthLoginResponse:
    """
    Handle OAuth login by finding or creating a contributor.
    
    SECURITY NOTE: In a real production app, you MUST verify the 'token' 
    with the OAuth provider (Google/GitHub) here.
    """
    # TODO: Implement token verification logic
    # if not verify_oauth_token(data.token, data.provider):
    #     raise HTTPException(status_code=401, detail="Invalid OAuth token")

    # Check if email already exists
    email_lower = data.email.lower()
    result = await db.execute(
        select(Contributor).where(Contributor.email == email_lower)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        # If user exists, we might still want to return a key if they are "logging in" 
        # on a new device. For security, we usually regenerate or require a session.
        # For now, we return existing info without the key.
        return OAuthLoginResponse(
            id=str(existing.id),
            email=existing.email,
            api_key=None,  # Key is not exposed for existing users
            tier=existing.tier.value,
            display_name=existing.display_name,
            is_new_user=False,
            message="Welcome back!",
        )
    
    # Create new contributor
    api_key, key_hash = generate_api_key()
    
    contributor = Contributor(
        email=email_lower,
        display_name=data.name,
        api_key_hash=key_hash,
        tier=ContributorTier.STARTER,
        total_submissions=0,
        validated_submissions=0,
    )
    
    db.add(contributor)
    await db.flush()
    await db.refresh(contributor)
    
    return OAuthLoginResponse(
        id=str(contributor.id),
        email=contributor.email,
        api_key=api_key,  # Show key for new users
        tier=contributor.tier.value,
        display_name=contributor.display_name,
        is_new_user=True,
        message="Welcome to ResonanceDB! Your API key has been generated. Save it securely!",
    )
         register,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

