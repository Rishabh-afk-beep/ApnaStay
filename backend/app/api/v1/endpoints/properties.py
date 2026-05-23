from fastapi import APIRouter, Query, HTTPException, status

from app.models.schemas.common import PaginatedResponse
from app.models.schemas.property import PropertyCard, PropertyDetail, PropertySearchQuery
from app.repositories.property_repository import PropertyRepository
from app.services.property_service import PropertyService

router = APIRouter()
service = PropertyService()
repo = PropertyRepository()


@router.get("/search")
def search_properties(
    college_id: str,
    radius_km: float = 2.0,
    property_type: str | None = None,
    gender: str | None = None,
    budget_min: int | None = None,
    budget_max: int | None = None,
    availability_status: str | None = None,
    amenities: list[str] = Query(default=[]),
    sort: str = "nearest",
    page: int = 1,
    limit: int = 20,
) -> PaginatedResponse[PropertyCard]:
    query = PropertySearchQuery(
        college_id=college_id,
        radius_km=radius_km,
        property_type=property_type,
        gender=gender,
        budget_min=budget_min,
        budget_max=budget_max,
        availability_status=availability_status,
        amenities=amenities,
        sort=sort,
        page=page,
        limit=limit,
    )
    items, total = service.search(query)
    return PaginatedResponse[PropertyCard](items=items, page=page, limit=limit, total=total)


@router.get("/{property_id}")
def get_property_detail(property_id: str) -> PropertyDetail:
    item = repo.get_detail(property_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PROPERTY_NOT_FOUND", "message": "Property not found"},
        )
    return item
