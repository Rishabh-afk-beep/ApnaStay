from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from uuid import uuid4

from app.models.schemas.engagement import (
    AlertCreate,
    AlertOut,
    AlertUpdate,
    InquiryCreate,
    InquiryOut,
    RecentViewOut,
    ShortlistOut,
)
from app.repositories.firestore_client import get_firestore_client

_FALLBACK_SHORTLISTS: Dict[Tuple[str, str], ShortlistOut] = {}
_FALLBACK_RECENT_VIEWS: Dict[Tuple[str, str], RecentViewOut] = {}
_FALLBACK_INQUIRIES: List[InquiryOut] = []
_FALLBACK_ALERTS: Dict[str, AlertOut] = {}


class EngagementRepository:
    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    def add_shortlist(self, user_uid: str, property_id: str) -> ShortlistOut:
        item = ShortlistOut(user_uid=user_uid, property_id=property_id, created_at=self._now())
        key = (user_uid, property_id)

        client = get_firestore_client()
        if client is None:
            _FALLBACK_SHORTLISTS[key] = item
            return item

        doc_id = f"{user_uid}_{property_id}"
        client.collection("shortlists").document(doc_id).set(item.model_dump())
        return item

    def remove_shortlist(self, user_uid: str, property_id: str) -> bool:
        key = (user_uid, property_id)

        client = get_firestore_client()
        if client is None:
            return _FALLBACK_SHORTLISTS.pop(key, None) is not None

        doc_id = f"{user_uid}_{property_id}"
        ref = client.collection("shortlists").document(doc_id)
        if not ref.get().exists:
            return False
        ref.delete()
        return True

    def list_shortlists(self, user_uid: str) -> List[ShortlistOut]:
        client = get_firestore_client()
        if client is None:
            return [value for (uid, _), value in _FALLBACK_SHORTLISTS.items() if uid == user_uid]

        docs = client.collection("shortlists").where("user_uid", "==", user_uid).stream()
        return [ShortlistOut(**doc.to_dict()) for doc in docs]

    def add_recent_view(self, user_uid: str, property_id: str) -> RecentViewOut:
        item = RecentViewOut(user_uid=user_uid, property_id=property_id, viewed_at=self._now())
        key = (user_uid, property_id)

        client = get_firestore_client()
        if client is None:
            _FALLBACK_RECENT_VIEWS[key] = item
            return item

        doc_id = f"{user_uid}_{property_id}"
        client.collection("recent_views").document(doc_id).set(item.model_dump())
        return item

    def list_recent_views(self, user_uid: str) -> List[RecentViewOut]:
        client = get_firestore_client()
        if client is None:
            items = [value for (uid, _), value in _FALLBACK_RECENT_VIEWS.items() if uid == user_uid]
            return sorted(items, key=lambda x: x.viewed_at, reverse=True)

        docs = client.collection("recent_views").where("user_uid", "==", user_uid).stream()
        items = [RecentViewOut(**doc.to_dict()) for doc in docs]
        return sorted(items, key=lambda x: x.viewed_at, reverse=True)

    def create_inquiry(
        self,
        property_id: str,
        owner_uid: Optional[str],
        student_uid: Optional[str],
        payload: InquiryCreate,
    ) -> InquiryOut:
        item = InquiryOut(
            inquiry_id=f"inquiry_{uuid4().hex[:10]}",
            property_id=property_id,
            owner_uid=owner_uid,
            student_uid=student_uid,
            name=payload.name,
            phone=payload.phone,
            message=payload.message,
            source=payload.source,
            created_at=self._now(),
        )

        client = get_firestore_client()
        if client is None:
            _FALLBACK_INQUIRIES.append(item)
            return item

        client.collection("inquiries").document(item.inquiry_id).set(item.model_dump())
        return item

    def create_alert(self, user_uid: str, payload: AlertCreate) -> AlertOut:
        now = self._now()
        item = AlertOut(
            alert_id=f"alert_{uuid4().hex[:10]}",
            user_uid=user_uid,
            college_id=payload.college_id,
            property_type=payload.property_type,
            budget_min=payload.budget_min,
            budget_max=payload.budget_max,
            radius_km=payload.radius_km,
            gender=payload.gender,
            amenities=payload.amenities,
            active=payload.active,
            created_at=now,
            updated_at=now,
        )

        client = get_firestore_client()
        if client is None:
            _FALLBACK_ALERTS[item.alert_id] = item
            return item

        client.collection("alerts").document(item.alert_id).set(item.model_dump())
        return item

    def list_alerts(self, user_uid: str) -> List[AlertOut]:
        client = get_firestore_client()
        if client is None:
            return [alert for alert in _FALLBACK_ALERTS.values() if alert.user_uid == user_uid]

        docs = client.collection("alerts").where("user_uid", "==", user_uid).stream()
        return [AlertOut(**doc.to_dict()) for doc in docs]

    def update_alert(self, user_uid: str, alert_id: str, payload: AlertUpdate) -> Optional[AlertOut]:
        patch = {k: v for k, v in payload.model_dump().items() if v is not None}
        patch["updated_at"] = self._now()

        client = get_firestore_client()
        if client is None:
            current = _FALLBACK_ALERTS.get(alert_id)
            if current is None or current.user_uid != user_uid:
                return None
            merged = current.model_dump()
            merged.update(patch)
            updated = AlertOut(**merged)
            _FALLBACK_ALERTS[alert_id] = updated
            return updated

        ref = client.collection("alerts").document(alert_id)
        doc = ref.get()
        if not doc.exists:
            return None
        current = doc.to_dict()
        if current.get("user_uid") != user_uid:
            return None
        ref.update(patch)
        current.update(patch)
        return AlertOut(**current)

    def list_inquiries_for_property(self, property_id: str) -> List[InquiryOut]:
        client = get_firestore_client()
        if client is None:
            return [i for i in _FALLBACK_INQUIRIES if i.property_id == property_id]

        docs = client.collection("inquiries").where("property_id", "==", property_id).stream()
        items = [InquiryOut(**doc.to_dict()) for doc in docs]
        items.sort(key=lambda x: x.created_at, reverse=True)
        return items

    def list_all_inquiries(self) -> List[InquiryOut]:
        client = get_firestore_client()
        if client is None:
            return _FALLBACK_INQUIRIES

        docs = client.collection("inquiries").stream()
        items = [InquiryOut(**doc.to_dict()) for doc in docs]
        items.sort(key=lambda x: x.created_at, reverse=True)
        return items

    def delete_alert(self, user_uid: str, alert_id: str) -> bool:
        client = get_firestore_client()
        if client is None:
            current = _FALLBACK_ALERTS.get(alert_id)
            if current is None or current.user_uid != user_uid:
                return False
            _FALLBACK_ALERTS.pop(alert_id, None)
            return True

        ref = client.collection("alerts").document(alert_id)
        doc = ref.get()
        if not doc.exists:
            return False
        current = doc.to_dict()
        if current.get("user_uid") != user_uid:
            return False
        ref.delete()
        return True


def fallback_counts() -> dict:
    return {
        "total_inquiries": len(_FALLBACK_INQUIRIES),
        "total_shortlists": len(_FALLBACK_SHORTLISTS),
        "total_alerts": len(_FALLBACK_ALERTS),
    }
