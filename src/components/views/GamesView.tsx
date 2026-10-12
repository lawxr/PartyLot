'use client';

import React, { useState } from 'react';
import {
  Trophy,
  Coins,
  Users,
  Sparkles,
  HelpCircle,
  Vote,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GameId } from '@/types';
import { WhosMostLikely } from '@/components/games/WhosMostLikely';
import { ThisOrThat } from '@/components/games/ThisOrThat';
import { CrewTrivia } from '@/components/games/CrewTrivia';
import { RewardWinnerModal } from '@/components/games/RewardWinnerModal';
import { TopNav } from '@/components/navigation/TopNav';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Avatar } from '@/components/ui/Avatar';

export const GamesView: React.FC = () => {
  const { parties, currentPartyId, activeGameId, setActiveGame, goBack } = usePartyStore();
  const { t, language } = useTranslation();
  const isEs = language === 'es';

  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const members = party?.members || [];
  const potBalance = Number(party?.potBalance || 0);

  const games: {
    id: GameId;
    label: string;
    number: string;
    desc: string;
    descEs: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'whos-most-likely',
      label: t.games.mostLikely,
      number: '01',
      desc: 'Vote who in the group fits funny scenarios',
      descEs: 'Vota quién del grupo encaja en situaciones épicas',
      icon: Vote,
    },
    {
      id: 'this-or-that',
      label: t.games.thisOrThat,
      number: '02',
      desc: 'Pick between two dilemmas and compare votes',
      descEs: 'Elige entre dos dilemas y compara elecciones',
      icon: Flame,
    },
    {
      id: 'crew-trivia',
      label: t.games.crewTrivia,
      number: '03',
      desc: 'Test your knowledge of the crew lore',
      descEs: 'Pon a prueba tu conocimiento de la historia del grupo',
      icon: HelpCircle,
    },
  ];

  const activeGameMeta = games.find((g) => g.id === activeGameId) || games[0];

  return (
    <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] pb-28 select-none transition-colors">
      {/* Top Navigation Bar */}
      <TopNav
        title={isEs ? 'JUEGOS DE FIESTA' : 'PARTY GAMES'}
        showBack={true}
        onBack={goBack}
      />

      <main className="px-4 sm:px-6 max-w-lg md:max-w-2xl lg:max-w-6xl mx-auto w-full pt-1">
        {/* Mobile Party Banner (Hidden on desktop) */}
        <div className="lg:hidden mb-4 p-4 rounded-3xl bg-surface border border-divider shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-party-yellow animate-pulse" />
              <span className="text-xs font-semibold text-secondary">
                {party?.title || (isEs ? 'Fiesta Activa' : 'Active Gathering')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-party-yellow/20 border border-party-yellow/40 text-xs font-mono font-bold text-primary">
              <Coins className="w-3.5 h-3.5 text-party-yellow" />
              <span>${potBalance.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Avatar stack */}
            <div className="flex items-center">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {members.slice(0, 4).map((m) => (
                    <Avatar
                      key={m.id}
                      user={{ avatar: m.avatar, name: m.name }}
                      size="xs"
                    />
                  ))}
                </div>
              <span className="ml-2 text-xs font-bold text-secondary">
                {members.length} {isEs ? 'en la sala' : 'playing'}
              </span>
            </div>

            {/* Quick Reward Winner button */}
            <button
              onClick={() => setIsRewardModalOpen(true)}
              className="py-1.5 px-3 rounded-full bg-party-yellow hover:bg-party-yellow-hover text-on-party-yellow text-xs font-black flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{isEs ? 'Premiar' : 'Reward'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Game Switcher Pills (Hidden on desktop) */}
        <div className="lg:hidden flex justify-center gap-1.5 p-1 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 mb-4 max-w-xs mx-auto shadow-sm">
          {games.map((g) => {
            const isActive = activeGameId === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setActiveGame(g.id)}
                className={`py-1.5 px-3 rounded-full text-xs font-display font-bold shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#F0DC00] text-[#171512] shadow-sm'
                    : 'text-[#6F6A62] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white'
                }`}
              >
                <span>{g.label}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop Side-by-Side Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 lg:items-start">
          {/* Left Column: Party Context & Games Navigation (Desktop Sidebar) */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-4 space-y-4">
            {/* Party Context Card */}
            <div className="p-5 rounded-3xl bg-surface border border-divider shadow-xs backdrop-blur-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-party-yellow animate-pulse" />
                <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-party-yellow" />
                  {isEs ? 'FIESTA EN CURSO' : 'LIVE GATHERING'}
                </span>
              </div>

              <h2 className="font-display font-black text-xl text-primary tracking-tight leading-snug">
                {party?.title || (isEs ? 'Fiesta Privada' : 'Private Party')}
              </h2>

              <p className="text-xs text-secondary mt-1 line-clamp-2">
                {party?.description || (isEs ? 'Minijuegos sociales sincronizados en vivo con tu grupo.' : 'Social party games synced live with your crew.')}
              </p>

              {/* Pot Balance Banner */}
              <div className="mt-4 p-3.5 rounded-2xl bg-surface-secondary border border-divider flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-secondary block">
                    {isEs ? 'Bote de la fiesta:' : 'Party Pot:'}
                  </span>
                  <span className="font-mono font-bold text-lg text-primary">
                    ${potBalance.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => setIsRewardModalOpen(true)}
                  className="py-2 px-3 rounded-xl bg-party-yellow hover:bg-party-yellow-hover text-on-party-yellow text-xs font-black flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{isEs ? 'Premiar Ganador' : 'Reward Winner'}</span>
                </button>
              </div>

              {/* Members in Room */}
              <div className="mt-4 pt-4 border-t border-black/8 dark:border-white/10">
                <div className="flex items-center justify-between text-xs font-bold text-[#6F6A62] dark:text-[#A8A196] mb-2.5">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {isEs ? 'Participantes en la sala' : 'Players in the room'}
                  </span>
                  <span className="font-mono font-bold text-[#171512] dark:text-white">
                    {members.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {members.slice(0, 6).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] font-medium"
                      title={m.name}
                    >
                      <Avatar
                        user={{ avatar: m.avatar, name: m.name }}
                        size="xs"
                      />
                      <span className="truncate max-w-[80px]">{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Games Selector Card List (Desktop Sidebar) */}
            <div className="p-3 rounded-3xl bg-surface border border-divider shadow-xs backdrop-blur-md space-y-1.5">
              <span className="text-xs font-semibold text-secondary px-3 pt-2 block">
                {isEs ? 'CATÁLOGO DE JUEGOS' : 'GAME CATALOG'}
              </span>

              {games.map((g) => {
                const isActive = activeGameId === g.id;
                const IconComponent = g.icon;
                return (
                  <button
                    key={g.id}
                    onClick={() => setActiveGame(g.id)}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-party-yellow text-on-party-yellow shadow-xs font-bold'
                        : 'hover:bg-black/5 dark:hover:bg-white/5 text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isActive
                            ? 'bg-black/80 text-party-yellow'
                            : 'bg-surface-secondary text-primary'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono opacity-60 font-bold">
                            {g.number}
                          </span>
                          <span className="font-display font-bold text-xs">
                            {g.label}
                          </span>
                        </div>
                        <span className={`text-xs block line-clamp-1 ${
                          isActive ? 'text-primary/80' : 'text-secondary'
                        }`}>
                          {isEs ? g.descEs : g.desc}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'rotate-90' : 'opacity-40'}`} />
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Column: Active Interactive Game Container */}
          <section className="lg:col-span-8 xl:col-span-8 w-full">
            <div className="w-full">
              {activeGameId === 'whos-most-likely' && <WhosMostLikely />}
              {activeGameId === 'this-or-that' && <ThisOrThat />}
              {activeGameId === 'crew-trivia' && <CrewTrivia />}
            </div>
          </section>
        </div>
      </main>

      {/* Reward Winner Modal */}
      <RewardWinnerModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        gameTitle={activeGameMeta.label}
      />
    </div>
  );
};
