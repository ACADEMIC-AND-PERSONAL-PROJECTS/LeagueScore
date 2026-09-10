from __future__ import annotations

import json
import os
from collections.abc import Iterator, MutableMapping
from datetime import datetime
from itertools import count
from typing import Any

from dotenv import load_dotenv
from pydantic import BaseModel
from sqlalchemy import Column, JSON, MetaData, String, Table, create_engine, delete, select

from .store import MockStore


metadata = MetaData()
records = Table(
    "domain_records",
    metadata,
    # SQLAlchemy chooses the concrete type for each database dialect.
    Column("collection", String(40), primary_key=True),
    Column("record_id", String(160), primary_key=True),
    Column("payload", JSON, nullable=False),
)


def _json_default(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    raise TypeError(f"Unsupported database value: {type(value)!r}")


def _dump(value: Any) -> dict[str, Any]:
    if isinstance(value, BaseModel):
        return json.loads(value.model_dump_json(by_alias=True))
    return json.loads(json.dumps(value, default=_json_default))


class DatabaseCollection(MutableMapping[str, Any]):
    def __init__(self, database: "SQLAlchemyStore", name: str):
        self.database = database
        self.name = name
        self.cache: dict[str, Any] = {}
        self._load()

    def _load(self) -> None:
        with self.database.engine.begin() as connection:
            rows = connection.execute(
                select(records.c.record_id, records.c.payload).where(
                    records.c.collection == self.name
                )
            )
            for record_id, payload in rows:
                self.cache[record_id] = self.database.deserialize(self.name, payload)

    def __getitem__(self, key: str) -> Any:
        return self.cache[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self.cache[key] = value
        self.database.dirty = True

    def __delitem__(self, key: str) -> None:
        del self.cache[key]
        self.database.dirty = True

    def __iter__(self) -> Iterator[str]:
        return iter(self.cache)

    def __len__(self) -> int:
        return len(self.cache)

    def clear(self) -> None:
        self.cache.clear()
        self.database.dirty = True


class SQLAlchemyStore:
    """Persistent store using SQLAlchemy without coupling the API to a dialect."""

    collections = ("leagues", "seasons", "teams", "players", "matches", "events")

    def __init__(self, database_url: str | None = None, seed: bool = True):
        load_dotenv()
        url = database_url or os.getenv("DATABASE_URL", "sqlite:///./leaguescore.db")
        self.engine = create_engine(url, future=True)
        metadata.create_all(self.engine)
        self.dirty = False
        for collection in self.collections:
            setattr(self, collection, DatabaseCollection(self, collection))
        self.users: dict[str, dict[str, str]] = {"admin": {"password": "admin", "role": "ADMIN"}}
        self.sessions: dict[str, tuple[str, datetime]] = {}
        self.counters = {prefix: count(1) for prefix in ("lg", "sn", "tm", "pl", "m", "ev")}
        if seed and not any(len(getattr(self, item)) for item in self.collections):
            self.copy_from(MockStore.seeded())
            self.flush()

    def deserialize(self, collection: str, payload: dict[str, Any]) -> Any:
        from .models import EventType, League, Match, MatchEvent, MatchStatus, Player, Season, Team

        models = {
            "leagues": League,
            "seasons": Season,
            "teams": Team,
            "players": Player,
            "matches": Match,
            "events": MatchEvent,
        }
        return models[collection].model_validate(payload)

    def copy_from(self, source: MockStore) -> None:
        for collection in self.collections:
            target = getattr(self, collection)
            for key, value in getattr(source, collection).items():
                target[key] = value

    def flush(self) -> None:
        if not self.dirty:
            return
        with self.engine.begin() as connection:
            for collection in self.collections:
                connection.execute(delete(records).where(records.c.collection == collection))
                values = [
                    {"collection": collection, "record_id": key, "payload": _dump(value)}
                    for key, value in getattr(self, collection).items()
                ]
                if values:
                    connection.execute(records.insert(), values)
        self.dirty = False

    def new_id(self, prefix: str) -> str:
        return f"{prefix}-{next(self.counters[prefix])}"
