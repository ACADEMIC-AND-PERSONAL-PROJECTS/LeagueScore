# LeagueScore — Project Specification

## 1. Project Overview

**LeagueScore** is a full-stack web application for following multiple football leagues in real time.

The application is primarily designed for **football spectators/fans** who want to:

- Follow live matches
- See real-time scores
- See match events
- Browse upcoming matches
- View completed matches
- Consult league standings
- Open detailed match information

An **administrator** manages the football data and controls live match information.

The application should provide a modern, responsive and intuitive user experience.

---

# 2. Project Goals

The main goals are:

1. Build a complete full-stack football scoreboard application.
2. Support multiple football leagues.
3. Allow administrators to manage leagues, teams, players and matches.
4. Allow administrators to update live match information.
5. Provide real-time score and event updates to spectators.
6. Automatically maintain league standings from match results.
7. Provide detailed information about individual matches.

---

# 3. User Roles

The application has two main roles.

## 3.1 Spectator / Fan

Spectators are primarily consumers of football information.

They can:

- Browse leagues
- View live matches
- View upcoming matches
- View finished matches
- View league standings
- View match details
- Follow the score of a live match
- See goals
- See yellow cards
- See red cards
- See substitutions
- See the chronological timeline of match events

Spectators should **not** be able to modify football data.

---

## 3.2 Administrator

Administrators are responsible for managing the platform.

They can:

- Create leagues
- Update leagues
- Delete leagues when appropriate
- Create teams
- Update teams
- Delete teams when appropriate
- Register players
- Schedule matches
- Update match status
- Start matches
- Update live scores
- Add match events
- Correct match information
- Finish matches
- Manage seasons
- Manage league participation

The administrator interface should be separated from the spectator interface.

---

# 4. Core Features

## 4.1 Multiple Leagues

The platform must support multiple football leagues.

Examples:

- Premier League
- La Liga
- Ligue 1
- Serie A
- Bundesliga

The application should not be hardcoded to a single competition.

Each league should have its own:

- Name
- Country/region
- Logo
- Seasons
- Teams
- Matches
- Standings

---

# 5. Seasons

A league can contain multiple seasons.

Example:

```text
Premier League
├── 2025/2026
└── 2026/2027
```

A season contains:

- Participating teams
- Scheduled matches
- Completed matches
- Standings

The active/current season should be clearly identified.

---

# 6. Teams

Each team should contain information such as:

- Name
- Short name
- Logo
- Country
- League/season participation

Example:

```text
Team
├── Name: Arsenal
├── Short name: ARS
└── Logo
```

A team can participate in different seasons.

---

# 7. Players

Players belong to teams.

A player should contain:

- First name
- Last name
- Shirt number
- Position
- Team

Possible positions:

- Goalkeeper
- Defender
- Midfielder
- Forward

Player management is primarily an administrative feature.

Players can be associated with match events such as:

- Goals
- Yellow cards
- Red cards
- Substitutions

---

# 8. Matches

A match represents a football game between two teams.

A match should contain:

- League
- Season
- Home team
- Away team
- Scheduled date/time
- Status
- Home score
- Away score
- Match events

Possible statuses:

```text
SCHEDULED
LIVE
HALF_TIME
FINISHED
POSTPONED
CANCELLED
```

Example:

```text
Arsenal 2 - 1 Chelsea

Premier League
2026/2027

Status: LIVE
Minute: 67'
```

---

# 9. Live Match System

Live matches are one of the main features of LeagueScore.

When a match is live, spectators should be able to see:

- Current score
- Current match minute
- Match status
- Goals
- Yellow cards
- Red cards
- Substitutions

The match page should update without requiring the spectator to manually refresh the browser.

---

# 10. Match Events

Every important event during a match should be represented as a match event.

Supported event types for the MVP:

```text
GOAL
YELLOW_CARD
RED_CARD
SUBSTITUTION
```

Each event should contain information such as:

- Match
- Event type
- Minute
- Team
- Player
- Optional secondary player
- Timestamp

For substitutions:

```text
Player IN
Player OUT
```

For goals:

```text
Scoring player
Team
Minute
```

---

# 11. Match Timeline

The match details page should display events chronologically.

Example:

```text
67'  🔄 Substitution
     Arsenal
     Martinelli → Trossard

61'  🟨 Yellow Card
     Chelsea
     Player Name

45'  ⚽ Goal
     Arsenal
     Saka

23'  🟨 Yellow Card
     Arsenal
     Player Name
```

