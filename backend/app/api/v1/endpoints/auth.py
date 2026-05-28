import logging
import os
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
    college_id: Optional[str] = None  # required for students


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
    Register a new user with a role after Firebase auth.
    The Firebase user already exists — this sets their role in the DB
    and sets Firebase custom claims so future tokens carry the role.
    """
    # Check if user already registered with a role
    existing = user_repo.get_by_uid(user.uid)
    if existing:
        # If registering as admin and email is whitelisted, allow role upgrade
        if payload.role == UserRole.admin:
            pass  # Fall through to admin whitelist check + re-registration below
        elif existing.role != UserRole.student:
            # Already registered with a non-student role — just return
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

    # ── Admin whitelist enforcement ──
    # Only emails explicitly listed in ADMIN_ALLOWED_EMAILS can register as admin.
    # Everyone else is rejected outright.
    if payload.role == UserRole.admin:
        # Collect email from all possible sources
        existing_email = existing.email if existing else None
        user_email = (payload.email or user.email or existing_email or "").strip().lower()
        allowed = get_settings().admin_emails()
        logger.info("[Admin Register] Email being checked: '%s'", user_email)
        logger.info("[Admin Register] Allowed emails: %s", allowed)
        logger.info("[Admin Register] payload.email='%s', user.email='%s', existing_email='%s'",
                     payload.email, user.email, existing_email)
        if not user_email or user_email not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "ADMIN_NOT_ALLOWED",
                    "message": f"Admin registration is restricted. Email '{user_email}' is not authorized. Allowed: {', '.join(allowed) if allowed else 'NONE (env var not set)'}",
                },
            )

    user_status = UserStatus.active

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()

    # Auto-verify students and admins; owners need admin verification
    if payload.role in (UserRole.student, UserRole.admin):
        verification = VerificationState.verified
    else:
        verification = VerificationState.unverified

    profile = UserProfile(
        uid=user.uid,
        role=payload.role,
        status=user_status,
        name=payload.name,
        phone=payload.phone or user.phone,
        email=payload.email or user.email,
        college_id=payload.college_id,
        verification_state=verification,

        created_at=now,
        updated_at=now,
    )

    user_repo.upsert(profile)

    # Set Firebase custom claims so the role appears in ID tokens
    try:
        from firebase_admin import auth as firebase_auth
        firebase_auth.set_custom_user_claims(user.uid, {
            "role": payload.role.value,
        })
    except Exception:
        pass  # Firebase not configured or user doesn't exist in Firebase Auth

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
