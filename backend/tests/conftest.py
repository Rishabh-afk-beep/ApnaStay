import os
import pytest
from fastapi.testclient import TestClient

# Force offline/in-memory mode before importing app so tests never touch production Firestore
os.environ["ENVIRONMENT"] = "test"
os.environ["APP_ENV"] = "test"
os.environ["FIREBASE_PROJECT_ID"] = "test-project"
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = ""
os.environ["FIREBASE_SERVICE_ACCOUNT_B64"] = ""
os.environ["DEV_AUTH_ENABLED"] = "true"
os.environ["REDIS_URL"] = ""

from app.core.config import get_settings
get_settings.cache_clear()

from app.main import app
from app.services.cache_service import CacheService


@pytest.fixture(autouse=True)
def reset_cache():
    CacheService().clear_all()
    yield
    CacheService().clear_all()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
