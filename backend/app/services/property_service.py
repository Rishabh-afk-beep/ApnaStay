import math
from typing import List, Optional

from app.models.schemas.property import PropertyCard, PropertySearchQuery
from app.repositories.college_repository import CollegeRepository
from app.repositories.property_repository import PropertyRepository


class PropertyService:
    def __init__(self) -> None:
        self.property_repo = PropertyRepository()
        self.college_repo = CollegeRepository()

    @staticmethod
    def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        r = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(d_lon / 2) ** 2
        )
        return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    def search(self, query: PropertySearchQuery) -> tuple[List[PropertyCard], int]:
        """Returns (paginated items, total count before pagination)."""

        # ── Global search (no college selected) ───────────────────────────────
        if not query.college_id:
            items = self.property_repo.search_all_live(
                property_type=query.property_type,
                gender=query.gender,
            )
            filtered = []
            for item in items:
                if query.budget_min is not None and item.rent_max < query.budget_min:
                    continue
                if query.budget_max is not None and item.rent_min > query.budget_max:
                    continue
                if query.amenities and not set(query.amenities).issubset(set(item.amenities)):
                    continue
                if query.availability_status and item.availability_status != query.availability_status:
                    continue
                filtered.append(item)

            # Sort (no distance available without college)
            if query.sort == "lowest_price":
                filtered.sort(key=lambda x: x.rent_min)
            elif query.sort == "highest_rated":
                filtered.sort(key=lambda x: x.rating_avg, reverse=True)
            elif query.sort == "popular":
                filtered.sort(key=lambda x: x.review_count + x.rating_count, reverse=True)
            else:
                # Default: newest first
                filtered.sort(key=lambda x: x.created_at or "", reverse=True)

            total = len(filtered)
            start = (query.page - 1) * query.limit
            end = start + query.limit
            return filtered[start:end], total

        # ── College-specific search ────────────────────────────────────────────
        colleges = self.college_repo.list_active()
        college = next((c for c in colleges if c.college_id == query.college_id), None)
        if college is None:
            return [], 0

        items = self.property_repo.search_live(query.college_id, query.property_type, query.gender)

        filtered = []
        for item in items:
            distance = self._haversine_km(college.latitude, college.longitude, item.latitude, item.longitude)
            if distance > query.radius_km:
                continue

            if query.budget_min is not None and item.rent_max < query.budget_min:
                continue
            if query.budget_max is not None and item.rent_min > query.budget_max:
                continue
            if query.amenities and not set(query.amenities).issubset(set(item.amenities)):
                continue
            if query.availability_status and item.availability_status != query.availability_status:
                continue

            item.distance_km = round(distance, 2)
            filtered.append(item)

        if query.sort == "lowest_price":
            filtered.sort(key=lambda x: x.rent_min)
        elif query.sort == "newest":
            filtered.sort(key=lambda x: x.created_at or "", reverse=True)
        elif query.sort == "highest_rated":
            filtered.sort(key=lambda x: x.rating_avg, reverse=True)
        elif query.sort == "popular":
            filtered.sort(key=lambda x: x.review_count + x.rating_count, reverse=True)
        else:
            filtered.sort(key=lambda x: x.distance_km or 9999)

        total = len(filtered)
        start = (query.page - 1) * query.limit
        end = start + query.limit
        return filtered[start:end], total
