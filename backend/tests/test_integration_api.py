def test_provider_status_requires_admin(client):
    response = client.get("/api/v1/integrations/api-football/status")

    assert response.status_code == 401


def test_provider_sync_is_accepted(client, admin_headers):
    response = client.post(
        "/api/v1/integrations/api-football/sync",
        headers=admin_headers,
        json={"scope": "live", "leagueIds": ["lg-pl"]},
    )

    assert response.status_code == 202
    assert response.json()["provider"] == "API_FOOTBALL"
    assert response.json()["status"] == "QUEUED"
