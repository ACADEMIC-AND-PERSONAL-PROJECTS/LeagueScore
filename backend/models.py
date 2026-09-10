from datetime import datetime
from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints


class MatchStatus(StrEnum):
    SCHEDULED = "SCHEDULED"
    LIVE = "LIVE"
    HALF_TIME = "HALF_TIME"
    FINISHED = "FINISHED"
    POSTPONED = "POSTPONED"
    CANCELLED = "CANCELLED"


class EventType(StrEnum):
    GOAL = "GOAL"
    YELLOW_CARD = "YELLOW_CARD"
    RED_CARD = "RED_CARD"
    SUBSTITUTION = "SUBSTITUTION"


class PlayerPosition(StrEnum):
    GOALKEEPER = "GOALKEEPER"
    DEFENDER = "DEFENDER"
    MIDFIELDER = "MIDFIELDER"
    FORWARD = "FORWARD"


class Side(StrEnum):
    HOME = "home"
    AWAY = "away"


class DomainModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


Name = Annotated[str, StringConstraints(min_length=1, max_length=160)]


class League(DomainModel):
    id: str
    name: Name
    country: Name
    logo: Name


class LeagueInput(DomainModel):
    name: Name
    country: Name
    logo: Name


class Season(DomainModel):
    id: str
    league_id: str = Field(alias="leagueId")
    label: str = Field(pattern=r"^[0-9]{4}/[0-9]{4}$")
    is_current: bool = Field(alias="isCurrent")


class SeasonInput(DomainModel):
    league_id: str = Field(alias="leagueId")
    label: str = Field(pattern=r"^[0-9]{4}/[0-9]{4}$")
    is_current: bool = Field(alias="isCurrent")


class Team(DomainModel):
    id: str
    name: Name
    short_name: Annotated[str, StringConstraints(min_length=1, max_length=10)] = Field(alias="shortName")
    crest_url: str = Field(alias="crestUrl")
    country: Name


class TeamInput(DomainModel):
    name: Name
    short_name: Annotated[str, StringConstraints(min_length=1, max_length=10)] = Field(alias="shortName")
    crest_url: str = Field(alias="crestUrl")
    country: Name


class Player(DomainModel):
    id: str
    team_id: str = Field(alias="teamId")
    first_name: Name = Field(alias="firstName")
    last_name: Name = Field(alias="lastName")
    shirt_number: int = Field(alias="shirtNumber", ge=1, le=99)
    position: PlayerPosition


class PlayerInput(DomainModel):
    team_id: str = Field(alias="teamId")
    first_name: Name = Field(alias="firstName")
    last_name: Name = Field(alias="lastName")
    shirt_number: int = Field(alias="shirtNumber", ge=1, le=99)
    position: PlayerPosition


class MatchEvent(DomainModel):
    id: str
    match_id: str = Field(alias="matchId")
    type: EventType
    minute: int = Field(ge=1, le=130)
    side: Side
    player_name: Name = Field(alias="playerName")
    player_out_name: str | None = Field(default=None, alias="playerOutName")
    note: str | None = Field(default=None, max_length=500)
    created_at: datetime = Field(alias="createdAt")


class MatchEventInput(DomainModel):
    type: EventType
    minute: int = Field(ge=1, le=130)
    side: Side
    player_name: Name = Field(alias="playerName")
    player_out_name: str | None = Field(default=None, alias="playerOutName")
    note: str | None = Field(default=None, max_length=500)


class Match(DomainModel):
    id: str
    league_id: str = Field(alias="leagueId")
    season_id: str = Field(alias="seasonId")
    home_team: Team = Field(alias="homeTeam")
    away_team: Team = Field(alias="awayTeam")
    kickoff: datetime
    status: MatchStatus
    minute: int | None
    home_score: int = Field(alias="homeScore", ge=0)
    away_score: int = Field(alias="awayScore", ge=0)
    events: list[MatchEvent]


class MatchInput(DomainModel):
    league_id: str = Field(alias="leagueId")
    season_id: str = Field(alias="seasonId")
    home_team_id: str = Field(alias="homeTeamId")
    away_team_id: str = Field(alias="awayTeamId")
    kickoff: datetime


class MatchPatch(DomainModel):
    kickoff: datetime | None = None
    status: MatchStatus | None = None
    home_score: int | None = Field(default=None, alias="homeScore", ge=0)
    away_score: int | None = Field(default=None, alias="awayScore", ge=0)


class StandingRow(DomainModel):
    team: Team
    position: int
    played: int
    won: int
    drawn: int
    lost: int
    goals_for: int = Field(alias="goalsFor")
    goals_against: int = Field(alias="goalsAgainst")
    goal_difference: int = Field(alias="goalDifference")
    points: int


class LoginRequest(DomainModel):
    username: str
    password: str


class Session(DomainModel):
    token: str
    username: str
    expires_at: datetime = Field(alias="expiresAt")


class ApiError(BaseModel):
    error: str
    message: str
    status: int
