from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

import httpx
from dotenv import load_dotenv


@dataclass(frozen=True)
class ApiFootballConfig:
    api_key: str | None
    base_url: str = "https://v3.football.api-sports.io"

    @classmethod
    def from_environment(cls) -> "ApiFootballConfig":
        load_dotenv()
        return cls(
            api_key=os.getenv("API_FOOTBALL_KEY") or os.getenv("api-key"),
            base_url=os.getenv(
                "API_FOOTBALL_BASE_URL",
                "https://v3.football.api-sports.io",
            ).rstrip("/"),
        )


class ApiFootballError(RuntimeError):
    pass


class ApiFootballClient:
    def __init__(
        self,
        config: ApiFootballConfig | None = None,
        client: httpx.Client | None = None,
    ):
        self.config = config or ApiFootballConfig.from_environment()
        self.client = client or httpx.Client(timeout=10.0)

    @property
    def configured(self) -> bool:
        return bool(self.config.api_key)

    def get(self, endpoint: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        if not self.config.api_key:
            raise ApiFootballError("API_FOOTBALL_KEY is not configured.")
        response = self.client.get(
            f"{self.config.base_url}/{endpoint.lstrip('/')}",
            params=params,
            headers={"x-apisports-key": self.config.api_key},
        )
        if response.status_code == 429:
            raise ApiFootballError("API-Football quota exceeded.")
        if response.is_error:
            raise ApiFootballError(
                f"API-Football returned HTTP {response.status_code}."
            )
        payload = response.json()
        if payload.get("errors"):
            raise ApiFootballError(f"API-Football error: {payload['errors']}")
        return payload

    def health(self) -> dict[str, Any]:
        payload = self.get("status")
        account = payload.get("response", {}).get("account", {})
        subscription = account.get("subscription", {})
        quota = account.get("requests", {})
        return {
            "healthy": True,
            "quota": {
                "dailyLimit": subscription.get("limit_day"),
                "dailyRemaining": quota.get("remaining"),
                "minuteLimit": None,
                "minuteRemaining": None,
                "resetAt": None,
            },
        }

    def fixtures(self, *, live: bool = False) -> list[dict[str, Any]]:
        params: dict[str, Any] = {"live": "all"} if live else {}
        return self.get("fixtures", params=params).get("response", [])

    def league_fixtures(self, league_id: int, season: int) -> list[dict[str, Any]]:
        return self.get(
            "fixtures",
            params={"league": league_id, "season": season},
        ).get("response", [])

    def fixture_events(self, fixture_id: int) -> list[dict[str, Any]]:
        return self.get(
            "fixtures/events",
            params={"fixture": fixture_id},
        ).get("response", [])

    def fixtures_on_date(self, date: str) -> list[dict[str, Any]]:
        return self.get("fixtures", params={"date": date}).get("response", [])
