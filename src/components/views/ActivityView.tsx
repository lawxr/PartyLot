'use client';

import React from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { usePartyStore } from '@/store/usePartyStore';
import { Bell, Sparkles, DollarSign, Vote, Gamepad2, UserPlus } from 'lucide-react';

export const ActivityView: React.FC = () => {
  const { activities, parties, selectParty } = usePartyStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'join':
        return <UserPlus className="w-4 h-4 text-[#E9FF32]" />;
      case 'pot':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'poll':
        return <Vote className="w-4 h-4 text-blue-400" />;
      case 'game':
        return <Gamepad2 className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-28 pt-4 px-4 sm:px-6 max-w-2xl mx-auto safe-top select-none">
      <header className="py-3 mb-6">
        <span className="text-xs uppercase tracking-wider text-white/50 font-semibold">
          LIVE FEED
        </span>
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
          Party Activity
        </h2>
      </header>

      <div className="flex flex-col gap-3">
        {activities.map((act) => {
          const party = parties.find((p) => p.id === act.partyId);

          return (
            <GlassPanel
              key={act.id}
              level={2}
              onClick={() => act.partyId && selectParty(act.partyId)}
              className="p-4 flex items-center gap-3.5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-white/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={act.avatar}
                  alt="User"
                  className="w-full h-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black/80 flex items-center justify-center border border-white/20 shadow-md">
                  {getIcon(act.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90 leading-snug">
                  {act.text}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {party && (
                    <span className="text-[11px] font-bold text-[#E9FF32] truncate max-w-[140px]">
                      {party.title}
                    </span>
                  )}
                  <span className="text-[11px] text-white/40">• {act.time}</span>
                </div>
              </div>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
};
