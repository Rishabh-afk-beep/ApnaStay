from fastapi import APIRouter, HTTPException, Response, status

from app.models.schemas.college import CollegeOut
from app.repositories.college_repository import CollegeRepository
from app.services.cache_service import CacheService
from app.services.warmup_service import get_cached_colleges

router = APIRouter()
repo = CollegeRepository()
cache = CacheService()


def clear_colleges_cache():
    cache.delete("cache:colleges:all")


@router.get("")
def list_colleges(response: Response) -> list[CollegeOut]:
    response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=3600"
    return get_cached_colleges()


@router.get("/{college_id}")
def get_college(college_id: str) -> CollegeOut:
    item = repo.get_by_id(college_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "COLLEGE_NOT_FOUND", "message": "College not found"},
        )
    return item
