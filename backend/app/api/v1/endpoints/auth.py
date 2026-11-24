import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.models.schemas.user import UserProfile, UserRole, UserStatus, VerificationState
from app.repositories.user_repository import UserRepository

logger = logging.getLogger(__name__)

router = APIRouter()
user_repo = UserRepository()


class RegisterRequest(BaseModel):
    role: UserRole
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    college_id: Optional[str] = None


class RegisterResponse(BaseModel):
    uid: str
    role: str
    name: str
    message: str


@router.post("/register")
def register_user(
    payload: RegisterRequest,
    user: UserProfile = Depends(get_current_user),
) -> RegisterResponse:
    """
    Register a user with a role after Firebase auth.
    Sets their role in the DB and updates Firebase custom claims.
    """
    existing = user_repo.get_by_uid(user.uid)
    if existing:
        if existing.status == UserStatus.blocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "USER_BLOCKED", "message": "Account is suspended"},
            )
        # If registering as admin and email is whitelisted, allow role upgrade
        if payload.role == UserRole.admin:
            pass
        elif existing.role != UserRole.student:
            return RegisterResponse(
                uid=existing.uid,
                role=existing.role.value,
                name=existing.name or payload.name,
                message="User already registered",
            )

    # Validate student must have college_id
    if payload.role == UserRole.student and not payload.college_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "COLLEGE_REQUIRED", "message": "Students must select a college"},
        )

    # Admin whitelist enforcement
    if payload.role == UserRole.admin:
        existing_email = existing.email if existing else None
        user_email = (payload.email or user.email or existing_email or "").strip().lower()
        allowed = get_settings().admin_emails()
        logger.info("[Admin Register] Checking authorization for '%s'", user_email)
        if not user_email or user_email not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "ADMIN_NOT_ALLOWED",
                    "message": "Admin registration is restricted to authorized email addresses.",
                },
            )

    now = datetime.now(timezone.utc).isoformat()

    if payload.role in (UserRole.student, UserRole.admin):
        verification = VerificationState.verified
    elif existing and existing.role == UserRole.owner:
        verification = existing.verification_state
    else:
        verification = VerificationState.unverified

    profile = UserProfile(
        uid=user.uid,
        role=payload.role,
        status=UserStatus.active,
        name=payload.name,
        phone=payload.phone or user.phone,
        email=payload.email or user.email,
        college_id=payload.college_id,
        verification_state=verification,
        created_at=existing.created_at if existing and existing.created_at else now,
        updated_at=now,
    )

    user_repo.upsert(profile)

    try:
        from firebase_admin import auth as firebase_auth
        firebase_auth.set_custom_user_claims(user.uid, {"role": payload.role.value})
    except Exception:
        pass

    return RegisterResponse(
        uid=user.uid,
        role=payload.role.value,
        name=payload.name,
        message=f"Registered as {payload.role.value} successfully",
    )


@router.get("/me")
def get_auth_profile(user: UserProfile = Depends(get_current_user)) -> UserProfile:
    """Get the authenticated user's full profile from DB, falling back to token data."""
    stored = user_repo.get_by_uid(user.uid)
    if stored:
        return stored
    return user
