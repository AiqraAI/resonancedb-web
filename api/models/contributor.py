"""
Contributor Model

Represents users who contribute data to ResonanceDB and consume the API.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.core.database import Base, GUID
from .tier import ContributorTier


class Contributor(Base):
    """
    A contributor who can submit vibration samples and query the API.
    
    Contributors are identified by their API key and earn tiers based
    on their validated submissions.
    """
    
    __tablename__ = "contributors"
    
    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
    )
    
    # Identity
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    github_username: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    display_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    
    # Authentication
    api_key_hash: Mapped[str] = mapped_column(
        String(64),  # SHA256 hex digest
        nullable=False,
        index=True,
    )
    
    # Tier & Stats
    tier: Mapped[ContributorTier] = mapped_column(
        SQLEnum(ContributorTier),
        default=ContributorTier.STARTER,
        nullable=False,
    )
    total_submissions: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    validated_submissions: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    last_activity_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )
    
    # Relationships
    samples: Mapped[list["Sample"]] = relationship(
        "Sample",
        back_populates="contributor",
        lazy="selectin",
    )
    
    def __repr__(self) -> str:
        return f"<Contributor {self.email} ({self.tier.value})>"
    
    def update_tier(self) -> bool:
        """
        Recalculate tier based on current stats.
        
        Returns:
            True if tier changed, False otherwise
        """
        new_tier = ContributorTier.from_submission_count(
            self.validated_submissions
        )
        if new_tier != self.tier:
            self.tier = new_tier
            return True
        return False
    
    @property
    def rate_limit(self) -> int:
        """Get rate limit for this contributor's tier."""
        return self.tier.get_rate_limit()
    
    @property
    def progress_to_next_tier(self) -> dict | None:
        """Get progress info toward next tier."""
        next_tier = self.tier.next_tier()
        if next_tier is None:
            return None
        
        remaining = self.tier.samples_to_next_tier(self.validated_submissions)
        return {
            "current_tier": self.tier.value,
            "next_tier": next_tier.value,
            "validated_submissions": self.validated_submissions,
            "samples_remaining": remaining,
        }


# Import Sample here to avoid circular imports (for type hint)
from .sample import Sample  # noqa: E402, F401
