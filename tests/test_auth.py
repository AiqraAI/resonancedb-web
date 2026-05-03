"""
Tests for Authentication endpoints.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_new_contributor(test_client: AsyncClient):
    """Test registering a new contributor."""
    response = await test_client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "display_name": "Test User",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "api_key" in data
    assert data["api_key"].startswith("rdb_live_")
    assert "tier" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(test_client: AsyncClient):
    """Test that duplicate email registration fails."""
    # First registration
    await test_client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "display_name": "First User",
        },
    )

    # Second registration with same email
    response = await test_client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "display_name": "Second User",
        },
    )

    assert response.status_code == 409
    assert "already registered" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_invalid_email(test_client: AsyncClient):
    """Test that invalid email format is rejected."""
    response = await test_client.post(
        "/api/v1/auth/register",
        json={
            "email": "not-an-email",
            "display_name": "Invalid User",
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_oauth_login_invalid_provider(test_client: AsyncClient):
    """Test OAuth login with unsupported provider."""
    response = await test_client.post(
        "/api/v1/auth/oauth-login",
        json={
            "email": "oauth@example.com",
            "name": "OAuth User",
            "provider": "invalid_provider",
        },
    )

    assert response.status_code == 400
    assert "Unsupported OAuth provider" in response.json()["detail"]


@pytest.mark.asyncio
async def test_oauth_login_creates_new_user(test_client: AsyncClient):
    """Test OAuth login creates new user if email doesn't exist."""
    response = await test_client.post(
        "/api/v1/auth/oauth-login",
        json={
            "email": "newoauth@example.com",
            "name": "New OAuth User",
            "provider": "google",
            # No token provided - will skip verification in test mode
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newoauth@example.com"
    assert data["is_new_user"] is True
    assert "api_key" in data


@pytest.mark.asyncio
async def test_health_endpoint(test_client: AsyncClient):
    """Test health check endpoint."""
    response = await test_client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_root_endpoint(test_client: AsyncClient):
    """Test root endpoint."""
    response = await test_client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert "ResonanceDB" in data["name"]
    assert data["status"] == "healthy"
