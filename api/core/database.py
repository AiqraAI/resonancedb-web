"""
Async Database Configuration for ResonanceDB API

Uses SQLAlchemy 2.0 async engine with asyncpg driver for PostgreSQL.
"""

import asyncio
import uuid
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.types import TypeDecorator, CHAR
from typing import AsyncGenerator

from .config import settings


# Portable UUID type that works with both SQLite and PostgreSQL
class GUID(TypeDecorator):
    """Platform-independent GUID type using CHAR(32) for storage."""
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is not None:
            return str(value).replace('-', '')
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return uuid.UUID(value)
        return value


# Determine engine options based on database type
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# SQLite doesn't support pool_size settings
engine_kwargs = {
    "echo": settings.DEBUG,
}

if not is_sqlite:
    # PostgreSQL-specific options
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
    })

# Create async engine
engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency that provides an async database session.
    
    Usage in FastAPI:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db(max_retries: int = 5, retry_delay: float = 2.0) -> None:
    """
    Create all database tables. Call on application startup.
    
    Includes retry logic for when PostgreSQL is still starting.
    """
    for attempt in range(max_retries):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("✅ Database initialized successfully")
            return
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"⏳ Database not ready (attempt {attempt + 1}/{max_retries}): {e}")
                await asyncio.sleep(retry_delay)
            else:
                print(f"❌ Failed to initialize database after {max_retries} attempts")
                raise


async def close_db() -> None:
    """Dispose of the engine. Call on application shutdown."""
    await engine.dispose()

