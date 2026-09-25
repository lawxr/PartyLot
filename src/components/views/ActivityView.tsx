'use client';

import React, { useState } from 'react';
import { usePartyStore } from '@/store/usePartyStore';
import { Bell, Sparkles, DollarSign, Vote, Gamepad2, UserPlus, Flame } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export const ActivityView: React.FC = () => {
  const { activities, parties, selectParty, crews } = usePartyStore();
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState<string>('all');

  const getIcon = (type: string) => {
    switch (type) {
      case 'join':
        return <UserPlus className="w-3.5 h-3.5 text-[#F0DC00]" />;
      case 'pot':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
      case 'poll':
        return <Vote className="w-3.5 h-3.5 text-blue-400" />;
      case 'game':
        return <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const filtered = filterType === 'all'
    ? activities
    : activities.filter((a) => a.type === filterType);

  const filters = [
    { id: 'all', label: t.activityView.all },
    { id: 'join', label: t.activityView.rsvps },
    { id: 'pot', label: t.activityView.treasury },
    { id: 'game', label: t.activityView.games },
    { id: 'poll', label: t.activityView.polls },
  ];

  return (
    <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] pb-32 pt-4 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto safe-top select-none w-full transition-colors duration-200">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 py-4 mb-6 border-b border-[rgba(35,30,22,0.08)] dark:border-white/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#6F6A62] dark:text-[#A8A196] font-semibold block mb-0.5">
            {t.activityView.subtitle}
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#171512] dark:text-white tracking-tight">
            {t.activityView.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  filterType === f.id
                    ? 'bg-[#F0DC00] text-[#171512] shadow-sm'
                    : 'bg-[#FFFDF8] dark:bg-[#1C1A16] text-[#6F6A62] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white border border-[rgba(35,30,22,0.08)] dark:border-white/10 shadow-xs'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
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
                <div
                  key={act.id}
                  onClick={() => act.partyId && selectParty(act.partyId)}
                  className="p-4 flex items-center gap-3.5 bg-[#FFFDF8] dark:bg-[#1C1A16] hover:bg-[#FDFBF7] dark:hover:bg-[#25221D] transition-all cursor-pointer border border-[rgba(35,30,22,0.07)] dark:border-white/10 rounded-[20px] shadow-[0_4px_16px_rgba(40,30,20,0.03)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
                >
                  <div className="relative shrink-0 w-11 h-11">
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#FFFDF8] dark:border-[#1C1A16] flex items-center justify-center bg-[#F1EADF] dark:bg-[#2A2620] shadow-sm">
                      {act.avatar ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={act.avatar}
                          alt="User"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#F0DC00]/30 text-[#171512] dark:text-white flex items-center justify-center font-display font-black text-sm">
                          A
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FFFDF8] dark:bg-[#1C1A16] flex items-center justify-center border-2 border-[#FFFDF8] dark:border-[#1C1A16] shadow-sm z-10">
                      {getIcon(act.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#171512] dark:text-[#F5F1E8] leading-snug">
                      {act.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {party && (
                        <span className="text-[11px] font-bold text-[#171512] dark:text-white truncate max-w-[160px]">
                          {party.title}
                        </span>
                      )}
                      <span className="text-[11px] text-[#8E887E] dark:text-[#A8A196]">• {act.time}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 rounded-3xl bg-[#FFFDF8] dark:bg-[#1C1A16] border border-[rgba(35,30,22,0.08)] dark:border-white/10 text-center shadow-sm">
              <Bell className="w-8 h-8 text-[#999187] dark:text-[#6F6A62] mx-auto mb-2" />
              <p className="text-sm text-[#6F6A62] dark:text-[#A8A196]">{t.activityView.empty}</p>
            </div>
          )}
        </div>

        {/* Right Column: Trending Circles & Network Status (4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-6 hidden lg:block">
          <div className="p-5 bg-[#FFFDF8] dark:bg-[#1C1A16] border border-[rgba(35,30,22,0.08)] dark:border-white/10 rounded-3xl shadow-[0_4px_20px_rgba(40,30,20,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-[#E6D300]" />
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#171512] dark:text-white">
                {t.activityView.activeCircles}
              </span>
            </div>

            <div className="space-y-3">
              {crews.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F2E8] dark:bg-[#25221D] border border-[rgba(35,30,22,0.05)] dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-black/5 dark:border-white/10 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.coverImage} alt={c.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h5 className="font-display font-bold text-xs text-[#171512] dark:text-white truncate max-w-[140px]">{c.name}</h5>
                      <span className="text-[10px] text-[#6F6A62] dark:text-[#A8A196]">{t.activityView.members(c.membersCount)}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#171512] dark:text-white font-semibold">{c.lastActivity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF5C0] dark:bg-[#2C2718] border border-[#F0DC00]/50 dark:border-[#F0DC00]/30 text-xs text-[#171512] dark:text-[#F0DC00] leading-relaxed">
            ⚡ <span className="font-bold text-[#171512] dark:text-white">Instant Event Relay:</span> All member interactions and game results are broadcasted in real time across the private graph.
          </div>
        </div>
      </div>
    </div>
  );
};
