"""
Tests for Prediction endpoints.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_predict_requires_auth(test_client: AsyncClient):
    """Test that prediction requires authentication."""
    response = await test_client.post(
        "/api/v1/predict",
        json={
            "vibration": [0.1, 0.2, 0.3, 0.4, 0.5] * 20,
            "sample_rate_hz": 100,
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_predict_with_valid_data(test_client: AsyncClient, sample_vibration_data):
    """Test prediction with valid vibration data."""
    # Register to get API key
    reg_response = await test_client.post(
        "/api/v1/auth/register",
        json={
            "email": "predict_test@example.com",
            "display_name": "Predict Tester",
        },
    )
    api_key = reg_response.json()["api_key"]

    # Make prediction
    response = await test_client.post(
        "/api/v1/predict",
        json={
            "vibration": sample_vibration_data["vibration"],
            "sample_rate_hz": sample_vibration_data["sample_rate_hz"],
        },
        headers={"Authorization": f"Bearer {api_key}"},
    )

    # If model is not available, should return 503
    # If model is available, should return prediction
    if response.status_code == 200:
        data = response.json()
        assert "prediction" in data
        assert "confidence" in data
    elif response.status_code == 503:
        # Model not found is acceptable in test environment
        assert "Model not found" in response.json()["detail"]
    else:
        pytest.fail(f"Unexpected status code: {response.status_code}")


@pytest.mark.asyncio
async def test_predict_with_invalid_data(test_client: AsyncClient):
    """Test prediction with invalid vibration data."""
    # Register to get API key
    reg_response = await test_client.post(
        "/api/v1/auth/register",
        json={
            "email": "predict_invalid@example.com",
            "display_name": "Invalid Predict Tester",
        },
    )
    api_key = reg_response.json()["api_key"]

    # Too short vibration array
    response = await test_client.post(
        "/api/v1/predict",
        json={
            "vibration": [0.1],  # Too short
            "sample_rate_hz": 100,
        },
        headers={"Authorization": f"Bearer {api_key}"},
    )

    # Should either fail feature extraction or model prediction
    assert response.status_code in [422, 500]


@pytest.mark.asyncio
async def test_model_info(test_client: AsyncClient):
    """Test getting model information."""
    # Register to get API key
    reg_response = await test_client.post(
        "/api/v1/auth/register",
        json={
            "email": "model_info@example.com",
            "display_name": "Model Info Tester",
        },
    )
    api_key = reg_response.json()["api_key"]

    response = await test_client.get(
        "/api/v1/predict/model-info",
        headers={"Authorization": f"Bearer {api_key}"},
    )

    # If model is not available, should return 503
    if response.status_code == 200:
        data = response.json()
        assert "name" in data
        assert "materials" in data
    elif response.status_code == 503:
        assert "Model not found" in response.json()["detail"]
    else:
        pytest.fail(f"Unexpected status code: {response.status_code}")
