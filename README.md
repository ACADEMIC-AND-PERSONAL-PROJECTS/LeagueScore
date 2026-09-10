# ⚽ LeagueScore

<p align="center">
  <strong>A broadcast-style football live-score experience built from the ground up with AI-assisted development.</strong>
</p>

<p align="center">
  <a href="https://github.com/ACADEMIC-AND-PERSONAL-PROJECTS/LeagueScore">
    <img src="https://img.shields.io/badge/status-active-00c853?style=for-the-badge" alt="Project status">
  </a>
  <img src="https://img.shields.io/badge/frontend-React%2019-61dafb?style=for-the-badge&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/database-SQLAlchemy-d71f00?style=for-the-badge&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy">
  <img src="https://img.shields.io/badge/provider-API--Football-111827?style=for-the-badge" alt="API-Football">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/tests-25%20passing-2ea44f?style=flat-square" alt="Tests passing">
  <img src="https://img.shields.io/badge/type--checked-TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/package%20manager-uv-6f42c1?style=flat-square" alt="uv">
  <img src="https://img.shields.io/badge/license-learning%20project-blue?style=flat-square" alt="Learning project">
</p>

> LeagueScore is an academic project created for the **AI Dev Tools Zoomcamp 2026**. It turns a football-score product brief into a working full-stack application: public match browsing, live match details, standings, an administrator console, provider synchronization, and persistent storage.

## ✨ What is LeagueScore?

LeagueScore is designed as a compact digital broadcast center for football fans:

- follow live and half-time matches;
- browse upcoming fixtures and finished results;
- filter matches by league with a compact source selector;
- open a detailed match center with score, status, teams, and event timeline;
- inspect league seasons, teams, players, and standings;
- manage matches and live events from an authenticated admin console;
- synchronize real football data through API-Football;
- keep the backend storage replaceable through a database-agnostic store boundary.

The frontend never calls API-Football directly. The backend owns the provider key, normalization, quota handling, and persistence.

## 🎯 Project brief

The project follows the **League Score** assignment brief:

1. design a spectator-facing football score application;
2. provide league, season, team, player, fixture, event, and standings views;
3. support live match operations for administrators;
4. expose a documented REST backend and real-time channel;
5. connect the application to an external football-data provider;
6. develop the solution with modern AI-assisted engineering tools.

The original backend contract is documented in [`_docs/openapi.yaml`](./_docs/openapi.yaml).

## 🖥️ Product tour

### Spectator experience

- broadcast-inspired dark interface;
- responsive desktop and mobile navigation;
- live indicators and match status badges;
- scoreboards with team crests;
- live minute progression between provider refreshes;
- league and source filtering;
- finished-match and upcoming-fixture sections;
- match event timeline.

### Administrator experience

- JWT-protected login;
- live match console;
- start, pause at half-time, resume, finish, postpone, and cancel actions;
- goal, card, and substitution events;
- league, team, player, and season management;
- provider status and synchronization endpoints.

## 🏗️ Architecture

```text
┌──────────────────────┐
│  React + Vite UI     │
│  localhost:3000      │
└──────────┬───────────┘
           │ REST + WebSocket
           ▼
┌──────────────────────┐
│  FastAPI application │
│  localhost:4000      │
└──────┬───────┬───────┘
       │       │
       │       └──────────────────────┐
       ▼                              ▼
┌───────────────┐             ┌────────────────┐
│ SQLAlchemy    │             │ API-Football   │
│ persistent    │             │ provider       │
│ read model    │             │ adapter        │
└───────────────┘             └────────────────┘
```

### Backend boundaries

| Layer | Responsibility |
|---|---|
| `backend/app.py` | FastAPI routes, authentication, CORS, WebSocket, lifecycle |
| `backend/models.py` | Pydantic API/domain contracts |
| `backend/database.py` | SQLAlchemy-backed persistence |
| `backend/store.py` | In-memory store used by isolated tests |
| `backend/api_football.py` | Provider HTTP client and quota-aware errors |
| `backend/sync_service.py` | Provider-to-LeagueScore normalization |
| `backend/tests/` | Contract, integration, persistence, and live-event tests |

The public API keeps the same domain models regardless of whether the app is running with the in-memory test store or SQLAlchemy persistence.

## 🧰 Tech stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- WebSocket client with reconnect-friendly polling

### Backend

- Python 3.12+
- FastAPI
- Pydantic v2
- SQLAlchemy 2
- SQLite by default
- PostgreSQL-ready through `DATABASE_URL`
- PyJWT
- HTTPX
- `uv`

### Data provider

- API-Football / API-Sports v3
- server-side authentication using `x-apisports-key`
- normalized internal match statuses and events
- local persistence so the frontend is not coupled to the provider

