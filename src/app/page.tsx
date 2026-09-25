'use client';

import React, { useSyncExternalStore, useEffect } from 'react';
import { usePartyStore, useHydrateStore } from '@/store/usePartyStore';
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
import { NewUserOnboardingModal } from '@/components/ui/NewUserOnboardingModal';
import { usePrivySync } from '@/hooks/usePrivySync';
import { isExplicitDevelopmentDemoMode } from '@/lib/runtimeMode';
import { useSwipeBack } from '@/hooks/useSwipeBack';

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function App() {
  const { currentView, parties, currentPartyId, currentUser, setCurrentView, theme } = usePartyStore();
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  // Hydrate store from Supabase on mount
  useHydrateStore();

  // Synchronize Privy auth & embedded wallet state across views
  const { ready } = usePrivySync();

  // Mobile edge-swipe-to-go-back gesture
  useSwipeBack();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__partyStore = usePartyStore;

      // Detect invite code from URL parameters (?code= or ?join=)
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code') || urlParams.get('join');
        if (code && code.trim().length >= 4) {
          const clean = code.trim().slice(0, 4).toUpperCase();
          usePartyStore.getState().setPendingInviteCode(clean);
          usePartyStore.getState().setCurrentView('join-party');
        }
      } catch {
        // Query param parsing failed
      }
    }
  }, []);

  // Centralized Route Gate: orchestrates view state transitions based on auth state
  useEffect(() => {
    if (!mounted || !ready) return;
    const isAuthed = Boolean(currentUser?.isPrivyAuthenticated || isExplicitDevelopmentDemoMode());

    if (!isAuthed) {
      // Unauthenticated users are confined to splash or join-party view
      if (currentView !== 'splash' && currentView !== 'join-party') {
        setCurrentView('splash');
      }
    } else {
      // Authenticated users on splash are promoted to home
      if (currentView === 'splash') {
        setCurrentView('home');
      }
    }
  }, [mounted, ready, currentUser?.isPrivyAuthenticated, currentView, setCurrentView]);

  if (!mounted) {
    // Avoid hydration mismatch on initial render
    return <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E]" />;
  }

  const activeParty = parties.find((p) => p.id === currentPartyId) || parties[0];

  const isSplash = currentView === 'splash';

  return (
    <div
      className="relative min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] overflow-x-hidden flex flex-col justify-start transition-colors duration-300"
    >
      {/* Ambient Desktop Backdrop Photography (Warm Blurred) - only on splash */}
      {isSplash && (
        <>
          <div
            className="fixed inset-0 hidden md:block opacity-25 bg-cover bg-center filter blur-3xl pointer-events-none scale-110"
            style={{
              backgroundImage: `url("${activeParty?.coverImage || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1600&q=80'}")`,
            }}
          />
          {/* Warm Ambient Radial Gradients */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute -top-[10%] left-[15%] w-[450px] h-[450px] rounded-full bg-[#f0dc00]/10 filter blur-[90px]" />
            <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[#ff8f9e]/8 filter blur-[100px]" />
            <div className="absolute bottom-[5%] left-[20%] w-[400px] h-[400px] rounded-full bg-[#ffd65c]/10 filter blur-[80px]" />
          </div>
        </>
      )}

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

        {/* New User Onboarding Modal */}
        <NewUserOnboardingModal />

        {/* Global Floating Liquid Glass TabBar */}
        <TabBar />
      </div>
    </div>
  );
}
