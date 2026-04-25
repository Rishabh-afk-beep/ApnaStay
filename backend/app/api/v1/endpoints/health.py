from datetime import datetime, timezone

from fastapi import APIRouter

from app.models.schemas.analytics import PublicStatsOut
from app.repositories.analytics_repository import AnalyticsRepository


router = APIRouter()
analytics_repo = AnalyticsRepository()


@router.get("/health")
def health_check() -> dict:
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/health/stats", response_model=PublicStatsOut)
def public_stats() -> PublicStatsOut:
    return analytics_repo.get_public_stats()
