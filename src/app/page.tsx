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
    return <div className="min-h-screen bg-[#050505]" />;
  }

  const activeParty = parties.find((p) => p.id === currentPartyId) || parties[0];

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#F5F5F7] overflow-x-hidden flex flex-col justify-start">
      {/* Ambient Desktop Backdrop Photography (Blurred) */}
      <div
        className="fixed inset-0 hidden md:block opacity-20 bg-cover bg-center filter blur-3xl pointer-events-none scale-110"
        style={{
          backgroundImage: `url("${activeParty?.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80'}")`,
        }}
      />

      {/* Main Responsive View Container */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-start">
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
