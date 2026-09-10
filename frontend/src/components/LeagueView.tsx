import React, { useEffect, useMemo, useState } from 'react';
import { getSeasonMatches, getSeasons, getSeasonTeams } from '../api/api';
import { League, Match, Season, Team } from '../types';
import { ClubCrest } from './ClubCrest';
import { MatchListItem } from './MatchListItem';
import { EmptyState } from './StatusBadge';
import { Calendar, CheckCircle2, Users } from 'lucide-react';

interface LeagueViewProps {
  leagues: League[];
  selectedLeagueId: string | null;
  onSelectLeague: (leagueId: string) => void;
  onOpenMatch: (id: string) => void;
}

/**
 * League page (spec §4/§5/§6): league + season selection, fixtures & results,
 * participating teams.
 */
export const LeagueView: React.FC<LeagueViewProps> = ({
  leagues,
  selectedLeagueId,
  onSelectLeague,
  onOpenMatch,
}) => {
  const league = leagues.find((l) => l.id === selectedLeagueId) ?? leagues[0];
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tab, setTab] = useState<'fixtures' | 'results' | 'teams'>('fixtures');

  useEffect(() => {
    if (!league) return;
    getSeasons(league.id).then((s) => {
      setSeasons(s);
      setSeasonId((s.find((x) => x.isCurrent) ?? s[0])?.id ?? null);
    });
  }, [league?.id]);

  useEffect(() => {
    if (!seasonId) return;
    setMatches(null);
    getSeasonMatches(seasonId).then(setMatches);
    getSeasonTeams(seasonId).then(setTeams);
  }, [seasonId]);

  const fixtures = useMemo(
    () => (matches ?? []).filter((m) => m.status === 'SCHEDULED'),
    [matches]
  );
  const results = useMemo(
    () => (matches ?? []).filter((m) => m.status === 'FINISHED').reverse(),
    [matches]
  );
  const liveHere = useMemo(
    () => (matches ?? []).filter((m) => m.status === 'LIVE' || m.status === 'HALF_TIME'),
    [matches]
  );
  const tabs = [
    { id: 'fixtures' as const, label: 'Fixtures', icon: <Calendar className="w-4 h-4" />, count: fixtures.length },
    { id: 'results' as const, label: 'Results', icon: <CheckCircle2 className="w-4 h-4" />, count: results.length },
    { id: 'teams' as const, label: 'Teams', icon: <Users className="w-4 h-4" />, count: teams.length },
  ];

  if (!league) return <EmptyState message="No leagues available" />;

  return (
    <div className="space-y-6">
      {/* Header with league + season selection (spec §5) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#3b4b3d]/30">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            {league.logo.startsWith('http') ? (
              <img src={league.logo} alt="" className="h-8 w-8 object-contain" />
            ) : (
              <span className="text-3xl">{league.logo}</span>
            )}
            {league.name}
          </h2>
          <p className="font-mono-tabular text-xs text-[#b9cbb9] uppercase tracking-wider mt-1">
            {league.country}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-mono-tabular text-xs text-[#b9cbb9] uppercase">Season:</label>
          <select
            value={seasonId ?? ''}
            onChange={(e) => setSeasonId(e.target.value)}
            className="appearance-none bg-[#181c24] text-white text-sm font-semibold rounded-lg border border-[#3b4b3d]/50 px-4 py-2 cursor-pointer focus:border-[#00ff87] focus:outline-none"
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}{s.isCurrent ? ' ★' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* League quick-switch */}
      <div className="flex flex-wrap gap-2">
        {leagues.map((l) => (
          <button
            key={l.id}
            onClick={() => onSelectLeague(l.id)}
            className={`px-3 py-1.5 rounded-full font-mono-tabular text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
              l.id === league.id
                ? 'bg-[#00ff87]/15 border-[#00ff87]/60 text-[#00ff87]'
                : 'bg-[#181c24] border-[#3b4b3d]/40 text-[#b9cbb9] hover:text-white'
            }`}
          >
            {l.logo.startsWith('http') ? (
              <img src={l.logo} alt="" className="h-4 w-4 object-contain" />
            ) : (
              l.logo
            )}{' '}{l.name}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Tab key={t.id} active={tab === t.id} onClick={() => setTab(t.id)} icon={t.icon} count={t.count}>
            {t.label}
          </Tab>
        ))}
      </div>

      {liveHere.length > 0 && tab === 'fixtures' && (
        <section className="space-y-3">
          <h3 className="font-heading text-lg font-bold text-[#00ff87] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00ff87] animate-pulse" /> In play now
          </h3>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {liveHere.map((m) => (
              <MatchListItem key={m.id} match={m} leagueLabel={league.name} onOpen={onOpenMatch} />
            ))}
          </div>
        </section>
      )}

      {tab === 'fixtures' && (
        <MatchList
          items={[...fixtures].sort((a, b) => a.kickoff.localeCompare(b.kickoff))}
          emptyMessage="No upcoming fixtures in this season"
          onOpenMatch={onOpenMatch}
        />
      )}

      {tab === 'results' && (
        <MatchList items={results} emptyMessage="No finished matches yet" onOpenMatch={onOpenMatch} />
      )}

      {tab === 'teams' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {teams.map((t) => (
            <div key={t.id} className="p-4 rounded-xl bg-[#181c24] border border-[#3b4b3d]/30 flex items-center gap-3">
              <ClubCrest name={t.name} url={t.crestUrl} size="lg" />
              <div className="min-w-0">
                <p className="font-heading font-bold text-white truncate">{t.name}</p>
                <p className="font-mono-tabular text-[11px] text-[#b9cbb9] uppercase tracking-wider">
                  {t.shortName} · {t.country}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MatchList: React.FC<{ items: Match[]; emptyMessage: string; onOpenMatch: (id: string) => void }> = ({
  items,
  emptyMessage,
  onOpenMatch,
}) =>
  items.length === 0 ? (
    <EmptyState message={emptyMessage} />
  ) : (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {items.map((m) => (
        <MatchListItem key={m.id} match={m} onOpen={onOpenMatch} />
      ))}
    </div>
  );

const Tab: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}> = ({ active, onClick, icon, count, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-bold text-xs uppercase tracking-wider border transition-all active:scale-95 cursor-pointer ${
      active
        ? 'bg-[#262a33] border-[#00ff87]/60 text-[#00ff87]'
        : 'bg-[#181c24] border-[#3b4b3d]/30 text-[#b9cbb9] hover:text-white'
    }`}
  >
    {icon}
    {children}
    <span className="px-1.5 py-0.5 rounded bg-[#0a0e16] text-[10px] font-mono-tabular">{count}</span>
  </button>
);