## 🚀 Quick start

### Prerequisites

- Node.js 18+
- Python 3.12+
- [`uv`](https://docs.astral.sh/uv/)
- an API-Football account and API key for live provider data

### 1. Configure the backend

From the repository root:

```bash
cp .env.example .env
```

Set the provider key in `.env`:

```env
API_FOOTBALL_KEY=your_api_football_key
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
DATABASE_URL=sqlite:///./leaguescore.db
```

The API key must remain server-side. Never expose it through `VITE_*` variables or commit it to Git.

### 2. Install Python dependencies

```bash
uv sync
```

### 3. Start the backend

```bash
uv run uvicorn backend.app:app --host 0.0.0.0 --port 4000
```

The backend is available at:

- API: <http://localhost:4000>
- Swagger UI: <http://localhost:4000/docs>
- OpenAPI JSON: <http://localhost:4000/openapi.json>

### 4. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000>.

The frontend uses `http://localhost:4000/api/v1` by default. To override it:

```bash
VITE_API_URL=http://localhost:4000/api/v1 npm run dev
```

## 🧪 Quality checks

Run the backend tests:

```bash
uv run pytest
```

Run frontend type checking:

```bash
cd frontend
npm run lint
```

Build the frontend:

```bash
npm run build
```

The current project validation includes backend API tests, API-Football adapter tests, synchronization tests, SQLAlchemy persistence tests, and frontend TypeScript/build checks.

## 🔌 API highlights

### Public endpoints

```text
GET  /api/v1/leagues
GET  /api/v1/matches/live
GET  /api/v1/matches/upcoming
GET  /api/v1/matches/recent
GET  /api/v1/matches/{match_id}
GET  /api/v1/seasons/{season_id}/standings
GET  /api/v1/teams/{team_id}/players
```

### Administration and provider integration

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/matches/{match_id}/events
POST /api/v1/integrations/api-football/sync
GET  /api/v1/integrations/api-football/status
WS   /ws
```

See the complete contract in [`_docs/openapi.yaml`](./_docs/openapi.yaml).

## 🔐 Demo administration login

The local development store currently includes:

```text
username: admin
password: admin
```

These credentials are for development only. Before production use, move users to the database, hash passwords, rotate the JWT secret, and configure all secrets through the environment.

## 📡 Real-time behavior and provider limits

LeagueScore combines two different notions of real time:

1. **Local UI clock** — the browser advances the displayed live minute smoothly between provider updates.
2. **Provider synchronization** — scores, statuses, and events are refreshed by the backend from API-Football.

The provider remains the source of truth for scores and official match status. Small differences with Google or another live-score service can occur because providers receive updates at different times.

API-Football free plans also impose request quotas. The application therefore:

- keeps provider credentials on the backend;
- throttles refresh attempts;
- preserves previously synchronized records when the provider is unavailable;
- stores provider data locally;
- avoids deleting the local read model after quota errors.

## 🗂️ Repository layout

```text
.
├── _docs/
│   └── openapi.yaml
├── backend/
│   ├── api_football.py
│   ├── app.py
│   ├── database.py
│   ├── models.py
│   ├── store.py
│   ├── sync_service.py
│   └── tests/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── .env.example
├── pyproject.toml
└── uv.lock
```

## 🧭 Roadmap

- [ ] Add Alembic migrations.
- [ ] Move from generic JSON records to relational SQLAlchemy tables and foreign keys.
- [ ] Add a PostgreSQL production profile.
- [ ] Persist users and hashed passwords.
- [ ] Replace startup synchronization with a scheduled worker.
- [ ] Add provider freshness timestamps to the public response.
- [ ] Add automated end-to-end browser tests.
- [ ] Add observability for provider latency, quota, and synchronization failures.

## 🎓 Course

This project was built as part of the **AI Dev Tools Zoomcamp 2026**.

👉 **[Join the course](https://courses.datatalks.club/ai-dev-tools-2026/)**

The course explores practical AI-assisted software development: understanding an existing codebase, writing specifications, building tested features, integrating external services, and validating the result end to end.

## 🤝 Contributing

1. Create a feature branch.
2. Make a focused change.
3. Add or update tests.
4. Run `uv run pytest`.
5. Run `npm run lint` and `npm run build` from `frontend/`.
6. Open a pull request with a clear description.

## 📄 License

This is a learning and portfolio project created for the AI Dev Tools Zoomcamp. Check the repository settings for the applicable project license.

---

<p align="center">
  Built with ⚽, TypeScript, Python, FastAPI, SQLAlchemy, and AI-assisted engineering.
</p>
