def test_list_leagues(client):
    response = client.get("/api/v1/leagues")

    assert response.status_code == 200
    assert response.json()[0]["id"] == "lg-pl"


def test_live_matches_include_embedded_teams_and_events(client):
    response = client.get("/api/v1/matches/live")

    assert response.status_code == 200
    match = response.json()[0]
    assert match["homeTeam"]["name"] == "Arsenal"
    assert match["awayTeam"]["name"] == "Chelsea"
    assert match["status"] == "LIVE"
    assert match["events"][0]["type"] == "GOAL"


def test_standings_use_finished_matches_and_tiebreakers(client):
    response = client.get("/api/v1/seasons/sn-pl-26/standings")

    assert response.status_code == 200
    rows = response.json()
    assert rows[0]["team"]["name"] == "Liverpool"
    assert rows[0]["points"] == 3
    assert rows[0]["position"] == 1


def test_unknown_match_returns_not_found(client):
    response = client.get("/api/v1/matches/does-not-exist")

    assert response.status_code == 404
    assert response.json()["error"] == "NOT_FOUND"
