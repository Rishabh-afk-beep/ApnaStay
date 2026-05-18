import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks

from app.api.deps import get_current_user, get_optional_user
from app.models.schemas.engagement import (
    AlertCreate,
    AlertOut,
    AlertUpdate,
    InquiryCreate,
    InquiryOut,
    RecentViewOut,
    ShortlistOut,
)
from app.models.schemas.user import UserProfile
from app.repositories.engagement_repository import EngagementRepository
from app.repositories.property_repository import PropertyRepository

router = APIRouter()
engagement_repo = EngagementRepository()
property_repo = PropertyRepository()


@router.post("/properties/{property_id}/shortlist")
def add_shortlist(
    property_id: str,
    user: Annotated[UserProfile, Depends(get_current_user)],
) -> ShortlistOut:
    return engagement_repo.add_shortlist(user.uid, property_id)


@router.delete("/properties/{property_id}/shortlist")
def remove_shortlist(
    property_id: str,
    user: Annotated[UserProfile, Depends(get_current_user)],
) -> dict:
    removed = engagement_repo.remove_shortlist(user.uid, property_id)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SHORTLIST_NOT_FOUND", "message": "Shortlist not found"},
        )
    return {"message": "Shortlist removed"}


@router.get("/me/shortlists")
def list_shortlists(user: Annotated[UserProfile, Depends(get_current_user)]) -> list[ShortlistOut]:
    return engagement_repo.list_shortlists(user.uid)


@router.post("/properties/{property_id}/view")
def add_recent_view(
    property_id: str,
    user: Annotated[UserProfile, Depends(get_current_user)],
) -> RecentViewOut:
    return engagement_repo.add_recent_view(user.uid, property_id)


@router.get("/me/recent-views")
def list_recent_views(user: Annotated[UserProfile, Depends(get_current_user)]) -> list[RecentViewOut]:
    return engagement_repo.list_recent_views(user.uid)


def notify_inquiry_received(inquiry_title: str, owner_uid: str):
    import time
    logger = logging.getLogger(__name__)
    logger.info("[Background Task] Sending instant call/WhatsApp notifications for %s to landlord %s...", inquiry_title, owner_uid)
    # Simulate API network delay to third-party SMS/WhatsApp gateway
    time.sleep(1.0)
    logger.info("[Background Task] Landlord successfully notified asynchronously!")


@router.post("/properties/{property_id}/inquiries")
def create_inquiry(
    property_id: str,
    payload: InquiryCreate,
    background_tasks: BackgroundTasks,
    user: Annotated[UserProfile | None, Depends(get_optional_user)],
) -> InquiryOut:
    property_item = property_repo.get_by_id(property_id)
    if property_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PROPERTY_NOT_FOUND", "message": "Property not found"},
        )
    inquiry = engagement_repo.create_inquiry(
        property_id=property_id,
        owner_uid=property_item.owner_uid,
        student_uid=user.uid if user else None,
        payload=payload,
    )
    # Offload the SMS/WhatsApp alert notification process to a background thread (100% free!)
    background_tasks.add_task(notify_inquiry_received, property_item.title, property_item.owner_uid)
    return inquiry


@router.post("/me/alerts")
def create_alert(
    payload: AlertCreate,
    user: Annotated[UserProfile, Depends(get_current_user)],
) -> AlertOut:
    return engagement_repo.create_alert(user.uid, payload)


@router.get("/me/alerts")
def list_alerts(user: Annotated[UserProfile, Depends(get_current_user)]) -> list[AlertOut]:
    return engagement_repo.list_alerts(user.uid)


@router.patch("/me/alerts/{alert_id}")
def update_alert(
    alert_id: str,
    payload: AlertUpdate,
    user: Annotated[UserProfile, Depends(get_current_user)],
) -> AlertOut:
    updated = engagement_repo.update_alert(user.uid, alert_id, payload)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ALERT_NOT_FOUND", "message": "Alert not found"},
        )
    return updated


@router.delete("/me/alerts/{alert_id}")
def delete_alert(alert_id: str, user: Annotated[UserProfile, Depends(get_current_user)]) -> dict:
    deleted = engagement_repo.delete_alert(user.uid, alert_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ALERT_NOT_FOUND", "message": "Alert not found"},
        )
    return {"message": "Alert deleted"}