The timeline should update when a new live event is created.

---

# 12. Live Score Updates

When an administrator records an event that changes the score:

```text
Admin
   ↓
Create goal
   ↓
Backend
   ↓
Update match score
   ↓
Save event
   ↓
Publish real-time event
   ↓
Connected spectators receive update
```

The spectator interface should immediately display the updated score.

Example:

Before:

```text
Arsenal 1 - 0 Chelsea
```

After a goal:

```text
Arsenal 2 - 0 Chelsea
```

---

# 13. Real-Time Communication

The application should use a real-time communication mechanism such as:

- WebSockets
- Server-Sent Events

**WebSockets are preferred** if the chosen technology stack supports them naturally.

The purpose is to notify connected spectators when:

- A goal is scored
- A card is given
- A substitution occurs
- The match status changes
- The score changes
- The match minute/status is updated

Example architecture:

```text
                  ┌──────────────┐
                  │   Database   │
                  └──────┬───────┘
                         │
                         │
                  ┌──────▼───────┐
                  │    Backend   │
                  │     API      │
                  └──────┬───────┘
                         │
                   WebSocket
                         │
             ┌───────────┴───────────┐
             │                       │
       ┌─────▼─────┐           ┌─────▼─────┐
       │ Spectator │           │ Spectator │
       │     A     │           │     B     │
       └───────────┘           └───────────┘
```

---

# 14. Upcoming Matches

Spectators should have access to upcoming fixtures.

Each fixture should display:

- League
- Teams
- Team logos
- Date
- Kickoff time
- Match status

Example:

```text
Premier League

Saturday, September 12

Arsenal        18:30        Chelsea
```

Upcoming matches can be filtered by league.

---

# 15. Live Matches Dashboard

The application should have a dedicated section for currently live matches.

Example:

```text
LIVE

Premier League

Arsenal       2 - 1       Chelsea
67'

Liverpool    0 - 0       Manchester City
34'
```

Each live match should be clickable to open its detailed match page.

---

# 16. League Standings

Every league/season should have a standings table.

The standard standings format is:

| Position | Team | P | W | D | L | GF | GA | GD | Points |
|----------|------|---|---|---|---|----|----|----|--------|

Where:

- **P** = Played
- **W** = Won
- **D** = Draw
- **L** = Lost
- **GF** = Goals For
- **GA** = Goals Against
- **GD** = Goal Difference
- **Points** = Total points

---

# 17. Standings Calculation Rules

For a standard football league:

### Win

Winner receives:

```text
3 points
```

### Draw

Both teams receive:

```text
1 point
```

### Loss

Loser receives:

```text
0 points
```

The standings should be updated automatically when a match is officially finished.

Example:

```text
Arsenal 2 - 1 Chelsea
```

The system updates:

```text
Arsenal
Played +1
Won +1
Goals For +2
Goals Against +1
Goal Difference +1
Points +3

Chelsea
Played +1
Lost +1
Goals For +1
Goals Against +2
Goal Difference -1
Points +0
```

---

# 18. Standings Ordering

The default ordering should be:

1. Points descending
2. Goal difference descending
3. Goals scored descending
4. Team name alphabetically as a final deterministic fallback

The implementation should keep the standings calculation on the backend.

The frontend should display the result rather than independently calculating league rankings.

---

# 19. Match Details Page

A spectator should be able to open any match.

The page should display:

## Header

```text
Premier League
Matchday 5

Arsenal
   2 - 1
Chelsea

67' LIVE
```

## Match information

- Date
- Stadium if available
- Referee if available
- Competition
- Season

## Match timeline

```text
67'  Substitution
61'  Yellow Card
45'  Goal
23'  Yellow Card
```

The timeline should be chronological.

---

# 20. Spectator Navigation

The main spectator application should provide navigation similar to:

```text
Home
Leagues
Live
Matches
Standings
```

### Home

Displays:

- Live matches
- Upcoming matches
- Recently finished matches
- Popular/featured leagues

### Leagues

Displays all available leagues.

### Live

Displays currently live matches.

### Matches

Displays upcoming and completed matches.

### Standings

Allows the spectator to select a league and season and view its standings.

---

# 21. Admin Dashboard

The admin dashboard should provide management interfaces.

Suggested navigation:

```text
Dashboard
Leagues
Seasons
Teams
Players
Matches
Match Events
```

The administrator should be able to create and manage the application's football data.

---

# 22. Admin Match Management

The administrator should be able to:

### Schedule a match

Provide:

