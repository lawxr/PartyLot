'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Share2,
  Sparkles,
  Download,
  Check,
  Award,
  Flame,
  Disc,
  ShieldCheck,
  Users,
  Copy,
  Receipt,
  Gamepad2,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { TopNav } from '@/components/navigation/TopNav';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassPanel } from '@/components/ui/GlassPanel';
import confetti from 'canvas-confetti';

export const RecapView: React.FC = () => {
  const { parties, currentPartyId } = usePartyStore();
  const party = parties.find((p) => p.id === currentPartyId) || parties[0];

  const [copied, setCopied] = useState(false);
  const posterRef = useRef<HTMLDivElement | null>(null);

  const handleShareRecap = async () => {
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E9FF32', '#FFFFFF', '#EC4899'],
    });

    const shareText = `PARTYLOT RECAP — ${party.title} 🔥\n14 People · $284 Shared · 7 Games · MVP: Ana\n\nRelive the night on Partylot: https://partylot.app/party/${party.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${party.title} Recap`,
          text: shareText,
        });
      } catch {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 select-none">
      <TopNav title="EDITORIAL RECAP" />

      <main className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1800px] mx-auto pt-2 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: The Capture-Ready Editorial Poster (6 cols on desktop) */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div
              ref={posterRef}
              className="relative w-full rounded-[36px] overflow-hidden p-6 sm:p-7 border border-white/20 shadow-2xl bg-black text-white film-grain"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(5,5,5,0.78) 0%, rgba(5,5,5,0.96) 100%), url("${party.coverImage}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Top Brand Banner */}
              <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-6">
                <span className="font-display font-black text-lg text-[#E9FF32] tracking-tighter">
                  PARTYLOT
                </span>
                <span className="text-[11px] font-mono tracking-widest text-white/70 uppercase">
                  OFFICIAL EVENT DOSSIER
                </span>
              </div>

              {/* Headline Title */}
              <div className="mb-6">
                <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[0.9] drop-shadow-lg">
                  {party.title}
                </h1>
                <p className="font-display font-extrabold text-xs sm:text-sm text-[#E9FF32] tracking-widest uppercase mt-2">
                  {party.date} · {party.location}
                </p>
              </div>

              {/* Giant Grid of Poster Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3.5 rounded-2xl liquid-glass-card border border-white/15">
                  <span className="font-display font-black text-3xl sm:text-4xl text-white block leading-none">
                    14
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">
                    PEOPLE ATTENDED
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl liquid-glass-card border border-white/15">
                  <span className="font-display font-black text-3xl sm:text-4xl text-[#E9FF32] block leading-none">
                    $284
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">
                    SHARED DAMAGE
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl liquid-glass-card border border-white/15">
                  <span className="font-display font-black text-3xl sm:text-4xl text-white block leading-none">
                    7
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">
                    MINIGAMES PLAYED
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl liquid-glass-card border border-white/15">
                  <span className="font-display font-black text-3xl sm:text-4xl text-white block leading-none">
                    93
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">
                    CONSENSUS VOTES
                  </span>
                </div>
              </div>

              {/* Hall of Fame Awards */}
              <div className="p-4 rounded-2xl liquid-glass-modal border border-white/20 mb-6 space-y-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E9FF32] block">
                  NIGHT AWARDS
                </span>

                <div className="flex items-center justify-between text-xs font-bold border-b border-white/10 pb-2">
                  <span className="text-white/60 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#E9FF32]" />
                    MVP OF THE NIGHT
                  </span>
                  <span className="text-white font-display font-black">ANA</span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold border-b border-white/10 pb-2">
                  <span className="text-white/60 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    GAME KING
                  </span>
                  <span className="text-white font-display font-black">CARLOS</span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white/60 flex items-center gap-1.5">
                    <Disc className="w-3.5 h-3.5 text-sky-400" />
                    OFFICIAL AUX DJ
                  </span>
                  <span className="text-white font-display font-black">LAW</span>
                </div>
              </div>

              {/* Rollover Balance Card */}
              <div className="p-3.5 rounded-2xl bg-[#E9FF32]/10 border border-[#E9FF32]/30 flex items-center justify-between">
                <span className="text-xs font-bold text-white/80">
                  ROLLED INTO NEXT PARTY
                </span>
                <span className="font-display font-black text-lg text-[#E9FF32]">
                  +$18.20
                </span>
              </div>
            </div>

            {/* Mobile Share CTA (Hidden on desktop) */}
            <div className="w-full mt-5 lg:hidden space-y-2">
              <GlassButton
                variant="accent"
                size="lg"
                fullWidth
                onClick={handleShareRecap}
                icon={copied ? <Check className="w-5 h-5 text-black" /> : <Share2 className="w-5 h-5 text-black" />}
              >
                {copied ? 'Recap Copied to Clipboard!' : 'Share Recap'}
              </GlassButton>
            </div>
          </div>

          {/* Right Column: Editorial Breakdown & Export Hub (6 cols on desktop) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Monad Proof-of-Presence Card */}
            <GlassPanel level={2} className="p-6 border border-white/15 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#E9FF32]" />
                  <span className="text-xs uppercase font-extrabold tracking-wider text-white">
                    VERIFIED SOCIAL GRAPH
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ONCHAIN RECORD
                </span>
              </div>

              <h3 className="font-display font-black text-2xl text-white tracking-tight mb-2">
                Night Dossier & Proof of Presence
              </h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-4">
                Attendance and shared treasury liquidation for <span className="text-white font-semibold">{party.title}</span> were signed via EIP-712 permits and attested on Monad Metropolis.
              </p>

              <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-white/10 text-center">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <Users className="w-4 h-4 text-[#E9FF32] mx-auto mb-1" />
                  <span className="font-display font-black text-base text-white block">14</span>
                  <span className="text-[9px] uppercase text-white/50">Attested</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <Receipt className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                  <span className="font-display font-black text-base text-white block">100%</span>
                  <span className="text-[9px] uppercase text-white/50">Settled</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <Gamepad2 className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                  <span className="font-display font-black text-base text-white block">7</span>
                  <span className="text-[9px] uppercase text-white/50">Games</span>
                </div>
              </div>
            </GlassPanel>

            {/* Attendees Who Earned Co-Presence Badge */}
            <GlassPanel level={2} className="p-6 border border-white/15">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-white/60">
                  VERIFIED ATTENDEES ({party.members.length})
                </span>
                <span className="text-[11px] text-[#E9FF32] font-semibold">Social badges minted</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {party.members.map((member) => (
                  <div
                    key={member.id}
                    className="p-2.5 rounded-xl liquid-glass-card flex items-center gap-2.5 border border-white/10"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white truncate block">
                        {member.name}
                      </span>
                      <span className="text-[9px] text-[#E9FF32] font-mono">
                        {member.role === 'host' ? 'Host' : 'Verified'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex flex-col gap-3 pt-2">
              <GlassButton
                variant="accent"
                size="lg"
                fullWidth
                onClick={handleShareRecap}
                icon={copied ? <Check className="w-5 h-5 text-black" /> : <Share2 className="w-5 h-5 text-black" />}
              >
                {copied ? 'Recap Link Copied to Clipboard!' : 'Share Editorial Recap'}
              </GlassButton>

              <GlassButton
                variant="glass"
                size="lg"
                fullWidth
                onClick={handleShareRecap}
                icon={<Download className="w-5 h-5 text-white" />}
              >
                Download Instagram Story Poster
              </GlassButton>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
