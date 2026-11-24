import asyncio
import logging

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile

from app.core.config import get_settings
from app.models.schemas.upload import ImageUploadResponse

logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


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


async def upload_image(file: UploadFile, folder: str = "nearmycolleges") -> ImageUploadResponse:
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file received")
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image size exceeds 5MB limit")

    if not _configure_cloudinary():
        logger.warning("Cloudinary not configured — returning placeholder")
        return ImageUploadResponse(
            url=f"https://placehold.co/800x600/f59e0b/ffffff?text={file.filename or 'image'}",
            public_id=f"dev/{file.filename or 'placeholder'}",
            width=800,
            height=600,
            format="png",
        )

    logger.info("Uploading %s (%d bytes) to Cloudinary...", file.filename, len(contents))

    try:
        # Run blocking SDK upload in a thread pool so the asyncio event loop stays responsive
        result = await asyncio.to_thread(
            cloudinary.uploader.upload,
            contents,
            folder=folder,
            resource_type="image",
            transformation=[
                {"width": 1200, "height": 900, "crop": "limit", "quality": "auto"},
            ],
        )
        logger.info("Upload success: %s", result.get("public_id"))
        return ImageUploadResponse(
            url=result["secure_url"],
            public_id=result["public_id"],
            width=result["width"],
            height=result["height"],
            format=result["format"],
        )
    except Exception as e:
        error_msg = str(e)
        logger.error("Cloudinary upload FAILED: %s", error_msg)
        raise HTTPException(
            status_code=500,
            detail=f"Cloudinary error: {error_msg}",
        )
