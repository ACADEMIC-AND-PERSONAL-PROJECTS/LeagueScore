import React from 'react';
import { ViewType } from '../types';
import { Shield, Radio, Trophy, ListOrdered, SlidersHorizontal, CalendarDays } from 'lucide-react';

interface TopNavBarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  liveMatchCount: number;
  isAdmin: boolean;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentView,
  onSelectView,
  liveMatchCount,
  isAdmin,
}) => {
  const links = [
    { view: 'home' as ViewType, label: 'Home', icon: liveMatchCount > 0 ? <Radio className="w-3 h-3 text-[#00ff87]" /> : undefined },
    { view: 'leagues' as ViewType, label: 'Leagues', icon: undefined },
    { view: 'live' as ViewType, label: 'Live', icon: liveMatchCount > 0 ? <Radio className="w-3 h-3 text-[#00ff87]" /> : undefined },
    { view: 'matches' as ViewType, label: 'Matches', icon: <CalendarDays className="w-3 h-3" /> },
    { view: 'standings' as ViewType, label: 'Standings', icon: undefined },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 w-full bg-[#0f131c]/85 backdrop-blur-md border-b border-[#3b4b3d]/30 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-6">
        <button
          onClick={() => onSelectView('home')}
          className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
        >
          <div className="relative w-8 h-8 rounded-lg bg-[#262a33] border border-[#00ff87]/40 flex items-center justify-center overflow-hidden group-hover:border-[#00ff87] transition-all">
            <Shield className="w-5 h-5 text-[#00ff87] fill-[#00ff87]/30" />
          </div>
          <span className="font-heading font-extrabold text-xl tracking-tight text-white group-hover:text-[#00ff87] transition-colors">
            LeagueScore
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-6 font-mono-tabular text-xs font-semibold uppercase tracking-wider">
          {links.map((l) => (
            <button
              key={l.view}
              onClick={() => onSelectView(l.view)}
              className={`pb-1 flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer ${
                currentView === l.view
                  ? 'text-[#00ff87] border-b-2 border-[#00ff87] font-bold'
                  : 'text-[#b9cbb9] hover:text-white'
              }`}
            >
              {l.icon}
              {l.label}
            </button>
          ))}
        </nav>
      </div>

      <button
        onClick={() => onSelectView('admin')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono-tabular text-xs uppercase tracking-wider transition-all duration-150 active:scale-95 cursor-pointer ${
          currentView === 'admin'
            ? 'bg-[#00ff87]/15 border-[#00ff87] text-[#00ff87]'
            : 'bg-[#262a33] border-[#3b4b3d]/50 text-[#dfe2ee] hover:bg-[#31353e]'
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-[#00ff87]" />
        <span className="hidden sm:inline font-semibold">{isAdmin ? 'Admin ✓' : 'Admin'}</span>
      </button>
    </header>
  );
};
