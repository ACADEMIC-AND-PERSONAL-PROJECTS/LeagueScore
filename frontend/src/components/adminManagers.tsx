import React, { useEffect, useState } from 'react';
import * as api from '../api/api';
import { EventType, League, Match, Player, PlayerPosition, Season, Team } from '../types';
import { EmptyState, StatusBadge } from './StatusBadge';

type Notify = (title: string, description?: string) => void;
const input = 'w-full rounded-lg border border-[#3b4b3d]/50 bg-[#0a0e16] px-3 py-2 text-sm text-white focus:border-[#00ff87] focus:outline-none';
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'danger' }> = ({ tone, className = '', ...props }) => (
  <button {...props} className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-40 ${tone === 'primary' ? 'bg-[#00ff87] text-[#00210c]' : tone === 'danger' ? 'border border-red-500/40 bg-red-950/60 text-red-300' : 'border border-[#3b4b3d]/50 bg-[#262a33] text-white'} ${className}`} />
);
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => <label className="space-y-1"><span className="block text-[10px] uppercase tracking-wider text-[#b9cbb9]">{label}</span>{children}</label>;
const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => <section className="space-y-3 rounded-xl border border-[#3b4b3d]/30 bg-[#181c24] p-4"><h3 className="font-heading font-bold uppercase tracking-wider text-white">{title}</h3>{children}</section>;
const safe = async (notify: Notify, operation: () => Promise<void>) => { try { await operation(); } catch (error) { notify('Operation failed', error instanceof Error ? error.message : 'Please retry.'); } };

export const LiveConsole: React.FC<{ onNotify: Notify }> = ({ onNotify }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selected, setSelected] = useState('');
  const [type, setType] = useState<EventType>('GOAL');
  const [side, setSide] = useState<'home' | 'away'>('home');
  const [minute, setMinute] = useState(70);
  const [player, setPlayer] = useState('');
  const [playerOut, setPlayerOut] = useState('');
  const refresh = async () => { const [live, upcoming] = await Promise.all([api.getLiveMatches(), api.getUpcomingMatches()]); setMatches([...live, ...upcoming]); setSelected((current) => current || live[0]?.id || upcoming[0]?.id || ''); };
  useEffect(() => { refresh(); }, []);
  const match = matches.find((item) => item.id === selected);
  const run = (operation: () => Promise<void>) => safe(onNotify, async () => { await operation(); await refresh(); });
  return <div className="grid gap-4 lg:grid-cols-2"><Card title="Live match control">
    <Field label="Match"><select className={input} value={selected} onChange={(event) => setSelected(event.target.value)}>{matches.map((item) => <option key={item.id} value={item.id}>{item.homeTeam.name} {item.homeScore}-{item.awayScore} {item.awayTeam.name}</option>)}</select></Field>
    {match && <><div className="flex items-center justify-between rounded-lg bg-[#0a0e16] p-3 text-sm text-white"><span>{match.homeTeam.name} — {match.awayTeam.name}</span><StatusBadge status={match.status} minute={match.minute} /></div><div className="flex flex-wrap gap-2"><Button onClick={() => run(async () => { await api.startMatch(match.id); onNotify('Match started'); })} disabled={match.status !== 'SCHEDULED'}>Start</Button><Button onClick={() => run(async () => { await api.halfTimeMatch(match.id); onNotify('Half-time'); })} disabled={match.status !== 'LIVE'}>Half-time</Button><Button onClick={() => run(async () => { await api.resumeMatch(match.id); onNotify('Match resumed'); })} disabled={match.status !== 'HALF_TIME'}>Resume</Button><Button tone="primary" onClick={() => run(async () => { await api.finishMatch(match.id); onNotify('Match finished'); })} disabled={match.status !== 'LIVE' && match.status !== 'HALF_TIME'}>Finish</Button></div></>}
  </Card><Card title="Add match event">
    {!match || (match.status !== 'LIVE' && match.status !== 'HALF_TIME') ? <EmptyState message="Select a live match to add events" /> : <><div className="grid grid-cols-2 gap-2"><Field label="Event type"><select className={input} value={type} onChange={(event) => setType(event.target.value as EventType)}>{['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Team"><select className={input} value={side} onChange={(event) => setSide(event.target.value as 'home' | 'away')}><option value="home">{match.homeTeam.shortName}</option><option value="away">{match.awayTeam.shortName}</option></select></Field><Field label="Minute"><input className={input} type="number" min="1" max="120" value={minute} onChange={(event) => setMinute(Number(event.target.value))} /></Field><Field label="Player in / event"><input className={input} value={player} onChange={(event) => setPlayer(event.target.value)} placeholder="Player name" /></Field>{type === 'SUBSTITUTION' && <Field label="Player out"><input className={input} value={playerOut} onChange={(event) => setPlayerOut(event.target.value)} /></Field>}</div><Button tone="primary" onClick={() => run(async () => { await api.addMatchEvent(match.id, { type, side, minute, playerName: player, playerOutName: playerOut || undefined }); onNotify('Event added'); setPlayer(''); setPlayerOut(''); })}>Add event</Button></>}
  </Card></div>;
};

export const MatchesManager: React.FC<{ onNotify: Notify }> = ({ onNotify }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const refresh = async () => setMatches([...(await api.getLiveMatches()), ...(await api.getUpcomingMatches()), ...(await api.getRecentMatches())]);
  useEffect(() => { refresh(); }, []);
  return <Card title="Scheduled matches"><Button tone="primary" onClick={() => onNotify('Use the mock API to schedule matches', 'The schedule form is ready for the backend contract.')}>Schedule a match</Button>{matches.length === 0 ? <EmptyState message="No matches" /> : <div className="space-y-2">{matches.map((match) => <div key={match.id} className="flex items-center justify-between rounded-lg bg-[#0a0e16] p-3 text-sm text-white"><span>{match.homeTeam.name} — {match.awayTeam.name}</span><StatusBadge status={match.status} minute={match.minute} /></div>)}</div>}</Card>;
};

export const SquadsManager: React.FC<{ onNotify: Notify }> = ({ onNotify }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [team, setTeam] = useState('');
  const [selected, setSelected] = useState('');
  const refresh = async () => { const leagues = await api.getLeagues(); const seasons = await Promise.all(leagues.map((league) => api.getSeasons(league.id))); const result = await Promise.all(seasons.flat().map((season) => api.getSeasonTeams(season.id))); setTeams([...new Map(result.flat().map((item) => [item.id, item])).values()]); };
  useEffect(() => { refresh(); }, []);
  useEffect(() => { if (selected) api.getPlayers(selected).then(setPlayers); }, [selected]);
  return <div className="grid gap-4 lg:grid-cols-2"><Card title="Teams"><div className="flex gap-2"><input className={input} value={team} onChange={(event) => setTeam(event.target.value)} placeholder="Team name" /><Button tone="primary" onClick={() => safe(onNotify, async () => { await api.createTeam({ name: team, shortName: team.slice(0, 3).toUpperCase(), country: 'England', crestUrl: '' }); setTeam(''); await refresh(); onNotify('Team created'); })}>Create</Button></div><div className="space-y-1">{teams.map((item) => <button key={item.id} onClick={() => setSelected(item.id)} className="block w-full rounded-lg bg-[#0a0e16] p-2 text-left text-sm text-white hover:text-[#00ff87]">{item.name}</button>)}</div></Card><Card title="Players"><p className="text-xs text-[#b9cbb9]">Selected team: {teams.find((item) => item.id === selected)?.name || 'none'}</p>{players.length ? players.map((item) => <div key={item.id} className="flex justify-between text-sm text-white"><span>{item.firstName} {item.lastName}</span><span className="text-[#b9cbb9]">#{item.shirtNumber}</span></div>) : <EmptyState message="Select a team" />}</Card></div>;
};

export const CompetitionsManager: React.FC<{ onNotify: Notify }> = ({ onNotify }) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  useEffect(() => { api.getLeagues().then(setLeagues); }, []);
  useEffect(() => { Promise.all(leagues.map((league) => api.getSeasons(league.id))).then((result) => setSeasons(result.flat())); }, [leagues]);
  return <Card title="Leagues and seasons"><Button tone="primary" onClick={() => safe(onNotify, async () => { await api.createLeague({ name: `New League ${leagues.length + 1}`, country: 'England', logo: '🏆' }); setLeagues(await api.getLeagues()); onNotify('League created'); })}>Create league</Button><div className="grid gap-2 sm:grid-cols-2">{leagues.map((league) => <div key={league.id} className="rounded-lg bg-[#0a0e16] p-3 text-sm text-white">{league.logo} {league.name}<p className="mt-1 text-xs text-[#b9cbb9]">{seasons.filter((season) => season.leagueId === league.id).map((season) => season.label).join(', ') || 'No seasons'}</p></div>)}</div></Card>;
};
