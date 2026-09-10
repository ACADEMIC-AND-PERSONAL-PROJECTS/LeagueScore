import React, { useCallback, useEffect, useState } from 'react';
import { ApiError, getMatch, realtime } from '../api/api';
import { Match, MatchEvent } from '../types';
import { ClubCrest } from './ClubCrest';
import { StatusBadge, EmptyState, LiveDot, formatKickoffTime, formatMatchDate, useLiveMinute } from './StatusBadge';
import { EVENT_EMOJI, EVENT_LABEL } from './eventIcons';
import { ArrowLeft, MapPin, Clock, CalendarDays } from 'lucide-react';

interface MatchCenterViewProps {
  matchId: string;
  onBack: () => void;
}

/**
 * Match details (spec §9/§11): scoreboard, match info and the chronological
 * event timeline. Subscribes to real-time updates so a live match refreshes
 * score, minute and timeline without manual browser refresh (spec §13).
 */
export const MatchCenterView: React.FC<MatchCenterViewProps> = ({ matchId, onBack }) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLiveUpdate, setIsLiveUpdate] = useState(false);

  const load = useCallback(async () => {
    try {
      const m = await getMatch(matchId);
      setMatch(m);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load match.');
    }
  }, [matchId]);

  useEffect(() => {
    load();
    const unsubscribe = realtime.subscribe((evt) => {
      if (evt.matchId !== matchId) return;
      load();
      // brief flash animation on score/timeline updates
      setIsLiveUpdate(true);
      setTimeout(() => setIsLiveUpdate(false), 900);
    });
    return unsubscribe;
  }, [load, matchId]);

  const liveMinute = useLiveMinute(match?.status ?? 'SCHEDULED', match?.kickoff, match?.minute);

  if (error) {
    return (
      <div className="space-y-6">
        <BackButton onBack={onBack} />
        <EmptyState message={error} />
      </div>
    );
  }

  if (!match) {
    return <div className="p-12 text-center font-mono-tabular text-xs text-[#b9cbb9]">Loading match…</div>;
  }

  return (
    <div className="space-y-6">
      <BackButton onBack={onBack} />

      {/* Scoreboard hero (spec §9) */}
      <section className={`relative rounded-2xl overflow-hidden border transition-all duration-500 bg-gradient-to-b from-[#262a33]/90 via-[#1c2028]/95 to-[#0a0e16] p-5 sm:p-8 shadow-[0_12px_32px_-8px_rgba(0,255,135,0.18)] ${
        isLiveUpdate ? 'border-[#00ff87] shadow-[0_0_40px_rgba(0,255,135,0.35)]' : 'border-[#3b4b3d]/40'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-[#3b4b3d]/20 font-mono-tabular text-xs text-[#b9cbb9]">
          <span>
            {match.leagueId && <span>League · </span>}
            {formatMatchDate(match.kickoff)} — {formatKickoffTime(match.kickoff)}
          </span>
          <span className="flex items-center gap-2">
            <StatusBadge status={match.status} minute={match.minute} kickoff={match.kickoff} />
          </span>
        </div>

        <div className="grid grid-cols-3 items-center gap-2 sm:gap-6 py-3">
          <div className="flex flex-col items-center gap-2.5 text-center min-w-0">
            <ClubCrest name={match.homeTeam.name} url={match.homeTeam.crestUrl} size="xl" />
            <h2 className="font-heading text-sm sm:text-xl font-extrabold text-white tracking-tight truncate w-full">
              {match.homeTeam.name}
            </h2>
            <span className="font-mono-tabular text-[10px] text-[#b9cbb9] uppercase">
              Home
            </span>
          </div>

          <div className="text-center">
            <div className={`font-mono-tabular font-black text-4xl sm:text-6xl tabular-nums ${isLiveUpdate ? 'animate-score-flash' : 'text-white'}`}>
              {match.homeScore}<span className="text-[#b9cbb9] mx-1 sm:mx-2">-</span>{match.awayScore}
            </div>
            {(match.status === 'LIVE' || match.status === 'HALF_TIME') && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00ff87]/15 border border-[#00ff87]/50 text-[#00ff87] font-mono-tabular text-xs font-bold">
                {match.status === 'LIVE' && <LiveDot />}
                {match.status === 'LIVE' ? `${liveMinute}'` : 'HALF-TIME'}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2.5 text-center min-w-0">
            <ClubCrest name={match.awayTeam.name} url={match.awayTeam.crestUrl} size="xl" />
            <h2 className="font-heading text-sm sm:text-xl font-extrabold text-white tracking-tight truncate w-full">
              {match.awayTeam.name}
            </h2>
            <span className="font-mono-tabular text-[10px] text-[#b9cbb9] uppercase">
              Away
            </span>
          </div>
        </div>

        <div className="pt-4 mt-3 border-t border-[#3b4b3d]/20 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 font-mono-tabular text-[11px] text-[#b9cbb9]">
          <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-[#00e3fd]" /> {formatMatchDate(match.kickoff)}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#00e3fd]" /> Kick-off {formatKickoffTime(match.kickoff)}</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#00e3fd]" /> Season fixture</span>
        </div>
      </section>

      {/* Chronological event timeline (spec §11) */}
      <Timeline events={match.events} homeName={match.homeTeam.name} awayName={match.awayTeam.name} />
    </div>
  );
};

const BackButton: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <button
    onClick={onBack}
    className="flex items-center gap-2 font-mono-tabular text-xs uppercase tracking-wider text-[#b9cbb9] hover:text-white transition-colors cursor-pointer"
  >
    <ArrowLeft className="w-4 h-4" />
    <span>Back to home</span>
  </button>
);


