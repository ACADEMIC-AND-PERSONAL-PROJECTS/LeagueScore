import { useCallback, useEffect, useState } from 'react';
import {
  getLeagues,
  getLiveMatches,
  getRecentMatches,
  getUpcomingMatches,
  realtime,
  startRealtimeSimulation,
} from './api/api';
import { League, Match } from './types';
import { ViewType } from './types';
import { TopNavBar } from './components/TopNavBar';
import { SideNavBar } from './components/SideNavBar';
import { BottomNavBar } from './components/BottomNavBar';
import { HomeView } from './components/HomeView';
import { LeagueView } from './components/LeagueView';
import { StandingsView } from './components/StandingsView';
import { MatchCenterView } from './components/MatchCenterView';
import { MatchesView } from './components/MatchesView';
import { AdminView } from './components/AdminView';
import { ToastContainer, ToastMessage } from './components/Toast';
import { EVENT_EMOJI } from './components/eventIcons';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [adminSession, setAdminSession] = useState<{ token: string; username: string } | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [{ id, title, description }, ...prev.slice(0, 4)]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  };

  const refreshAll = useCallback(async () => {
    const [live, upcoming, recent, lgs] = await Promise.all([
      getLiveMatches(),
      getUpcomingMatches(),
      getRecentMatches(),
      getLeagues(),
    ]);
    setLiveMatches(live);
    setUpcomingMatches(upcoming);
    setRecentMatches(recent);
    setLeagues(lgs);
  }, []);

  // Initial load + real-time subscription (spec §13: updates without refresh)
  useEffect(() => {
    refreshAll();
    startRealtimeSimulation();
    const unsubscribe = realtime.subscribe((evt) => {
      refreshAll();
      if (evt.type === 'EVENT_ADDED') {
        const icon = EVENT_EMOJI[evt.event.type];
        addToast(
          `${icon} ${evt.event.type.replace('_', ' ')}`,
          `${evt.event.playerName} — ${evt.event.minute}'`
        );
      }
    });
    return unsubscribe;
  }, [refreshAll]);

  const leagueLabel = (leagueId: string) => {
    const l = leagues.find((x) => x.id === leagueId);
    return l ? `${l.logo} ${l.name}` : '';
  };

  const handleOpenMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setCurrentView('match');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLeague = (leagueId: string) => {
    setSelectedLeagueId(leagueId);
    setCurrentView('leagues');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const liveCount = liveMatches.filter((m) => m.status === 'LIVE').length;

  return (
    <div className="min-h-screen">
      <TopNavBar
        currentView={currentView}
        onSelectView={setCurrentView}
        liveMatchCount={liveCount}
        isAdmin={!!adminSession}
      />

      <div className="pt-16 flex min-h-screen">
        <SideNavBar
          currentView={currentView}
          onSelectView={setCurrentView}
          liveMatchCount={liveCount}
        />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6 lg:ml-64">
          {currentView === 'home' && (
            <HomeView
              liveMatches={liveMatches}
              upcomingMatches={upcomingMatches}
              recentMatches={recentMatches}
              leagues={leagues}
              onOpenMatch={handleOpenMatch}
              onOpenLeague={handleOpenLeague}
            />
          )}

          {(currentView === 'live' || currentView === 'matches') && (
            <MatchesView
              leagues={leagues}
              liveMatches={liveMatches}
              upcomingMatches={upcomingMatches}
              recentMatches={recentMatches}
              mode={currentView}
              onOpenMatch={handleOpenMatch}
            />
          )}

          {currentView === 'leagues' && (
            <LeagueView
              leagues={leagues}
              selectedLeagueId={selectedLeagueId}
              onSelectLeague={setSelectedLeagueId}
              onOpenMatch={handleOpenMatch}
            />
          )}

          {currentView === 'standings' && (
            <StandingsView
              leagues={leagues}
              selectedLeagueId={selectedLeagueId}
              onSelectLeague={setSelectedLeagueId}
            />
          )}

          {currentView === 'match' && selectedMatchId && (
            <MatchCenterView
              matchId={selectedMatchId}
              onBack={() => setCurrentView('home')}
            />
          )}

          {currentView === 'admin' && (
            <AdminView
              session={adminSession}
              onSessionChange={setAdminSession}
              onNotify={addToast}
              onOpenMatch={handleOpenMatch}
            />
          )}
        </main>
      </div>

      <BottomNavBar
        currentView={currentView}
        onSelectView={setCurrentView}
        liveMatchCount={liveCount}
      />

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}
