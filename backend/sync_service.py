from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from .api_football import ApiFootballClient
from .models import EventType, League, Match, MatchEvent, MatchStatus, Season, Side, Team
from .store import MockStore


PROVIDER_LEAGUES = {
    "lg-pl": 39,
    "lg-es": 140,
    "lg-de": 78,
}

STATUS_MAP = {
    "NS": MatchStatus.SCHEDULED,
    "TBD": MatchStatus.SCHEDULED,
    "1H": MatchStatus.LIVE,
    "2H": MatchStatus.LIVE,
    "ET": MatchStatus.LIVE,
    "P": MatchStatus.LIVE,
    "BT": MatchStatus.LIVE,
    "HT": MatchStatus.HALF_TIME,
    "FT": MatchStatus.FINISHED,
    "AET": MatchStatus.FINISHED,
    "PEN": MatchStatus.FINISHED,
    "PST": MatchStatus.POSTPONED,
    "CANC": MatchStatus.CANCELLED,
    "ABD": MatchStatus.CANCELLED,
}


def _status(raw: str | None) -> MatchStatus:
    return STATUS_MAP.get(raw or "", MatchStatus.SCHEDULED)


def _side(raw: str | None) -> Side:
    return Side.HOME if raw == "Home" else Side.AWAY


def _event_type(raw: str | None) -> EventType | None:
    if raw == "Goal":
        return EventType.GOAL
    if raw == "subst":
        return EventType.SUBSTITUTION
    return None


class SyncService:
    def __init__(self, store: MockStore, provider: ApiFootballClient):
        self.store = store
        self.provider = provider

    def sync(self, scope: str = "live", league_ids: list[str] | None = None) -> int:
        selected = league_ids or list(PROVIDER_LEAGUES)
        fixtures: list[dict[str, Any]] = []
        if scope == "live":
            fixtures = self.provider.fixtures(live=True)
        else:
            season = datetime.now(UTC).year
            for internal_id in selected:
                provider_id = PROVIDER_LEAGUES.get(internal_id)
                if provider_id:
                    fixtures.extend(self.provider.league_fixtures(provider_id, season))

        if fixtures:
            self._clear_provider_read_model()
        for fixture in fixtures:
            self._upsert_fixture(fixture)
        return len(fixtures)

    def _clear_provider_read_model(self) -> None:
        self.store.leagues.clear()
        self.store.seasons.clear()
        self.store.teams.clear()
        self.store.players.clear()
        self.store.matches.clear()
        self.store.events.clear()

    def _upsert_fixture(self, fixture: dict[str, Any]) -> None:
        fixture_data = fixture["fixture"]
        teams = fixture["teams"]
        league_data = fixture["league"]
        provider_id = str(fixture_data["id"])
        league_id = self._upsert_league(league_data)
        season_year = league_data.get("season") or fixture.get("season", {}).get("year")
        if season_year is None:
            raise ValueError("API-Football fixture is missing its season.")
        season_id = self._upsert_season(league_id, int(season_year))
        home = self._upsert_team(teams["home"])
        away = self._upsert_team(teams["away"])
        status_data = fixture_data["status"]
        status = _status(status_data.get("short"))
        score = fixture.get("goals") or {}
        existing = self.store.matches.get(f"af-{provider_id}")
        match = Match(
            id=f"af-{provider_id}",
            leagueId=league_id,
            seasonId=season_id,
            homeTeam=home,
            awayTeam=away,
            kickoff=datetime.fromisoformat(fixture_data["date"].replace("Z", "+00:00")),
            status=status,
            minute=status_data.get("elapsed"),
            homeScore=score.get("home") or 0,
            awayScore=score.get("away") or 0,
            events=existing.events if existing else [],
        )
        if status in (MatchStatus.LIVE, MatchStatus.HALF_TIME, MatchStatus.FINISHED):
            self._sync_events(match, fixture_data["id"])
        self.store.matches[match.id] = match

    def _sync_events(self, match: Match, fixture_id: int) -> None:
        events: list[MatchEvent] = []
        for index, data in enumerate(self.provider.fixture_events(fixture_id)):
            event_type = _event_type(data.get("type"))
            if event_type is None and data.get("type") == "Card":
                detail = (data.get("detail") or "").casefold()
                event_type = (
                    EventType.RED_CARD
                    if "red" in detail or "second yellow" in detail
                    else EventType.YELLOW_CARD
                )
            if event_type is None:
                continue
            minute = data.get("time", {}).get("elapsed") or 1
            player = (data.get("player") or {}).get("name") or "Unknown player"
            team_id = (data.get("team") or {}).get("id")
            side = Side.HOME if team_id == self._provider_team_id(match.home_team.id) else Side.AWAY
            events.append(
                MatchEvent(
                    id=f"{match.id}-ev-{index}",
                    matchId=match.id,
                    type=event_type,
                    minute=min(int(minute), 130),
                    side=side,
                    playerName=player,
                    playerOutName=(
                        (data.get("assist") or {}).get("name")
                        if event_type == EventType.SUBSTITUTION
                        else None
                    ),
                    note=data.get("detail"),
                    createdAt=datetime.now(UTC),
                )
            )
        match.events = events

    @staticmethod
    def _provider_team_id(team_id: str) -> int | None:
        try:
            return int(team_id.removeprefix("af-tm-"))
        except ValueError:
            return None

    def _upsert_league(self, data: dict[str, Any]) -> str:
        league_id = f"af-lg-{data['id']}"
        self.store.leagues[league_id] = League(
            id=league_id,
            name=data["name"],
            country=data["country"],
            logo=data.get("logo") or "",
        )
        return league_id

    def _upsert_season(self, league_id: str, year: int) -> str:
        season_id = f"{league_id}-sn-{year}"
        self.store.seasons[season_id] = Season(
            id=season_id,
            leagueId=league_id,
            label=f"{year}/{year + 1}",
            isCurrent=True,
        )
        return season_id

    def _upsert_team(self, data: dict[str, Any]) -> Team:
        team_id = f"af-tm-{data['id']}"
        team = Team(
            id=team_id,
            name=data["name"],
            shortName=(data.get("name") or "")[:10],
            crestUrl=data.get("logo") or "",
            country=data.get("country") or "Unknown",
        )
        self.store.teams[team_id] = team
        return team
