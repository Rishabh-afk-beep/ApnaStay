import math
from typing import List

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

    @staticmethod
    def _matches_common_filters(item: PropertyCard, query: PropertySearchQuery) -> bool:
        if query.budget_min is not None and item.rent_max < query.budget_min:
            return False
        if query.budget_max is not None and item.rent_min > query.budget_max:
            return False
        if query.amenities and not set(query.amenities).issubset(set(item.amenities)):
            return False
        if query.availability_status and item.availability_status != query.availability_status:
            return False
        return True

    @staticmethod
    def _sort_items(items: List[PropertyCard], sort_by: str, default_nearest: bool = False) -> None:
        if sort_by == "lowest_price":
            items.sort(key=lambda x: x.rent_min)
        elif sort_by == "highest_rated":
            items.sort(key=lambda x: x.rating_avg, reverse=True)
        elif sort_by == "popular":
            items.sort(key=lambda x: x.review_count + x.rating_count, reverse=True)
        elif sort_by == "nearest" or (default_nearest and sort_by != "newest"):
            items.sort(key=lambda x: x.distance_km if x.distance_km is not None else 9999)
        else:
            items.sort(key=lambda x: x.created_at or "", reverse=True)

    def search(self, query: PropertySearchQuery) -> tuple[List[PropertyCard], int]:
        """Returns (paginated items, total count before pagination)."""
        if not query.college_id:
            items = self.property_repo.search_all_live(
                property_type=query.property_type,
                gender=query.gender,
            )
            filtered = [item for item in items if self._matches_common_filters(item, query)]
            self._sort_items(filtered, query.sort, default_nearest=False)

            total = len(filtered)
            start = (query.page - 1) * query.limit
            return filtered[start : start + query.limit], total

        # Single document lookup instead of scanning every active college
        college = self.college_repo.get_by_id(query.college_id)
        if college is None or college.status != "active":
            return [], 0

        items = self.property_repo.search_live(query.college_id, query.property_type, query.gender)

        filtered: List[PropertyCard] = []
        for item in items:
            if not (item.latitude == 0.0 and item.longitude == 0.0):
                distance = self._haversine_km(college.latitude, college.longitude, item.latitude, item.longitude)
                if distance > query.radius_km:
                    continue
                item.distance_km = round(distance, 2)
            elif query.radius_km < 9999:
                # If coords aren't set and user filtered by strict radius, skip
                continue

            if not self._matches_common_filters(item, query):
                continue
            filtered.append(item)

        self._sort_items(filtered, query.sort, default_nearest=True)

        total = len(filtered)
        start = (query.page - 1) * query.limit
        return filtered[start : start + query.limit], total
