import base64
import json
import logging
import os
from pathlib import Path

import firebase_admin
from firebase_admin import credentials

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def initialize_firebase() -> None:
    if firebase_admin._apps:
        return

    settings = get_settings()
    cred_path = settings.google_application_credentials.strip()

    try:
        # Option 1: Service account JSON file on disk
        if cred_path and Path(cred_path).exists():
            logger.info("[Firebase] Initializing with service account file: %s", cred_path)
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred, {"projectId": settings.firebase_project_id or None})
            logger.info("[Firebase] Initialized successfully via file.")
            return

        # Option 2: Base64-encoded service account (for Render / cloud deployments)
        b64 = os.getenv("FIREBASE_SERVICE_ACCOUNT_B64", "").strip()
        if b64:
            logger.info("[Firebase] Initializing with Base64 service account (cloud mode).")
            sa_json = json.loads(base64.b64decode(b64).decode("utf-8"))
            cred = credentials.Certificate(sa_json)
            firebase_admin.initialize_app(cred, {"projectId": settings.firebase_project_id or None})
            logger.info("[Firebase] Initialized successfully via B64 secret.")
            return

        # Option 3: Fall back to Application Default Credentials
        logger.warning("[Firebase] No credentials found — falling back to Application Default Credentials.")
        firebase_admin.initialize_app(options={"projectId": settings.firebase_project_id or None})
        logger.info("[Firebase] Initialized via Application Default Credentials.")

    except Exception as e:
        logger.error("[Firebase] Initialization FAILED: %s", e)
        logger.error("[Firebase] Server will start but Firestore operations will fail.")
        # Don't raise — let the server start so logs are visible on Render
