import React from 'react';
import { ViewType } from '../types';
import { Shield, Radio, Trophy, ListOrdered, SlidersHorizontal, CalendarDays } from 'lucide-react';

interface SideNavBarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  liveMatchCount: number;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  currentView,
  onSelectView,
  liveMatchCount,
}) => {
  const items = [
    { view: 'home' as ViewType, label: 'Home', icon: <Shield className="w-4 h-4" /> },
    {
      view: 'leagues' as ViewType,
      label: 'Leagues',
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      view: 'live' as ViewType,
      label: liveMatchCount ? `Live (${liveMatchCount})` : 'Live',
      icon: <Radio className="w-4 h-4" />,
    },
    { view: 'matches' as ViewType, label: 'Matches', icon: <CalendarDays className="w-4 h-4" /> },
    { view: 'standings' as ViewType, label: 'Standings', icon: <ListOrdered className="w-4 h-4" /> },
  ];

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 top-16 bottom-0 flex-col justify-between w-64 overflow-hidden p-4 border-r border-[#3b4b3d]/30 z-40 bg-[#0a0e16]">
      <nav className="flex flex-col gap-1.5 font-mono-tabular text-xs uppercase tracking-wider">
        {items.map((i) => (
          <button
            key={i.view}
            onClick={() => onSelectView(i.view)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all duration-150 active:scale-[0.98] cursor-pointer ${
              currentView === i.view
                ? 'bg-[#262a33] text-[#00ff87] border-l-2 border-[#00ff87] font-bold shadow-sm'
                : 'text-[#b9cbb9] hover:bg-[#181c24] hover:text-white'
            }`}
          >
            {i.icon}
            <span className="flex-1">{i.label}</span>
          </button>
        ))}
      </nav>

      <button
        onClick={() => onSelectView('admin')}
        className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-[#00ff87] to-[#00e3fd] text-[#00210c] font-heading font-extrabold text-xs uppercase tracking-wider text-center hover:shadow-[0_0_24px_rgba(0,255,135,0.45)] transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span>Admin Console</span>
      </button>
    </aside>
  );
};
