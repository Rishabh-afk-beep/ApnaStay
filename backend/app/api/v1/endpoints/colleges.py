from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import require_admin
from app.models.schemas.college import CollegeCreate, CollegeOut, CollegeUpdate
from app.models.schemas.user import UserProfile
from app.repositories.college_repository import CollegeRepository

router = APIRouter()
repo = CollegeRepository()


# Local in-memory caching variables (100% free memory cache!)
_active_colleges_cache = None


def clear_colleges_cache():
    global _active_colleges_cache
    _active_colleges_cache = None


@router.get("")
def list_colleges() -> list[CollegeOut]:
    global _active_colleges_cache
    if _active_colleges_cache is None:
        _active_colleges_cache = repo.list_active()
    return _active_colleges_cache


@router.get("/{college_id}")
def get_college(college_id: str) -> CollegeOut:
    item = repo.get_by_id(college_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "COLLEGE_NOT_FOUND", "message": "College not found"},
        )
    return item
