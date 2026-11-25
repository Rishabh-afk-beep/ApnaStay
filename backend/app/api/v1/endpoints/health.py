from datetime import datetime, timezone

from fastapi import APIRouter, Response

from app.models.schemas.analytics import PublicStatsOut
from app.services.warmup_service import get_cached_public_stats, warm_public_caches

router = APIRouter()


@router.get("/health")
def health_check() -> dict:
    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health/stats", response_model=PublicStatsOut)
def public_stats(response: Response) -> PublicStatsOut:
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return get_cached_public_stats()


@router.get("/health/warm")
def warm_caches(response: Response) -> dict:
    """Keep-alive and cache-warming endpoint for uptime monitors and cron jobs."""
    response.headers["Cache-Control"] = "no-store"
    warmed = warm_public_caches()
    return {
        "status": "ok",
        "warmed": warmed,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
