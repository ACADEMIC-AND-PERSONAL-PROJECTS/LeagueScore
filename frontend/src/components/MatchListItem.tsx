import React from 'react';
import { Match } from '../types';
import { ClubCrest } from './ClubCrest';
import { StatusBadge, formatKickoffTime, formatMatchDate } from './StatusBadge';

interface MatchListItemProps {
  match: Match;
  leagueLabel?: string;
  onOpen: (id: string) => void;
}

/** Compact, clickable match row used on the home dashboard and league fixtures lists. */
export const MatchListItem: React.FC<MatchListItemProps> = ({ match, leagueLabel, onOpen }) => {
  const winner =
    match.status === 'FINISHED'
      ? match.homeScore > match.awayScore
        ? 'home'
        : match.awayScore > match.homeScore
          ? 'away'
          : null
      : null;

  return (
    <button
      onClick={() => onOpen(match.id)}
      className="w-full cursor-pointer group p-3.5 rounded-xl bg-[#181c24] border border-[#3b4b3d]/30 hover:border-[#00ff87]/50 transition-all text-left active:scale-[0.99] shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 pb-2 font-mono-tabular text-[11px] text-[#b9cbb9]">
        <span className="truncate">{leagueLabel}</span>
        <StatusBadge status={match.status} minute={match.minute} />
      </div>

      <div className="space-y-1.5">
        {/* Home */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <ClubCrest name={match.homeTeam.name} url={match.homeTeam.crestUrl} size="sm" />
            <span
              className={`text-sm truncate ${winner === 'home' ? 'text-white font-bold' : 'text-[#dfe2ee]'}`}
            >
              {match.homeTeam.name}
            </span>
          </div>
          <span className="font-mono-tabular text-sm font-bold text-white tabular-nums">
            {match.status === 'SCHEDULED' ? (
              <span className="text-[#b9cbb9] font-normal text-xs">
                {formatKickoffTime(match.kickoff)}
              </span>
            ) : (
              match.homeScore
            )}
          </span>
        </div>
        {/* Away */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <ClubCrest name={match.awayTeam.name} url={match.awayTeam.crestUrl} size="sm" />
            <span
              className={`text-sm truncate ${winner === 'away' ? 'text-white font-bold' : 'text-[#dfe2ee]'}`}
            >
              {match.awayTeam.name}
            </span>
          </div>
          <span className="font-mono-tabular text-sm font-bold text-white tabular-nums">
            {match.status === 'SCHEDULED' ? (
              <span className="text-[#b9cbb9] font-normal text-xs">
                {formatMatchDate(match.kickoff)}
              </span>
            ) : (
              match.awayScore
            )}
          </span>
        </div>
      </div>
    </button>
  );
};
