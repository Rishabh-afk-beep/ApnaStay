from fastapi.testclient import TestClient

def test_health_check(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data

def test_list_colleges(client: TestClient):
    response = client.get("/api/v1/colleges")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # The fallback list contains at least bits-hyderabad
    if len(data) > 0:
        assert "college_id" in data[0]
        assert "name" in data[0]
