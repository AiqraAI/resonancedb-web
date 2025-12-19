"""
Sample Model

Represents a vibration sample submitted to ResonanceDB.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Float, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.core.database import Base, GUID


class Sample(Base):
    """
    A vibration sample with metadata.
    
    The vibration array is stored as JSONB for flexibility and efficient querying.
    """
    
    __tablename__ = "samples"
    
    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
    )
    
    # Foreign key to contributor
    contributor_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("contributors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Required fields (per DATA_FORMAT.md)
    material: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    vibration: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
    )
    sample_rate_hz: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    excitation: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    source: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    
    # Optional fields
    temperature_c: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    thickness_mm: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    load_g: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    mounting: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    device: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    # Validation status
    validated: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    validation_errors: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )
    
    # Computed features (cached for quick queries)
    peak_frequency_hz: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    energy: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    
    # Relationship back to contributor
    contributor: Mapped["Contributor"] = relationship(
        "Contributor",
        back_populates="samples",
    )
    
    def __repr__(self) -> str:
        return f"<Sample {self.id} material={self.material}>"
    
    @property
    def vibration_length(self) -> int:
        """Get the number of vibration samples."""
        if isinstance(self.vibration, list):
            return len(self.vibration)
        return 0
    
    @property
    def duration_seconds(self) -> float:
        """Calculate the duration of the sample in seconds."""
        if self.sample_rate_hz > 0:
            return self.vibration_length / self.sample_rate_hz
        return 0.0


# Import for type hints
from .contributor import Contributor  # noqa: E402, F401
