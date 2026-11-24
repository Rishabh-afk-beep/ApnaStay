from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.models.schemas.user import AdminUserStatusUpdate, UserProfile, UserStatus
from app.repositories.firestore_client import get_firestore_client


_FALLBACK_USERS: Dict[str, Dict[str, Any]] = {
    "admin_demo": {
        "uid": "admin_demo",
        "role": "admin",
        "status": "active",
        "name": "Admin User",
        "phone": "9000000001",
        "email": "admin@nearmycolleges.in",
        "verification_state": "verified",
        "created_at": "2026-01-01T00:00:00+00:00",
        "updated_at": "2026-01-01T00:00:00+00:00",
    },
    "owner_demo": {
        "uid": "owner_demo",
        "role": "owner",
        "status": "active",
        "name": "Owner Demo",
        "phone": "9000000002",
        "email": "owner@nearmycolleges.in",
        "verification_state": "verified",
        "created_at": "2026-01-01T00:00:00+00:00",
        "updated_at": "2026-01-01T00:00:00+00:00",
    },
    "student_demo": {
        "uid": "student_demo",
        "role": "student",
        "status": "active",
        "name": "Student Demo",
        "phone": "9000000003",
        "email": "student@nearmycolleges.in",
        "college_id": "sample-college-1",
        "verification_state": "verified",
        "created_at": "2026-01-01T00:00:00+00:00",
        "updated_at": "2026-01-01T00:00:00+00:00",
    },
}


class UserRepository:
    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    def get_by_uid(self, uid: str) -> Optional[UserProfile]:
        client = get_firestore_client()
        if client is None:
            data = _FALLBACK_USERS.get(uid)
            if data is None:
                return None
            return UserProfile(**data)

        doc = client.collection("users").document(uid).get()
        if not doc.exists:
            return None
        return UserProfile(**doc.to_dict())

    def get_many_by_uids(self, uids: List[str]) -> Dict[str, UserProfile]:
        unique_uids = [u for u in dict.fromkeys(uids) if u]
        if not unique_uids:
            return {}

        client = get_firestore_client()
        if client is None:
            result: Dict[str, UserProfile] = {}
            for uid in unique_uids:
                data = _FALLBACK_USERS.get(uid)
                if data:
                    result[uid] = UserProfile(**data)
            return result

        refs = [client.collection("users").document(uid) for uid in unique_uids]
        result = {}
        for doc in client.get_all(refs):
            if doc.exists:
                profile = UserProfile(**doc.to_dict())
                result[profile.uid] = profile
        return result

    def upsert(self, profile: UserProfile) -> UserProfile:
        now = self._now()
        data = profile.model_dump()
        data["updated_at"] = now
        if not data.get("created_at"):
            data["created_at"] = now

        client = get_firestore_client()
        if client is not None:
            client.collection("users").document(profile.uid).set(data, merge=True)
        else:
            existing = _FALLBACK_USERS.get(profile.uid, {})
            existing.update(data)
            _FALLBACK_USERS[profile.uid] = existing

        return UserProfile(**data)

    def update_fields(self, uid: str, patch: Dict[str, Any]) -> Optional[UserProfile]:
        patch["updated_at"] = self._now()

        client = get_firestore_client()
        if client is None:
            current = _FALLBACK_USERS.get(uid)
            if current is None:
                return None
            current.update(patch)
            _FALLBACK_USERS[uid] = current
            return UserProfile(**current)

        ref = client.collection("users").document(uid)
        doc = ref.get()
        if not doc.exists:
            return None
        ref.update(patch)
        current = doc.to_dict()
        current.update(patch)
        return UserProfile(**current)

    def list_all(
        self, role: Optional[str] = None, status: Optional[str] = None, skip: int = 0, limit: int = 50
    ) -> List[UserProfile]:
        client = get_firestore_client()
        if client is None:
            users = list(_FALLBACK_USERS.values())
            if role:
                users = [u for u in users if u.get("role") == role]
            if status:
                users = [u for u in users if u.get("status") == status]
            return [UserProfile(**u) for u in users[skip : skip + limit]]

        query = client.collection("users")
        if role:
            query = query.where("role", "==", role)
        if status:
            query = query.where("status", "==", status)

        docs = query.offset(skip).limit(limit).stream()
        return [UserProfile(**doc.to_dict()) for doc in docs]

    def update_status(self, uid: str, payload: AdminUserStatusUpdate) -> Optional[UserProfile]:
        patch: Dict[str, Any] = {"status": payload.status.value, "updated_at": self._now()}
        return self.update_fields(uid, patch)

    def update_verification(self, uid: str, verification_state: str) -> Optional[UserProfile]:
        patch: Dict[str, Any] = {"verification_state": verification_state, "updated_at": self._now()}
        return self.update_fields(uid, patch)


def fallback_user_count() -> int:
    return len(_FALLBACK_USERS)
