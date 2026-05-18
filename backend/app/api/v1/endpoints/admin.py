from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import require_admin
from app.models.schemas.admin_log import AdminLogOut
from app.models.schemas.analytics import AdminAnalyticsOverview
from app.models.schemas.college import CollegeCreate, CollegeOut, CollegeUpdate
from app.models.schemas.property import PropertyCard
from app.models.schemas.user import AdminUserStatusUpdate, UserProfile
from app.models.schemas.engagement import AdminInquiryOut
from app.repositories.admin_log_repository import AdminLogRepository
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.college_repository import CollegeRepository
from app.repositories.property_repository import PropertyRepository
from app.repositories.user_repository import UserRepository
from app.repositories.engagement_repository import EngagementRepository

router = APIRouter()
repo = PropertyRepository()
analytics_repo = AnalyticsRepository()
admin_log_repo = AdminLogRepository()
college_repo = CollegeRepository()
user_repo = UserRepository()
engagement_repo = EngagementRepository()


# ── Listing moderation ──────────────────────────────────────────────

@router.get("/listings/pending")
def list_pending(user: Annotated[UserProfile, Depends(require_admin)]) -> list[PropertyCard]:
    _ = user
    return repo.list_pending()


@router.get("/properties")
def list_properties(user: Annotated[UserProfile, Depends(require_admin)]) -> list[PropertyCard]:
    _ = user
    return repo.list_all()


@router.delete("/properties/{property_id}")
def delete_property(property_id: str, user: Annotated[UserProfile, Depends(require_admin)]):
    success = repo.delete_property(property_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PROPERTY_NOT_FOUND", "message": "Property not found"},
        )
    admin_log_repo.create(
        admin_uid=user.uid,
        action_type="delete_property",
        target_type="property",
        target_id=property_id,
        metadata={},
    )
    return {"success": True}



def _require_updated(item: PropertyCard | None) -> PropertyCard:
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PROPERTY_NOT_FOUND", "message": "Property not found"},
        )
    return item


@router.patch("/properties/{property_id}/approve")
def approve_property(property_id: str, user: Annotated[UserProfile, Depends(require_admin)]) -> PropertyCard:
    updated = _require_updated(repo.set_moderation_state(property_id, approval_status="approved", visibility_status="live"))
    admin_log_repo.create(
        admin_uid=user.uid,
        action_type="approve_property",
        target_type="property",
        target_id=property_id,
        metadata={"approval_status": "approved", "visibility_status": "live"},
    )
    return updated


@router.patch("/properties/{property_id}/reject")
def reject_property(property_id: str, user: Annotated[UserProfile, Depends(require_admin)]) -> PropertyCard:
    updated = _require_updated(repo.set_moderation_state(property_id, approval_status="rejected", visibility_status="hidden"))
    admin_log_repo.create(
        admin_uid=user.uid,
        action_type="reject_property",
        target_type="property",
        target_id=property_id,
        metadata={"approval_status": "rejected", "visibility_status": "hidden"},
    )
    return updated


@router.patch("/properties/{property_id}/hide")
def hide_property(property_id: str, user: Annotated[UserProfile, Depends(require_admin)]) -> PropertyCard:
    updated = _require_updated(repo.set_moderation_state(property_id, visibility_status="hidden"))
    admin_log_repo.create(
        admin_uid=user.uid,
        action_type="hide_property",
        target_type="property",
        target_id=property_id,
        metadata={"visibility_status": "hidden"},
    )
    return updated


@router.patch("/properties/{property_id}/feature")
def feature_property(property_id: str, user: Annotated[UserProfile, Depends(require_admin)]) -> PropertyCard:
    updated = _require_updated(repo.set_moderation_state(property_id, featured=True))
    admin_log_repo.create(
        admin_uid=user.uid,
        action_type="feature_property",
        target_type="property",
        target_id=property_id,
        metadata={"featured": True},
    )
    return updated


# ── Analytics ───────────────────────────────────────────────────────

