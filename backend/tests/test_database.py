from backend.database import SQLAlchemyStore
from backend.app import create_app
from backend.models import League
from fastapi.testclient import TestClient


def test_sqlalchemy_store_persists_domain_records(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'leaguescore.db'}"
    first = SQLAlchemyStore(database_url=database_url)
    first.leagues["lg-test"] = League(
        id="lg-test",
        name="Test League",
        country="Testland",
        logo="test-logo",
    )
    first.flush()

    second = SQLAlchemyStore(database_url=database_url, seed=False)
    assert second.leagues["lg-test"].name == "Test League"


def test_sqlalchemy_store_can_start_empty(tmp_path):
    store = SQLAlchemyStore(
        database_url=f"sqlite:///{tmp_path / 'empty.db'}",
        seed=False,
    )

    assert len(store.matches) == 0
    assert len(store.leagues) == 0


def test_api_writes_are_flushed_to_sqlalchemy_store(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'api.db'}"
    store = SQLAlchemyStore(database_url=database_url)
    with TestClient(create_app(store=store)) as client:
        token = client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": "admin"},
        ).json()["token"]
        response = client.post(
            "/api/v1/leagues",
            headers={"Authorization": f"Bearer {token}"},
            json={"name": "Persistent League", "country": "Testland", "logo": "🏆"},
        )

    assert response.status_code == 201
    reopened = SQLAlchemyStore(database_url=database_url, seed=False)
    assert any(item.name == "Persistent League" for item in reopened.leagues.values())
