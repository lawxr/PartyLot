'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Avatar, AvatarUser } from '@/components/ui/Avatar';

interface VoteBarProps {
  friend: AvatarUser;
  votes: number;
  totalVotes: number;
  percentage: number;
  isWinner?: boolean;
  index?: number;
  className?: string;
}

/**
 * VoteBar matching the trailer's result breakdown:
 * - Row showing friend avatar, name, animated progress bar, and percentage.
 * - Winner's bar fills with party yellow, other bars fill with subtle neutral track.
 * - Staggered 0.7s fill animation.
 */
export const VoteBar: React.FC<VoteBarProps> = ({
  friend,
  votes,
  percentage,
  isWinner = false,
  index = 0,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`w-full flex items-center gap-3 py-1.5 ${className}`}>
      {/* Friend avatar */}
      <Avatar
        user={friend}
        size="sm"
        border={isWinner ? 'dark' : false}
        className="shrink-0"
      />

      {/* Bar container */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs font-bold mb-1">
          <span className="truncate max-w-[140px] text-[var(--stage-text)]">
            {friend.name || 'Friend'}
          </span>
          <span className="font-mono text-[11px] text-[var(--stage-muted)] ml-2">
            {votes} {votes === 1 ? 'voto' : 'votos'} ({percentage}%)
          </span>
        </div>

        {/* Track */}
        <div className="h-2.5 w-full rounded-full bg-[var(--stage-track)] overflow-hidden">
          <motion.div
            initial={shouldReduceMotion ? { width: `${percentage}%` } : { width: '0%' }}
            animate={{ width: `${percentage}%` }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.7,
              delay: shouldReduceMotion ? 0 : index * 0.05,
              ease: 'easeOut',
            }}
            className={`h-full rounded-full ${
              isWinner ? 'bg-party-yellow' : 'bg-black/25 dark:bg-white/30'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
