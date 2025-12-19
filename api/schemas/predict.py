"""
Pydantic Schemas for Prediction endpoints.
"""

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    """Request schema for material prediction."""
    
    vibration: list[float] = Field(..., min_length=10, description="Acceleration values (g)")
    sample_rate_hz: float = Field(..., gt=0, description="Samples per second")


class PredictResponse(BaseModel):
    """Response from material prediction."""
    
    prediction: str = Field(..., description="Predicted material type")
    confidence: float = Field(..., ge=0, le=1, description="Prediction confidence (0-1)")
    probabilities: dict[str, float] | None = Field(
        None,
        description="Per-class probabilities if available"
    )
    features: dict[str, float] | None = Field(
        None,
        description="Extracted features used for prediction"
    )


class ModelInfo(BaseModel):
    """Information about a trained model."""
    
    name: str
    version: str
    materials: list[str] = Field(..., description="Materials this model can classify")
    accuracy: float | None = Field(None, description="Evaluated accuracy")
    feature_config: dict | None = Field(None, description="Feature extraction configuration")
    created_at: str | None = None
