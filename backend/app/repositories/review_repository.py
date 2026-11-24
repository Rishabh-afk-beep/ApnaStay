from datetime import datetime, timezone
from typing import Dict, List
from uuid import uuid4

from app.models.schemas.review import ReviewCreate, ReviewOut
from app.repositories.firestore_client import get_firestore_client
from app.repositories.property_repository import PropertyRepository

_FALLBACK_REVIEWS: Dict[str, List[ReviewOut]] = {}


class ReviewRepository:
    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    def create(
        self, property_id: str, user_uid: str, payload: ReviewCreate, user_name: str = "Verified Student"
    ) -> ReviewOut:
        review = ReviewOut(
            review_id=f"review_{uuid4().hex[:10]}",
            property_id=property_id,
            user_uid=user_uid,
            user_name=user_name or "Verified Student",
            rating=payload.rating,
            title=payload.title,
            comment=payload.comment,
            stay_status=payload.stay_status,
            moderation_status="visible",
            created_at=self._now(),
        )

        client = get_firestore_client()
        if client is None:
            _FALLBACK_REVIEWS.setdefault(property_id, []).append(review)
        else:
            client.collection("reviews").document(review.review_id).set(review.model_dump())

        # Recompute property average rating and review count
        all_reviews = self.list_by_property(property_id)
        if all_reviews:
            avg_rating = sum(r.rating for r in all_reviews) / len(all_reviews)
            PropertyRepository().update_rating_stats(property_id, avg_rating, len(all_reviews))

        return review

    def list_by_property(self, property_id: str) -> List[ReviewOut]:
        client = get_firestore_client()
        if client is None:
            items = list(_FALLBACK_REVIEWS.get(property_id, []))
            items.sort(key=lambda r: r.created_at, reverse=True)
            return items

        docs = client.collection("reviews").where("property_id", "==", property_id).stream()
        items = [ReviewOut(**doc.to_dict()) for doc in docs]
        items.sort(key=lambda r: r.created_at, reverse=True)
        return items


def fallback_review_count() -> int:
    return sum(len(items) for items in _FALLBACK_REVIEWS.values())
