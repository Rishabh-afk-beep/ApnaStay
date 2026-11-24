from datetime import datetime, timezone

from fastapi import APIRouter

from app.models.schemas.analytics import PublicStatsOut
from app.repositories.analytics_repository import AnalyticsRepository
from app.services.cache_service import CacheService

router = APIRouter()
analytics_repo = AnalyticsRepository()
cache = CacheService()


@router.get("/health")
def health_check() -> dict:
    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health/stats", response_model=PublicStatsOut)
def public_stats() -> PublicStatsOut:
    cache_key = "cache:public:stats"
    cached = cache.get(cache_key)
    if cached:
        return PublicStatsOut(**cached)
    stats = analytics_repo.get_public_stats()
    cache.set(cache_key, stats.model_dump(), ttl=300)
    return stats
