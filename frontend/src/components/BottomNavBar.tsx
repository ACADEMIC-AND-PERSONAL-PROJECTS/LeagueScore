import React from 'react';
import { ViewType } from '../types';
import { Shield, Radio, Trophy, ListOrdered, CalendarDays } from 'lucide-react';

interface BottomNavBarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  liveMatchCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentView,
  onSelectView,
  liveMatchCount,
}) => {
  const items = [
    { view: 'home' as ViewType, label: 'Home', icon: <Shield className="w-5 h-5" /> },
    { view: 'leagues' as ViewType, label: 'Leagues', icon: <Trophy className="w-5 h-5" /> },
    { view: 'live' as ViewType, label: liveMatchCount ? `Live (${liveMatchCount})` : 'Live', icon: <Radio className="w-5 h-5" /> },
    { view: 'matches' as ViewType, label: 'Matches', icon: <CalendarDays className="w-5 h-5" /> },
    { view: 'standings' as ViewType, label: 'Tables', icon: <ListOrdered className="w-5 h-5" /> },
    { view: 'admin' as ViewType, label: 'Admin', icon: <Radio className="w-5 h-5" /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-2 py-1 bg-[#0a0e16]/95 backdrop-blur-md border-t border-[#3b4b3d]/30 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]">
      {items.map((i) => (
        <button
          key={i.view}
          onClick={() => onSelectView(i.view)}
          className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg active:scale-90 transition-transform cursor-pointer ${
            currentView === i.view ? 'text-[#00ff87] bg-[#00ff87]/10' : 'text-[#b9cbb9]'
          }`}
        >
          {i.icon}
          <span className="font-mono-tabular text-[10px] mt-0.5">{i.label}</span>
        </button>
      ))}
    </nav>
  );
};
