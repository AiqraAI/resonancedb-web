"""
Tests for Sample endpoints.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_submit_sample_requires_auth(test_client: AsyncClient):
    """Test that submitting a sample requires authentication."""
    response = await test_client.post(
        "/api/v1/samples",
        json={
            "material": "glass",
            "vibration": [0.1, 0.2, 0.3, 0.4, 0.5] * 20,
            "sample_rate_hz": 100,
            "excitation": "manual_tap",
            "source": "real",
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_submit_valid_sample(test_client: AsyncClient, sample_vibration_data):
    """Test submitting a valid sample."""
    # First register to get API key
    reg_response = await test_client.post(
        "/api/v1/auth/register",
        json={
            "email": "sample_test@example.com",
            "display_name": "Sample Tester",
        },
    )
    api_key = reg_response.json()["api_key"]

    # Submit sample
    response = await test_client.post(
        "/api/v1/samples",
        json={
            "material": "glass",
            "vibration": sample_vibration_data["vibration"],
            "sample_rate_hz": sample_vibration_data["sample_rate_hz"],
            "excitation": "manual_tap",
            "source": "real",
        },
        headers={"Authorization": f"Bearer {api_key}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["material"] == "glass"
    assert data["validated"] is True  # Valid data should be validated


@pytest.mark.asyncio
async def test_submit_sample_all_zeros_rejected(test_client: AsyncClient):
    """Test that all-zero vibration data is marked as not validated."""
    # Register to get API key
    reg_response = await test_client.post(
        "/api/v1/auth/register",
        json={
            "email": "zeros_test@example.com",
            "display_name": "Zeros Tester",
        },
    )
    api_key = reg_response.json()["api_key"]

    # Submit all-zeros sample
    response = await test_client.post(
        "/api/v1/samples",
        json={
            "material": "glass",
            "vibration": [0.0] * 100,
            "sample_rate_hz": 100,
            "excitation": "manual_tap",
            "source": "real",
        },
        headers={"Authorization": f"Bearer {api_key}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["validated"] is False  # Invalid data should not be validated


@pytest.mark.asyncio
async def test_submit_sample_nan_rejected(test_client: AsyncClient):
    """Test that NaN values in vibration data are marked as not validated."""
    # Register to get API key
    reg_response = await test_client.post(
        "/api/v1/auth/register",
        json={
            "email": "nan_test@example.com",
            "display_name": "NaN Tester",
        },
    )
    api_key = reg_response.json()["api_key"]

    # Submit sample with NaN (represented as string that will fail)
    response = await test_client.post(
        "/api/v1/samples",
        json={
            "material": "glass",
            "vibration": [0.1, float('nan'), 0.3],
            "sample_rate_hz": 100,
            "excitation": "manual_tap",
            "source": "real",
        },
        headers={"Authorization": f"Bearer {api_key}"},
    )

    # Should either reject at validation or mark as not validated
    assert response.status_code in [201, 422]
    if response.status_code == 201:
        assert response.json()["validated"] is False


@pytest.mark.asyncio
async def test_list_samples_pagination(test_client: AsyncClient, sample_vibration_data):
    """Test listing samples with pagination."""
    # Register
    reg_response = await test_client.post(
        "/api/v1/auth/register",
        json={
            "email": "list_test@example.com",
            "display_name": "List Tester",
        },
    )
    api_key = reg_response.json()["api_key"]

    # Submit a sample
    await test_client.post(
        "/api/v1/samples",
        json={
            "material": "aluminum",
            "vibration": sample_vibration_data["vibration"],
            "sample_rate_hz": sample_vibration_data["sample_rate_hz"],
            "excitation": "manual_tap",
            "source": "real",
        },
        headers={"Authorization": f"Bearer {api_key}"},
    )

    # List samples
    response = await test_client.get(
        "/api/v1/samples?page=1&page_size=10",
        headers={"Authorization": f"Bearer {api_key}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert data["page"] == 1


@pytest.mark.asyncio
async def test_get_sample_details(test_client: AsyncClient, sample_vibration_data):
    """Test getting sample details by ID."""
    # Register
    reg_response = await test_client.post(
        "/api/v1/auth/register",
        json={
            "email": "detail_test@example.com",
            "display_name": "Detail Tester",
        },
    )
    api_key = reg_response.json()["api_key"]

    # Submit sample
    submit_response = await test_client.post(
        "/api/v1/samples",
        json={
            "material": "steel",
            "vibration": sample_vibration_data["vibration"],
            "sample_rate_hz": sample_vibration_data["sample_rate_hz"],
            "excitation": "manual_tap",
            "source": "real",
        },
        headers={"Authorization": f"Bearer {api_key}"},
    )
    sample_id = submit_response.json()["id"]

    # Get details
    response = await test_client.get(
        f"/api/v1/samples/{sample_id}",
        headers={"Authorization": f"Bearer {api_key}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_id
    assert data["material"] == "steel"
    assert "vibration" in data  # Full details include vibration data


@pytest.mark.asyncio
async def test_get_nonexistent_sample(test_client: AsyncClient):
    """Test getting a sample that doesn't exist."""
    # Register
    reg_response = await test_client.post(
        "/api/v1/auth/register",
        json={
            "email": "notfound_test@example.com",
            "display_name": "Not Found Tester",
        },
    )
    api_key = reg_response.json()["api_key"]

    # Try to get nonexistent sample
    response = await test_client.get(
        "/api/v1/samples/00000000-0000-0000-0000-000000000000",
        headers={"Authorization": f"Bearer {api_key}"},
    )

    assert response.status_code == 404
