import { db, seedAll } from './mockDb';
import { realtime } from './realtime';
export { realtime } from './realtime';
import {
  EventType,
  League,
  Match,
  MatchEvent,
  MatchStatus,
  Player,
  PlayerPosition,
  Season,
  StandingRow,
  Team,
} from './types';

/**
 * LeagueScore API client — the ONLY place the frontend talks to the backend (spec §26, §37).
 * Every function currently resolves against the in-memory mock (mockDb.ts) with simulated
 * latency, auth enforcement and backend business rules. When the real backend lands, only
 * this file changes: each mock body is swapped for a `fetch(...)` call.
 */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface Session {
  token: string;
  username: string;
}

let session: Session | null = null;
export const getSession = () => session;

seedAll();

const delay = (ms = 200) => new Promise<void>((r) => setTimeout(r, ms));
const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function requireAdmin(): Session {
  if (!session) throw new ApiError(401, 'Unauthorized. Administrator login required.');
  return session;
}

const teamById = (id: string): Team => {
  const t = db.teams.find((x) => x.id === id);
  if (!t) throw new ApiError(404, 'Team not found');
  return t;
};

const joinMatch = (row: (typeof db.matches)[number]): Match => ({
  id: row.id,
  leagueId: row.leagueId,
  seasonId: row.seasonId,
  homeTeam: teamById(row.homeTeamId),
  awayTeam: teamById(row.awayTeamId),
  kickoff: row.kickoff,
  status: row.status,
  minute: row.minute,
  homeScore: row.homeScore,
  awayScore: row.awayScore,
  events: db.events
    .filter((e) => e.matchId === row.id)
    .sort((a, b) => a.minute - b.minute || a.createdAt.localeCompare(b.createdAt)),
});

const getMatchRow = (id: string) => {
  const row = db.matches.find((m) => m.id === id);
  if (!row) throw new ApiError(404, 'Match not found');
  return row;
};

/** Rule 4: only a live match can receive live match events. */
function assertLive(matchId: string) {
  const row = getMatchRow(matchId);
  if (row.status !== 'LIVE') {
    throw new ApiError(409, 'Only a LIVE match can receive match events.');
  }
  return row;
}

/** Rule 3: both teams must participate in the selected season's league. */
function assertTeamsInSeason(seasonId: string, homeTeamId: string, awayTeamId: string) {
  const season = db.seasons.find((s) => s.id === seasonId);
  if (!season) throw new ApiError(404, 'Season not found');
  const country = db.leagues.find((l) => l.id === season.leagueId)?.country;
  for (const teamId of [homeTeamId, awayTeamId]) {
    if (teamById(teamId).country !== country) {
      throw new ApiError(400, 'Invalid team selection: both teams must play in this league.');
    }
  }
}


// ---------------------------------------------------------------------------
// Auth (spec §27 — only admins may modify football data)
// ---------------------------------------------------------------------------

export async function login(username: string, password: string): Promise<Session> {
  await delay();
  const user = db.users.find(
    (u) => u.username === username && u.password === password && u.role === 'ADMIN'
  );
  if (!user) throw new ApiError(401, 'Invalid credentials.');
  session = { token: uid('tkn'), username: user.username };
  return session;
}

export async function logout(): Promise<void> {
  await delay(80);
  session = null;
}

// ---------------------------------------------------------------------------
// Public endpoints
// ---------------------------------------------------------------------------

export async function getLeagues(): Promise<League[]> {
  await delay();
  return [...db.leagues];
}

export async function getSeasons(leagueId: string): Promise<Season[]> {
  await delay();
  return db.seasons.filter((s) => s.leagueId === leagueId);
}

export async function getLiveMatches(): Promise<Match[]> {
  await delay();
  return db.matches.filter((m) => m.status === 'LIVE' || m.status === 'HALF_TIME').map(joinMatch);
}

export async function getUpcomingMatches(): Promise<Match[]> {
  await delay();
  return db.matches
    .filter((m) => m.status === 'SCHEDULED' || m.status === 'POSTPONED')
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
    .map(joinMatch);
}

