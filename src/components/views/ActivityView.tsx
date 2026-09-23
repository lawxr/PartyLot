'use client';

import React, { useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { usePartyStore } from '@/store/usePartyStore';
import { Bell, Sparkles, DollarSign, Vote, Gamepad2, UserPlus, Flame } from 'lucide-react';

export const ActivityView: React.FC = () => {
  const { activities, parties, selectParty, crews } = usePartyStore();
  const [filterType, setFilterType] = useState<string>('all');

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

  const filtered = filterType === 'all'
    ? activities
    : activities.filter((a) => a.type === filterType);

  const filters = [
    { id: 'all', label: 'All Activity' },
    { id: 'join', label: 'RSVPs' },
    { id: 'pot', label: 'Treasury' },
    { id: 'game', label: 'Games & Trivia' },
    { id: 'poll', label: 'Polls' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 pt-4 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto safe-top select-none w-full">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 py-4 mb-6 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-wider text-white/50 font-semibold block mb-0.5">
            LIVE NETWORK PULSE
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            Party Activity
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                filterType === f.id
                  ? 'bg-[#E9FF32] text-black shadow-md'
                  : 'liquid-glass-card text-white/70 hover:text-white border border-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* Responsive 2-Column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Activity Feed (8 cols on desktop) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {filtered.length > 0 ? (
            filtered.map((act) => {
              const party = parties.find((p) => p.id === act.partyId);

              return (
                <GlassPanel
                  key={act.id}
                  level={2}
                  onClick={() => act.partyId && selectParty(act.partyId)}
                  className="p-4 flex items-center gap-3.5 hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
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
                        <span className="text-[11px] font-bold text-[#E9FF32] truncate max-w-[160px]">
                          {party.title}
                        </span>
                      )}
                      <span className="text-[11px] text-white/40">• {act.time}</span>
                    </div>
                  </div>
                </GlassPanel>
              );
            })
          ) : (
            <div className="p-8 rounded-3xl liquid-glass-card text-center border border-white/10">
              <Bell className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-sm text-white/60">No activity under this category yet.</p>
            </div>
          )}
        </div>

        {/* Right Column: Trending Circles & Network Status (4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-6 hidden lg:block">
          <GlassPanel level={2} className="p-5 border border-white/15">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-[#E9FF32]" />
              <span className="text-xs uppercase font-extrabold tracking-wider text-white">
                ACTIVE CREW CIRCLES
              </span>
            </div>

            <div className="space-y-3">
              {crews.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/15 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.coverImage} alt={c.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h5 className="font-display font-bold text-xs text-white truncate max-w-[140px]">{c.name}</h5>
                      <span className="text-[10px] text-white/50">{c.membersCount} members</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#E9FF32] font-semibold">{c.lastActivity}</span>
                </div>
              ))}
            </div>
          </GlassPanel>

          <div className="p-4 rounded-2xl bg-[#E9FF32]/10 border border-[#E9FF32]/25 text-xs text-white/80 leading-relaxed">
            ⚡ <span className="font-bold text-white">Instant Event Relay:</span> All member interactions and game results are broadcasted in real time across the private graph.
          </div>
        </div>
      </div>
    </div>
  );
};
