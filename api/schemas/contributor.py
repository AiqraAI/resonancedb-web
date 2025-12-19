"""
Pydantic Schemas for Contributor endpoints.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

from api.models.tier import ContributorTier


# --- Request Schemas ---

class ContributorCreate(BaseModel):
    """Schema for registering a new contributor."""
    
    email: EmailStr = Field(..., description="Email address (used as unique identifier)")
    github_username: str | None = Field(None, description="GitHub username for attribution")
    display_name: str | None = Field(None, max_length=100, description="Display name")


class ContributorUpdate(BaseModel):
    """Schema for updating contributor profile."""
    
    github_username: str | None = Field(None, description="GitHub username")
    display_name: str | None = Field(None, max_length=100, description="Display name")


# --- Response Schemas ---

class ContributorResponse(BaseModel):
    """Public contributor info (no sensitive data)."""
    
    id: UUID
    email: EmailStr
    github_username: str | None
    display_name: str | None
    tier: ContributorTier
    total_submissions: int
    validated_submissions: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ContributorWithKey(BaseModel):
    """Response after registration - includes the API key (shown only once)."""
    
    id: UUID
    email: EmailStr
    api_key: str = Field(..., description="Your API key - save this! It won't be shown again")
    tier: ContributorTier
    message: str = "Welcome to ResonanceDB! Save your API key securely."
    
    class Config:
        from_attributes = True


class ContributorStats(BaseModel):
    """Detailed stats for a contributor."""
    
    id: UUID
    email: EmailStr
    tier: ContributorTier
    total_submissions: int
    validated_submissions: int
    rate_limit_per_hour: int
    progress_to_next_tier: dict | None
    created_at: datetime
    last_activity_at: datetime | None
    
    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    """Entry in the contributor leaderboard."""
    
    rank: int
    display_name: str | None
    github_username: str | None
    tier: ContributorTier
    validated_submissions: int
    
    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    """Leaderboard response with top contributors."""
    
    entries: list[LeaderboardEntry]
    total_contributors: int
    updated_at: datetime