export async function getRecentMatches(): Promise<Match[]> {
  await delay();
  return db.matches
    .filter((m) => m.status === 'FINISHED')
    .sort((a, b) => b.kickoff.localeCompare(a.kickoff))
    .map(joinMatch);
}

export async function getSeasonMatches(seasonId: string): Promise<Match[]> {
  await delay();
  if (!db.seasons.some((season) => season.id === seasonId)) throw new ApiError(404, 'Season not found');
  return db.matches
    .filter((match) => match.seasonId === seasonId)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
    .map(joinMatch);
}

export async function getMatch(matchId: string): Promise<Match> {
  await delay();
  return joinMatch(getMatchRow(matchId));
}


/**
 * Standings are a BACKEND responsibility (spec §17/§18/§37): computed here from
 * FINISHED matches only, ordered points → GD → GF → team name.
 */
export async function getStandings(seasonId: string): Promise<StandingRow[]> {
  await delay(120);
  const table = new Map<string, StandingRow>();
  for (const m of db.matches) {
    if (m.seasonId !== seasonId || m.status !== 'FINISHED') continue;
    for (const [teamId, gf, ga] of [
      [m.homeTeamId, m.homeScore, m.awayScore],
      [m.awayTeamId, m.awayScore, m.homeScore],
    ] as const) {
      const row =
        table.get(teamId) ??
        ({
          team: teamById(teamId),
          position: 0,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        } as StandingRow);
      row.played += 1;
      row.goalsFor += gf;
      row.goalsAgainst += ga;
      row.goalDifference = row.goalsFor - row.goalsAgainst;
      if (gf > ga) {
        row.won += 1;
        row.points += 3; // win = 3 points
      } else if (gf === ga) {
        row.drawn += 1;
        row.points += 1; // draw = 1 point
      }
      table.set(teamId, row);
    }
  }
  return [...table.values()]
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.team.name.localeCompare(b.team.name)
    )
    .map((row, i) => ({ ...row, position: i + 1 }));
}

export async function getSeasonTeams(seasonId: string): Promise<Team[]> {
  await delay();
  const season = db.seasons.find((s) => s.id === seasonId);
  if (!season) throw new ApiError(404, 'Season not found');
  const country = db.leagues.find((l) => l.id === season.leagueId)?.country;
  return db.teams.filter((t) => t.country === country);
}

export async function getTeam(teamId: string): Promise<Team> {
  await delay();
  return teamById(teamId);
}

export async function getPlayers(teamId: string): Promise<Player[]> {
  await delay();
  if (!db.teams.some((t) => t.id === teamId)) throw new ApiError(404, 'Team not found');
  return db.players
    .filter((p) => p.teamId === teamId)
    .sort((a, b) => a.shirtNumber - b.shirtNumber);
}

// ---------------------------------------------------------------------------
// Admin endpoints — every one of these enforces authorization (Rule 9)
// ---------------------------------------------------------------------------

export async function createLeague(data: Pick<League, 'name' | 'country' | 'logo'>): Promise<League> {
  await delay();
  requireAdmin();
  if (db.leagues.some((l) => l.name.toLowerCase() === data.name.toLowerCase())) {
    throw new ApiError(409, 'A league with this name already exists.');
  }
  const league: League = { id: uid('lg'), ...data };
  db.leagues.push(league);
  return league;
}

export async function deleteLeague(id: string): Promise<void> {
  await delay();
  requireAdmin();
  const idx = db.leagues.findIndex((l) => l.id === id);
  if (idx === -1) throw new ApiError(404, 'League not found');
  if (db.matches.some((m) => m.leagueId === id)) {
    throw new ApiError(409, 'Cannot delete a league that still has matches.');
  }
  db.leagues.splice(idx, 1);
  db.seasons = db.seasons.filter((s) => s.leagueId !== id);
}

