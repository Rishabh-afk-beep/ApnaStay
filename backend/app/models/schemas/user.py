from enum import Enum
from typing import Optional

from pydantic import BaseModel


class UserRole(str, Enum):
    admin = "admin"
    student = "student"
    owner = "owner"


class UserStatus(str, Enum):
    active = "active"
    blocked = "blocked"
    pending_verification = "pending_verification"


class VerificationState(str, Enum):
    unverified = "unverified"
    pending = "pending"
    verified = "verified"


class UserProfile(BaseModel):
    uid: str
    role: UserRole
    status: UserStatus = UserStatus.active
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    photo_url: Optional[str] = None
    college_id: Optional[str] = None
    verification_state: VerificationState = VerificationState.unverified
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    last_login_at: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    photo_url: Optional[str] = None
    college_id: Optional[str] = None


class ProfileComplete(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    college_id: Optional[str] = None  # required for students
    photo_url: Optional[str] = None


class AdminUserStatusUpdate(BaseModel):
    status: UserStatus
    reason: Optional[str] = None


class AdminVerificationUpdate(BaseModel):
    verification_state: VerificationState
