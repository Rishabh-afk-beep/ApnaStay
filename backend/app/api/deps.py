from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.core.rbac import require_roles
from app.core.security import verify_firebase_token
from app.models.schemas.user import UserProfile, UserRole, UserStatus


def get_optional_user(
    authorization: Annotated[str | None, Header()] = None,
) -> UserProfile | None:
    if not authorization:
        return None

    token = authorization.replace("Bearer ", "").strip()
    if not token:
        return None

    payload = verify_firebase_token(token)
    uid = payload.get("uid", "")

    # Check Firestore for the stored profile first — it has the real role & status
    from app.repositories.user_repository import UserRepository
    stored = UserRepository().get_by_uid(uid)
    if stored:
        if stored.status == UserStatus.blocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "USER_BLOCKED", "message": "Your account has been suspended by an administrator"},
            )
        return stored

    # Fallback to token claims for unregistered users
    role_value = payload.get("role", UserRole.student.value)
    role = UserRole(role_value) if role_value in UserRole._value2member_map_ else UserRole.student

    return UserProfile(
        uid=uid,
        role=role,
        status=UserStatus.active,
        name=payload.get("name"),
        phone=payload.get("phone_number"),
        email=payload.get("email"),
    )


def get_current_user(
    user: Annotated[UserProfile | None, Depends(get_optional_user)],
) -> UserProfile:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_REQUIRED", "message": "Authentication required"},
        )
    if user.status == UserStatus.blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "USER_BLOCKED", "message": "Your account has been suspended by an administrator"},
        )
    return user


def require_admin(user: Annotated[UserProfile, Depends(get_current_user)]) -> UserProfile:
    require_roles(user.role.value, {UserRole.admin.value})
    return user


def require_owner(user: Annotated[UserProfile, Depends(get_current_user)]) -> UserProfile:
    require_roles(user.role.value, {UserRole.owner.value})
    return user


def require_student(user: Annotated[UserProfile, Depends(get_current_user)]) -> UserProfile:
    require_roles(user.role.value, {UserRole.student.value})
    return user
