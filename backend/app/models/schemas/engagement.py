from typing import List, Optional

from pydantic import BaseModel, Field


class InquiryCreate(BaseModel):
    name: str
    phone: str
    message: Optional[str] = None
    source: str = "listing_page"


class InquiryOut(BaseModel):
    inquiry_id: str
    property_id: str
    owner_uid: Optional[str] = None
    student_uid: Optional[str] = None
    name: str
    phone: str
    message: Optional[str] = None
    source: str
    created_at: str


class AdminInquiryOut(BaseModel):
    inquiry_id: str
    property_id: str
    property_title: str
    owner_uid: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    student_uid: Optional[str] = None
    name: str
    phone: str
    message: Optional[str] = None
    source: str
    created_at: str


class ShortlistOut(BaseModel):
    user_uid: str
    property_id: str
    created_at: str


class RecentViewOut(BaseModel):
    user_uid: str
    property_id: str
    viewed_at: str


class AlertCreate(BaseModel):
    college_id: str
    property_type: Optional[str] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    radius_km: float = 2.0
    gender: Optional[str] = None
    amenities: List[str] = Field(default_factory=list)
    active: bool = True


class AlertUpdate(BaseModel):
    property_type: Optional[str] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    radius_km: Optional[float] = None
    gender: Optional[str] = None
    amenities: Optional[List[str]] = None
    active: Optional[bool] = None


class AlertOut(BaseModel):
    alert_id: str
    user_uid: str
    college_id: str
    property_type: Optional[str] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    radius_km: float
    gender: Optional[str] = None
    amenities: List[str] = Field(default_factory=list)
    active: bool = True
    created_at: str
    updated_at: str
