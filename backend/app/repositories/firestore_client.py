import logging
from typing import Optional

from google.cloud import firestore

logger = logging.getLogger(__name__)

# Global client singleton cache
_firestore_client: Optional[firestore.Client] = None


def get_firestore_client() -> Optional[firestore.Client]:
    global _firestore_client
    if _firestore_client is None:
        try:
            from firebase_admin import firestore as fa_firestore
            _firestore_client = fa_firestore.client()
            logger.info("[Firestore] Successfully initialized global client singleton.")
        except Exception as e:
            logger.error("[Firestore] Failed to initialize global client singleton: %s", e)
            return None
    return _firestore_client
