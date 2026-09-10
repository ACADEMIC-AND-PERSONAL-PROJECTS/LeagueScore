import pytest
from fastapi.testclient import TestClient

from backend.app import create_app
from backend.store import MockStore


@pytest.fixture
def client():
    app = create_app(store=MockStore.seeded())
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def admin_headers(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin"},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['token']}"}
