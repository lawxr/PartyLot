'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Share2, Sparkles, Download, Check, Award, Flame, Disc } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { TopNav } from '@/components/navigation/TopNav';
import { GlassButton } from '@/components/ui/GlassButton';
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

      <main className="px-4 sm:px-6 max-w-md mx-auto pt-2 flex flex-col items-center">
        {/* The Capture-Ready Editorial Poster Card */}
        <div
          ref={posterRef}
          className="relative w-full rounded-[36px] overflow-hidden p-6 sm:p-7 border border-white/20 shadow-2xl bg-black text-white film-grain"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(5,5,5,0.75) 0%, rgba(5,5,5,0.95) 100%), url("${party.coverImage}")`,
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
            <h1 className="font-display font-black text-5xl sm:text-6xl text-white tracking-tight leading-[0.9] drop-shadow-lg">
              {party.title}
            </h1>
            <p className="font-display font-extrabold text-sm sm:text-base text-[#E9FF32] tracking-widest uppercase mt-2">
              SEP 26 · MEDELLÍN PENTHOUSE
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

        {/* Share Action Button */}
        <div className="w-full mt-6 space-y-2">
          <GlassButton
            variant="accent"
            size="lg"
            fullWidth
            onClick={handleShareRecap}
            icon={copied ? <Check className="w-5 h-5 text-black" /> : <Share2 className="w-5 h-5 text-black" />}
          >
            {copied ? 'Recap Copied to Clipboard!' : 'Share recap'}
          </GlassButton>

          <p className="text-[11px] text-white/40 text-center font-medium">
            Ready to export as Instagram Story or iMessage poster.
          </p>
        </div>
      </main>
    </div>
  );
};
