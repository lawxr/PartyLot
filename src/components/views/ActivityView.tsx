'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Calendar,
  Wallet,
  Gamepad2,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Avatar } from '@/components/ui/Avatar';
import { RelativeTime } from '@/components/ui/RelativeTime';
import { PressableCard } from '@/components/ui/PressableCard';
import { resolveActivityActor } from '@/lib/activityActor';
import type { ActivityItem, Member } from '@/types';

type ActivityFilter = 'all' | 'parties' | 'pot' | 'games';

/**
 * Activity View — Social Feed & Crew Timeline
 *
 * Implements the social activity feed (P1-2 & P1-4):
 * - Displays who joined, who contributed to the party pot, who voted or won games.
 * - Resolves real actor identity with initials & color derivation.
 * - Shows relative time formatted via Intl.RelativeTimeFormat.
 * - Seamlessly navigates to the associated party or crew upon tapping.
 */
export const ActivityView: React.FC = () => {
  const { activities, parties, selectParty, currentUser } = usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';

  const [activeFilter, setActiveFilter] = useState<ActivityFilter>('all');

  // Map parties by ID for fast context lookup
  const partyMap = useMemo(() => {
    const map = new Map<string, { title: string; coverImage?: string }>();
    parties.forEach((p) => {
      map.set(p.id, { title: p.title, coverImage: p.coverImage });
    });
    return map;
  }, [parties]);

  // Collect all known members across parties for actor matching
  const allMembers = useMemo<Member[]>(() => {
    const list: Member[] = [];
    if (currentUser?.id) {
      list.push({ id: currentUser.id, name: currentUser.name || 'Member', avatar: currentUser.avatar || '' });
    }
    parties.forEach((p) => {
      (p.members || []).forEach((m) => {
        if (!list.some((existing) => existing.id === m.id)) {
          list.push(m);
        }
      });
    });
    return list;
  }, [currentUser, parties]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'parties') return act.type === 'join';
      if (activeFilter === 'pot') return act.type === 'pot' || act.type === 'expense';
      if (activeFilter === 'games') return act.type === 'game' || act.type === 'poll';
      return true;
    });
  }, [activities, activeFilter]);

  const handleActivityClick = (act: ActivityItem) => {
    if (act.partyId) {
      selectParty(act.partyId);
    }
  };

  const getFilterBadgeIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'pot':
      case 'expense':
        return <Wallet className="w-3.5 h-3.5 text-[#DE6B48]" />;
      case 'game':
      case 'poll':
        return <Gamepad2 className="w-3.5 h-3.5 text-[#3D5A80]" />;
      case 'join':
      default:
        return <Calendar className="w-3.5 h-3.5 text-[#547A5B]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] pb-32 pt-2 px-4 sm:px-6 md:px-8 max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto safe-top select-none w-full transition-colors duration-200">
      {/* Top Header */}
      <header className="py-3 mb-3 md:py-4 md:mb-5">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-[#171512] dark:text-white tracking-tight leading-none">
          {isEs ? 'Actividad' : 'Activity'}
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-[#6F6A62] dark:text-[#A8A196] mt-1.5">
          {isEs
            ? 'Lo que está pasando con tus amigos y tus fiestas'
            : "What's happening across your crew and gatherings"}
        </p>
      </header>

      {/* Filter Chips Bar */}
      <nav aria-label="Activity Filters" className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {[
          { id: 'all' as const, label: isEs ? 'Todo' : 'All' },
          { id: 'parties' as const, label: isEs ? 'Fiestas' : 'Parties' },
          { id: 'pot' as const, label: isEs ? 'Party Pot' : 'Party Pot' },
          { id: 'games' as const, label: isEs ? 'Juegos y votos' : 'Games & votes' },
        ].map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#171512] text-white dark:bg-white dark:text-[#171512] shadow-xs'
                  : 'bg-black/[0.04] dark:bg-white/10 text-[#6F6A62] dark:text-[#A8A196] hover:bg-black/[0.08] dark:hover:bg-white/15'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </nav>

      {/* Activity Stream Container */}
      <main className="space-y-2.5">
        {filteredActivities.length === 0 ? (
          <div className="rounded-[28px] p-8 bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/[0.07] dark:border-white/10 text-center shadow-[0_8px_24px_rgba(65,48,25,0.04)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)] my-6">
            <div className="w-12 h-12 rounded-2xl bg-[#F0DC00]/20 text-[#171512] dark:text-[#F0DC00] flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="font-display font-extrabold text-lg text-[#171512] dark:text-white">
              {isEs ? 'No hay actividad reciente' : 'No recent activity yet'}
            </h3>
            <p className="text-xs sm:text-sm text-[#6F6A62] dark:text-[#A8A196] font-medium mt-1.5 max-w-sm mx-auto leading-relaxed">
              {isEs
                ? 'Cuando tú o tus amigos organicen una fiesta, aporten al Party Pot o voten en juegos, lo verás todo aquí.'
                : 'When you or your friends host gatherings, contribute to the Party Pot, or vote in games, updates will appear here.'}
            </p>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const actor = resolveActivityActor(act, undefined, allMembers);
            const partyInfo = act.partyId ? partyMap.get(act.partyId) : null;

            return (
              <PressableCard
                key={act.id}
                onClick={() => handleActivityClick(act)}
                className="p-3.5 sm:p-4 rounded-2xl bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/[0.06] dark:border-white/10 shadow-[0_4px_16px_rgba(65,48,25,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:border-[#F0DC00]/60 dark:hover:border-[#F0DC00]/40 transition-colors flex items-start gap-3.5 group"
                aria-label={act.text}
              >
                {/* Actor Avatar */}
                <div className="relative shrink-0 pt-0.5">
                  <Avatar
                    user={{
                      id: actor.id,
                      name: actor.name,
                      avatar: actor.avatar,
                    }}
                    size="md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-[#25221D] border border-black/10 dark:border-white/15 flex items-center justify-center shadow-xs">
                    {getFilterBadgeIcon(act.type)}
                  </div>
                </div>

                {/* Content Text & Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-[#171512] dark:text-[#F5F1E8] font-medium leading-snug">
                    <span className="font-bold text-[#171512] dark:text-white mr-1">
                      {actor.name}
                    </span>
                    {/* Clean activity narrative */}
                    <span>
                      {act.text.startsWith(actor.name)
                        ? act.text.slice(actor.name.length).trim()
                        : act.text}
                    </span>
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#6F6A62] dark:text-[#A8A196]">
                    <RelativeTime date={act.time} />

                    {partyInfo && (
                      <>
                        <span>•</span>
                        <span className="font-semibold truncate text-[#171512]/80 dark:text-white/80 group-hover:text-[#F0DC00] transition-colors">
                          {partyInfo.title}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Arrow Chevron if actionable */}
                {act.partyId && (
                  <div className="shrink-0 self-center text-[#8E887E] dark:text-[#A8A196] group-hover:translate-x-0.5 transition-transform">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </PressableCard>
            );
          })
        )}
      </main>
    </div>
  );
};
