import httpx

from backend.api_football import ApiFootballClient, ApiFootballConfig, ApiFootballError


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
