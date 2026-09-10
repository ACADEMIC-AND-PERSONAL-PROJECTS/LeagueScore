import React, { useEffect, useState } from 'react';
import { MatchStatus } from '../types';

/** Formats an ISO kickoff datetime as a short date, e.g. "Sat, Sep 12". */
export const formatMatchDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

/** Formats an ISO kickoff datetime as a kickoff time, e.g. "18:30". */
export const formatKickoffTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

export const isToday = (iso: string) => {
  const d = new Date(iso);
  const n = new Date();
  return d.toDateString() === n.toDateString();
};

export const STATUS_LABEL: Record<MatchStatus, string> = {
  SCHEDULED: 'UPCOMING',
  LIVE: 'LIVE',
  HALF_TIME: 'HALF-TIME',
  FINISHED: 'FINISHED',
  POSTPONED: 'POSTPONED',
  CANCELLED: 'CANCELLED',
};

export const statusBadgeClass = (status: MatchStatus) => {
  switch (status) {
    case 'LIVE':
      return 'bg-[#00ff87]/15 text-[#00ff87] border border-[#00ff87]/50';
    case 'HALF_TIME':
      return 'bg-amber-500/15 text-amber-300 border border-amber-500/50';
    case 'FINISHED':
      return 'bg-[#262a33] text-[#b9cbb9] border border-[#3b4b3d]';
    case 'POSTPONED':
      return 'bg-purple-500/15 text-purple-300 border border-purple-500/50';
    case 'CANCELLED':
      return 'bg-red-500/15 text-red-300 border border-red-500/50';
    default:
      return 'bg-[#00e3fd]/10 text-[#00e3fd] border border-[#00e3fd]/40';
  }
};

/** Visually distinct live indicator (spec §28). */
export const LiveDot = () => (
  <span className="relative flex w-2.5 h-2.5 shrink-0">
    <span className="absolute inline-flex w-full h-full rounded-full bg-[#00ff87] opacity-75 animate-ping" />
    <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-[#00ff87]" />
  </span>
);

export const useLiveMinute = (
  status: MatchStatus,
  kickoff?: string,
  fallback?: number | null,
) => {
  const [minute, setMinute] = useState(fallback ?? 0);

  useEffect(() => {
    if (status !== 'LIVE') {
      setMinute(fallback ?? 0);
      return;
    }
    const update = () => {
      const kickoffMinute = kickoff
        ? Math.max(0, Math.floor((Date.now() - new Date(kickoff).getTime()) / 60000))
        : 0;
      setMinute(Math.max(fallback ?? 0, kickoffMinute));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [fallback, kickoff, status]);

  return minute;
};

export const StatusBadge: React.FC<{
  status: MatchStatus;
  minute?: number | null;
  kickoff?: string;
}> = ({
  status,
  minute,
  kickoff,
}) => {
  const liveMinute = useLiveMinute(status, kickoff, minute);
  if (status === 'LIVE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00ff87]/15 border border-[#00ff87]/50 text-[#00ff87] font-mono-tabular text-[11px] font-bold">
        <LiveDot />
        {liveMinute}'
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono-tabular text-[11px] font-bold ${statusBadgeClass(status)}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
};


export const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-8 rounded-xl bg-[#181c24] border border-[#3b4b3d]/30 text-center font-mono-tabular text-xs text-[#b9cbb9] uppercase tracking-wider">
    {message}
  </div>
);
