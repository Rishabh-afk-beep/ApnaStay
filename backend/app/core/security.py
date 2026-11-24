from typing import Any, Dict

import jwt
from fastapi import HTTPException, status
from firebase_admin import auth

from app.core.config import get_settings


def verify_firebase_token(token: str) -> Dict[str, Any]:
    settings = get_settings()

    if settings.dev_auth_enabled:
        try:
            header = jwt.get_unverified_header(token)
        except Exception:
            header = {}
        if header.get("alg") == "HS256":
            try:
                payload = jwt.decode(token, settings.dev_auth_secret, algorithms=["HS256"])
                if not payload.get("uid") or not payload.get("role"):
                    raise ValueError("missing uid or role")
                return payload
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={"code": "AUTH_INVALID_TOKEN", "message": "Invalid or expired token"},
                ) from exc

    try:
        return auth.verify_id_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_INVALID_TOKEN", "message": "Invalid or expired token"},
        ) from exc
