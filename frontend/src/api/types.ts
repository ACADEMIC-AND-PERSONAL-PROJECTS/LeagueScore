/**
 * LeagueScore — centralized domain types (mirrors the backend contract in _docs/specs.md §25-§26).
 * All frontend data access goes through ./api.ts; these types are its public contract.
 */

export type MatchStatus =
  | 'SCHEDULED'
  | 'LIVE'
  | 'HALF_TIME'
  | 'FINISHED'
  | 'POSTPONED'
  | 'CANCELLED';

export type EventType = 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';

export type PlayerPosition = 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD';

export interface League {
  id: string;
  name: string;
  country: string;
  logo: string; // emoji placeholder until real logos exist
}

export interface Season {
  id: string;
  leagueId: string;
  label: string; // e.g. "2025/2026"
  isCurrent: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  crestUrl: string;
  country: string;
}

export interface Player {
  id: string;
  teamId: string;
  firstName: string;
  lastName: string;
  shirtNumber: number;
  position: PlayerPosition;
}

/** Match as exposed by the API: identifiers joined into embedded views for display. */
export interface Match {
  id: string;
  leagueId: string;
  seasonId: string;
  homeTeam: Team;
  awayTeam: Team;
  kickoff: string; // ISO datetime
  status: MatchStatus;
  minute: number | null; // live match minute (null unless LIVE/HALF_TIME)
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
}

export interface MatchEvent {
  id: string;
  matchId: string;
  type: EventType;
  minute: number;
  side: 'home' | 'away';
  playerName: string;
  /** For SUBSTITUTION: the player coming off (playerName is the player coming on). */
  playerOutName?: string;
  note?: string;
  createdAt: string;
}

export interface StandingRow {
  team: Team;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

/** Real-time payloads broadcast to connected spectators (WebSocket stand-in). */
export type RealtimeEvent =
  | { type: 'MATCH_UPDATED'; matchId: string }
  | { type: 'EVENT_ADDED'; matchId: string; event: MatchEvent }
  | { type: 'EVENT_DELETED'; matchId: string; eventId: string };
