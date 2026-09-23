'use client';

import React, { useState } from 'react';
import { RotateCcw, ShieldCheck, Copy, Check, LogOut, Sparkles } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { getOrCreateSmartAccount } from '@/lib/web3/smartAccount';
import { getEnvioSyncStatus } from '@/lib/web3/metropolis';
import { usePrivySync } from '@/hooks/usePrivySync';
import { SharedExperienceConnection } from '@/types';

export const ProfileView: React.FC = () => {
  const { currentUser, resetToDefaults } = usePartyStore();
  const { logout: privyLogout } = usePrivySync();
  const [copied, setCopied] = useState(false);

  const smartAccount = getOrCreateSmartAccount();
  const activeAddress = currentUser.walletAddress || smartAccount.address;
  const envioStatus = getEnvioSyncStatus();

  const sharedConnections: SharedExperienceConnection[] = [
    {
      targetUserId: 'u-ana',
      targetUserName: 'Ana',
      targetUserHandle: '@ana.monad',
      targetUserAvatar:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      gatheringsTogether: 12,
      gamesPlayedTogether: 31,
      settlementsTogether: 8,
      recurringCrewsShared: 3,
      sparkLevel: 'Soul Crew',
    },
    {
      targetUserId: 'u-carlos',
      targetUserName: 'Carlos',
      targetUserHandle: '@carlos.lens',
      targetUserAvatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      gatheringsTogether: 9,
      gamesPlayedTogether: 24,
      settlementsTogether: 5,
      recurringCrewsShared: 2,
      sparkLevel: 'Ride or Die',
    },
    {
      targetUserId: 'u-valen',
      targetUserName: 'Valen',
      targetUserHandle: '@valen.eth',
      targetUserAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      gatheringsTogether: 7,
      gamesPlayedTogether: 18,
      settlementsTogether: 4,
      recurringCrewsShared: 2,
      sparkLevel: 'Ignited',
    },
    {
      targetUserId: 'u-sofi',
      targetUserName: 'Sofi',
      targetUserHandle: '@sofi.partylot',
      targetUserAvatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      gatheringsTogether: 6,
      gamesPlayedTogether: 14,
      settlementsTogether: 3,
      recurringCrewsShared: 1,
      sparkLevel: 'Kindling',
    },
  ];

  const pastNights = [
    {
      title: 'Neon Rooftop Sunset',
      date: 'Aug 14',
      people: 18,
      cover: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Secret Warehouse Rave',
      date: 'Jul 29',
      people: 26,
      cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const badges = [
    { name: 'Aux Cord Royalty', desc: 'Played 40+ tracks without a single skip', icon: '🎧' },
    { name: 'Late Night Survivor', desc: 'Present at 5+ sunrises in 2026', icon: '🌅' },
    { name: 'Instant Settler', desc: '100% on-time damage settlements', icon: '⚡' },
  ];

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(activeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#15140f] text-white pb-32 pt-4 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto safe-top select-none w-full">
      {/* Profile Header */}
      <header className="flex flex-col items-center text-center my-6 sm:my-8 border-b border-white/10 pb-6">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#F0DC00]/50 p-1 liquid-glass-card shadow-2xl mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-full h-full object-cover rounded-full"
          />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#F0DC00] text-black flex items-center justify-center shadow-lg border border-black">
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <h2 className="bubble text-4xl sm:text-6xl text-white tracking-tight drop-shadow-lg">
          {currentUser.name}
        </h2>
        <span className="text-xs sm:text-sm font-mono text-[#F0DC00] font-semibold mt-1">
          {currentUser.handle} · {currentUser.email || 'MEDELLÍN'} · {currentUser.isPrivyAuthenticated ? 'PRIVY EMBEDDED' : 'LOCAL PASSKEY'}
        </span>
      </header>

      {/* 4 Social Metrics (Shared-Experience Graph, No follower counts) */}
      <div className="grid grid-cols-4 gap-3 sm:gap-4 mb-10 text-center">
        <GlassPanel level={2} className="p-4 border border-white/10">
          <span className="font-display font-black text-2xl sm:text-4xl text-white block leading-none">
            {currentUser.gatheringsCount}
          </span>
          <span className="text-[10px] sm:text-xs uppercase font-bold text-white/50 tracking-wider mt-1.5 block">
            Nights
          </span>
        </GlassPanel>

        <GlassPanel level={2} className="p-4 border border-white/10">
          <span className="font-display font-black text-2xl sm:text-4xl text-[#F0DC00] block leading-none">
            {currentUser.gamesCount}
          </span>
          <span className="text-[10px] sm:text-xs uppercase font-bold text-white/50 tracking-wider mt-1.5 block">
            Games
          </span>
        </GlassPanel>

        <GlassPanel level={2} className="p-4 border border-white/10">
          <span className="font-display font-black text-2xl sm:text-4xl text-white block leading-none">
            {currentUser.peopleCount}
          </span>
          <span className="text-[10px] sm:text-xs uppercase font-bold text-white/50 tracking-wider mt-1.5 block">
            People
          </span>
        </GlassPanel>

        <GlassPanel level={2} className="p-4 border border-white/10">
          <span className="font-display font-black text-2xl sm:text-4xl text-white block leading-none">
            {currentUser.settlementsCount}
          </span>
          <span className="text-[10px] sm:text-xs uppercase font-bold text-white/50 tracking-wider mt-1.5 block">
            Settled
          </span>
        </GlassPanel>
      </div>

      {/* Multi-Column Desktop Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Close Crew (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h3 className="font-display font-extrabold text-base sm:text-lg tracking-wide uppercase text-white/90">
                  SHARED-EXPERIENCE GRAPH
                </h3>
                <p className="text-[11px] text-white/50">Verified co-presence · No vanity followers</p>
              </div>
              <span className="text-xs text-[#F0DC00] font-semibold bg-[#F0DC00]/10 border border-[#F0DC00]/20 px-2 py-0.5 rounded-full">
                Onchain Matrix
              </span>
            </div>

            <div className="space-y-3">
              {sharedConnections.map((c) => {
                const sparkColors: Record<string, { bg: string; text: string; border: string }> = {
                  'Soul Crew': { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
                  'Ride or Die': { bg: 'bg-[#F0DC00]/15', text: 'text-[#F0DC00]', border: 'border-[#F0DC00]/30' },
                  'Ignited': { bg: 'bg-orange-500/15', text: 'text-orange-300', border: 'border-orange-500/30' },
                  'Kindling': { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30' },
                };
                const spark = sparkColors[c.sparkLevel] || sparkColors['Kindling'];

                return (
                  <GlassPanel
                    key={c.targetUserId}
                    level={2}
                    className="p-4 border border-white/15 hover:border-white/30 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full overflow-hidden border border-white/20 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={c.targetUserAvatar} alt={c.targetUserName} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-base text-white">
                              {c.targetUserName}
                            </h4>
                            <span className="text-[10px] text-white/40 font-mono">
                              {c.targetUserHandle}
                            </span>
                          </div>
                          <span className="text-xs text-white/50 block">Recurring Accomplice</span>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${spark.bg} ${spark.text} ${spark.border} shadow-sm`}
                      >
                        ⚡ {c.sparkLevel}
                      </span>
                    </div>

                    {/* Co-Presence Multi-Metrics Grid */}
                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/5 text-center">
                      <div className="p-1.5 rounded-lg bg-white/[0.02]">
                        <span className="text-[10px] text-white/40 block">Parties</span>
                        <span className="font-display font-black text-xs sm:text-sm text-white">
                          {c.gatheringsTogether}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/[0.02]">
                        <span className="text-[10px] text-white/40 block">Games</span>
                        <span className="font-display font-black text-xs sm:text-sm text-[#F0DC00]">
                          {c.gamesPlayedTogether}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/[0.02]">
                        <span className="text-[10px] text-white/40 block">Settled</span>
                        <span className="font-display font-black text-xs sm:text-sm text-white">
                          {c.settlementsTogether}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/[0.02]">
                        <span className="text-[10px] text-white/40 block">Crews</span>
                        <span className="font-display font-black text-xs sm:text-sm text-white">
                          {c.recurringCrewsShared}
                        </span>
                      </div>
                    </div>
                  </GlassPanel>
                );
              })}
            </div>
          </section>

          {/* Action Buttons: Reset Demo & Log Out */}
          <div className="pt-2 space-y-2.5">
            <button
              onClick={() => {
                resetToDefaults();
                alert('App state restored to fresh demo data!');
              }}
              className="w-full text-xs text-white/50 hover:text-white flex items-center justify-center gap-2 py-3 px-4 rounded-2xl liquid-glass-card border border-white/10 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Local Demo Data</span>
            </button>

            <button
              onClick={privyLogout}
              className="w-full text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl liquid-glass-card border border-red-500/20 hover:border-red-500/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Right Column: Badges, Past Nights, Metropolis Diagnostics (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section: BADGES & MOMENTS */}
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-display font-extrabold text-base sm:text-lg tracking-wide uppercase text-white/90">
                BADGES & MOMENTS
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {badges.map((b, idx) => (
                <GlassPanel key={idx} level={2} className="p-4 border border-white/10 hover:border-white/25 transition-colors">
                  <span className="text-3xl mb-2 block">{b.icon}</span>
                  <h4 className="font-display font-bold text-sm sm:text-base text-white">
                    {b.name}
                  </h4>
                  <p className="text-xs text-white/50 mt-1 leading-snug">
                    {b.desc}
                  </p>
                </GlassPanel>
              ))}
            </div>
          </section>

          {/* Section: PAST NIGHTS */}
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-display font-extrabold text-base sm:text-lg tracking-wide uppercase text-white/90">
                PAST NIGHTS
              </h3>
              <span className="text-xs text-white/40">Event archive</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {pastNights.map((night, idx) => (
                <div
                  key={idx}
                  className="relative h-36 sm:h-40 rounded-3xl overflow-hidden border border-white/15 p-4 flex flex-col justify-end group shadow-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={night.cover}
                    alt={night.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                  <div className="relative z-10">
                    <span className="text-[10px] font-bold text-[#F0DC00] uppercase tracking-wider">
                      {night.date} · {night.people} people
                    </span>
                    <h4 className="font-display font-bold text-sm sm:text-base text-white truncate">
                      {night.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Advanced: Monad Verification & Metropolis Stack Diagnostics */}
          <section>
            <GlassPanel level={2} className="p-5 border border-white/15 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#F0DC00]" />
                  <span className="font-display font-bold text-base text-white">
                    Onchain Identity & Metropolis Stack
                  </span>
                </div>
                <span className="text-xs font-mono text-[#F0DC00] font-semibold">
                  ACTIVE
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider block">
                  COUNTERFACTUAL SMART ACCOUNT
                </span>
                <div className="flex items-center justify-between mt-1.5 p-3 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs">
                  <span className="text-[#F0DC00] truncate max-w-[340px]">
                    {activeAddress}
                  </span>
                  <button
                    onClick={handleCopyAddress}
                    className="text-white/60 hover:text-white p-1 ml-2 shrink-0"
                    aria-label="Copy Address"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#F0DC00]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-white/40 block text-[10px] uppercase font-bold">Gas Sponsorship</span>
                  <span className="font-bold text-[#F0DC00]">Pimlico Paymaster (100%)</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-white/40 block text-[10px] uppercase font-bold">RPC Provider</span>
                  <span className="font-bold text-white">QuickNode Build Plan</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-white/40 block text-[10px] uppercase font-bold">Simulation Engine</span>
                  <span className="font-bold text-white">Tenderly Pro</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-white/40 block text-[10px] uppercase font-bold">Indexer Pipeline</span>
                  <span className="font-bold text-white">Envio HyperIndex ({envioStatus.indexerStatus})</span>
                </div>
              </div>
            </GlassPanel>
          </section>
        </div>
      </div>
    </div>
  );
};
