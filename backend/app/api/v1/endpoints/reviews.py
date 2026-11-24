from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.models.schemas.review import ReviewCreate, ReviewOut
from app.models.schemas.user import UserProfile
from app.repositories.property_repository import PropertyRepository
from app.repositories.review_repository import ReviewRepository
from app.services.cache_service import CacheService

router = APIRouter()
repo = ReviewRepository()
property_repo = PropertyRepository()
cache = CacheService()


@router.post("/{property_id}/reviews")
def create_review(
    property_id: str,
    payload: ReviewCreate,
    user: Annotated[UserProfile, Depends(get_current_user)],
) -> ReviewOut:
    if property_repo.get_by_id(property_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PROPERTY_NOT_FOUND", "message": "Property not found"},
        )
    review = repo.create(
        property_id=property_id,
        user_uid=user.uid,
        payload=payload,
        user_name=user.name or "Verified Student",
    )
    cache.delete(f"cache:property:{property_id}")
    cache.invalidate_pattern("cache:search:*")
    return review


@router.get("/{property_id}/reviews")
def list_reviews(property_id: str) -> list[ReviewOut]:
    return repo.list_by_property(property_id)
