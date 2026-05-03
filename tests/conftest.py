"""
Pytest fixtures for ResonanceDB API tests.
"""

import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from api.main import app
from api.core.database import Base, get_db
from api.core.config import settings


# Use SQLite for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_resonancedb.db"


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
    )

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def test_db(test_engine):
    """Create test database session."""
    async_session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session_maker() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def test_client(test_db):
    """Create test HTTP client."""
    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
def sample_vibration_data():
    """Sample vibration data for testing."""
    import numpy as np
    # Generate simple sine wave
    sample_rate = 100  # Hz
    duration = 1  # second
    frequency = 10  # Hz
    t = np.linspace(0, duration, sample_rate * duration)
    vibration = np.sin(2 * np.pi * frequency * t).tolist()

    return {
        "vibration": vibration,
        "sample_rate_hz": sample_rate,
    }
