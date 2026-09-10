def test_live_event_updates_score_and_is_visible_on_match(client, admin_headers):
    response = client.post(
        "/api/v1/matches/m-1/events",
        headers=admin_headers,
        json={
            "type": "GOAL",
            "minute": 70,
            "side": "home",
            "playerName": "Bukayo Saka",
        },
    )

    assert response.status_code == 201
    match = client.get("/api/v1/matches/m-1").json()
    assert match["homeScore"] == 3
    assert match["events"][-1]["playerName"] == "Bukayo Saka"


def test_event_is_rejected_for_scheduled_match(client, admin_headers):
    response = client.post(
        "/api/v1/matches/m-s1/events",
        headers=admin_headers,
        json={
            "type": "GOAL",
            "minute": 10,
            "side": "home",
            "playerName": "Player",
        },
    )

    assert response.status_code == 409


def test_match_lifecycle_and_standings_refresh(client, admin_headers):
    started = client.post("/api/v1/matches/m-s1/start", headers=admin_headers)
    finished = client.post("/api/v1/matches/m-s1/finish", headers=admin_headers)

    assert started.status_code == 200
    assert started.json()["status"] == "LIVE"
    assert finished.status_code == 200
    assert finished.json()["status"] == "FINISHED"


def test_deleting_goal_rolls_back_score(client, admin_headers):
    created = client.post(
        "/api/v1/matches/m-1/events",
        headers=admin_headers,
        json={
            "type": "GOAL",
            "minute": 71,
            "side": "away",
            "playerName": "Cole Palmer",
        },
    )
    event_id = created.json()["id"]

    deleted = client.delete(
        f"/api/v1/matches/m-1/events/{event_id}",
        headers=admin_headers,
    )

    assert deleted.status_code == 200
    assert deleted.json()["awayScore"] == 1
