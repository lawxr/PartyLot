'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Avatar, AvatarUser } from '@/components/ui/Avatar';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface WinnerRevealProps {
  winners: AvatarUser[];
  votesCount: number;
  totalVotes: number;
  subtitle?: string;
  className?: string;
}

/**
 * WinnerReveal matching the trailer's "The crew has spoken" screen:
 * - Huge central avatar with 6px yellow halo ring.
 * - Handles ties gracefully by displaying tied friends side-by-side.
 * - Winner name in large 40px display font.
 * - Vote summary pill.
 */
export const WinnerReveal: React.FC<WinnerRevealProps> = ({
  winners,
  votesCount,
  totalVotes,
  subtitle,
  className = '',
}) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const isTie = winners.length > 1;

  return (
    <div className={`flex flex-col items-center text-center my-4 ${className}`}>
      {/* Title Eyebrow */}
      <span className="font-mono text-xs font-black uppercase tracking-widest text-[var(--stage-accent-text)] mb-4">
        {t.games.crewHasSpoken}
      </span>

      {/* Hero Winner Avatar(s) with 6px Yellow Ring */}
      <div className="flex items-center justify-center gap-3 my-2">
        {winners.map((winner, idx) => (
          <motion.div
            key={winner.id || idx}
            initial={shouldReduceMotion ? { scale: 1 } : { scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 18, stiffness: 240, delay: idx * 0.1 }}
            className="relative"
          >
            {/* 6px Party Yellow Halo Ring */}
            <div className="rounded-full p-1.5 ring-6 ring-party-yellow shadow-[0_0_36px_rgba(240,220,0,0.4)]">
              <Avatar
                user={winner}
                size="2xl"
                className="w-24 h-24 min-w-24 min-h-24 shadow-md"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Winner Name in Big Display Font */}
      <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-[var(--stage-text)] tracking-tight leading-none mt-4 mb-2">
        {isTie
          ? winners.map((w) => w.name).join(' & ')
          : winners[0]?.name || t.games.nobodyYet}
      </h2>

      {/* Vote Count Summary Pill */}
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--stage-card)] border border-[var(--stage-card-border)] text-xs font-mono font-bold text-[var(--stage-muted)] shadow-2xs">
        <span>{t.games.summaryVotes(votesCount, totalVotes)}</span>
        {subtitle && <span>· {subtitle}</span>}
      </div>
    </div>
  );
};
