from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from google.cloud import firestore_v1

from app.models.schemas.property import OwnerPropertyCreate, OwnerPropertyUpdate, PropertyCard, PropertyDetail
from app.repositories.firestore_client import get_firestore_client


_FALLBACK_PROPERTIES: Dict[str, Dict[str, Any]] = {
    "p1": {
        "property_id": "p1",
        "owner_uid": "owner_demo",
        "title": "Green Nest PG",
        "property_type": "pg",
        "primary_college_id": "sample-college-1",
        "description": "A comfortable PG with homely food and all modern amenities. Walking distance from campus.",
        "address_text": "Plot 45, Gachibowli Road, Hyderabad",
        "rent_min": 6500,
        "rent_max": 8500,
        "security_deposit": 5000,
        "amenities": ["wifi", "food", "laundry"],
        "rating_avg": 4.2,
        "rating_count": 38,
        "review_count": 38,
        "availability_status": "available",
        "approval_status": "approved",
        "visibility_status": "live",
        "featured": False,
        "gender": "male",
        "food_available": True,
        "food_menu": "Breakfast & Dinner included. Veg/Non-Veg options.",
        "rules": "No smoking inside rooms. Gate closes at 10 PM.",
        "cover_image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
        "image_urls": [
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80",
        ],
        "latitude": 17.392,
        "longitude": 78.49,
        "created_at": "2026-03-01T10:00:00+00:00",
        "updated_at": "2026-04-10T12:00:00+00:00",
    },
    "p2": {
        "property_id": "p2",
        "owner_uid": "owner_demo",
        "title": "Campus View Rooms",
        "property_type": "single_room",
        "primary_college_id": "sample-college-1",
        "description": "Fully furnished single rooms with attached bathroom. 24/7 water and power backup.",
        "address_text": "Building 12, Campus Road, Near SEC Gate",
        "rent_min": 9000,
        "rent_max": 12000,
        "security_deposit": 10000,
        "amenities": ["wifi", "ac", "parking"],
        "rating_avg": 4.0,
        "rating_count": 14,
        "review_count": 14,
        "availability_status": "available",
        "approval_status": "approved",
        "visibility_status": "live",
        "featured": False,
        "gender": "any",
        "food_available": False,
        "cover_image_url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        "image_urls": [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        ],
        "latitude": 17.379,
        "longitude": 78.481,
        "created_at": "2026-03-15T08:00:00+00:00",
        "updated_at": "2026-04-11T09:00:00+00:00",
    },
    "p3": {
        "property_id": "p3",
        "owner_uid": "owner_demo",
        "title": "Sunshine Hostel for Women",
        "property_type": "hostel",
        "primary_college_id": "sample-college-1",
        "description": "Safe women-only hostel with 24/7 security, mess, and study rooms.",
        "address_text": "Street 7, Near SEC Back Gate",
        "rent_min": 5000,
        "rent_max": 7500,
        "security_deposit": 3000,
        "amenities": ["wifi", "food", "cctv", "geyser"],
        "rating_avg": 4.5,
        "rating_count": 22,
        "review_count": 22,
        "availability_status": "available",
        "approval_status": "approved",
        "visibility_status": "live",
        "featured": True,
        "gender": "female",
        "food_available": True,
        "food_menu": "3 meals/day included. Pure Veg.",
        "rules": "Only women allowed. Curfew at 9 PM.",
        "cover_image_url": "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
        "image_urls": [
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
        ],
        "latitude": 17.388,
        "longitude": 78.483,
        "created_at": "2026-02-20T06:00:00+00:00",
        "updated_at": "2026-04-12T14:00:00+00:00",
    },
}


def fallback_property_counts() -> Dict[str, int]:
    total = len(_FALLBACK_PROPERTIES)
    live = len([item for item in _FALLBACK_PROPERTIES.values() if item.get("visibility_status") == "live"])
    pending = len([item for item in _FALLBACK_PROPERTIES.values() if item.get("approval_status") == "pending"])
    return {"total_properties": total, "live_properties": live, "pending_properties": pending}