@router.get("/analytics/overview")
def analytics_overview(user: Annotated[UserProfile, Depends(require_admin)]) -> AdminAnalyticsOverview:
    _ = user
    return analytics_repo.get_overview()


@router.get("/inquiries")
def admin_list_inquiries(user: Annotated[UserProfile, Depends(require_admin)]) -> list[AdminInquiryOut]:
    _ = user
    inquiries = engagement_repo.list_all_inquiries()
    decorated = []
    
    for inq in inquiries:
        prop = repo.get_by_id(inq.property_id)
        prop_title = prop.title if prop else "Unknown PG / Deleted"
        
        owner_name = "Unknown Owner"
        owner_email = "No Email"
        if inq.owner_uid:
            owner = user_repo.get_by_uid(inq.owner_uid)
            if owner:
                owner_name = owner.name or "Unnamed Owner"
                owner_email = owner.email or "No Email"
                
        decorated.append(
            AdminInquiryOut(
                inquiry_id=inq.inquiry_id,
                property_id=inq.property_id,
                property_title=prop_title,
                owner_uid=inq.owner_uid,
                owner_name=owner_name,
                owner_email=owner_email,
                student_uid=inq.student_uid,
                name=inq.name,
                phone=inq.phone,
                message=inq.message,
                source=inq.source,
                created_at=inq.created_at,
            )
        )
    return decorated


# ── Audit logs ──────────────────────────────────────────────────────

@router.get("/logs")
def admin_logs(user: Annotated[UserProfile, Depends(require_admin)]) -> list[AdminLogOut]:
    _ = user
    return admin_log_repo.list_logs(limit=100)


# ── College management ──────────────────────────────────────────────

@router.get("/colleges")
def admin_list_colleges(user: Annotated[UserProfile, Depends(require_admin)]) -> list[CollegeOut]:
    _ = user
    return college_repo.list_all()


@router.post("/colleges")
def admin_create_college(
    payload: CollegeCreate,
    user: Annotated[UserProfile, Depends(require_admin)],
) -> CollegeOut:
    college = college_repo.create(payload)
    admin_log_repo.create(
        admin_uid=user.uid,
        action_type="create_college",
        target_type="college",
        target_id=college.college_id,
    )
    return college


@router.patch("/colleges/{college_id}")
def admin_update_college(
    college_id: str,
    payload: CollegeUpdate,
    user: Annotated[UserProfile, Depends(require_admin)],
) -> CollegeOut:
    updated = college_repo.update(college_id, payload)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "COLLEGE_NOT_FOUND", "message": "College not found"},
        )
    admin_log_repo.create(
        admin_uid=user.uid,
        action_type="update_college",
        target_type="college",
        target_id=college_id,
    )
    return updated


@router.delete("/colleges/{college_id}")
def admin_delete_college(
    college_id: str,
    user: Annotated[UserProfile, Depends(require_admin)],
) -> dict:
    deleted = college_repo.delete(college_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "COLLEGE_NOT_FOUND", "message": "College not found"},
        )
    admin_log_repo.create(
        admin_uid=user.uid,
        action_type="delete_college",
        target_type="college",
        target_id=college_id,
    )
    return {"message": "College deleted"}


# ── User management ────────────────────────────────────────────────

@router.get("/users")
def admin_list_users(
    user: Annotated[UserProfile, Depends(require_admin)],
    role: Optional[str] = None,
    status_filter: Optional[str] = Query(default=None, alias="status"),
) -> list[UserProfile]:
    _ = user
    return user_repo.list_all(role=role, status=status_filter)


@router.patch("/users/{uid}/status")
def admin_update_user_status(
    uid: str,
    payload: AdminUserStatusUpdate,
    user: Annotated[UserProfile, Depends(require_admin)],
) -> UserProfile:
    updated = user_repo.update_status(uid, payload)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"},
        )
    admin_log_repo.create(
        admin_uid=user.uid,
        action_type="update_user_status",
        target_type="user",
        target_id=uid,
        reason=payload.reason,
        metadata={"new_status": payload.status.value},
    )
    return updated
