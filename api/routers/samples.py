"""
Samples Router

Handles vibration sample submission and retrieval.
"""

from datetime import datetime
from uuid import UUID
from typing import Optional
import numpy as np
from fastapi import APIRouter, HTTPException, Query, status, Request
from sqlalchemy import select, func

from api.core.rate_limit import limiter
from api.deps import DBSession, CurrentContributor
from api.models.sample import Sample
from api.schemas.sample import (
    SampleCreate,
    SampleResponse,
    SampleDetail,
    SampleListItem,
    SampleListResponse,
)

# Import feature extraction from existing code
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from python.features import compute_feature_vector
import numpy as np

router = APIRouter(tags=["Samples"])


def validate_vibration_data(vibration: list[float]) -> list[str]:
    """
    Validate vibration data quality.

    Returns list of validation errors (empty if valid).
    """
    errors = []
    arr = np.array(vibration)

    # Check for NaN or Infinity
    if np.any(np.isnan(arr)):
        errors.append("Vibration data contains NaN values")

    if np.any(np.isinf(arr)):
        errors.append("Vibration data contains Infinity values")

    # Check for all-zeros (no signal)
    if np.all(arr == 0):
        errors.append("Vibration data is all zeros (no signal)")

    # Check for constant signal (no variation)
    if np.std(arr) == 0:
        errors.append("Vibration data is constant (no variation)")

    # Check for extremely small values (likely noise floor or error)
    if np.all(np.abs(arr) < 1e-10):
        errors.append("Vibration data values are extremely small (possible error)")

    # Check for suspiciously large values
    if np.any(np.abs(arr) > 1e6):
        errors.append("Vibration data contains suspiciously large values")

    return errors


@router.post(
    "",
    response_model=SampleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a vibration sample",
    description="Submit a new vibration sample to ResonanceDB.",
)
@limiter.limit("50/hour")  # Limit sample submissions to prevent abuse
async def create_sample(
    request: Request,
    data: SampleCreate,
    contributor: CurrentContributor,
    db: DBSession,
) -> SampleResponse:
    """
    Submit a new vibration sample.

    The sample will be validated and features extracted automatically.
    """
    # Validate vibration data quality first
    validation_errors = validate_vibration_data(data.vibration)

    vibration_array = np.array(data.vibration)

    # Extract features using existing pipeline
    try:
        features = compute_feature_vector(
            vibration_array,
            data.sample_rate_hz,
            extra=False,
        )
        peak_freq = float(features[0])
        energy = float(features[2])

        # Sample is validated only if quality checks pass and feature extraction succeeds
        validated = len(validation_errors) == 0
        if validated:
            validation_errors = None

    except Exception as e:
        peak_freq = None
        energy = None
        validated = False
        if validation_errors:
            validation_errors.append(str(e))
        else:
            validation_errors = [str(e)]
    
    # Create sample
    sample = Sample(
        contributor_id=contributor.id,
        material=data.material,
        vibration=data.vibration,
        sample_rate_hz=data.sample_rate_hz,
        excitation=data.excitation,
        source=data.source,
        temperature_c=data.temperature_c,
        thickness_mm=data.thickness_mm,
        load_g=data.load_g,
        mounting=data.mounting,
        device=data.device,
        notes=data.notes,
        validated=validated,
        validation_errors=validation_errors,
        peak_frequency_hz=peak_freq,
        energy=energy,
    )
    
    db.add(sample)
    
    # Update contributor stats
    contributor.total_submissions += 1
    if validated:
        contributor.validated_submissions += 1
        contributor.update_tier()
    contributor.last_activity_at = datetime.utcnow()
    
    await db.flush()
    await db.refresh(sample)
    
    return SampleResponse(
        id=sample.id,
        material=sample.material,
        sample_rate_hz=sample.sample_rate_hz,
        vibration_length=sample.vibration_length,
        duration_seconds=sample.duration_seconds,
        validated=sample.validated,
        created_at=sample.created_at,
    )


@router.get(
    "",
    response_model=SampleListResponse,
    summary="List samples",
    description="Get a paginated list of samples with optional filters.",
)
@limiter.limit("100/hour")  # Limit read operations
async def list_samples(
    request: Request,
    db: DBSession,
    material: Optional[str] = Query(None, description="Filter by material"),
    source: Optional[str] = Query(None, description="Filter by source"),
    validated: Optional[bool] = Query(None, description="Filter by validation status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
) -> SampleListResponse:
    """List samples with optional filtering and pagination."""
    
    # Build query
    query = select(Sample)
    
    if material:
        query = query.where(Sample.material == material.lower())
    if source:
        query = query.where(Sample.source == source.lower())
    if validated is not None:
        query = query.where(Sample.validated == validated)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(Sample.created_at.desc()).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    samples = result.scalars().all()
    
    items = [
        SampleListItem(
            id=s.id,
            material=s.material,
            sample_rate_hz=s.sample_rate_hz,
            vibration_length=s.vibration_length,
            duration_seconds=s.duration_seconds,
            source=s.source,
            device=s.device,
            validated=s.validated,
            created_at=s.created_at,
        )
        for s in samples
    ]
    
    return SampleListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_next=(offset + len(items)) < total,
    )


@router.get(
    "/{sample_id}",
    response_model=SampleDetail,
    summary="Get sample details",
    description="Get full details of a sample including vibration data.",
)
@limiter.limit("100/hour")  # Limit read operations
async def get_sample(
    request: Request,
    sample_id: UUID,
    db: DBSession,
) -> SampleDetail:
    """Get a sample by ID with full vibration data."""
    
    result = await db.execute(
        select(Sample).where(Sample.id == sample_id)
    )
    sample = result.scalar_one_or_none()
    
    if sample is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample not found",
        )
    
    return SampleDetail.model_validate(sample)
