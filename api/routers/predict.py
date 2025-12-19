"""
Prediction Router

Handles material prediction using trained ML models.
"""

import numpy as np
import joblib
from pathlib import Path
from fastapi import APIRouter, HTTPException, status

from api.core.config import settings
from api.deps import CurrentContributor
from api.schemas.predict import PredictRequest, PredictResponse, ModelInfo

# Import feature extraction from existing code
import sys
ROOT = Path(__file__).resolve().parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from python.features import compute_feature_vector
from python.preprocess import PreprocessConfig

router = APIRouter(tags=["Prediction"])

# Cache loaded model
_model_cache: dict = {}


def load_model(model_path: str = None):
    """Load and cache the trained model."""
    path = model_path or settings.DEFAULT_MODEL_PATH
    full_path = ROOT / path
    
    if path not in _model_cache:
        if not full_path.exists():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Model not found: {path}",
            )
        
        try:
            model_data = joblib.load(full_path)
            _model_cache[path] = model_data
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to load model: {e}",
            )
    
    return _model_cache[path]


@router.post(
    "",
    response_model=PredictResponse,
    summary="Predict material from vibration",
    description="Submit vibration data and get a material classification prediction.",
)
async def predict(
    data: PredictRequest,
    contributor: CurrentContributor,
) -> PredictResponse:
    """
    Predict material type from vibration data.
    
    Uses the trained classifier to identify the material based on
    vibration characteristics (frequency, damping, energy).
    """
    # Load model
    model_data = load_model()
    
    # Handle both old (just model) and new (dict with metadata) formats
    if isinstance(model_data, dict):
        model = model_data.get("model")
        config = model_data.get("config", {})
        preprocess_config = config.get("preprocess")
        # Get feature config to determine what extras are needed
        feature_config = config.get("features", {})
        use_extra = feature_config.get("extra", True)  # Default to True for trained models
        top_k_peaks = feature_config.get("top_k_peaks", 3)
    else:
        model = model_data
        preprocess_config = None
        use_extra = True  # Assume trained model uses extras
        top_k_peaks = 3
    
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Invalid model format",
        )
    
    # Extract features
    vibration_array = np.array(data.vibration)
    
    try:
        # Build preprocessing config if available
        if preprocess_config:
            cfg = PreprocessConfig(**preprocess_config)
            features = compute_feature_vector(
                vibration_array,
                data.sample_rate_hz,
                config=cfg,
                extra=use_extra,
                top_k_peaks=top_k_peaks,
            )
        else:
            features = compute_feature_vector(
                vibration_array,
                data.sample_rate_hz,
                extra=use_extra,
                top_k_peaks=top_k_peaks,
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Feature extraction failed: {e}",
        )
    
    # Make prediction
    try:
        features_2d = features.reshape(1, -1)
        prediction = model.predict(features_2d)[0]
        
        # Get probabilities if available
        probabilities = None
        confidence = 0.0
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(features_2d)[0]
            classes = model.classes_
            probabilities = {str(c): float(p) for c, p in zip(classes, proba)}
            confidence = float(max(proba))
        else:
            confidence = 0.8  # Default for models without probability
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {e}",
        )
    
    # Build feature dict for response
    feature_names = ["peak_freq", "decay_rate", "energy"]
    if use_extra:
        feature_names.extend(["spectral_centroid", "spectral_bandwidth", "zcr"])
        feature_names.extend([f"peak_freq_{i+1}" for i in range(top_k_peaks)])
        feature_names.append("ac_lag_s")
    
    features_dict = {}
    for i, name in enumerate(feature_names):
        if i < len(features):
            features_dict[name] = float(features[i])
    
    return PredictResponse(
        prediction=str(prediction),
        confidence=confidence,
        probabilities=probabilities,
        features=features_dict,
    )


@router.get(
    "/model-info",
    response_model=ModelInfo,
    summary="Get model information",
    description="Get information about the currently loaded prediction model.",
)
async def get_model_info() -> ModelInfo:
    """Get information about the loaded model."""
    model_data = load_model()
    
    if isinstance(model_data, dict):
        model = model_data.get("model")
        config = model_data.get("config", {})
        materials = list(model.classes_) if hasattr(model, "classes_") else []
        
        return ModelInfo(
            name="material_classifier",
            version="1.0.0",
            materials=materials,
            accuracy=config.get("accuracy"),
            feature_config=config.get("features"),
            created_at=config.get("created_at"),
        )
    else:
        materials = list(model_data.classes_) if hasattr(model_data, "classes_") else []
        return ModelInfo(
            name="material_classifier",
            version="1.0.0",
            materials=materials,
            accuracy=None,
            feature_config=None,
        )
