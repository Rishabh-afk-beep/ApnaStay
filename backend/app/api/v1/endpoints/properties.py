import hashlib
import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_optional_user
from app.models.schemas.common import PaginatedResponse
from app.models.schemas.property import PropertyCard, PropertyDetail, PropertySearchQuery
from app.models.schemas.user import UserProfile, UserRole
from app.repositories.property_repository import PropertyRepository
from app.services.cache_service import CacheService
from app.services.property_service import PropertyService

router = APIRouter()
service = PropertyService()
repo = PropertyRepository()
cache = CacheService()


@router.get("/search")
def search_properties(
    college_id: str | None = None,
    radius_km: float = 2.0,
    property_type: str | None = None,
    gender: str | None = None,
    budget_min: int | None = None,
    budget_max: int | None = None,
    availability_status: str | None = None,
    amenities: list[str] = Query(default=[]),
    sort: str = "newest",
    page: int = 1,
    limit: int = 20,
) -> PaginatedResponse[PropertyCard]:
    query = PropertySearchQuery(
        college_id=college_id,
        radius_km=radius_km,
        property_type=property_type,
        gender=gender,
        budget_min=budget_min,
        budget_max=budget_max,
        availability_status=availability_status,
        amenities=amenities,
        sort=sort,
        page=page,
        limit=limit,
    )

    query_json = json.dumps(query.model_dump(), sort_keys=True)
    query_hash = hashlib.md5(query_json.encode()).hexdigest()
    cache_key = f"cache:search:{query_hash}"

    cached_result = cache.get(cache_key)
    if cached_result:
        return PaginatedResponse[PropertyCard](**cached_result)

    items, total = service.search(query)
    response = PaginatedResponse[PropertyCard](items=items, page=page, limit=limit, total=total)
    cache.set(cache_key, response.model_dump(), ttl=300)
    return response


@router.get("/{property_id}")
def get_property_detail(
    property_id: str,
    user: Annotated[UserProfile | None, Depends(get_optional_user)] = None,
) -> PropertyDetail:
    cache_key = f"cache:property:{property_id}"
    cached_detail = cache.get(cache_key)
    if cached_detail:
        item = PropertyDetail(**cached_detail)
    else:
        fetched = repo.get_detail(property_id)
        if fetched is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "PROPERTY_NOT_FOUND", "message": "Property not found"},
            )
        item = fetched
        cache.set(cache_key, item.model_dump(), ttl=3600)

    # Hide unpublished / pending / rejected listings from non-owners and non-admins
    is_privileged = user is not None and (user.role == UserRole.admin or user.uid == item.owner_uid)
    if item.visibility_status != "live" and not is_privileged:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PROPERTY_NOT_FOUND", "message": "Property not found"},
        )

    # Never expose owner direct contact numbers to unauthenticated guests
    if user is None:
        return item.model_copy(update={"owner_contact": None, "owner_whatsapp": None})

    return item
