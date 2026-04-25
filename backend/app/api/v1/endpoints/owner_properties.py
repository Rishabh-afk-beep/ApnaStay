from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import require_owner
from app.models.schemas.engagement import InquiryOut
from app.models.schemas.property import OwnerPropertyCreate, OwnerPropertyUpdate, PropertyDetail
from app.models.schemas.user import UserProfile
from app.repositories.engagement_repository import EngagementRepository
from app.repositories.property_repository import PropertyRepository

router = APIRouter()
repo = PropertyRepository()
engagement_repo = EngagementRepository()


@router.get("")
def list_my_properties(user: Annotated[UserProfile, Depends(require_owner)]) -> list[PropertyDetail]:
    return repo.list_by_owner(user.uid)


@router.post("")
def create_property(
    payload: OwnerPropertyCreate,
    user: Annotated[UserProfile, Depends(require_owner)],
) -> PropertyDetail:
    return repo.create_for_owner(user.uid, payload)


@router.patch("/{property_id}")
def update_property(
    property_id: str,
    payload: OwnerPropertyUpdate,
    user: Annotated[UserProfile, Depends(require_owner)],
) -> PropertyDetail:
    if not property_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_PROPERTY_ID", "message": "Property ID is required"},
        )
    updated = repo.update_for_owner(user.uid, property_id, payload)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PROPERTY_NOT_FOUND_OR_FORBIDDEN", "message": "Property not found or not owned by this user"},
        )
    return updated


@router.delete("/{property_id}")
def delete_property(
    property_id: str,
    user: Annotated[UserProfile, Depends(require_owner)],
) -> dict:
    deleted = repo.delete_for_owner(user.uid, property_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PROPERTY_NOT_FOUND_OR_FORBIDDEN", "message": "Property not found or not owned by this user"},
        )
    return {"message": "Property deleted"}


@router.get("/{property_id}/inquiries")
def list_property_inquiries(
    property_id: str,
    user: Annotated[UserProfile, Depends(require_owner)],
) -> list[InquiryOut]:
    prop = repo.get_by_id(property_id)
    if prop is None or prop.owner_uid != user.uid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PROPERTY_NOT_FOUND_OR_FORBIDDEN", "message": "Property not found or not owned by this user"},
        )
    return engagement_repo.list_inquiries_for_property(property_id)
