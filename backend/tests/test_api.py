from datetime import datetime, timedelta, timezone
import jwt
from fastapi.testclient import TestClient

from app.core.config import get_settings


def _dev_token(uid: str, role: str, email: str | None = None, name: str | None = None) -> str:
    settings = get_settings()
    payload = {
        "uid": uid,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    if email:
        payload["email"] = email
    if name:
        payload["name"] = name
    return jwt.encode(payload, settings.dev_auth_secret, algorithm="HS256")


def test_health_check(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "timestamp" in data


def test_public_stats(client: TestClient):
    response = client.get("/api/v1/health/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["verified_listings"] >= 1
    assert data["colleges_covered"] >= 1


def test_list_colleges(client: TestClient):
    response = client.get("/api/v1/colleges")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "college_id" in data[0]
    assert "name" in data[0]


def test_search_properties_global_and_college(client: TestClient):
    res_all = client.get("/api/v1/properties/search")
    assert res_all.status_code == 200
    assert res_all.json()["total"] >= 3

    res_college = client.get("/api/v1/properties/search", params={"college_id": "sample-college-1", "radius_km": 5})
    assert res_college.status_code == 200
    assert res_college.json()["total"] >= 1


def test_property_detail_redacts_owner_contact_for_guests(client: TestClient):
    owner_token = _dev_token("owner_demo", "owner", "owner@nearmycolleges.in", "Owner Demo")
    create_res = client.post(
        "/api/v1/owner/properties",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={
            "title": "Test Contact PG",
            "property_type": "pg",
            "primary_college_id": "sample-college-1",
            "address_text": "123 Campus Lane",
            "latitude": 17.386,
            "longitude": 78.487,
            "rent_min": 6000,
            "rent_max": 8000,
            "security_deposit": 5000,
            "owner_contact": "9876543210",
            "owner_whatsapp": "9876543210",
        },
    )
    assert create_res.status_code == 200
    prop_id = create_res.json()["property_id"]

    # Hidden before approval: guest gets 404, owner gets full detail
    assert client.get(f"/api/v1/properties/{prop_id}").status_code == 404
    assert client.get(
        f"/api/v1/properties/{prop_id}",
        headers={"Authorization": f"Bearer {owner_token}"},
    ).status_code == 200

    # Approve via admin
    admin_token = _dev_token("admin_demo", "admin", "admin@nearmycolleges.in", "Admin User")
    approve_res = client.patch(
        f"/api/v1/admin/properties/{prop_id}/approve",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert approve_res.status_code == 200

    # Guest can view approved property, but phone numbers are redacted
    guest_res = client.get(f"/api/v1/properties/{prop_id}")
    assert guest_res.status_code == 200
    assert guest_res.json()["owner_contact"] is None
    assert guest_res.json()["owner_whatsapp"] is None

    # Logged-in student sees contact numbers
    student_token = _dev_token("student_demo", "student", "student@nearmycolleges.in", "Student Demo")
    authed_res = client.get(
        f"/api/v1/properties/{prop_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert authed_res.status_code == 200
    assert authed_res.json()["owner_contact"] == "9876543210"


def test_owner_cannot_bypass_moderation_visibility(client: TestClient):
    owner_token = _dev_token("owner_demo", "owner", "owner@nearmycolleges.in", "Owner Demo")
    create_res = client.post(
        "/api/v1/owner/properties",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={
            "title": "Pending Bypass Test PG",
            "property_type": "pg",
            "primary_college_id": "sample-college-1",
            "address_text": "456 Campus Lane",
            "latitude": 17.386,
            "longitude": 78.487,
            "rent_min": 6000,
            "rent_max": 8000,
            "security_deposit": 5000,
        },
    )
    assert create_res.status_code == 200
    prop_id = create_res.json()["property_id"]

    patch_res = client.patch(
        f"/api/v1/owner/properties/{prop_id}",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"visibility_status": "live", "title": "Updated Pending PG"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Updated Pending PG"
    assert patch_res.json()["visibility_status"] == "hidden"


def test_review_updates_property_rating_and_user_name(client: TestClient):
    student_token = _dev_token("student_demo", "student", "student@nearmycolleges.in", "Student Demo")
    review_res = client.post(
        "/api/v1/properties/p1/reviews",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"rating": 5, "comment": "Great place!"},
    )
    assert review_res.status_code == 200
    assert review_res.json()["user_name"] == "Student Demo"

    detail_res = client.get("/api/v1/properties/p1")
    assert detail_res.status_code == 200
    assert detail_res.json()["review_count"] == 1
    assert detail_res.json()["rating_avg"] == 5.0


def test_blocked_user_is_rejected(client: TestClient):
    admin_token = _dev_token("admin_demo", "admin", "admin@nearmycolleges.in", "Admin User")
    block_res = client.patch(
        "/api/v1/admin/users/student_demo/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "blocked", "reason": "Spam"},
    )
    assert block_res.status_code == 200

    student_token = _dev_token("student_demo", "student", "student@nearmycolleges.in", "Student Demo")
    me_res = client.get("/api/v1/me", headers={"Authorization": f"Bearer {student_token}"})
    assert me_res.status_code == 403

    # Restore student status for isolation
    client.patch(
        "/api/v1/admin/users/student_demo/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "active"},
    )


def test_warm_endpoint_and_swr_cache(client: TestClient):
    warm_res = client.get("/api/v1/health/warm")
    assert warm_res.status_code == 200
    warm_data = warm_res.json()
    assert warm_data["status"] == "ok"
    assert warm_data["warmed"]["stats"] is True
    assert warm_data["warmed"]["colleges"] is True
    assert warm_data["warmed"]["search"] is True

    stats_res = client.get("/api/v1/health/stats")
    assert stats_res.status_code == 200
    assert "stale-while-revalidate" in stats_res.headers.get("cache-control", "")

    from app.services.cache_service import CacheService

    calls = 0

    def _loader():
        nonlocal calls
        calls += 1
        return {"count": calls}

    cache = CacheService()
    cache.delete("test:swr:key")
    first = cache.get_swr("test:swr:key", _loader, fresh_ttl=60, stale_ttl=300)
    second = cache.get_swr("test:swr:key", _loader, fresh_ttl=60, stale_ttl=300)
    assert first == {"count": 1}
    assert second == {"count": 1}
    assert calls == 1

    # Inject stale wrapper (fresh_until in the past) — must return stale immediately without blocking
    cache.set("test:swr:key", {"__swr__": True, "fresh_until": 0, "v": {"count": 99}}, ttl=300)
    stale_val = cache.get_swr("test:swr:key", _loader, fresh_ttl=60, stale_ttl=300, background_refresh=False)
    assert stale_val == {"count": 99}
    assert calls == 1
    cache.delete("test:swr:key")
