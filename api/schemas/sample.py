"""
Pydantic Schemas for Sample endpoints.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


# --- Request Schemas ---

class SampleCreate(BaseModel):
    """Schema for submitting a new vibration sample."""
    
    # Required fields (matching DATA_FORMAT.md)
    material: str = Field(..., min_length=1, max_length=100, description="Material type, e.g., 'glass', 'oak_wood'")
    vibration: list[float] = Field(..., min_length=10, description="Acceleration values (g) over time")
    sample_rate_hz: float = Field(..., gt=0, description="Samples per second")
    excitation: str = Field(..., description="How vibration was created: 'manual_tap', 'solenoid', 'ambient'")
    source: str = Field(..., description="Data source: 'real', 'simulation', 'phone_sensor'")
    
    # Optional fields
    temperature_c: float | None = Field(None, description="Temperature in Celsius")
    thickness_mm: float | None = Field(None, ge=0, description="Material thickness in mm")
    load_g: float | None = Field(None, ge=0, description="Weight on surface in grams")
    mounting: str | None = Field(None, max_length=50, description="e.g., 'clamped', 'free_edge', 'on_table'")
    device: str | None = Field(None, max_length=100, description="Sensor used: 'ESP32+MPU6050', 'iPhone14', etc.")
    notes: str | None = Field(None, max_length=500, description="Additional notes")
    
    @field_validator("vibration")
    @classmethod
    def validate_vibration(cls, v: list[float]) -> list[float]:
        """Ensure vibration array contains valid numbers."""
        if not all(isinstance(x, (int, float)) for x in v):
            raise ValueError("vibration must contain only numbers")
        if len(v) > 100000:
            raise ValueError("vibration array too large (max 100,000 samples)")
        return v
    
    @field_validator("excitation")
    @classmethod
    def validate_excitation(cls, v: str) -> str:
        """Validate excitation type."""
        valid = {"manual_tap", "solenoid", "ambient", "impact_hammer", "piezo"}
        if v.lower() not in valid:
            # Allow but warn about unknown types
            pass
        return v.lower()
    
    @field_validator("source")
    @classmethod
    def validate_source(cls, v: str) -> str:
        """Validate source type."""
        valid = {"real", "simulation", "phone_sensor"}
        if v.lower() not in valid:
            raise ValueError(f"source must be one of: {', '.join(valid)}")
        return v.lower()


# --- Response Schemas ---

class SampleResponse(BaseModel):
    """Response after creating a sample."""
    
    id: UUID
    material: str
    sample_rate_hz: float
    vibration_length: int
    duration_seconds: float
    validated: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class SampleDetail(BaseModel):
    """Full sample details including vibration data."""
    
    id: UUID
    contributor_id: UUID
    material: str
    vibration: list[float]
    sample_rate_hz: float
    excitation: str
    source: str
    temperature_c: float | None
    thickness_mm: float | None
    load_g: float | None
    mounting: str | None
    device: str | None
    notes: str | None
    validated: bool
    peak_frequency_hz: float | None
    energy: float | None
    created_at: datetime
    
    class Config:
        from_attributes = True


class SampleListItem(BaseModel):
    """Sample summary for list responses (no vibration data)."""
    
    id: UUID
    material: str
    sample_rate_hz: float
    vibration_length: int
    duration_seconds: float
    source: str
    device: str | None
    validated: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class SampleListResponse(BaseModel):
    """Paginated list of samples."""
    
    items: list[SampleListItem]
    total: int
    page: int
    page_size: int
    has_next: bool
