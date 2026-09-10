from datetime import UTC, datetime, timedelta
from itertools import count

from .models import (
    EventType,
    League,
    Match,
    MatchEvent,
    MatchEventInput,
    MatchStatus,
    Player,
    PlayerPosition,
    Season,
    Side,
    Team,
)


class MockStore:
    def __init__(self):
        self.leagues: dict[str, League] = {}
        self.seasons: dict[str, Season] = {}
        self.teams: dict[str, Team] = {}
        self.players: dict[str, Player] = {}
        self.matches: dict[str, Match] = {}
        self.events: dict[str, MatchEvent] = {}
        self.users = {"admin": {"password": "admin", "role": "ADMIN"}}
        self.sessions: dict[str, tuple[str, datetime]] = {}
        self.counters = {prefix: count(1) for prefix in ("lg", "sn", "tm", "pl", "m", "ev")}

    @classmethod
    def seeded(cls) -> "MockStore":
        store = cls()
        leagues = [
            League(id="lg-pl", name="Premier League", country="England", logo="🏴"),
            League(id="lg-es", name="La Liga", country="Spain", logo="🇪🇸"),
            League(id="lg-de", name="Bundesliga", country="Germany", logo="🇩🇪"),
        ]
        store.leagues = {item.id: item for item in leagues}
        seasons = [
            Season(id="sn-pl-26", leagueId="lg-pl", label="2025/2026", isCurrent=True),
            Season(id="sn-es-26", leagueId="lg-es", label="2025/2026", isCurrent=True),
        ]
        store.seasons = {item.id: item for item in seasons}
        clubs = [
            ("tm-ars", "Arsenal", "ARS", "England"), ("tm-che", "Chelsea", "CHE", "England"),
            ("tm-liv", "Liverpool", "LIV", "England"), ("tm-mci", "Manchester City", "MCI", "England"),
            ("tm-new", "Newcastle United", "NEW", "England"), ("tm-bha", "Brighton", "BHA", "England"),
            ("tm-rma", "Real Madrid", "RMA", "Spain"), ("tm-atm", "Atletico Madrid", "ATM", "Spain"),
        ]
        store.teams = {
            item[0]: Team(id=item[0], name=item[1], shortName=item[2], crestUrl="", country=item[3])
            for item in clubs
        }
        for index, (team_id, name, _, _) in enumerate(clubs):
            store.players[f"pl-{index}"] = Player(
                id=f"pl-{index}", teamId=team_id, firstName=name.split()[0],
                lastName=" ".join(name.split()[1:]) or "Player", shirtNumber=10,
                position=PlayerPosition.FORWARD,
            )
        now = datetime.now(UTC)
        def match(match_id, league_id, season_id, home, away, days, home_score, away_score, status, minute=None):
            store.matches[match_id] = Match(
                id=match_id, leagueId=league_id, seasonId=season_id,
                homeTeam=store.teams[home], awayTeam=store.teams[away],
                kickoff=now + timedelta(days=days), status=status, minute=minute,
                homeScore=home_score, awayScore=away_score, events=[],
            )
        match("m-f1", "lg-pl", "sn-pl-26", "tm-mci", "tm-bha", -2, 3, 1, MatchStatus.FINISHED)
        match("m-f2", "lg-pl", "sn-pl-26", "tm-new", "tm-liv", -1, 1, 3, MatchStatus.FINISHED)
        match("m-1", "lg-pl", "sn-pl-26", "tm-ars", "tm-che", 0, 2, 1, MatchStatus.LIVE, 67)
        match("m-2", "lg-pl", "sn-pl-26", "tm-liv", "tm-mci", 0, 0, 0, MatchStatus.LIVE, 34)
        match("m-3", "lg-es", "sn-es-26", "tm-rma", "tm-atm", 0, 1, 1, MatchStatus.HALF_TIME, 45)
        match("m-s1", "lg-pl", "sn-pl-26", "tm-new", "tm-bha", 1, 0, 0, MatchStatus.SCHEDULED)
        match("m-s2", "lg-pl", "sn-pl-26", "tm-ars", "tm-liv", 1, 0, 0, MatchStatus.SCHEDULED)
        for event in [
            MatchEvent(id="ev-1a", matchId="m-1", type=EventType.GOAL, minute=14, side=Side.HOME, playerName="Bukayo Saka", createdAt=now),
            MatchEvent(id="ev-1b", matchId="m-1", type=EventType.YELLOW_CARD, minute=31, side=Side.AWAY, playerName="Moises Caicedo", createdAt=now),
        ]:
            store.events[event.id] = event
            store.matches[event.match_id].events.append(event)
        return store

    def new_id(self, prefix: str) -> str:
        return f"{prefix}-{next(self.counters[prefix])}"
