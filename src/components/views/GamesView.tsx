'use client';

import React, { useEffect } from 'react';
import { ArrowLeft, Users, Lock } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GameId, Party, Member } from '@/types';
import { WhosMostLikely } from '@/components/games/WhosMostLikely';
import { ThisOrThat } from '@/components/games/ThisOrThat';
import { CrewTrivia } from '@/components/games/CrewTrivia';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Avatar } from '@/components/ui/Avatar';
import { GameStage, GameWaitingLobby } from '@/components/games/stage';

interface GamesViewProps {
  party?: Party;
}

export const GamesView: React.FC<GamesViewProps> = ({ party: propParty }) => {
  const storeParties = usePartyStore((s) => s.parties);
  const currentPartyId = usePartyStore((s) => s.currentPartyId);
  const activeGameId = usePartyStore((s) => s.activeGameId);
  const setActiveGame = usePartyStore((s) => s.setActiveGame);
  const goBack = usePartyStore((s) => s.goBack);
  const setCurrentView = usePartyStore((s) => s.setCurrentView);
  const loadPartyFromSupabase = usePartyStore((s) => s.loadPartyFromSupabase);
  const listenToActivePartyRealtime = usePartyStore((s) => s.listenToActivePartyRealtime);
  const currentUser = usePartyStore((s) => s.currentUser);
  const { t } = useTranslation();

  // In SSR / renderToStaticMarkup, Zustand persist returns initial server snapshot.
  // Fall back to getState() if storeParties is empty but getState() has parties.
  const parties =
    storeParties.length > 0
      ? storeParties
      : typeof window === 'undefined'
      ? usePartyStore.getState().parties
      : storeParties;

  const effectivePartyId =
    currentPartyId ||
    (typeof window === 'undefined' ? usePartyStore.getState().currentPartyId : '');

  const party =
    propParty ||
    parties.find((p) => p.id === effectivePartyId) ||
    parties[0];
  const members = party?.members || [];
  const minRequiredPlayers = 2;
  const hasEnoughPlayers = Boolean(party && members.length >= minRequiredPlayers);

  // Subscribe to real-time party updates while in the game room
  useEffect(() => {
    if (!party?.id) return;
    loadPartyFromSupabase(party.id);
    const unsub = listenToActivePartyRealtime(party.id);
    return () => {
      unsub();
    };
  }, [party?.id, listenToActivePartyRealtime, loadPartyFromSupabase]);

  const games: {
    id: GameId;
    label: string;
    number: string;
  }[] = [
    {
      id: 'whos-most-likely',
      label: t.games.mostLikely,
      number: '01',
    },
    {
      id: 'this-or-that',
      label: t.games.thisOrThat,
      number: '02',
    },
    {
      id: 'crew-trivia',
      label: t.games.crewTrivia,
      number: '03',
    },
  ];

  return (
    <GameStage
      partyCoverImage={party?.coverImage}
      className="pb-[calc(1.5rem+var(--cookie-banner-h,0px))]"
    >
      {/* Top Stage Control Header */}
      <header className="w-full flex flex-col gap-2.5 z-20 shrink-0 mb-1">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goBack || (() => setCurrentView('party-detail'))}
            aria-label={t.games.backToParty}
            className="w-9 h-9 rounded-full bg-[var(--stage-card)] border border-[var(--stage-card-border)] text-[var(--stage-text)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Party title & room attendees status */}
          <div className="text-center min-w-0 px-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--stage-accent-text)] block">
              {party?.title || t.games.liveGathering}
            </span>
            <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--stage-muted)] font-bold">
              {hasEnoughPlayers ? (
                <>
                  <Users className="w-3.5 h-3.5" />
                  <span>{t.games.inRoom(members.length)}</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-party-yellow animate-pulse" />
                  <span>{t.games.minPlayersRequired(members.length, minRequiredPlayers)}</span>
                </>
              )}
            </div>
          </div>

          {/* Attendees mini stack */}
          <div className="flex -space-x-1.5 overflow-hidden shrink-0">
            {members.slice(0, 3).map((m: Member) => (
              <Avatar
                key={m.id}
                user={{ avatar: m.avatar, name: m.name }}
                size="xs"
                border="light"
              />
            ))}
          </div>
        </div>

        {/* Game Switcher Tabs with locked state when not enough real-time players */}
        <nav
          role="tablist"
          aria-label={t.games.availableGames}
          className={`flex items-center justify-center gap-1 p-1 rounded-full bg-[var(--stage-card)] border border-[var(--stage-card-border)] w-full mx-auto shadow-2xs transition-opacity ${
            !hasEnoughPlayers ? 'opacity-70' : 'opacity-100'
          }`}
        >
          {games.map((g) => {
            const isActive = activeGameId === g.id;
            if (!hasEnoughPlayers) {
              return (
                <div
                  key={g.id}
                  className="flex-1 py-1.5 px-2 rounded-full text-xs font-display font-bold text-[var(--stage-muted)] flex items-center justify-center gap-1 truncate cursor-not-allowed select-none"
                  title={t.games.gamesLockedHint}
                >
                  <Lock className="w-3 h-3 stroke-[2.2] text-[var(--stage-muted)] shrink-0" />
                  <span className="truncate">{g.label}</span>
                </div>
              );
            }

            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveGame(g.id)}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs font-display font-bold transition-all cursor-pointer truncate ${
                  isActive
                    ? 'bg-party-yellow text-on-party-yellow shadow-xs'
                    : 'text-[var(--stage-muted)] hover:text-[var(--stage-text)]'
                }`}
              >
                <span>{g.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Game Stage Area: renders GameWaitingLobby or active game */}
      <main className="w-full flex-1 flex flex-col items-center justify-start">
        {!hasEnoughPlayers ? (
          <GameWaitingLobby
            party={party}
            currentUser={currentUser}
            onBack={goBack || (() => setCurrentView('party-detail'))}
          />
        ) : (
          <>
            {activeGameId === 'whos-most-likely' && <WhosMostLikely />}
            {activeGameId === 'this-or-that' && <ThisOrThat />}
            {activeGameId === 'crew-trivia' && <CrewTrivia />}
          </>
        )}
      </main>
    </GameStage>
  );
};