- League
- Season
- Home team
- Away team
- Date/time

Initial status:

```text
SCHEDULED
```

### Start a match

Change status:

```text
SCHEDULED → LIVE
```

### Half-time

Change:

```text
LIVE → HALF_TIME
```

### Resume

Change:

```text
HALF_TIME → LIVE
```

### Finish

Change:

```text
LIVE → FINISHED
```

The final result should trigger the standings update.

---

# 23. Admin Live Match Interface

The administrator should have a practical interface for controlling a live match.

Example:

```text
Arsenal 2 - 1 Chelsea

67'

[ + Goal ]
[ + Yellow Card ]
[ + Red Card ]
[ + Substitution ]

[ Half Time ]
[ Finish Match ]
```

The admin should be able to select:

- Team
- Player
- Event type
- Match minute

For substitutions:

```text
Player OUT
Player IN
Minute
```

---

# 24. Business Rules

The backend must enforce important business rules.

### Rule 1

A team cannot play against itself.

```text
homeTeam != awayTeam
```

### Rule 2

A match belongs to exactly one league and season.

### Rule 3

Both teams must participate in the selected season.

### Rule 4

Only a live match can receive live match events.

### Rule 5

A finished match should not normally accept new live events.

### Rule 6

A goal increases the appropriate team's score.

### Rule 7

Standings are updated only when the match becomes officially finished.

### Rule 8

Deleting a team with existing matches should be prevented or handled explicitly.

### Rule 9

Only administrators can modify football data.

### Rule 10

Spectators have read-only access to football data.

---

# 25. Suggested Domain Model

The core entities are:

```text
User
League
Season
Team
Player
Match
MatchEvent
Standing
```

Relationships:

```text
League
  │
  └── Season
        │
        ├── Teams
        │
        ├── Matches
        │     │
        │     ├── Home Team
        │     ├── Away Team
        │     └── Match Events
        │
        └── Standings

Team
  │
  └── Players
```

---

# 26. Suggested API

The exact API design can be adapted to the chosen backend framework.

## Public endpoints

```http
GET /api/leagues
GET /api/leagues/{leagueId}
GET /api/leagues/{leagueId}/seasons
GET /api/seasons/{seasonId}/standings

GET /api/matches/live
GET /api/matches/upcoming
GET /api/matches/recent
GET /api/matches/{matchId}

GET /api/teams/{teamId}
GET /api/teams/{teamId}/players
```

## Admin endpoints

```http
POST   /api/admin/leagues
PUT    /api/admin/leagues/{id}
DELETE /api/admin/leagues/{id}

POST   /api/admin/seasons
PUT    /api/admin/seasons/{id}

POST   /api/admin/teams
PUT    /api/admin/teams/{id}
DELETE /api/admin/teams/{id}

POST   /api/admin/players
PUT    /api/admin/players/{id}
DELETE /api/admin/players/{id}

POST   /api/admin/matches
PUT    /api/admin/matches/{id}

POST   /api/admin/matches/{id}/start
POST   /api/admin/matches/{id}/half-time
POST   /api/admin/matches/{id}/resume
POST   /api/admin/matches/{id}/finish

POST   /api/admin/matches/{id}/events
DELETE /api/admin/matches/{id}/events/{eventId}
```

These endpoints are suggestions, not strict requirements.

---

# 27. Authentication and Authorization

Authentication should be implemented for administrators.

At minimum:

```text
ADMIN
SPECTATOR
```

Only administrators should have access to management operations.

Public spectator pages can remain accessible without authentication unless authentication is explicitly added later.

The backend must enforce authorization.

Frontend route protection alone is not sufficient.

---

# 28. Frontend Requirements

The frontend should be:

- Responsive
- Mobile-friendly
- Desktop-friendly
- Easy to navigate
- Fast
- Accessible

Important UI states should be clearly represented.

For example:

```text
LIVE
UPCOMING
HALF-TIME
FINISHED
POSTPONED
```

Live matches should have a visually distinct live indicator.

---

# 29. Backend Requirements

The backend should:

- Expose a REST API
- Validate incoming data
- Enforce authorization
- Implement business rules
- Manage database persistence
- Calculate standings
- Handle match events
- Publish real-time updates
- Return meaningful HTTP status codes
- Handle errors consistently

The backend should be the source of truth for scores and standings.

---

# 30. Database Requirements

The database should persist:

- Users
- Leagues
- Seasons
- Teams
- Players
- Matches
- Match events
- Standings

