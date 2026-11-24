from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.deps import get_current_user
from app.core.rbac import require_roles
from app.models.schemas.upload import ImageUploadResponse
from app.models.schemas.user import UserProfile, UserRole
from app.services.upload_service import upload_image

router = APIRouter()


@router.post("/photo")
async def upload_image_endpoint(
    user: Annotated[UserProfile, Depends(get_current_user)],
    file: UploadFile = File(...),
) -> ImageUploadResponse:
    require_roles(user.role.value, {UserRole.owner.value, UserRole.admin.value})
    return await upload_image(file)
