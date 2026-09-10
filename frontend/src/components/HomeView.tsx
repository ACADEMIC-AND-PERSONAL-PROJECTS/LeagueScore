import React, { useState } from 'react';
import { League, Match } from '../types';
import { MatchListItem } from './MatchListItem';
import { LiveDot, EmptyState } from './StatusBadge';
import { Activity, Calendar, History, Trophy, ChevronRight } from 'lucide-react';

interface HomeViewProps {
  liveMatches: Match[];
  upcomingMatches: Match[];
  recentMatches: Match[];
  leagues: League[];
  onOpenMatch: (id: string) => void;
  onOpenLeague: (leagueId: string) => void;
}

/**
 * Home dashboard (spec §14/§15): LIVE dashboard, upcoming fixtures and finished
 * matches, filterable by league, plus the league directory.
 */
export const HomeView: React.FC<HomeViewProps> = ({
  liveMatches,
  upcomingMatches,
  recentMatches,
  leagues,
  onOpenMatch,
  onOpenLeague,
}) => {
  const [filter, setFilter] = useState<string>('ALL');

  const apply = (list: Match[]) =>
    filter === 'ALL' ? list : list.filter((m) => m.leagueId === filter);

  const live = apply(liveMatches);
  const upcoming = apply(upcomingMatches);
  const finished = apply(recentMatches);

  const label = (m: Match) => {
    const l = leagues.find((x) => x.id === m.leagueId);
    return l ? `${l.logo} ${l.name}` : '';
  };

  const renderList = (list: Match[]) =>
    list.length === 0 ? (
      <EmptyState message="No matches" />
    ) : (
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {list.map((m) => (
          <MatchListItem key={m.id} match={m} leagueLabel={label(m)} onOpen={onOpenMatch} />
        ))}
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative rounded-2xl overflow-hidden border border-[#3b4b3d]/40 bg-gradient-to-br from-[#181c24] via-[#1c2028] to-[#0a0e16] p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff87]/10 border border-[#00ff87]/30 text-[#00ff87] font-mono-tabular text-xs font-bold tracking-wider">
              <LiveDot />
              <span>{liveMatches.filter((m) => m.status === 'LIVE').length} IN PLAY</span>
            </div>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight uppercase leading-none">
              FOLLOW FOOTBALL.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff87] via-[#00e3fd] to-white">
                LIVE, IN REAL TIME.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#b9cbb9] max-w-xl leading-relaxed">
              Live scores, goals, cards and substitutions from every league — updating instantly, no refresh needed.
            </p>
          </div>
          <button
            onClick={() => onOpenLeague(leagues[0]?.id ?? '')}
            className="self-start md:self-auto px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#00ff87] to-[#00e3fd] text-[#00210c] font-heading font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            Browse Leagues <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* League filter chips (spec §14) */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={filter === 'ALL'} onClick={() => setFilter('ALL')}>
          All
        </FilterChip>
        {leagues.map((l) => (
          <FilterChip key={l.id} active={filter === l.id} onClick={() => setFilter(l.id)}>
            {l.logo} {l.name}
          </FilterChip>
        ))}
      </div>

      {/* Live matches with distinct indicator (spec §15/§28) */}
      <Section icon={<LiveDot />} title="LIVE & HALF-TIME" accent="text-[#00ff87]">
        {renderList(live)}
      </Section>

      <Section icon={<Calendar className="w-5 h-5 text-[#00e3fd]" />} title="UPCOMING FIXTURES" accent="text-[#00e3fd]">
        {renderList(upcoming)}
      </Section>

      <Section icon={<History className="w-5 h-5 text-[#b9cbb9]" />} title="FINISHED MATCHES" accent="text-white">
        {renderList(finished)}
      </Section>

      {/* League directory (spec §4.1) */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#00ff87]" /> LEAGUES
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {leagues.map((l) => (
            <button
              key={l.id}
              onClick={() => onOpenLeague(l.id)}
              className="cursor-pointer group p-4 rounded-xl bg-[#181c24] border border-[#3b4b3d]/30 hover:border-[#00ff87]/60 transition-all text-left flex items-center gap-3 active:scale-95"
            >
              <span className="text-2xl">{l.logo}</span>
              <span className="min-w-0">
                <span className="block font-heading font-bold text-white text-sm truncate">{l.name}</span>
                <span className="block font-mono-tabular text-[10px] text-[#b9cbb9] uppercase tracking-wider">
                  {l.country}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};


const FilterChip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full font-mono-tabular text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
      active
        ? 'bg-[#00ff87]/15 border-[#00ff87]/60 text-[#00ff87]'
        : 'bg-[#181c24] border-[#3b4b3d]/40 text-[#b9cbb9] hover:text-white'
    }`}
  >
    {children}
  </button>
);

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  accent: string;
  children: React.ReactNode;
}> = ({ icon, title, accent, children }) => (
  <section className="space-y-4">
    <h2 className={`font-heading text-xl font-bold tracking-tight flex items-center gap-2 ${accent}`}>
      {icon} {title}
    </h2>
    {children}
  </section>
);
