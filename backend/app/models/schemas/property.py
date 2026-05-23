from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class RoomOption(BaseModel):
    option_id: str = ""
    label: str  # single, 2-sharing, 3-sharing
    price: int
    deposit: Optional[int] = None
    available_count: int = 0
    status: str = "available"


class PropertyMetadata(BaseModel):
    # PG fields
    gender: Optional[str] = None
    mess_timing: Optional[str] = None
    gate_timing: Optional[str] = None
    warden_contact: Optional[str] = None
    # Flat fields
    bhk_type: Optional[str] = None
    furnishing: Optional[str] = None
    floor: Optional[int] = None
    lift: Optional[bool] = None
    society_name: Optional[str] = None
    # Shop fields
    size_sqft: Optional[int] = None
    allowed_use_type: Optional[str] = None
    maintenance_charge: Optional[int] = None
    # Hostel fields
    total_capacity: Optional[int] = None
    study_hall: Optional[bool] = None
    curfew_time: Optional[str] = None
    warden_on_site: Optional[bool] = None
    # Single Room fields
    bathroom_type: Optional[str] = None
    kitchen_access: Optional[bool] = None
    furnished: Optional[str] = None
    # Co-living fields
    community_events: Optional[bool] = None
    coworking: Optional[bool] = None
    min_stay_duration: Optional[str] = None


class PropertyCard(BaseModel):
    property_id: str
    owner_uid: Optional[str] = None
    title: str
    property_type: str
    primary_college_id: str
    address_text: Optional[str] = None
    rent_min: int
    rent_max: int
    security_deposit: int
    amenities: List[str] = Field(default_factory=list)
    rating_avg: float = 0.0
    rating_count: int = 0
    review_count: int = 0
    availability_status: str = "available"
    approval_status: str = "pending"
    visibility_status: str = "hidden"
    featured: bool = False
    cover_image_url: Optional[str] = None
    image_urls: List[str] = Field(default_factory=list)
    latitude: float
    longitude: float
    distance_km: Optional[float] = None
    gender: Optional[str] = None
    food_available: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class PropertyDetail(PropertyCard):
    description: Optional[str] = None
    food_menu: Optional[str] = None
    rules: Optional[str] = None
    published_at: Optional[str] = None
    room_options: List[RoomOption] = Field(default_factory=list)
    metadata: Optional[PropertyMetadata] = None
    college_ids: List[str] = Field(default_factory=list)


class PropertySearchQuery(BaseModel):
    college_id: str
    radius_km: float = 2.0
    property_type: Optional[str] = None
    gender: Optional[str] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    availability_status: Optional[str] = None
    amenities: List[str] = Field(default_factory=list)
    sort: str = "nearest"
    page: int = 1
    limit: int = 20


class OwnerPropertyCreate(BaseModel):
    title: str
    property_type: str
    primary_college_id: str
    description: Optional[str] = None
    address_text: str
    latitude: float
    longitude: float
    rent_min: int
    rent_max: int
    security_deposit: int
    amenities: List[str] = Field(default_factory=list)
    gender: Optional[str] = None
    food_available: bool = False
    food_menu: Optional[str] = None
    rules: Optional[str] = None
    image_urls: List[str] = Field(default_factory=list)
    cover_image_url: Optional[str] = None
    room_options: List[RoomOption] = Field(default_factory=list)
    metadata: Optional[PropertyMetadata] = None


class OwnerPropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    address_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rent_min: Optional[int] = None
    rent_max: Optional[int] = None
    security_deposit: Optional[int] = None
    amenities: Optional[List[str]] = None
    availability_status: Optional[str] = None
    visibility_status: Optional[str] = None
    gender: Optional[str] = None
    food_available: Optional[bool] = None
    food_menu: Optional[str] = None
    rules: Optional[str] = None
    image_urls: Optional[List[str]] = None
    cover_image_url: Optional[str] = None
    room_options: Optional[List[RoomOption]] = None
    metadata: Optional[PropertyMetadata] = None
