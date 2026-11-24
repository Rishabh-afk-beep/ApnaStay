from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import require_admin
from app.models.schemas.college import CollegeCreate, CollegeOut, CollegeUpdate
from app.models.schemas.user import UserProfile
from app.repositories.college_repository import CollegeRepository

from app.services.cache_service import CacheService

router = APIRouter()
repo = CollegeRepository()
cache = CacheService()

def clear_colleges_cache():
    cache.delete("cache:colleges:all")

@router.get("")
def list_colleges() -> list[CollegeOut]:
    cache_key = "cache:colleges:all"
    cached_colleges = cache.get(cache_key)
    if cached_colleges:
        return [CollegeOut(**c) for c in cached_colleges]
        
    items = repo.list_active()
    # Cache for 24 hours
    cache.set(cache_key, [item.model_dump() for item in items], ttl=86400)
    return items


@router.get("/{college_id}")
def get_college(college_id: str) -> CollegeOut:
    item = repo.get_by_id(college_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "COLLEGE_NOT_FOUND", "message": "College not found"},
        )
    return item
