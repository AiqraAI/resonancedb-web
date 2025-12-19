"""
Contributors Router

Handles contributor stats and leaderboard.
"""

from datetime import datetime
from fastapi import APIRouter, Query
from sqlalchemy import select, func

from api.deps import DBSession, CurrentContributor
from api.models.contributor import Contributor
from api.schemas.contributor import (
    ContributorStats,
    LeaderboardEntry,
    LeaderboardResponse,
)

router = APIRouter(tags=["Contributors"])


@router.get(
    "/me/stats",
    response_model=ContributorStats,
    summary="Get your detailed stats",
    description="Get your submission statistics, tier progress, and rate limits.",
)
async def get_my_stats(
    contributor: CurrentContributor,
) -> ContributorStats:
    """Get detailed stats for the authenticated contributor."""
    
    return ContributorStats(
        id=contributor.id,
        email=contributor.email,
        tier=contributor.tier,
        total_submissions=contributor.total_submissions,
        validated_submissions=contributor.validated_submissions,
        rate_limit_per_hour=contributor.rate_limit,
        progress_to_next_tier=contributor.progress_to_next_tier,
        created_at=contributor.created_at,
        last_activity_at=contributor.last_activity_at,
    )


@router.get(
    "/leaderboard",
    response_model=LeaderboardResponse,
    summary="Get contributor leaderboard",
    description="Get the top contributors ranked by validated submissions.",
)
async def get_leaderboard(
    db: DBSession,
    limit: int = Query(20, ge=1, le=100, description="Number of entries to return"),
) -> LeaderboardResponse:
    """Get the top contributors by validated submissions."""
    
    # Get total count
    count_result = await db.execute(select(func.count(Contributor.id)))
    total = count_result.scalar() or 0
    
    # Get top contributors
    result = await db.execute(
        select(Contributor)
        .order_by(Contributor.validated_submissions.desc())
        .limit(limit)
    )
    contributors = result.scalars().all()
    
    entries = [
        LeaderboardEntry(
            rank=i + 1,
            display_name=c.display_name,
            github_username=c.github_username,
            tier=c.tier,
            validated_submissions=c.validated_submissions,
        )
        for i, c in enumerate(contributors)
    ]
    
    return LeaderboardResponse(
        entries=entries,
        total_contributors=total,
        updated_at=datetime.utcnow(),
    )
