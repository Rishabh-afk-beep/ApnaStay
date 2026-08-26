from fastapi import APIRouter

from app.api.v1.endpoints import admin, auth, colleges, engagement, health, me, owner_properties, properties, reviews, upload

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(me.router, prefix="/me", tags=["me"])
api_router.include_router(colleges.router, prefix="/colleges", tags=["colleges"])
api_router.include_router(properties.router, prefix="/properties", tags=["properties"])
api_router.include_router(reviews.router, prefix="/properties", tags=["reviews"])
api_router.include_router(engagement.router, tags=["engagement"])
api_router.include_router(owner_properties.router, prefix="/owner/properties", tags=["owner-properties"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(upload.router, prefix="/media", tags=["media"])