export async function createSeason(data: Pick<Season, 'leagueId' | 'label' | 'isCurrent'>): Promise<Season> {
  await delay();
  requireAdmin();
  if (!db.leagues.some((l) => l.id === data.leagueId)) throw new ApiError(404, 'League not found');
  const season: Season = { id: uid('sn'), ...data };
  if (season.isCurrent) {
    db.seasons.forEach((s) => {
      if (s.leagueId === season.leagueId) s.isCurrent = false;
    });
  }
  db.seasons.push(season);
  return season;
}

export async function createTeam(data: Pick<Team, 'name' | 'shortName' | 'crestUrl' | 'country'>): Promise<Team> {
  await delay();
  requireAdmin();
  if (db.teams.some((t) => t.name.toLowerCase() === data.name.toLowerCase())) {
    throw new ApiError(409, 'A team with this name already exists.');
  }
  const team: Team = { id: uid('tm'), ...data };
  db.teams.push(team);
  return team;
}

export async function deleteTeam(id: string): Promise<void> {
  await delay();
  requireAdmin();
  const idx = db.teams.findIndex((t) => t.id === id);
  if (idx === -1) throw new ApiError(404, 'Team not found');
  // Rule 8: deleting a team with existing matches is prevented.
  if (db.matches.some((m) => m.homeTeamId === id || m.awayTeamId === id)) {
    throw new ApiError(409, 'Cannot delete a team that has existing matches.');
  }
  db.teams.splice(idx, 1);
  db.players = db.players.filter((p) => p.teamId !== id);
}

export async function createPlayer(data: {
  teamId: string;
  firstName: string;
  lastName: string;
  shirtNumber: number;
  position: PlayerPosition;
}): Promise<Player> {
  await delay();
  requireAdmin();
  teamById(data.teamId);
  const player: Player = { id: uid('pl'), ...data };
  db.players.push(player);
  return player;
}

export async function deletePlayer(id: string): Promise<void> {
  await delay();
  requireAdmin();
  const idx = db.players.findIndex((p) => p.id === id);
  if (idx === -1) throw new ApiError(404, 'Player not found');
  db.players.splice(idx, 1);
}

export async function createMatch(data: {
  leagueId: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoff: string;
}): Promise<Match> {
  await delay();
  requireAdmin();
  assertTeamsInSeason(data.seasonId, data.homeTeamId, data.awayTeamId);
  if (data.homeTeamId === data.awayTeamId) {
    throw new ApiError(400, 'Invalid team selection: a team cannot play itself.');
  }
  const row = {
    id: uid('m'),
    ...data,
    status: 'SCHEDULED' as MatchStatus,
    minute: null,
    homeScore: 0,
    awayScore: 0,
  };
  db.matches.push(row);
  return joinMatch(row);
}

/** Correct match information / reschedule (spec §23). */
export async function updateMatch(
  id: string,
  data: Partial<Pick<Match, 'kickoff' | 'status' | 'homeScore' | 'awayScore'>>
): Promise<Match> {
  await delay();
  requireAdmin();
  const row = getMatchRow(id);
  Object.assign(row, data);
  realtime.publish({ type: 'MATCH_UPDATED', matchId: row.id });
  return joinMatch(row);
}

async function setMatchStatus(id: string, status: MatchStatus, minute: number | null): Promise<Match> {
  await delay();
  requireAdmin();
  const row = getMatchRow(id);
  if (row.status === 'FINISHED') throw new ApiError(409, 'Match already finished.');
  if (row.status === 'CANCELLED' || row.status === 'POSTPONED') {
    throw new ApiError(409, `Match is ${row.status.toLowerCase()} and cannot change status.`);
  }
  row.status = status;
  row.minute = minute;
  // Rule 7: standings refresh only when the match becomes officially finished.
  realtime.publish({ type: 'MATCH_UPDATED', matchId: row.id });
  return joinMatch(row);
}

export const startMatch = (id: string) => setMatchStatus(id, 'LIVE', 1);
export const halfTimeMatch = (id: string) => setMatchStatus(id, 'HALF_TIME', 45);
export const resumeMatch = (id: string) => setMatchStatus(id, 'LIVE', 46);
export const finishMatch = (id: string) => setMatchStatus(id, 'FINISHED', null);
export const postponeMatch = (id: string) => setMatchStatus(id, 'POSTPONED', null);
export const cancelMatch = (id: string) => setMatchStatus(id, 'CANCELLED', null);

