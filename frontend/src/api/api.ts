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

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');

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

let session: Session | null = (() => {
  const stored = localStorage.getItem('leaguescore-session');
  return stored ? JSON.parse(stored) as Session : null;
})();

export const getSession = () => session;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (session) headers.set('Authorization', `Bearer ${session.token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.message ?? message;
    } catch {
      // Preserve the HTTP status when the server did not return JSON.
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  body: JSON.stringify(body),
});

export async function login(username: string, password: string): Promise<Session> {
  session = await request<Session>('/auth/login', json({ username, password }));
  localStorage.setItem('leaguescore-session', JSON.stringify(session));
  return session;
}

export async function logout(): Promise<void> {
  await request<void>('/auth/logout', { method: 'POST' });
  session = null;
  localStorage.removeItem('leaguescore-session');
}

export const getLeagues = () => request<League[]>('/leagues');
export const getSeasons = (leagueId: string) => request<Season[]>(`/leagues/${leagueId}/seasons`);
export const getLiveMatches = () => request<Match[]>('/matches/live');
export const getUpcomingMatches = () => request<Match[]>('/matches/upcoming');
export const getRecentMatches = () => request<Match[]>('/matches/recent');
export const getSeasonMatches = (seasonId: string) => request<Match[]>(`/seasons/${seasonId}/matches`);
export const getMatch = (matchId: string) => request<Match>(`/matches/${matchId}`);
export const getStandings = (seasonId: string) => request<StandingRow[]>(`/seasons/${seasonId}/standings`);
export const getSeasonTeams = (seasonId: string) => request<Team[]>(`/seasons/${seasonId}/teams`);
export const getTeam = (teamId: string) => request<Team>(`/teams/${teamId}`);
export const getPlayers = (teamId: string) => request<Player[]>(`/teams/${teamId}/players`);

export const createLeague = (data: Pick<League, 'name' | 'country' | 'logo'>) =>
  request<League>('/leagues', { ...json(data) });
export const updateLeague = (id: string, data: Pick<League, 'name' | 'country' | 'logo'>) =>
  request<League>(`/leagues/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteLeague = (id: string) => request<void>(`/leagues/${id}`, { method: 'DELETE' });

export const createSeason = (data: Pick<Season, 'leagueId' | 'label' | 'isCurrent'>) =>
  request<Season>('/leagues/' + data.leagueId + '/seasons', { ...json(data) });

export const createTeam = (data: Pick<Team, 'name' | 'shortName' | 'crestUrl' | 'country'>) =>
  request<Team>('/teams', { ...json(data) });
export const updateTeam = (id: string, data: Pick<Team, 'name' | 'shortName' | 'crestUrl' | 'country'>) =>
  request<Team>(`/teams/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteTeam = (id: string) => request<void>(`/teams/${id}`, { method: 'DELETE' });

export const createPlayer = (data: {
  teamId: string;
  firstName: string;
  lastName: string;
  shirtNumber: number;
  position: PlayerPosition;
}) => request<Player>(`/teams/${data.teamId}/players`, { ...json(data) });
export const updatePlayer = (id: string, data: Parameters<typeof createPlayer>[0]) =>
  request<Player>(`/players/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deletePlayer = (id: string) => request<void>(`/players/${id}`, { method: 'DELETE' });

export const createMatch = (data: {
  leagueId: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoff: string;
}) => request<Match>('/matches', { ...json(data) });

export const updateMatch = (
  id: string,
  data: Partial<Pick<Match, 'kickoff' | 'status' | 'homeScore' | 'awayScore'>>,
) => request<Match>(`/matches/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

const transition = (id: string, action: string) => request<Match>(`/matches/${id}/${action}`, { ...json({}) });
export const startMatch = (id: string) => transition(id, 'start');
export const halfTimeMatch = (id: string) => transition(id, 'half-time');
export const resumeMatch = (id: string) => transition(id, 'resume');
export const finishMatch = (id: string) => transition(id, 'finish');
export const postponeMatch = (id: string) => transition(id, 'postpone');
export const cancelMatch = (id: string) => transition(id, 'cancel');

export const addMatchEvent = (
  matchId: string,
  data: {
    type: EventType;
    minute: number;
    side: 'home' | 'away';
    playerName: string;
    playerOutName?: string;
    note?: string;
  },
) => request<MatchEvent>(`/matches/${matchId}/events`, { ...json(data) });

export const deleteMatchEvent = (matchId: string, eventId: string) =>
  request<Match>(`/matches/${matchId}/events/${eventId}`, { method: 'DELETE' });

export function startRealtimeSimulation() {
  realtime.connect();
}