Foreign-key relationships should preserve data integrity.

The database schema should avoid unnecessary duplication.

---

# 31. Real-Time Requirements

The real-time system should allow multiple spectators to observe the same live match.

Example:

```text
100 spectators are watching:

Arsenal 1 - 0 Chelsea

Admin records:

Goal — Arsenal — 72'

↓

Backend updates database

↓

Backend broadcasts:

MATCH_SCORE_UPDATED

↓

100 connected spectators receive the update

↓

UI becomes:

Arsenal 2 - 0 Chelsea
```

The system should not require every spectator to manually refresh the page.

---

# 32. Error Handling

The application should handle common errors gracefully.

Examples:

```text
League not found
Team not found
Match not found
Invalid match status
Invalid team selection
Unauthorized operation
Player does not belong to selected team
Match already finished
Invalid event
```

The API should return appropriate HTTP status codes.

For example:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

---

# 33. MVP Scope

The first implementation should focus on these features:

### Spectator

- [x] Multiple leagues
- [x] Seasons
- [x] Teams
- [x] Live matches
- [x] Upcoming matches
- [x] Finished matches
- [x] Live scores
- [x] Match details
- [x] Goals
- [x] Yellow cards
- [x] Red cards
- [x] Substitutions
- [x] Match timeline
- [x] League standings

### Admin

- [x] League management
- [x] Season management
- [x] Team management
- [x] Player management
- [x] Match scheduling
- [x] Start/stop matches
- [x] Live score management
- [x] Match event management
- [x] Result correction

### Technical

- [x] REST API
- [x] Database
- [x] Authentication/authorization
- [x] Real-time updates
- [x] Responsive frontend

---

# 34. Out of Scope for MVP

Do not unnecessarily expand the project with:

- Betting
- Payments
- Fantasy football
- Social network features
- Private messaging
- Advanced AI
- Video streaming
- Full news articles
- Complex player analytics
- Push notifications
- External football API integration

These can be considered future features.

---

# 35. Future Enhancements

Possible future features include:

- Player statistics
- Top scorers
- Assists
- Team form
- Head-to-head statistics
- Search
- Favorites
- Notifications
- Push notifications
- Multiple languages
- Dark/light themes
- External football data providers
- Historical statistics
- Tournament/knockout competitions
- Advanced analytics

These should not interfere with the MVP implementation.

---

# 36. Recommended Development Strategy

The AI coding agent should implement the project incrementally.

Recommended order:

```text
1. Project structure
       ↓
2. Database/domain model
       ↓
3. Backend configuration
       ↓
4. League/season/team CRUD
       ↓
5. Player management
       ↓
6. Match management
       ↓
7. Match events
       ↓
8. Standings calculation
       ↓
9. Authentication/authorization
       ↓
10. Spectator frontend
       ↓
11. Admin frontend
       ↓
12. WebSocket/real-time updates
       ↓
13. Error handling
       ↓
14. Testing
       ↓
15. UI polish
```

The agent should **not attempt to implement the entire application in one step**.

Each phase should be implemented, tested, and verified before moving to the next phase.

---

# 37. Important Implementation Principle

The application should follow a clear separation of responsibilities:

```text
Frontend
   ↓
API
   ↓
Business Logic
   ↓
Persistence
   ↓
Database
```

The frontend should not contain authoritative business logic.

For example, the frontend should not decide that:

```text
Arsenal wins → +3 points
```

Instead:

```text
Frontend
   ↓
Backend
   ↓
Match finished
   ↓
Standings service
   ↓
Database
```

The backend should calculate and persist the official standings.

---

# 38. Definition of Done

The project can be considered complete when:

- A user can browse multiple leagues.
- A user can select a league and season.
- A user can view its teams.
- A user can see upcoming matches.
- A user can see live matches.
- A user can open a match's details.
- A user can see goals, cards and substitutions.
- Live match information updates without manually refreshing the page.
- A user can view the league standings.
- An administrator can manage the football data.
- An administrator can control a live match.
- Match results correctly update the standings.
- Unauthorized users cannot modify football data.
- The application works correctly on desktop and mobile.
- The backend validates important business rules.
- The application has appropriate error handling.
- The main functionality is covered by tests.

---

# 39. Product Vision

**LeagueScore** should feel like a lightweight, focused football live-score platform.

The primary experience should be:

> **Open the application → see what's happening now → follow a match live → inspect its events → check how the result affects the league table.**

The application should prioritize **clarity, real-time information, and simplicity** over unnecessary features.