import React, { useState } from 'react';
import * as api from '../api/api';
import { ApiError, Session } from '../api/api';
import { Shield, LogIn, LogOut, Radio, CalendarDays, Users, Trophy } from 'lucide-react';
import { LiveConsole, MatchesManager, SquadsManager, CompetitionsManager } from './adminManagers';

interface AdminViewProps {
  session: Session | null;
  onSessionChange: (s: Session | null) => void;
  onNotify: (title: string, description?: string) => void;
  onOpenMatch: (id: string) => void;
}

export const fmtErr = (e: unknown) =>
  e instanceof ApiError ? `[${e.status}] ${e.message}` : 'Unexpected error. Please retry.';

/**
 * Administrator interface (spec §3.2/§23/§26): login-gated management separated
 * from the spectator interface. Managers (LiveConsole, MatchesManager,
 * SquadsManager, CompetitionsManager) live in ./adminManagers.tsx.
 */
export const AdminView: React.FC<AdminViewProps> = ({ session, onSessionChange, onNotify }) => {
  const [tab, setTab] = useState<'console' | 'matches' | 'squads' | 'competitions'>('console');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const s = await api.login(username, password);
      onSessionChange(s);
      onNotify('Logged in', `Welcome back, ${s.username}`);
    } catch (err) {
      setLoginError(fmtErr(err));
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    onSessionChange(null);
    onNotify('Logged out');
  };


  if (!session) {
    return (
      <form
        onSubmit={handleLogin}
        className="max-w-md mx-auto mt-10 p-6 sm:p-8 rounded-2xl bg-[#181c24] border border-[#3b4b3d]/40 space-y-4 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#262a33] border border-[#00ff87]/40 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#00ff87]" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-extrabold text-white">Administrator Login</h2>
            <p className="font-mono-tabular text-[11px] text-[#b9cbb9] uppercase tracking-wider">
              Management is restricted (spec §27)
            </p>
          </div>
        </div>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full bg-[#0a0e16] text-sm text-white placeholder:text-[#b9cbb9]/50 px-3.5 py-2.5 rounded-lg border border-[#3b4b3d]/50 focus:outline-none focus:border-[#00ff87]"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full bg-[#0a0e16] text-sm text-white placeholder:text-[#b9cbb9]/50 px-3.5 py-2.5 rounded-lg border border-[#3b4b3d]/50 focus:outline-none focus:border-[#00ff87]"
        />
        {loginError && (
          <p className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/40 text-red-300 text-xs font-mono-tabular">
            {loginError}
          </p>
        )}
        <button
          type="submit"
          disabled={loggingIn}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#00ff87] to-[#00e3fd] text-[#00210c] font-heading font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <LogIn className="w-4 h-4" /> {loggingIn ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-center font-mono-tabular text-[10px] text-[#b9cbb9]/70">
          Demo credentials: admin / admin
        </p>
      </form>
    );
  }

  const tabs = [
    { id: 'console' as const, label: 'Live Console', icon: <Radio className="w-4 h-4" /> },
    { id: 'matches' as const, label: 'Matches', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'squads' as const, label: 'Teams & Players', icon: <Users className="w-4 h-4" /> },
    { id: 'competitions' as const, label: 'Leagues & Seasons', icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-5 rounded-xl bg-[#00ff87]/10 border border-[#00ff87]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-extrabold text-lg text-white">Administrator Console</h3>
          <p className="text-xs text-[#b9cbb9]">
            Signed in as <span className="text-[#00ff87] font-bold">{session.username}</span> — changes broadcast to spectators instantly.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="self-start px-3 py-2 rounded-lg bg-[#262a33] border border-[#3b4b3d] text-[#dfe2ee] font-mono-tabular text-xs uppercase tracking-wider flex items-center gap-1.5 hover:text-white cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-bold text-xs uppercase tracking-wider border transition-all active:scale-95 cursor-pointer ${
              tab === t.id
                ? 'bg-[#262a33] border-[#00ff87]/60 text-[#00ff87]'
                : 'bg-[#181c24] border-[#3b4b3d]/30 text-[#b9cbb9] hover:text-white'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'console' && <LiveConsole onNotify={onNotify} />}
      {tab === 'matches' && <MatchesManager onNotify={onNotify} />}
      {tab === 'squads' && <SquadsManager onNotify={onNotify} />}
      {tab === 'competitions' && <CompetitionsManager onNotify={onNotify} />}
    </div>
  );
};
