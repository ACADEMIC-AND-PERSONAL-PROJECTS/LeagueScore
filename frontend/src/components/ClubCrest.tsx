import React, { useState } from 'react';
import { Shield } from 'lucide-react';

interface ClubCrestProps {
  name: string;
  url?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ClubCrest: React.FC<ClubCrestProps> = ({
  name,
  url,
  size = 'md',
  className = ''
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 sm:w-20 sm:h-20 text-xl'
  }[size];

  // Dynamic color palette per club name for crisp fallback badges
  const getBadgeColors = (team: string) => {
    const t = team.toLowerCase();
    if (t.includes('arsenal')) return { bg: 'from-red-600 to-red-800', border: 'border-red-500/50', text: 'text-white', letter: 'AFC' };
    if (t.includes('chelsea')) return { bg: 'from-blue-600 to-blue-800', border: 'border-blue-500/50', text: 'text-white', letter: 'CFC' };
    if (t.includes('real madrid')) return { bg: 'from-slate-100 to-slate-300', border: 'border-amber-400/70', text: 'text-slate-900', letter: 'RMA' };
    if (t.includes('barcelona')) return { bg: 'from-blue-700 via-purple-700 to-red-700', border: 'border-amber-400/50', text: 'text-amber-300', letter: 'FCB' };
    if (t.includes('bayern')) return { bg: 'from-red-600 to-rose-700', border: 'border-red-400/50', text: 'text-white', letter: 'FCB' };
    if (t.includes('dortmund')) return { bg: 'from-amber-400 to-yellow-500', border: 'border-yellow-400/70', text: 'text-black', letter: 'BVB' };
    if (t.includes('liverpool')) return { bg: 'from-red-700 to-red-900', border: 'border-red-500/50', text: 'text-white', letter: 'LFC' };
    if (t.includes('manchester city') || t.includes('man city')) return { bg: 'from-sky-400 to-cyan-600', border: 'border-sky-300/50', text: 'text-white', letter: 'MCI' };
    if (t.includes('inter')) return { bg: 'from-blue-800 via-slate-900 to-black', border: 'border-blue-400/50', text: 'text-yellow-400', letter: 'INT' };
    if (t.includes('paris') || t.includes('psg')) return { bg: 'from-blue-900 via-red-800 to-blue-950', border: 'border-red-500/50', text: 'text-white', letter: 'PSG' };
    if (t.includes('leverkusen')) return { bg: 'from-red-600 to-black', border: 'border-red-500/40', text: 'text-white', letter: 'B04' };
    if (t.includes('aston villa')) return { bg: 'from-purple-800 to-sky-500', border: 'border-yellow-400/40', text: 'text-yellow-300', letter: 'AV' };
    if (t.includes('atletico')) return { bg: 'from-red-600 to-blue-700', border: 'border-red-400/40', text: 'text-white', letter: 'ATM' };
    return { bg: 'from-slate-700 to-slate-800', border: 'border-outline-variant/40', text: 'text-white', letter: team.substring(0, 2).toUpperCase() };
  };

  const badge = getBadgeColors(name);

  if (url && !hasError) {
    return (
      <div className={`relative flex items-center justify-center shrink-0 rounded-xl bg-surface-container-lowest/80 p-1 border border-white/10 shadow-inner overflow-hidden ${sizeClasses} ${className}`}>
        <img
          src={url}
          alt={`${name} Crest`}
          className="w-full h-full object-contain filter drop-shadow-md"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br ${badge.bg} border ${badge.border} shadow-md overflow-hidden font-bold select-none ${sizeClasses} ${className}`}
      title={name}
    >
      <div className="absolute inset-0 bg-radial from-white/20 to-transparent pointer-events-none" />
      <span className={`${badge.text} font-mono-tabular tracking-tighter text-[0.7em] font-extrabold`}>
        {badge.letter}
      </span>
    </div>
  );
};
