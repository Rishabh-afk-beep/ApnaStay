import hashlib
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import List

from app.models.schemas.analytics import PublicStatsOut
from app.models.schemas.college import CollegeOut
from app.models.schemas.common import PaginatedResponse
from app.models.schemas.property import PropertyCard, PropertySearchQuery
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.college_repository import CollegeRepository
from app.repositories.firestore_client import get_firestore_client
from app.services.cache_service import CacheService
from app.services.property_service import PropertyService

logger = logging.getLogger(__name__)

_cache = CacheService()
_analytics_repo = AnalyticsRepository()
_college_repo = CollegeRepository()
_property_service = PropertyService()


def _load_public_stats_dict() -> dict:
    return _analytics_repo.get_public_stats().model_dump()


def _stats_valid(data: dict) -> bool:
    return bool(
        isinstance(data, dict)
        and (
            data.get("colleges_covered", 0) > 0
            or data.get("verified_listings", 0) > 0
            or data.get("students_active", 0) > 0
        )
    )


def get_cached_public_stats() -> PublicStatsOut:
    """Return public stats via Stale-While-Revalidate caching (5m fresh, 24h stale fallback)."""
    data = _cache.get_swr(
        "cache:public:stats",
        _load_public_stats_dict,
        fresh_ttl=300,
        stale_ttl=86400,
        cache_if=_stats_valid,
    )
    return PublicStatsOut(**data)


def get_cached_colleges() -> List[CollegeOut]:
    """Return active colleges via Stale-While-Revalidate caching (1h fresh, 7d stale fallback)."""
    cached = _cache.get_swr(
        "cache:colleges:all",
        lambda: [item.model_dump() for item in _college_repo.list_active()],
        fresh_ttl=3600,
        stale_ttl=604800,
        cache_if=lambda items: isinstance(items, list) and len(items) > 0,
    )
    return [CollegeOut(**c) for c in cached]


def search_cache_key(query: PropertySearchQuery) -> str:
    query_json = json.dumps(query.model_dump(), sort_keys=True)
    query_hash = hashlib.md5(query_json.encode()).hexdigest()
    return f"cache:search:{query_hash}"


def get_cached_search(query: PropertySearchQuery) -> PaginatedResponse[PropertyCard]:
    """Return property search results via Stale-While-Revalidate caching (5m fresh, 1h stale)."""
    cache_key = search_cache_key(query)

    def _loader() -> dict:
        items, total = _property_service.search(query)
        return PaginatedResponse[PropertyCard](
            items=items,
            page=query.page,
            limit=query.limit,
            total=total,
        ).model_dump()

    cached = _cache.get_swr(
        cache_key,
        _loader,
        fresh_ttl=300,
        stale_ttl=3600,
    )
    return PaginatedResponse[PropertyCard](**cached)


def warm_public_caches() -> dict:
    """Pre-warm Firestore client and high-traffic public caches in parallel."""
    get_firestore_client()
    results = {"stats": False, "colleges": False, "search": False}

    def _warm_stats() -> bool:
        get_cached_public_stats()
        return True

    def _warm_colleges() -> bool:
        get_cached_colleges()
        return True

    def _warm_default_searches() -> bool:
        get_cached_search(PropertySearchQuery(sort="newest", page=1, limit=20))
        get_cached_search(PropertySearchQuery(sort="popular", page=1, limit=20))
        return True

    with ThreadPoolExecutor(max_workers=3) as pool:
        futs = {
            "stats": pool.submit(_warm_stats),
            "colleges": pool.submit(_warm_colleges),
            "search": pool.submit(_warm_default_searches),
        }
        for key, fut in futs.items():
            try:
                results[key] = fut.result()
            except Exception as exc:
                logger.warning("[Warmup] Failed to warm %s: %s", key, exc)

    return results
