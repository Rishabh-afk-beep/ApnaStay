from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.deps import get_current_user
from app.models.schemas.upload import ImageUploadResponse
from app.models.schemas.user import UserProfile
from app.services.upload_service import upload_image

router = APIRouter()


@router.post("/photo")
async def upload_image_endpoint(
    file: UploadFile = File(...),
    user: Annotated[UserProfile, None] = Depends(get_current_user),
) -> ImageUploadResponse:
    return await upload_image(file)
