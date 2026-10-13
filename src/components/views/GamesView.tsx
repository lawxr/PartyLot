'use client';

import React from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GameId } from '@/types';
import { WhosMostLikely } from '@/components/games/WhosMostLikely';
import { ThisOrThat } from '@/components/games/ThisOrThat';
import { CrewTrivia } from '@/components/games/CrewTrivia';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Avatar } from '@/components/ui/Avatar';

import { GameStage } from '@/components/games/stage';

export const GamesView: React.FC = () => {
  const { parties, currentPartyId, activeGameId, setActiveGame, goBack, setCurrentView } = usePartyStore();
  const { t } = useTranslation();

  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const members = party?.members || [];

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

          {/* Party title & room attendees */}
          <div className="text-center min-w-0 px-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--stage-accent-text)] block">
              {party?.title || t.games.liveGathering}
            </span>
            <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--stage-muted)] font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>{t.games.inRoom(members.length)}</span>
            </div>
          </div>

          {/* Attendees mini stack */}
          <div className="flex -space-x-1.5 overflow-hidden shrink-0">
            {members.slice(0, 3).map((m) => (
              <Avatar
                key={m.id}
                user={{ avatar: m.avatar, name: m.name }}
                size="xs"
                border="light"
              />
            ))}
          </div>
        </div>

        {/* Game Switcher Tabs with Yellow Active Pill */}
        <nav
          role="tablist"
          aria-label={t.games.availableGames}
          className="flex items-center justify-center gap-1 p-1 rounded-full bg-[var(--stage-card)] border border-[var(--stage-card-border)] w-full mx-auto shadow-2xs"
        >
          {games.map((g) => {
            const isActive = activeGameId === g.id;
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

      {/* Main Game Stage Area */}
      <main className="w-full flex-1 flex flex-col items-center justify-start">
        {activeGameId === 'whos-most-likely' && <WhosMostLikely />}
        {activeGameId === 'this-or-that' && <ThisOrThat />}
        {activeGameId === 'crew-trivia' && <CrewTrivia />}
      </main>
    </GameStage>
  );
};