class PropertyRepository:
    @staticmethod
    def _to_card(data: Dict[str, Any]) -> PropertyCard:
        # Field mapping for seed data compatibility
        if "nearest_college_id" in data and "primary_college_id" not in data:
            data["primary_college_id"] = data["nearest_college_id"]
        if "deposit_amount" in data and "security_deposit" not in data:
            data["security_deposit"] = data["deposit_amount"]
        if "is_featured" in data and "featured" not in data:
            data["featured"] = data["is_featured"]
        if "avg_rating" in data and "rating_avg" not in data:
            data["rating_avg"] = data["avg_rating"]
            
        # Ensure required defaults
        data.setdefault("rating_avg", 0.0)
        data.setdefault("rating_count", 0)
        data.setdefault("review_count", 0)
        data.setdefault("amenities", [])
        data.setdefault("security_deposit", 0)
        data.setdefault("availability_status", "available")
        data.setdefault("approval_status", "pending")
        data.setdefault("visibility_status", "hidden")
        data.setdefault("featured", False)
        data.setdefault("food_available", False)
        return PropertyCard(**data)

    @staticmethod
    def _to_detail(data: Dict[str, Any]) -> PropertyDetail:
        # Field mapping for seed data compatibility
        if "nearest_college_id" in data and "primary_college_id" not in data:
            data["primary_college_id"] = data["nearest_college_id"]
        if "deposit_amount" in data and "security_deposit" not in data:
            data["security_deposit"] = data["deposit_amount"]
        if "is_featured" in data and "featured" not in data:
            data["featured"] = data["is_featured"]
        if "avg_rating" in data and "rating_avg" not in data:
            data["rating_avg"] = data["avg_rating"]

        # Map room_options
        if "room_options" in data and isinstance(data["room_options"], list):
            mapped_rooms = []
            for room in data["room_options"]:
                label = room.get("label", room.get("occupancy", "single"))
                price = room.get("price", room.get("rent", 0))
                status = "available" if room.get("available", True) else "unavailable"
                # Keep other existing fields if any, override mapped fields
                mapped_room = dict(room)
                mapped_room["label"] = label
                mapped_room["price"] = price
                mapped_room["status"] = mapped_room.get("status", status)
                mapped_rooms.append(mapped_room)
            data["room_options"] = mapped_rooms

        data.setdefault("rating_avg", 0.0)
        data.setdefault("rating_count", 0)
        data.setdefault("review_count", 0)
        data.setdefault("amenities", [])
        data.setdefault("security_deposit", 0)
        data.setdefault("availability_status", "available")
        data.setdefault("approval_status", "pending")
        data.setdefault("visibility_status", "hidden")
        data.setdefault("featured", False)
        data.setdefault("food_available", False)
        return PropertyDetail(**data)

    @staticmethod
    def _fallback_cards() -> List[PropertyCard]:
        return [PropertyRepository._to_card(dict(item)) for item in _FALLBACK_PROPERTIES.values()]

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    def _to_firestore_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        payload = data.copy()
        payload.pop("distance_km", None)
        return payload

    def search_live(self, primary_college_id: str, property_type: Optional[str] = None, gender: Optional[str] = None) -> List[PropertyCard]:
        client = get_firestore_client()
        if client is None:
            items = [
                dict(item)
                for item in _FALLBACK_PROPERTIES.values()
                if item.get("primary_college_id") == primary_college_id
                and item.get("visibility_status", "hidden") == "live"
            ]
            if property_type:
                items = [i for i in items if i.get("property_type") == property_type]
            if gender and gender != "any":
                items = [i for i in items if i.get("gender") in (gender, "any", None)]
            return [self._to_card(i) for i in items]

        # Query Firestore using the new unified schema
        query = client.collection("properties").where(filter=firestore_v1.FieldFilter("visibility_status", "==", "live"))
        docs = list(query.stream())

        results = []
        for doc in docs:
            data = doc.to_dict()
            if data.get("primary_college_id") != primary_college_id:
                continue
            if property_type and data.get("property_type") != property_type:
                continue
            if gender and gender != "any" and data.get("gender") not in (gender, "any", None):
                continue
            results.append(self._to_card(data))
        return results

    def search_all_live(self, property_type: Optional[str] = None, gender: Optional[str] = None) -> List[PropertyCard]:
        """Return all live properties regardless of college — for global discovery."""
        client = get_firestore_client()
        if client is None:
            items = [
                dict(item)
                for item in _FALLBACK_PROPERTIES.values()
                if item.get("visibility_status", "hidden") == "live"
            ]
            if property_type:
                items = [i for i in items if i.get("property_type") == property_type]
            if gender and gender != "any":
                items = [i for i in items if i.get("gender") in (gender, "any", None)]
            return [self._to_card(i) for i in items]

        # Firestore: fetch all live properties
        query = client.collection("properties").where(filter=firestore_v1.FieldFilter("visibility_status", "==", "live"))
        docs = list(query.stream())

        results = []
        for doc in docs:
            data = doc.to_dict()
            if property_type and data.get("property_type") != property_type:
                continue
            if gender and gender != "any" and data.get("gender") not in (gender, "any", None):
                continue
            results.append(self._to_card(data))
        return results

    def get_by_id(self, property_id: str) -> Optional[PropertyCard]:

        client = get_firestore_client()
        if client is None:
            data = _FALLBACK_PROPERTIES.get(property_id)
            if data is None:
                return None
            return self._to_card(dict(data))

        doc = client.collection("properties").document(property_id).get()
        if not doc.exists:
            return None
        return self._to_card(doc.to_dict())

    def get_detail(self, property_id: str) -> Optional[PropertyDetail]:
        client = get_firestore_client()
        if client is None:
            data = _FALLBACK_PROPERTIES.get(property_id)
            if data is None:
                return None
            return self._to_detail(dict(data))

        doc = client.collection("properties").document(property_id).get()
        if not doc.exists:
            return None
        return self._to_detail(doc.to_dict())

    def list_by_owner(self, owner_uid: str) -> List[PropertyDetail]:
        client = get_firestore_client()
        if client is None:
            return [self._to_detail(dict(item)) for item in _FALLBACK_PROPERTIES.values() if item.get("owner_uid") == owner_uid]

        docs = client.collection("properties").where("owner_uid", "==", owner_uid).stream()
        return [self._to_detail(doc.to_dict()) for doc in docs]

    def create_for_owner(self, owner_uid: str, payload: OwnerPropertyCreate) -> PropertyDetail:
        now = self._now_iso()
        property_id = f"property_{owner_uid}_{int(datetime.now(timezone.utc).timestamp())}"
        data: Dict[str, Any] = {
            "property_id": property_id,
            "owner_uid": owner_uid,
            "title": payload.title,
            "property_type": payload.property_type,
            "primary_college_id": payload.primary_college_id,
            "description": payload.description,
            "address_text": payload.address_text,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "rent_min": payload.rent_min,
            "rent_max": payload.rent_max,
            "security_deposit": payload.security_deposit,
            "amenities": payload.amenities,
            "gender": payload.gender,
            "food_available": payload.food_available,
            "food_menu": payload.food_menu,
            "rules": payload.rules,
            "cover_image_url": payload.cover_image_url,
            "image_urls": payload.image_urls,
            "rating_avg": 0.0,
            "rating_count": 0,
            "review_count": 0,
            "availability_status": "available",
            "approval_status": "pending",
            "visibility_status": "hidden",
            "featured": False,
            "created_at": now,
            "updated_at": now,
        }

        if payload.room_options:
            data["room_options"] = [ro.model_dump() for ro in payload.room_options]
        if payload.metadata:
            data["metadata"] = payload.metadata.model_dump(exclude_none=True)

        client = get_firestore_client()
        if client is not None:
            client.collection("properties").document(property_id).set(self._to_firestore_dict(data))
        else:
            _FALLBACK_PROPERTIES[property_id] = self._to_firestore_dict(data)

        return self._to_detail(data)

    def update_for_owner(self, owner_uid: str, property_id: str, payload: OwnerPropertyUpdate) -> Optional[PropertyDetail]:
        item = self.get_by_id(property_id)
        if item is None:
            return None

        client = get_firestore_client()
        if client is not None:
            doc = client.collection("properties").document(property_id).get()
            if not doc.exists:
                return None
            current = doc.to_dict()
            if current.get("owner_uid") != owner_uid:
                return None
            patch = {k: v for k, v in payload.model_dump().items() if v is not None}
            # Handle nested models
            if "room_options" in patch and patch["room_options"] is not None:
                patch["room_options"] = [ro if isinstance(ro, dict) else ro.model_dump() for ro in patch["room_options"]]
            if "metadata" in patch and patch["metadata"] is not None:
                patch["metadata"] = patch["metadata"] if isinstance(patch["metadata"], dict) else patch["metadata"].model_dump(exclude_none=True)
            patch["updated_at"] = self._now_iso()
            client.collection("properties").document(property_id).update(patch)
            current.update(patch)
            return self._to_detail(current)

        current = _FALLBACK_PROPERTIES.get(property_id)
        if current is None:
            return None
        if current.get("owner_uid") != owner_uid:
            return None
        patch = {k: v for k, v in payload.model_dump().items() if v is not None}
        if "room_options" in patch and patch["room_options"] is not None:
            patch["room_options"] = [ro if isinstance(ro, dict) else ro.model_dump() for ro in patch["room_options"]]
        if "metadata" in patch and patch["metadata"] is not None:
            patch["metadata"] = patch["metadata"] if isinstance(patch["metadata"], dict) else patch["metadata"].model_dump(exclude_none=True)
        patch["updated_at"] = self._now_iso()
        current.update(patch)
        _FALLBACK_PROPERTIES[property_id] = current
        return self._to_detail(current)

    def delete_for_owner(self, owner_uid: str, property_id: str) -> bool:
        client = get_firestore_client()
        if client is None:
            current = _FALLBACK_PROPERTIES.get(property_id)
            if current is None or current.get("owner_uid") != owner_uid:
                return False
            _FALLBACK_PROPERTIES.pop(property_id)
            return True

        ref = client.collection("properties").document(property_id)
        doc = ref.get()
        if not doc.exists:
            return False
        if doc.to_dict().get("owner_uid") != owner_uid:
            return False
        ref.delete()
        return True

    def list_pending(self) -> List[PropertyCard]:
        client = get_firestore_client()
        if client is None:
            return [self._to_card(dict(item)) for item in _FALLBACK_PROPERTIES.values() if item.get("approval_status") == "pending"]

        docs = client.collection("properties").where("approval_status", "==", "pending").stream()
        return [self._to_card(doc.to_dict()) for doc in docs]

    def set_moderation_state(
        self,
        property_id: str,
        approval_status: Optional[str] = None,
        visibility_status: Optional[str] = None,
        featured: Optional[bool] = None,
    ) -> Optional[PropertyCard]:
        client = get_firestore_client()
        if client is None:
            current = _FALLBACK_PROPERTIES.get(property_id)
            if current is None:
                return None
            if approval_status is not None:
                current["approval_status"] = approval_status
            if visibility_status is not None:
                current["visibility_status"] = visibility_status
            if featured is not None:
                current["featured"] = featured
            current["updated_at"] = self._now_iso()
            _FALLBACK_PROPERTIES[property_id] = current
            return self._to_card(dict(current))

        doc_ref = client.collection("properties").document(property_id)
        doc = doc_ref.get()
        if not doc.exists:
            return None

        patch: Dict[str, Any] = {"updated_at": self._now_iso()}
        if approval_status is not None:
            patch["approval_status"] = approval_status
        if visibility_status is not None:
            patch["visibility_status"] = visibility_status
        if featured is not None:
            patch["featured"] = featured
        doc_ref.update(patch)

        current = doc.to_dict()
        current.update(patch)
        return self._to_card(current)

    def list_all(self) -> List[PropertyCard]:
        client = get_firestore_client()
        if client is None:
            return [self._to_card(dict(item)) for item in _FALLBACK_PROPERTIES.values()]

        docs = client.collection("properties").stream()
        return [self._to_card(doc.to_dict()) for doc in docs]

    def delete_property(self, property_id: str) -> bool:
        client = get_firestore_client()
        if client is None:
            if property_id in _FALLBACK_PROPERTIES:
                _FALLBACK_PROPERTIES.pop(property_id)
                return True
            return False

        ref = client.collection("properties").document(property_id)
        if not ref.get().exists:
            return False
        ref.delete()
        return True

    def count_all(self) -> int:
        client = get_firestore_client()
        if client is None:
            return len(_FALLBACK_PROPERTIES)
        return len(list(client.collection("properties").stream()))
