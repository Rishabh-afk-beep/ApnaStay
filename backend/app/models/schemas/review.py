from typing import Optional

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None
    stay_status: str = "self_declared"


class ReviewOut(BaseModel):
    review_id: str
    property_id: str
    user_uid: str
    user_name: str = "Verified Student"
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    stay_status: str
    moderation_status: str = "visible"
    created_at: str
