import httpx

from backend.api_football import ApiFootballClient, ApiFootballConfig, ApiFootballError
from backend.store import MockStore
from backend.sync_service import SyncService


def test_client_sends_api_key_and_returns_fixtures():
    def handler(request: httpx.Request):
        assert request.headers["x-apisports-key"] == "test-key"
        assert request.url.path == "/fixtures"
        assert request.url.params["live"] == "all"
        return httpx.Response(200, json={"errors": {}, "response": [{"fixture": {"id": 1}}]})

    client = ApiFootballClient(
        ApiFootballConfig(api_key="test-key", base_url="https://provider.test"),
        httpx.Client(transport=httpx.MockTransport(handler)),
    )

    assert client.fixtures(live=True) == [{"fixture": {"id": 1}}]


def test_client_rejects_missing_key():
    client = ApiFootballClient(ApiFootballConfig(api_key=None))

    try:
        client.fixtures()
    except ApiFootballError as error:
        assert "not configured" in str(error)
    else:
        raise AssertionError("Expected missing-key error")


def test_sync_replaces_seeded_read_model_with_provider_fixture():
    fixture = {
        "fixture": {
            "id": 987,
            "date": "2026-09-10T18:00:00+00:00",
            "status": {"short": "1H", "elapsed": 22},
        },
        "league": {"id": 39, "name": "Premier League", "country": "England", "logo": "logo", "season": 2026},
        "season": {"year": 2026},
        "teams": {
            "home": {"id": 10, "name": "Home FC", "logo": "home"},
            "away": {"id": 20, "name": "Away FC", "logo": "away"},
        },
        "goals": {"home": 1, "away": 0},
    }

    class Provider:
        def fixtures(self, *, live=False):
            return [fixture]

        def fixture_events(self, fixture_id):
            return []

    store = MockStore.seeded()
    imported = SyncService(store, Provider()).sync()

    assert imported == 1
    assert list(store.matches) == ["af-987"]
    assert store.matches["af-987"].status.value == "LIVE"
