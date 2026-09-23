'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, Gamepad2, Users, Receipt, RotateCcw, Award, ShieldCheck, Copy, Check, ChevronDown, ChevronUp, Server } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { getOrCreateSmartAccount } from '@/lib/web3/smartAccount';
import { METROPOLIS_CONFIG, getEnvioSyncStatus } from '@/lib/web3/metropolis';

export const ProfileView: React.FC = () => {
  const { currentUser, resetToDefaults } = usePartyStore();
  const [showWeb3Details, setShowWeb3Details] = useState(false);
  const [copied, setCopied] = useState(false);

  const smartAccount = getOrCreateSmartAccount();
  const envioStatus = getEnvioSyncStatus();

  const closeCrew = [
    { name: 'Ana', nights: 12, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
    { name: 'Carlos', nights: 9, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
    { name: 'Sofi', nights: 7, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
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
    await navigator.clipboard.writeText(smartAccount.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 pt-4 px-4 sm:px-6 max-w-xl mx-auto safe-top select-none">
      {/* Profile Header */}
      <header className="flex flex-col items-center text-center my-6">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 p-1 liquid-glass-card shadow-2xl mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-full h-full object-cover rounded-full"
          />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#E9FF32] text-black flex items-center justify-center shadow-lg border border-black">
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
          {currentUser.name}
        </h2>
        <span className="text-xs font-mono text-[#E9FF32] font-semibold mt-0.5">
          {currentUser.handle} · MEDELLÍN
        </span>
      </header>

      {/* 4 Social Metrics (Shared-Experience Graph, No follower counts) */}
      <div className="grid grid-cols-4 gap-2 mb-8 text-center">
        <GlassPanel level={2} className="p-3 border border-white/10">
          <span className="font-display font-black text-xl sm:text-2xl text-white block leading-none">
            {currentUser.gatheringsCount}
          </span>
          <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider mt-1 block">
            Nights
          </span>
        </GlassPanel>

        <GlassPanel level={2} className="p-3 border border-white/10">
          <span className="font-display font-black text-xl sm:text-2xl text-[#E9FF32] block leading-none">
            {currentUser.gamesCount}
          </span>
          <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider mt-1 block">
            Games
          </span>
        </GlassPanel>

        <GlassPanel level={2} className="p-3 border border-white/10">
          <span className="font-display font-black text-xl sm:text-2xl text-white block leading-none">
            {currentUser.peopleCount}
          </span>
          <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider mt-1 block">
            People
          </span>
        </GlassPanel>

        <GlassPanel level={2} className="p-3 border border-white/10">
          <span className="font-display font-black text-xl sm:text-2xl text-white block leading-none">
            {currentUser.settlementsCount}
          </span>
          <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider mt-1 block">
            Settled
          </span>
        </GlassPanel>
      </div>

      {/* Section: CLOSE CREW (Shared-Experience Graph) */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-display font-extrabold text-base tracking-wide uppercase text-white/90">
            CLOSE CREW
          </h3>
          <span className="text-xs text-[#E9FF32] font-semibold">Verified Co-Presence</span>
        </div>

        <div className="space-y-2.5">
          {closeCrew.map((c, idx) => (
            <GlassPanel
              key={idx}
              level={2}
              className="p-3.5 flex items-center justify-between border border-white/15"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-white">
                    {c.name}
                  </h4>
                  <span className="text-xs text-white/50">Core party accomplice</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-display font-black text-sm text-[#E9FF32]">
                  {c.nights} nights together
                </span>
                <span className="text-[9px] text-white/40 block font-mono">SocialGraph.sol</span>
              </div>
            </GlassPanel>
          ))}
        </div>
      </section>

      {/* Section: BADGES & MOMENTS */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-display font-extrabold text-base tracking-wide uppercase text-white/90">
            BADGES & MOMENTS
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {badges.map((b, idx) => (
            <GlassPanel key={idx} level={2} className="p-3.5 border border-white/10">
              <span className="text-2xl mb-1.5 block">{b.icon}</span>
              <h4 className="font-display font-bold text-sm text-white">
                {b.name}
              </h4>
              <p className="text-[11px] text-white/50 mt-0.5 leading-snug">
                {b.desc}
              </p>
            </GlassPanel>
          ))}
        </div>
      </section>

      {/* Section: PAST NIGHTS */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-display font-extrabold text-base tracking-wide uppercase text-white/90">
            PAST NIGHTS
          </h3>
          <span className="text-xs text-white/40">Archive</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {pastNights.map((night, idx) => (
            <div
              key={idx}
              className="relative h-32 rounded-2xl overflow-hidden border border-white/15 p-3 flex flex-col justify-end"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={night.cover}
                alt={night.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              <div className="relative z-10">
                <span className="text-[10px] font-bold text-[#E9FF32] uppercase">
                  {night.date} · {night.people} people
                </span>
                <h4 className="font-display font-bold text-xs text-white truncate">
                  {night.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Expandable Advanced: Monad Verification & Metropolis Stack */}
      <section className="mb-8">
        <button
          onClick={() => setShowWeb3Details(!showWeb3Details)}
          className="w-full p-4 rounded-2xl liquid-glass-card border border-white/15 flex items-center justify-between text-left hover:border-white/30 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#E9FF32]" />
            <div>
              <span className="font-display font-bold text-sm text-white block">
                Onchain Identity & Metropolis Stack
              </span>
              <span className="text-[11px] text-white/50">
                Privy Smart Wallet · QuickNode · Tenderly · Envio
              </span>
            </div>
          </div>
          {showWeb3Details ? (
            <ChevronUp className="w-4 h-4 text-white/60" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/60" />
          )}
        </button>

        <AnimatePresence>
          {showWeb3Details && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2.5 text-xs text-white/80 overflow-hidden"
            >
              <GlassPanel level={2} className="p-4 space-y-3 border border-white/10">
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider block">
                    COUNTERFACTUAL SMART ACCOUNT
                  </span>
                  <div className="flex items-center justify-between mt-1 p-2 rounded-xl bg-black/50 border border-white/10 font-mono text-[11px]">
                    <span className="text-[#E9FF32] truncate max-w-[240px]">
                      {smartAccount.address}
                    </span>
                    <button
                      onClick={handleCopyAddress}
                      className="text-white/60 hover:text-white p-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#E9FF32]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-[11px]">
                  <div>
                    <span className="text-white/40 block">Gas Sponsorship</span>
                    <span className="font-bold text-[#E9FF32]">Pimlico Paymaster (100%)</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">RPC Provider</span>
                    <span className="font-bold text-white">QuickNode Build Plan</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Simulation Engine</span>
                    <span className="font-bold text-white">Tenderly Pro</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Indexer Pipeline</span>
                    <span className="font-bold text-white">Envio HyperIndex ({envioStatus.indexerStatus})</span>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Reset Demo Data Button */}
      <div className="pt-2 flex justify-center">
        <button
          onClick={() => {
            resetToDefaults();
            alert('App state restored to fresh demo data!');
          }}
          className="text-xs text-white/40 hover:text-white/80 flex items-center gap-1.5 py-2 px-4 rounded-full border border-white/10 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </div>
  );
};
