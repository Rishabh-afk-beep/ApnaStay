import logging
from typing import Optional

from google.cloud import firestore

logger = logging.getLogger(__name__)


def get_firestore_client() -> Optional[firestore.Client]:
    try:
        from firebase_admin import firestore as fa_firestore
        return fa_firestore.client()
    except Exception as e:
        logger.error("[Firestore] Failed to get Firestore client from firebase_admin: %s", e)
        return None
