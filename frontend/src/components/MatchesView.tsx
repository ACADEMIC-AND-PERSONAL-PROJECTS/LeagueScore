import React, { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Radio } from 'lucide-react';
import { League, Match } from '../types';
import { MatchListItem } from './MatchListItem';
import { EmptyState, LiveDot } from './StatusBadge';

interface MatchesViewProps {
  leagues: League[];
  liveMatches: Match[];
  upcomingMatches: Match[];
  recentMatches: Match[];
  mode: 'live' | 'matches';
  onOpenMatch: (id: string) => void;
}

/** Dedicated spectator views required by the navigation in spec §20. */
export const MatchesView: React.FC<MatchesViewProps> = ({
  leagues,
  liveMatches,
  upcomingMatches,
  recentMatches,
  mode,
  onOpenMatch,
}) => {
  const [leagueId, setLeagueId] = useState('ALL');
  const filter = (items: Match[]) =>
    leagueId === 'ALL' ? items : items.filter((match) => match.leagueId === leagueId);
  const live = filter(liveMatches);
  const upcoming = filter(upcomingMatches);
  const recent = filter(recentMatches);
  const label = (match: Match) => {
    const league = leagues.find((item) => item.id === match.leagueId);
    return league ? `${league.logo} ${league.name}` : 'League';
  };
  const matches = useMemo(() => (mode === 'live' ? live : [...upcoming, ...recent]), [mode, live, upcoming, recent]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#3b4b3d]/30 pb-4">
        <div>
          <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#00ff87]">Spectator center</p>
          <h1 className="font-heading text-3xl font-extrabold text-white">
            {mode === 'live' ? 'Live matches' : 'Matches'}
          </h1>
          <p className="mt-1 text-sm text-[#b9cbb9]">
            {mode === 'live' ? 'Follow every match currently in play.' : 'Browse upcoming fixtures and completed results.'}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-mono-tabular uppercase text-[#b9cbb9]">
          League
          <select value={leagueId} onChange={(event) => setLeagueId(event.target.value)} className="rounded-lg border border-[#3b4b3d]/50 bg-[#181c24] px-3 py-2 text-sm normal-case text-white focus:border-[#00ff87] focus:outline-none">
            <option value="ALL">All leagues</option>
            {leagues.map((league) => <option key={league.id} value={league.id}>{league.name}</option>)}
          </select>
        </label>
      </header>

      {mode === 'live' ? (
        <MatchSection title="Live now" icon={<LiveDot />} matches={matches} label={label} onOpenMatch={onOpenMatch} empty="No matches are live right now." />
      ) : (
        <>
          <MatchSection title="Upcoming fixtures" icon={<Calendar className="h-5 w-5 text-[#00e3fd]" />} matches={upcoming} label={label} onOpenMatch={onOpenMatch} empty="No upcoming fixtures." />
          <MatchSection title="Finished matches" icon={<CheckCircle2 className="h-5 w-5 text-[#b9cbb9]" />} matches={recent} label={label} onOpenMatch={onOpenMatch} empty="No finished matches yet." />
        </>
      )}
    </div>
  );
};

const MatchSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  matches: Match[];
  label: (match: Match) => string;
  onOpenMatch: (id: string) => void;
  empty: string;
}> = ({ title, icon, matches, label, onOpenMatch, empty }) => (
  <section className="space-y-3">
    <h2 className="flex items-center gap-2 font-heading text-xl font-bold uppercase tracking-tight text-white">{icon}{title}<span className="font-mono-tabular text-xs font-normal text-[#b9cbb9]">({matches.length})</span></h2>
    {matches.length === 0 ? <EmptyState message={empty} /> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{matches.map((match) => <MatchListItem key={match.id} match={match} leagueLabel={label(match)} onOpen={onOpenMatch} />)}</div>}
  </section>
);