/** Timeline per spec §11 format: minute, icon, type, team, players. */
const Timeline: React.FC<{
  events: MatchEvent[];
  homeName: string;
  awayName: string;
}> = ({ events, homeName, awayName }) => (
  <section className="rounded-xl bg-[#181c24] border border-[#3b4b3d]/30 overflow-hidden">
    <div className="px-4 py-3 bg-[#262a33]/80 border-b border-[#3b4b3d]/30 font-heading text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
      Match Timeline
      <span className="font-mono-tabular text-[10px] text-[#b9cbb9]">({events.length} events)</span>
    </div>
    {events.length === 0 ? (
      <div className="p-6">
        <EmptyState message="No match events yet" />
      </div>
    ) : (
      <ul className="divide-y divide-[#3b4b3d]/20">
        {[...events].reverse().map((e) => {
          const team = e.side === 'home' ? homeName : awayName;
          return (
            <li key={e.id} className="flex items-start gap-3.5 px-4 py-3.5 hover:bg-[#262a33]/50 transition-colors">
              <span className="font-mono-tabular text-sm font-bold text-[#00e3fd] w-9 shrink-0 tabular-nums">
                {e.minute}'
              </span>
              <span className="text-lg leading-none shrink-0 mt-0.5">{EVENT_EMOJI[e.type]}</span>
              <div className="min-w-0">
                <p className="font-heading text-sm font-bold text-white">
                  {EVENT_LABEL[e.type]}
                  <span className="ml-2 font-mono-tabular text-[10px] font-semibold text-[#b9cbb9] uppercase tracking-wider">
                    {team}
                  </span>
                </p>
                <p className="text-xs text-[#dfe2ee] mt-0.5">
                  {e.type === 'SUBSTITUTION' ? (
                    <>
                      <span className="text-[#00ff87] font-semibold">↑ {e.playerName}</span>
                      {' / '}
                      <span className="text-red-300 font-semibold">↓ {e.playerOutName}</span>
                    </>
                  ) : (
                    e.playerName
                  )}
                </p>
                {e.note && (
                  <p className="text-[10px] text-[#b9cbb9]/70 mt-0.5 font-mono-tabular">{e.note}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);