export async function addMatchEvent(
  matchId: string,
  data: {
    type: EventType;
    minute: number;
    side: 'home' | 'away';
    playerName: string;
    playerOutName?: string;
    note?: string;
  }
): Promise<MatchEvent> {
  await delay();
  requireAdmin();
  const row = assertLive(matchId); // Rule 4
  if (data.type === 'SUBSTITUTION' && !data.playerOutName) {
    throw new ApiError(400, 'A substitution requires the player going off.');
  }
  if (!data.playerName?.trim()) throw new ApiError(400, 'An event requires a player.');
  const event: MatchEvent = {
    id: uid('ev'),
    matchId,
    type: data.type,
    minute: data.minute,
    side: data.side,
    playerName: data.playerName.trim(),
    playerOutName: data.playerOutName,
    note: data.note,
    createdAt: new Date().toISOString(),
  };
  db.events.push(event);
  // Rule 6: a goal increases the appropriate team's score (backend duty).
  if (data.type === 'GOAL') {
    if (data.side === 'home') row.homeScore += 1;
    else row.awayScore += 1;
    row.minute = Math.max(row.minute ?? 0, data.minute);
  }
  realtime.publish({ type: 'EVENT_ADDED', matchId, event });
  return event;
}

export async function deleteMatchEvent(matchId: string, eventId: string): Promise<Match> {
  await delay();
  requireAdmin();
  const row = getMatchRow(matchId);
  const idx = db.events.findIndex((e) => e.id === eventId && e.matchId === matchId);
  if (idx === -1) throw new ApiError(404, 'Match event not found');
  const removed = db.events[idx];
  // Correction: removing a goal event rolls the score back (backend duty).
  if (removed.type === 'GOAL') {
    if (removed.side === 'home') row.homeScore = Math.max(0, row.homeScore - 1);
    else row.awayScore = Math.max(0, row.awayScore - 1);
  }
  db.events.splice(idx, 1);
  realtime.publish({ type: 'EVENT_DELETED', matchId, eventId });
  return joinMatch(row);
}

// ---------------------------------------------------------------------------
// Real-time simulation (stands in for the backend clock + WebSocket pushes)
// ---------------------------------------------------------------------------

let simTimer: ReturnType<typeof setInterval> | null = null;
let autoEvents = false;

/** Tick every LIVE match's minute and broadcast — mimics backend minute updates. */
export function startRealtimeSimulation() {
  if (simTimer) return;
  simTimer = setInterval(async () => {
    for (const row of db.matches) {
      if (row.status !== 'LIVE') continue;
      row.minute = Math.min(95, (row.minute ?? 0) + 1);
      realtime.publish({ type: 'MATCH_UPDATED', matchId: row.id });

      // Optional demo generator: occasional live events.
      if (autoEvents && row.minute < 90 && Math.random() < 0.06) {
        const type: EventType = Math.random() < 0.7 ? 'GOAL' : 'YELLOW_CARD';
        const side = Math.random() < 0.5 ? 'home' : 'away';
        const t = teamById(side === 'home' ? row.homeTeamId : row.awayTeamId);
        const squad = db.players.filter((p) => p.teamId === t.id);
        const player = squad[Math.floor(Math.random() * squad.length)];
        if (player) {
          try {
            await addMatchEvent(row.id, {
              type,
              minute: row.minute,
              side,
              playerName: `${player.firstName} ${player.lastName}`,
              note: 'Auto-simulated by the demo generator',
            });
          } catch {
            /* simulation only */
          }
        }
      }
    }
  }, 5000);
}

export function stopRealtimeSimulation() {
  if (simTimer) clearInterval(simTimer);
  simTimer = null;
}

export function setAutoEvents(enabled: boolean) {
  autoEvents = enabled;
}

export function isAutoEventsEnabled() {
  return autoEvents;
}
