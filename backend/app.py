from datetime import UTC, datetime, timedelta
from typing import Annotated

import jwt
from fastapi import Depends, FastAPI, Header, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from .models import (
    ApiError, EventType, League, LeagueInput, LoginRequest, Match, MatchEvent,
    MatchEventInput, MatchInput, MatchPatch, MatchStatus, Player, PlayerInput,
    Season, SeasonInput, Session, StandingRow, Team, TeamInput,
)
from .store import MockStore

SECRET = "leaguescore-development-secret-key-2026"


def create_app(store: MockStore | None = None) -> FastAPI:
    store = store or MockStore.seeded()
    app = FastAPI(title="LeagueScore API", version="1.0.0")
    app.state.store = store

    @app.exception_handler(HTTPException)
    async def http_error(_, exc: HTTPException):
        message = exc.detail if isinstance(exc.detail, str) else "Request failed"
        names = {400: "VALIDATION_ERROR", 401: "UNAUTHORIZED", 404: "NOT_FOUND", 409: "CONFLICT", 429: "RATE_LIMITED"}
        return JSONResponse(status_code=exc.status_code, content=ApiError(
            error=names.get(exc.status_code, "HTTP_ERROR"), message=message, status=exc.status_code
        ).model_dump())

    def error(status: int, message: str):
        raise HTTPException(status_code=status, detail=message)

    def token_for(username: str) -> str:
        expires = datetime.now(UTC) + timedelta(hours=8)
        token = jwt.encode({"sub": username, "exp": expires}, SECRET, algorithm="HS256")
        store.sessions[token] = (username, expires)
        return token

    def require_admin(authorization: Annotated[str | None, Header()] = None) -> str:
        if not authorization or not authorization.startswith("Bearer "):
            error(401, "Administrator login required.")
        token = authorization.removeprefix("Bearer ")
        try:
            payload = jwt.decode(token, SECRET, algorithms=["HS256"])
            username = payload["sub"]
        except (jwt.PyJWTError, KeyError):
            error(401, "Invalid or expired session.")
        session = store.sessions.get(token)
        if not session or session[0] != username or session[1] <= datetime.now(UTC):
            error(401, "Invalid or expired session.")
        return username

    def league_or_404(league_id: str) -> League:
        if league_id not in store.leagues:
            error(404, "League not found")
        return store.leagues[league_id]

    def season_or_404(season_id: str) -> Season:
        if season_id not in store.seasons:
            error(404, "Season not found")
        return store.seasons[season_id]

    def team_or_404(team_id: str) -> Team:
        if team_id not in store.teams:
            error(404, "Team not found")
        return store.teams[team_id]

    def match_or_404(match_id: str) -> Match:
        if match_id not in store.matches:
            error(404, "Match not found")
        return store.matches[match_id]

    def emit(match: Match, event_type: str, **extra):
        app.state.last_events = getattr(app.state, "last_events", [])
        app.state.last_events.append({"type": event_type, "matchId": match.id, "match": match.model_dump(by_alias=True), **extra})
        app.state.last_events = app.state.last_events[-100:]

    def sorted_events(match: Match):
        match.events.sort(key=lambda event: (event.minute, event.created_at))

    @app.post("/api/v1/auth/login", response_model=Session)
    def login(data: LoginRequest):
        user = store.users.get(data.username)
        if not user or user["password"] != data.password or user["role"] != "ADMIN":
            error(401, "Invalid credentials.")
        token = token_for(data.username)
        return Session(token=token, username=data.username, expiresAt=store.sessions[token][1])

    @app.post("/api/v1/auth/logout", status_code=204)
    def logout(username: Annotated[str, Depends(require_admin)], authorization: Annotated[str, Header()]):
        store.sessions.pop(authorization.removeprefix("Bearer "), None)

    @app.get("/api/v1/leagues", response_model=list[League])
    def get_leagues():
        return list(store.leagues.values())

    @app.post("/api/v1/leagues", response_model=League, status_code=201)
    def create_league(data: LeagueInput, _: Annotated[str, Depends(require_admin)]):
        if any(item.name.casefold() == data.name.casefold() for item in store.leagues.values()):
            error(409, "A league with this name already exists.")
        league = League(id=store.new_id("lg"), **data.model_dump())
        store.leagues[league.id] = league
        return league

    @app.patch("/api/v1/leagues/{league_id}", response_model=League)
    def update_league(league_id: str, data: LeagueInput, _: Annotated[str, Depends(require_admin)]):
        league = league_or_404(league_id)
        if any(item.id != league_id and item.name.casefold() == data.name.casefold() for item in store.leagues.values()):
            error(409, "A league with this name already exists.")
        league.name, league.country, league.logo = data.name, data.country, data.logo
        return league

    @app.delete("/api/v1/leagues/{league_id}", status_code=204)
    def delete_league(league_id: str, _: Annotated[str, Depends(require_admin)]):
        league_or_404(league_id)
        if any(match.league_id == league_id for match in store.matches.values()):
            error(409, "Cannot delete a league that still has matches.")
        del store.leagues[league_id]
        for season_id in [item.id for item in store.seasons.values() if item.league_id == league_id]:
            del store.seasons[season_id]

    @app.get("/api/v1/leagues/{league_id}/seasons", response_model=list[Season])
    def get_seasons(league_id: str):
        league_or_404(league_id)
        return [item for item in store.seasons.values() if item.league_id == league_id]

    @app.post("/api/v1/leagues/{league_id}/seasons", response_model=Season, status_code=201)
    def create_season(league_id: str, data: SeasonInput, _: Annotated[str, Depends(require_admin)]):
        league_or_404(league_id)
        if data.league_id != league_id:
            error(400, "Season leagueId does not match the path.")
        if any(item.league_id == league_id and item.label == data.label for item in store.seasons.values()):
            error(409, "A season with this label already exists.")
        if data.is_current:
            for item in store.seasons.values():
                if item.league_id == league_id:
                    item.is_current = False
        season = Season(id=store.new_id("sn"), **data.model_dump())
        store.seasons[season.id] = season
        return season

    @app.get("/api/v1/seasons/{season_id}/teams", response_model=list[Team])
    def get_season_teams(season_id: str):
        season = season_or_404(season_id)
        league = league_or_404(season.league_id)
        return [team for team in store.teams.values() if team.country == league.country]

    @app.get("/api/v1/seasons/{season_id}/matches", response_model=list[Match])
    def get_season_matches(season_id: str, status: list[MatchStatus] | None = Query(default=None)):
        season_or_404(season_id)
        matches = [match for match in store.matches.values() if match.season_id == season_id]
        if status:
            matches = [match for match in matches if match.status in status]
        return sorted(matches, key=lambda match: match.kickoff)

    @app.get("/api/v1/seasons/{season_id}/standings", response_model=list[StandingRow])
    def get_standings(season_id: str):
        season = season_or_404(season_id)
        league = league_or_404(season.league_id)
        table = {team.id: {"team": team, "played": 0, "won": 0, "drawn": 0, "lost": 0, "goalsFor": 0, "goalsAgainst": 0, "points": 0}
                 for team in store.teams.values() if team.country == league.country}
        for match in store.matches.values():
            if match.season_id != season_id or match.status != MatchStatus.FINISHED:
                continue
            for team_id, goals_for, goals_against in (
                (match.home_team.id, match.home_score, match.away_score),
                (match.away_team.id, match.away_score, match.home_score),
            ):
                row = table[team_id]
                row["played"] += 1
                row["goalsFor"] += goals_for
                row["goalsAgainst"] += goals_against
                if goals_for > goals_against:
                    row["won"] += 1
                    row["points"] += 3
                elif goals_for == goals_against:
                    row["drawn"] += 1
                    row["points"] += 1
                else:
                    row["lost"] += 1
        rows = []
        for row in table.values():
            row["goalDifference"] = row["goalsFor"] - row["goalsAgainst"]
            rows.append(row)
        rows.sort(key=lambda row: (-row["points"], -row["goalDifference"], -row["goalsFor"], row["team"].name))
        return [StandingRow(position=index, **row) for index, row in enumerate(rows, 1)]

    @app.get("/api/v1/matches/live", response_model=list[Match])
    def get_live_matches():
        return [match for match in store.matches.values() if match.status in (MatchStatus.LIVE, MatchStatus.HALF_TIME)]

    @app.get("/api/v1/matches/upcoming", response_model=list[Match])
    def get_upcoming_matches():
        return sorted((match for match in store.matches.values() if match.status in (MatchStatus.SCHEDULED, MatchStatus.POSTPONED)), key=lambda match: match.kickoff)

    @app.get("/api/v1/matches/recent", response_model=list[Match])
    def get_recent_matches():
        return sorted((match for match in store.matches.values() if match.status == MatchStatus.FINISHED), key=lambda match: match.kickoff, reverse=True)

    @app.get("/api/v1/matches/{match_id}", response_model=Match)
    def get_match(match_id: str):
        return match_or_404(match_id)

    @app.post("/api/v1/matches", response_model=Match, status_code=201)
    def create_match(data: MatchInput, _: Annotated[str, Depends(require_admin)]):
        season = season_or_404(data.season_id)
        league = league_or_404(data.league_id)
        home, away = team_or_404(data.home_team_id), team_or_404(data.away_team_id)
        if season.league_id != league.id or home.id == away.id or home.country != league.country or away.country != league.country:
            error(400, "Invalid team selection for the selected season.")
        match = Match(id=store.new_id("m"), leagueId=league.id, seasonId=season.id, homeTeam=home, awayTeam=away,
                      kickoff=data.kickoff, status=MatchStatus.SCHEDULED, minute=None, homeScore=0, awayScore=0, events=[])
        store.matches[match.id] = match
        return match

    @app.patch("/api/v1/matches/{match_id}", response_model=Match)
    def update_match(match_id: str, data: MatchPatch, _: Annotated[str, Depends(require_admin)]):
        match = match_or_404(match_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(match, field, value)
        emit(match, "MATCH_UPDATED")
        return match

    def transition(match_id: str, target: MatchStatus, minute: int | None):
        match = match_or_404(match_id)
        if match.status in (MatchStatus.FINISHED, MatchStatus.CANCELLED, MatchStatus.POSTPONED):
            error(409, f"Match is {match.status} and cannot change status.")
        match.status, match.minute = target, minute
        emit(match, "MATCH_UPDATED")
        return match

    @app.post("/api/v1/matches/{match_id}/start", response_model=Match)
    def start(match_id: str, _: Annotated[str, Depends(require_admin)]):
        return transition(match_id, MatchStatus.LIVE, 1)

    @app.post("/api/v1/matches/{match_id}/half-time", response_model=Match)
    def half_time(match_id: str, _: Annotated[str, Depends(require_admin)]):
        return transition(match_id, MatchStatus.HALF_TIME, 45)

    @app.post("/api/v1/matches/{match_id}/resume", response_model=Match)
    def resume(match_id: str, _: Annotated[str, Depends(require_admin)]):
        return transition(match_id, MatchStatus.LIVE, 46)

    @app.post("/api/v1/matches/{match_id}/finish", response_model=Match)
    def finish(match_id: str, _: Annotated[str, Depends(require_admin)]):
        return transition(match_id, MatchStatus.FINISHED, None)

    @app.post("/api/v1/matches/{match_id}/postpone", response_model=Match)
    def postpone(match_id: str, _: Annotated[str, Depends(require_admin)]):
        return transition(match_id, MatchStatus.POSTPONED, None)

    @app.post("/api/v1/matches/{match_id}/cancel", response_model=Match)
    def cancel(match_id: str, _: Annotated[str, Depends(require_admin)]):
        return transition(match_id, MatchStatus.CANCELLED, None)

    @app.post("/api/v1/matches/{match_id}/events", response_model=MatchEvent, status_code=201)
    def add_event(match_id: str, data: MatchEventInput, _: Annotated[str, Depends(require_admin)]):
        match = match_or_404(match_id)
        if match.status != MatchStatus.LIVE:
            error(409, "Only a LIVE match can receive match events.")
        if data.type == EventType.SUBSTITUTION and not data.player_out_name:
            error(400, "A substitution requires the player going off.")
        event = MatchEvent(id=store.new_id("ev"), matchId=match.id, **data.model_dump(), createdAt=datetime.now(UTC))
        store.events[event.id] = event
        match.events.append(event)
        if event.type == EventType.GOAL:
            if event.side.value == "home":
                match.home_score += 1
            else:
                match.away_score += 1
            match.minute = max(match.minute or 0, event.minute)
        sorted_events(match)
        emit(match, "EVENT_ADDED", event=event.model_dump(by_alias=True))
        return event

    @app.delete("/api/v1/matches/{match_id}/events/{event_id}", response_model=Match)
    def delete_event(match_id: str, event_id: str, _: Annotated[str, Depends(require_admin)]):
        match = match_or_404(match_id)
        event = store.events.get(event_id)
        if not event or event.match_id != match.id:
            error(404, "Match event not found")
        match.events = [item for item in match.events if item.id != event_id]
        del store.events[event_id]
        if event.type == EventType.GOAL:
            if event.side.value == "home":
                match.home_score = max(0, match.home_score - 1)
            else:
                match.away_score = max(0, match.away_score - 1)
        emit(match, "EVENT_DELETED", eventId=event_id)
        return match

    @app.post("/api/v1/integrations/api-football/sync", status_code=202)
    def sync_provider(_: Annotated[str, Depends(require_admin)]):
        return {
            "id": f"sync-{datetime.now(UTC).strftime('%Y%m%d%H%M%S%f')}",
            "provider": "API_FOOTBALL",
            "status": "QUEUED",
            "requestedAt": datetime.now(UTC),
        }

    @app.get("/api/v1/integrations/api-football/status")
    def provider_status(_: Annotated[str, Depends(require_admin)]):
        return {
            "provider": "API_FOOTBALL",
            "configured": False,
            "healthy": False,
            "lastSuccessfulSync": None,
            "quota": {"dailyLimit": None, "dailyRemaining": None, "minuteLimit": None, "minuteRemaining": None, "resetAt": None},
            "lastError": "Provider adapter is not configured in the mock backend.",
        }

    @app.get("/api/v1/teams/{team_id}", response_model=Team)
    def get_team(team_id: str):
        return team_or_404(team_id)

    @app.get("/api/v1/teams/{team_id}/players", response_model=list[Player])
    def get_players(team_id: str):
        team_or_404(team_id)
        return sorted((player for player in store.players.values() if player.team_id == team_id), key=lambda player: player.shirt_number)

    @app.post("/api/v1/teams", response_model=Team, status_code=201)
    def create_team(data: TeamInput, _: Annotated[str, Depends(require_admin)]):
        if any(team.name.casefold() == data.name.casefold() for team in store.teams.values()):
            error(409, "A team with this name already exists.")
        team = Team(id=store.new_id("tm"), **data.model_dump())
        store.teams[team.id] = team
        return team

    @app.patch("/api/v1/teams/{team_id}", response_model=Team)
    def update_team(team_id: str, data: TeamInput, _: Annotated[str, Depends(require_admin)]):
        team = team_or_404(team_id)
        if any(item.id != team_id and item.name.casefold() == data.name.casefold() for item in store.teams.values()):
            error(409, "A team with this name already exists.")
        team.name, team.short_name, team.crest_url, team.country = data.name, data.short_name, data.crest_url, data.country
        return team

    @app.delete("/api/v1/teams/{team_id}", status_code=204)
    def delete_team(team_id: str, _: Annotated[str, Depends(require_admin)]):
        team_or_404(team_id)
        if any(match.home_team.id == team_id or match.away_team.id == team_id for match in store.matches.values()):
            error(409, "Cannot delete a team that has existing matches.")
        del store.teams[team_id]
        for player_id in [item.id for item in store.players.values() if item.team_id == team_id]:
            del store.players[player_id]

    @app.post("/api/v1/teams/{team_id}/players", response_model=Player, status_code=201)
    def create_player(team_id: str, data: PlayerInput, _: Annotated[str, Depends(require_admin)]):
        team_or_404(team_id)
        if data.team_id != team_id:
            error(400, "Player teamId does not match the path.")
        player = Player(id=store.new_id("pl"), **data.model_dump())
        store.players[player.id] = player
        return player

    @app.patch("/api/v1/players/{player_id}", response_model=Player)
    def update_player(player_id: str, data: PlayerInput, _: Annotated[str, Depends(require_admin)]):
        if player_id not in store.players:
            error(404, "Player not found")
        team_or_404(data.team_id)
        player = store.players[player_id]
        player.team_id, player.first_name, player.last_name = data.team_id, data.first_name, data.last_name
        player.shirt_number, player.position = data.shirt_number, data.position
        return player

    @app.delete("/api/v1/players/{player_id}", status_code=204)
    def delete_player(player_id: str, _: Annotated[str, Depends(require_admin)]):
        if player_id not in store.players:
            error(404, "Player not found")
        del store.players[player_id]

    @app.websocket("/ws")
    async def websocket(websocket: WebSocket):
        await websocket.accept()
        match_id = websocket.query_params.get("matchId")
        cursor = len(getattr(app.state, "last_events", []))
        try:
            while True:
                await websocket.receive_text()
                events = getattr(app.state, "last_events", [])[cursor:]
                for event in events:
                    if not match_id or event["matchId"] == match_id:
                        await websocket.send_json(event)
                cursor += len(events)
        except WebSocketDisconnect:
            return

    return app


app = create_app()
