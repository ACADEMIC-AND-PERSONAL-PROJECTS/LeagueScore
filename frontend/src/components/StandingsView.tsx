import React, { useEffect, useState } from 'react';
import { getSeasons, getStandings } from '../api/api';
import { League, Season, StandingRow } from '../types';
import { ClubCrest } from './ClubCrest';
import { EmptyState } from './StatusBadge';
import { Trophy, ChevronDown } from 'lucide-react';

interface StandingsViewProps {
  leagues: League[];
  selectedLeagueId: string | null;
  onSelectLeague: (leagueId: string) => void;
}

/** League standings (spec §16-§18) — computed by the backend API, displayed as-is. */
export const StandingsView: React.FC<StandingsViewProps> = ({
  leagues,
  selectedLeagueId,
  onSelectLeague,
}) => {
  const league = leagues.find((l) => l.id === selectedLeagueId) ?? leagues[0];
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [standings, setStandings] = useState<StandingRow[] | null>(null);

  useEffect(() => {
    if (!league) return;
    getSeasons(league.id).then((s) => {
      setSeasons(s);
      const current = s.find((x) => x.isCurrent) ?? s[0];
      setSeasonId(current?.id ?? null);
    });
  }, [league?.id]);

  useEffect(() => {
    if (!seasonId) return;
    setStandings(null);
    getStandings(seasonId).then(setStandings);
  }, [seasonId]);

  if (!league) return <EmptyState message="No leagues available" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#3b4b3d]/30">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#00ff87]" />
            <span>{league.logo} {league.name} — STANDINGS</span>
          </h2>
          <p className="text-sm text-[#b9cbb9] mt-0.5">
            Updated automatically from officially finished matches.
          </p>
        </div>

        {/* Season selector (spec §5: active season clearly identified) */}
        <div className="flex items-center gap-2">
          <label className="font-mono-tabular text-xs text-[#b9cbb9] uppercase">Season:</label>
          <div className="relative">
            <select
              value={seasonId ?? ''}
              onChange={(e) => setSeasonId(e.target.value)}
              className="appearance-none bg-[#181c24] text-white text-sm font-semibold rounded-lg border border-[#3b4b3d]/50 px-4 py-2 pr-9 focus:border-[#00ff87] focus:outline-none focus:ring-1 focus:ring-[#00ff87] cursor-pointer"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}{s.isCurrent ? ' (current)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#b9cbb9] absolute right-3 top-3 pointer-events-none" />
          </div>
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
            {l.logo} {l.name}
          </button>
        ))}
      </div>

      {!standings ? (
        <div className="p-12 text-center font-mono-tabular text-xs text-[#b9cbb9]">Loading standings…</div>
      ) : standings.length === 0 ? (
        <EmptyState message="No finished matches yet in this season" />
      ) : (
        <StandingsTable standings={standings} />
      )}
    </div>
  );
};

const StandingsTable: React.FC<{ standings: StandingRow[] }> = ({ standings }) => (
  <div className="rounded-xl bg-[#181c24] border border-[#3b4b3d]/30 overflow-hidden shadow-2xl">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-[#262a33]/80 font-mono-tabular text-xs text-[#b9cbb9] border-b border-[#3b4b3d]/40 uppercase tracking-wider">
            <th className="py-3 px-4 w-12 text-center">#</th>
            <th className="py-3 px-4">Team</th>
            <th className="py-3 px-2 text-center">P</th>
            <th className="py-3 px-2 text-center">W</th>
            <th className="py-3 px-2 text-center">D</th>
            <th className="py-3 px-2 text-center">L</th>
            <th className="py-3 px-2 text-center hidden sm:table-cell">GF</th>
            <th className="py-3 px-2 text-center hidden sm:table-cell">GA</th>
            <th className="py-3 px-2 text-center font-bold">GD</th>
            <th className="py-3 px-4 text-center font-bold text-[#00ff87]">PTS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#3b4b3d]/20 font-mono-tabular">
          {standings.map((row) => {
            const borderZone =
              row.position <= 3
                ? 'border-l-4 border-[#00ff87]'
                : row.position <= 5
                  ? 'border-l-4 border-[#00e3fd]'
                  : '';
            return (
              <tr key={row.team.id} className={`hover:bg-[#262a33]/60 transition-colors ${borderZone}`}>
                <td className="py-3 px-4 text-center text-[#b9cbb9]">{row.position}</td>
                <td className="py-3 px-4">
                  <span className="flex items-center gap-3">
                    <ClubCrest name={row.team.name} url={row.team.crestUrl} size="sm" />
                    <span className="font-sans font-semibold text-white text-sm">
                      {row.team.name}
                      <span className="ml-2 text-[10px] text-[#b9cbb9] font-mono-tabular">{row.team.shortName}</span>
                    </span>
                  </span>
                </td>
                <td className="py-3 px-2 text-center">{row.played}</td>
                <td className="py-3 px-2 text-center">{row.won}</td>
                <td className="py-3 px-2 text-center">{row.drawn}</td>
                <td className="py-3 px-2 text-center">{row.lost}</td>
                <td className="py-3 px-2 text-center hidden sm:table-cell text-[#b9cbb9]">{row.goalsFor}</td>
                <td className="py-3 px-2 text-center hidden sm:table-cell text-[#b9cbb9]">{row.goalsAgainst}</td>
                <td className={`py-3 px-2 text-center font-bold ${row.goalDifference > 0 ? 'text-[#00ff87]' : row.goalDifference < 0 ? 'text-red-400' : ''}`}>
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </td>
                <td className="py-3 px-4 text-center font-black text-[#00ff87] text-base">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    <div className="p-3.5 bg-[#0a0e16]/80 border-t border-[#3b4b3d]/30 flex flex-wrap items-center gap-5 font-mono-tabular text-xs text-[#b9cbb9]">
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 bg-[#00ff87]" /> Champions League places
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 bg-[#00e3fd]" /> Europa League places
      </span>
    </div>
  </div>
);
