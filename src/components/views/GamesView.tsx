'use client';

import React from 'react';
import { usePartyStore } from '@/store/usePartyStore';
import { GameId } from '@/types';
import { WhosMostLikely } from '@/components/games/WhosMostLikely';
import { ThisOrThat } from '@/components/games/ThisOrThat';
import { CrewTrivia } from '@/components/games/CrewTrivia';

export const GamesView: React.FC = () => {
  const { activeGameId, setActiveGame } = usePartyStore();

  const games: { id: GameId; label: string; number: string }[] = [
    { id: 'whos-most-likely', label: "Most Likely", number: '01' },
    { id: 'this-or-that', label: 'This or That', number: '02' },
    { id: 'crew-trivia', label: 'Crew Trivia', number: '03' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F2E8] text-[#171512] pb-28 pt-2 transition-colors">
      <main className="px-4 sm:px-6 max-w-lg md:max-w-xl mx-auto w-full">
        {/* Game switcher */}
        <div className="flex justify-center gap-1.5 p-1 rounded-full glass-strong border border-black/10 mb-4 max-w-xs mx-auto shadow-sm">
          {games.map((g) => {
            const isActive = activeGameId === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setActiveGame(g.id)}
                className={`py-1.5 px-3 rounded-full text-xs font-display font-bold shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#F0DC00] text-[#171512] shadow-sm'
                    : 'text-[#6F6A62] hover:text-[#171512]'
                }`}
              >
                <span>{g.label}</span>
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
