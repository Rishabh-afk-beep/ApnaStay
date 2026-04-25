import cloudinary
import cloudinary.uploader
from fastapi import UploadFile

from app.core.config import get_settings
from app.models.schemas.upload import ImageUploadResponse


def _configure_cloudinary() -> bool:
    settings = get_settings()
    if not settings.cloudinary_cloud_name:
        return False
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )
    return True


async def upload_image(file: UploadFile, folder: str = "apnastay") -> ImageUploadResponse:
    if not _configure_cloudinary():
        # Return a placeholder when Cloudinary is not configured
        return ImageUploadResponse(
            url=f"https://placehold.co/800x600/f59e0b/ffffff?text={file.filename or 'image'}",
            public_id=f"dev/{file.filename or 'placeholder'}",
            width=800,
            height=600,
            format="png",
        )

    contents = await file.read()
    result = cloudinary.uploader.upload(
        contents,
        folder=folder,
        resource_type="image",
        transformation=[
            {"width": 1200, "height": 900, "crop": "limit", "quality": "auto"},
        ],
    )
    return ImageUploadResponse(
        url=result["secure_url"],
        public_id=result["public_id"],
        width=result["width"],
        height=result["height"],
        format=result["format"],
    )
