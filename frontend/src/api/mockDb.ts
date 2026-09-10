import { League, MatchEvent, Player, Season, Team } from './types';

export interface MatchRow {
  id: string;
  leagueId: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoff: string;
  status: MatchRowStatus;
  minute: number | null;
  homeScore: number;
  awayScore: number;
}

type MatchRowStatus = 'SCHEDULED' | 'LIVE' | 'HALF_TIME' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
export type MatchEventRow = MatchEvent;

export const db = {
  users: [{ username: 'admin', password: 'admin', role: 'ADMIN' }],
  leagues: [] as League[],
  seasons: [] as Season[],
  teams: [] as Team[],
  players: [] as Player[],
  matches: [] as MatchRow[],
  events: [] as MatchEventRow[],
};

const at = (dayOffset: number, hour: number, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export function seedAll() {
  db.leagues = [
    { id: 'lg-pl', name: 'Premier League', country: 'England', logo: '🏴' },
    { id: 'lg-es', name: 'La Liga', country: 'Spain', logo: '🇪🇸' },
    { id: 'lg-de', name: 'Bundesliga', country: 'Germany', logo: '🇩🇪' },
  ];
  db.seasons = [
    { id: 'sn-pl-26', leagueId: 'lg-pl', label: '2025/2026', isCurrent: true },
    { id: 'sn-pl-27', leagueId: 'lg-pl', label: '2026/2027', isCurrent: false },
    { id: 'sn-es-26', leagueId: 'lg-es', label: '2025/2026', isCurrent: true },
    { id: 'sn-de-26', leagueId: 'lg-de', label: '2025/2026', isCurrent: true },
  ];
  const clubs: Array<[string, string, string, string]> = [
    ['tm-ars', 'Arsenal', 'ARS', 'England'], ['tm-che', 'Chelsea', 'CHE', 'England'],
    ['tm-liv', 'Liverpool', 'LIV', 'England'], ['tm-mci', 'Manchester City', 'MCI', 'England'],
    ['tm-mun', 'Manchester United', 'MUN', 'England'], ['tm-tot', 'Tottenham Hotspur', 'TOT', 'England'],
    ['tm-new', 'Newcastle United', 'NEW', 'England'], ['tm-avl', 'Aston Villa', 'AVL', 'England'],
    ['tm-bha', 'Brighton', 'BHA', 'England'], ['tm-whu', 'West Ham United', 'WHU', 'England'],
    ['tm-rma', 'Real Madrid', 'RMA', 'Spain'], ['tm-fcb', 'Barcelona', 'BAR', 'Spain'],
    ['tm-atm', 'Atletico Madrid', 'ATM', 'Spain'], ['tm-atb', 'Athletic Bilbao', 'ATH', 'Spain'],
    ['tm-rsb', 'Real Sociedad', 'RSO', 'Spain'], ['tm-vil', 'Villarreal', 'VIL', 'Spain'],
    ['tm-sev', 'Sevilla', 'SEV', 'Spain'], ['tm-bay', 'Bayern Munich', 'FCB', 'Germany'],
    ['tm-bvb', 'Borussia Dortmund', 'BVB', 'Germany'], ['tm-b04', 'Bayer Leverkusen', 'B04', 'Germany'],
    ['tm-rbl', 'RB Leipzig', 'RBL', 'Germany'], ['tm-sge', 'Eintracht Frankfurt', 'SGE', 'Germany'],
  ];
  db.teams = clubs.map(([id, name, shortName, country]) => ({ id, name, shortName, country, crestUrl: '' }));
  db.players = clubs.map(([id, name], index) => ({
    id: `pl-${index}`, teamId: id, firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' ') || 'Player',
    shirtNumber: 10, position: 'FORWARD' as const,
  }));
  db.matches = [
    ['m-f1', 'lg-pl', 'sn-pl-26', 'tm-mci', 'tm-whu', -14, 3, 1, 'FINISHED'],
    ['m-f2', 'lg-pl', 'sn-pl-26', 'tm-avl', 'tm-bha', -14, 2, 2, 'FINISHED'],
    ['m-f3', 'lg-pl', 'sn-pl-26', 'tm-tot', 'tm-mun', -13, 1, 2, 'FINISHED'],
    ['m-f4', 'lg-pl', 'sn-pl-26', 'tm-new', 'tm-liv', -7, 1, 3, 'FINISHED'],
    ['m-f5', 'lg-pl', 'sn-pl-26', 'tm-che', 'tm-ars', -7, 1, 2, 'FINISHED'],
    ['m-1', 'lg-pl', 'sn-pl-26', 'tm-ars', 'tm-che', 0, 2, 1, 'LIVE'],
    ['m-2', 'lg-pl', 'sn-pl-26', 'tm-liv', 'tm-mci', 0, 0, 0, 'LIVE'],
    ['m-3', 'lg-es', 'sn-es-26', 'tm-rma', 'tm-atm', 0, 1, 1, 'HALF_TIME'],
    ['m-s1', 'lg-pl', 'sn-pl-26', 'tm-new', 'tm-bha', 1, 0, 0, 'SCHEDULED'],
    ['m-s2', 'lg-pl', 'sn-pl-26', 'tm-tot', 'tm-avl', 1, 0, 0, 'SCHEDULED'],
    ['m-s3', 'lg-es', 'sn-es-26', 'tm-rsb', 'tm-vil', 1, 0, 0, 'SCHEDULED'],
    ['m-p1', 'lg-es', 'sn-es-26', 'tm-sev', 'tm-atb', 2, 0, 0, 'POSTPONED'],
  ].map(([id, leagueId, seasonId, homeTeamId, awayTeamId, day, homeScore, awayScore, status]) => ({
    id: id as string, leagueId: leagueId as string, seasonId: seasonId as string,
    homeTeamId: homeTeamId as string, awayTeamId: awayTeamId as string, kickoff: at(day as number, 20),
    status: status as MatchRowStatus, minute: status === 'LIVE' ? (id === 'm-1' ? 67 : 34) : status === 'HALF_TIME' ? 45 : null,
    homeScore: homeScore as number, awayScore: awayScore as number,
  }));
  db.events = [
    ['ev-1a', 'm-1', 'GOAL', 14, 'home', 'Bukayo Saka'],
    ['ev-1b', 'm-1', 'YELLOW_CARD', 31, 'away', 'Moises Caicedo'],
    ['ev-1c', 'm-1', 'GOAL', 42, 'away', 'Cole Palmer'],
    ['ev-1d', 'm-1', 'GOAL', 58, 'home', 'Gabriel Martinelli'],
    ['ev-2a', 'm-2', 'YELLOW_CARD', 22, 'home', 'Virgil van Dijk'],
  ].map(([id, matchId, type, minute, side, playerName]) => ({
    id, matchId, type, minute, side, playerName, createdAt: new Date().toISOString(),
  } as MatchEventRow));
}
