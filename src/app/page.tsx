'use client';

import React, { useSyncExternalStore, useEffect } from 'react';
import { usePartyStore } from '@/store/usePartyStore';
import { SplashView } from '@/components/views/SplashView';
import { HomeView } from '@/components/views/HomeView';
import { CreatePartyView } from '@/components/views/CreatePartyView';
import { JoinPartyView } from '@/components/views/JoinPartyView';
import { PartyDetailView } from '@/components/views/PartyDetailView';
import { GamesView } from '@/components/views/GamesView';
import { SplitView } from '@/components/views/SplitView';
import { PartyPotView } from '@/components/views/PartyPotView';
import { PollsView } from '@/components/views/PollsView';
import { RecapView } from '@/components/views/RecapView';
import { ProfileView } from '@/components/views/ProfileView';
import { CrewDetailView } from '@/components/views/CrewDetailView';
import { TabBar } from '@/components/navigation/TabBar';
import { usePrivySync } from '@/hooks/usePrivySync';
import { isExplicitDevelopmentDemoMode, isPrivyConfigured } from '@/lib/runtimeMode';
import { isSupabaseConfigured } from '@/lib/supabase/client';

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function App() {
  const { currentView, parties, currentPartyId } = usePartyStore();
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  // Synchronize Privy auth & embedded wallet state across views
  usePrivySync();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__partyStore = usePartyStore;
    }
  }, []);

  if (!mounted) {
    // Avoid hydration mismatch on initial render
    return <div className="min-h-screen bg-[#15140f]" />;
  }

  const activeParty = parties.find((p) => p.id === currentPartyId) || parties[0];

  return (
    <div className="relative min-h-screen bg-[#15140f] text-[#FCFAF7] overflow-x-hidden flex flex-col justify-start">
      {/* Ambient Desktop Backdrop Photography (Warm Blurred) */}
      <div
        className="fixed inset-0 hidden md:block opacity-25 bg-cover bg-center filter blur-3xl pointer-events-none scale-110"
        style={{
          backgroundImage: `url("${activeParty?.coverImage || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1600&q=80'}")`,
        }}
      />
      {/* Warm Ambient Radial Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-[10%] left-[15%] w-[450px] h-[450px] rounded-full bg-[#f0dc00]/10 filter blur-[90px]" />
        <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[#ff8f9e]/8 filter blur-[100px]" />
        <div className="absolute bottom-[5%] left-[20%] w-[400px] h-[400px] rounded-full bg-[#ffd65c]/10 filter blur-[80px]" />
      </div>

      {/* Main Responsive View Container */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-start">
        {(isExplicitDevelopmentDemoMode() || !isPrivyConfigured() || !isSupabaseConfigured()) && (
          <div role="status" className="mx-auto mt-3 w-[calc(100%-2rem)] max-w-4xl rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-center text-xs text-amber-100">
            {isExplicitDevelopmentDemoMode()
              ? 'Development demo mode — sample data and local changes are not real or persisted to a production database.'
              : !isPrivyConfigured()
              ? 'Sign-in is unavailable: configure the authentication provider. Demo fixtures are disabled.'
              : 'Database access is unavailable. Invite joins need server-side authentication and an atomic invite-join service.'}
          </div>
        )}
        {currentView === 'splash' && <SplashView />}
        {currentView === 'home' && <HomeView />}
        {currentView === 'create-party' && <CreatePartyView />}
        {currentView === 'join-party' && <JoinPartyView />}
        {currentView === 'party-detail' && <PartyDetailView />}
        {currentView === 'crew-detail' && <CrewDetailView />}
        {currentView === 'games' && <GamesView />}
        {currentView === 'split' && <SplitView />}
        {currentView === 'party-pot' && <PartyPotView />}
        {currentView === 'polls' && <PollsView />}
        {currentView === 'recap' && <RecapView />}
        {currentView === 'profile' && <ProfileView />}

        {/* Global Floating Liquid Glass TabBar */}
        <TabBar />
      </div>
    </div>
  );
}
