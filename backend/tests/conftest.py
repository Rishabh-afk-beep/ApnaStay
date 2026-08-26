import pytest
from fastapi.testclient import TestClient
from app.main import app
import os

@pytest.fixture(scope="session", autouse=True)
def set_env():
    # Make sure we don't accidentally write to prod
    os.environ["ENVIRONMENT"] = "test"
    os.environ["FIREBASE_PROJECT_ID"] = "test-project"

@pytest.fixture
def client():
    with TestClient(app) as client:
        yield client
