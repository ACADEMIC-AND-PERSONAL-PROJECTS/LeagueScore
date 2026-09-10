def test_admin_endpoints_require_authentication(client):
    response = client.post(
        "/api/v1/leagues",
        json={"name": "Serie A", "country": "Italy", "logo": "🇮🇹"},
    )

    assert response.status_code == 401


def test_admin_can_create_league_and_duplicate_is_rejected(client, admin_headers):
    payload = {"name": "Serie A", "country": "Italy", "logo": "🇮🇹"}

    created = client.post("/api/v1/leagues", json=payload, headers=admin_headers)
    duplicate = client.post("/api/v1/leagues", json=payload, headers=admin_headers)

    assert created.status_code == 201
    assert created.json()["name"] == "Serie A"
    assert duplicate.status_code == 409


def test_admin_can_schedule_match(client, admin_headers):
    response = client.post(
        "/api/v1/matches",
        headers=admin_headers,
        json={
            "leagueId": "lg-pl",
            "seasonId": "sn-pl-26",
            "homeTeamId": "tm-ars",
            "awayTeamId": "tm-che",
            "kickoff": "2026-09-20T20:00:00Z",
        },
    )

    assert response.status_code == 201
    assert response.json()["status"] == "SCHEDULED"


def test_invalid_team_pairing_is_rejected(client, admin_headers):
    response = client.post(
        "/api/v1/matches",
        headers=admin_headers,
        json={
            "leagueId": "lg-pl",
            "seasonId": "sn-pl-26",
            "homeTeamId": "tm-ars",
            "awayTeamId": "tm-rma",
            "kickoff": "2026-09-20T20:00:00Z",
        },
    )

    assert response.status_code == 400
