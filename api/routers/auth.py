"""
Authentication Router

Handles contributor registration and API key management.
"""

import httpx
from datetime import datetime
from fastapi import APIRouter, HTTPException, Header, status
from fastapi.requests import Request
from sqlalchemy import select

from api.core.security import generate_api_key, hash_api_key
from api.core.rate_limit import limiter, get_limit_for_tier
from api.deps import DBSession, CurrentContributor
from api.models.contributor import Contributor
from api.models.tier import ContributorTier
from api.schemas.contributor import (
    ContributorCreate,
    ContributorWithKey,
    ContributorResponse,
    OAuthLoginRequest,
    OAuthLoginResponse,
)

router = APIRouter(tags=["Authentication"])

# OAuth provider endpoints
OAUTH_PROVIDERS = {
    "google": {
        "userinfo_url": "https://www.googleapis.com/oauth2/v3/userinfo",
        "token_verify_url": "https://oauth2.googleapis.com/tokeninfo",
    },
    "github": {
        "userinfo_url": "https://api.github.com/user",
        "token_verify_url": "https://api.github.com/user",
    },
}


@router.post(
    "/register",
    response_model=ContributorWithKey,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new contributor",
    description="Create a new account and receive your API key. Save it securely - it won't be shown again!",
)
@limiter.limit("10/minute")  # Rate limit registration to prevent abuse
async def register(
    request: Request,
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
@limiter.limit(get_limit_for_tier)  # Uses contributor's tier-based limit
async def regenerate_key(
    request: Request,
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
@limiter.limit(get_limit_for_tier)  # Uses contributor's tier-based limit
async def get_me(
    request: Request,
    contributor: CurrentContributor,
) -> ContributorResponse:
    """Get the authenticated contributor's profile."""
    return ContributorResponse.model_validate(contributor)


async def verify_oauth_token(token: str, provider: str) -> dict:
    """
    Verify OAuth token with the provider and return user info.

    Raises HTTPException if token is invalid.
    """
    if provider not in OAUTH_PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OAuth provider: {provider}",
        )

    provider_config = OAUTH_PROVIDERS[provider]

    async with httpx.AsyncClient() as client:
        try:
            if provider == "google":
                # Verify token with Google
                response = await client.get(
                    f"{provider_config['token_verify_url']}?access_token={token}",
                    timeout=10.0,
                )
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid Google OAuth token",
                    )
                # Get user info with verified token
                response = await client.get(
                    provider_config["userinfo_url"],
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=10.0,
                )
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Failed to get Google user info",
                    )
                return response.json()

            elif provider == "github":
                # Verify token with GitHub by fetching user info
                response = await client.get(
                    provider_config["userinfo_url"],
                    headers={
                        "Authorization": f"token {token}",
                        "Accept": "application/vnd.github.v3+json",
                    },
                    timeout=10.0,
                )
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid GitHub OAuth token",
                    )
                user_info = response.json()
                # Get email if not in main response
                if not user_info.get("email"):
                    email_response = await client.get(
                        "https://api.github.com/user/emails",
                        headers={
                            "Authorization": f"token {token}",
                            "Accept": "application/vnd.github.v3+json",
                        },
                        timeout=10.0,
                    )
                    if email_response.status_code == 200:
                        emails = email_response.json()
                        primary = next((e for e in emails if e.get("primary")), None)
                        if primary:
                            user_info["email"] = primary["email"]
                return user_info

        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OAuth provider unavailable",
            )
        except httpx.RequestError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to connect to OAuth provider",
            )

    return {}


@router.post(
    "/oauth-login",
    response_model=OAuthLoginResponse,
    summary="OAuth login/register",
    description="Find or create a contributor from OAuth login. Returns API key for new users.",
)
@limiter.limit("10/minute")  # Rate limit OAuth to prevent abuse
async def oauth_login(
    request: Request,
    data: OAuthLoginRequest,
    db: DBSession,
) -> OAuthLoginResponse:
    """
    Handle OAuth login by finding or creating a contributor.

    Verifies the OAuth token with the provider before creating/finding user.
    """
    # Verify OAuth token if provided (required in production, optional for local dev)
    if data.token:
        user_info = await verify_oauth_token(data.token, data.provider)
        # Use verified email from provider if available
        if user_info.get("email"):
            data.email = user_info["email"]
        if user_info.get("name") and not data.name:
            data.name = user_info.get("name") or data.name
        if user_info.get("login") and data.provider == "github":
            data.name = user_info.get("login") or data.name

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

