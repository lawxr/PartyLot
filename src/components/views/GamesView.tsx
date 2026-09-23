'use client';

import React from 'react';
import { usePartyStore } from '@/store/usePartyStore';
import { GameId } from '@/types';
import { TopNav } from '@/components/navigation/TopNav';
import { WhosMostLikely } from '@/components/games/WhosMostLikely';
import { ThisOrThat } from '@/components/games/ThisOrThat';
import { CrewTrivia } from '@/components/games/CrewTrivia';

export const GamesView: React.FC = () => {
  const { activeGameId, setActiveGame, parties, currentPartyId } = usePartyStore();
  const party = parties.find((p) => p.id === currentPartyId) || parties[0];

  const games: { id: GameId; label: string; number: string }[] = [
    { id: 'whos-most-likely', label: "Who's Most Likely", number: '01' },
    { id: 'this-or-that', label: 'This or That', number: '02' },
    { id: 'crew-trivia', label: 'Crew Lore Trivia', number: '03' },
  ];

  return (
    <div className="min-h-screen bg-[#15140f] text-white pb-32">
      <TopNav title={`${party.title} · GAMES`} />

      <main className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto pt-2 w-full">
        {/* Game Switcher Pills (Centered on desktop) */}
        <div className="flex sm:justify-center gap-2 p-1.5 rounded-full liquid-glass-nav mb-8 overflow-x-auto no-scrollbar max-w-lg mx-auto">
          {games.map((g) => {
            const isActive = activeGameId === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setActiveGame(g.id)}
                className={`py-2 px-3.5 sm:px-5 rounded-full text-xs sm:text-sm font-display font-bold shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#F0DC00] text-black shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <span>{g.number}. {g.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Game Container */}
        <div className="w-full">
          {activeGameId === 'whos-most-likely' && <WhosMostLikely />}
          {activeGameId === 'this-or-that' && <ThisOrThat />}
          {activeGameId === 'crew-trivia' && <CrewTrivia />}
        </div>
      </main>
    </div>
  );
};
