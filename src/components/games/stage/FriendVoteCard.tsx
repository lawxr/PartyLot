'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Avatar, AvatarUser } from '@/components/ui/Avatar';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface FriendVoteCardProps {
  friend: AvatarUser;
  isSelected: boolean;
  onVote: () => void;
  disabled?: boolean;
  votesCount?: number;
  showVotes?: boolean;
  className?: string;
}

/**
 * FriendVoteCard matching the trailer 2x2 grid:
 * - 168px tall card with 86px circular avatar.
 * - In unselected state: uses theme stage-card background and clean typography.
 * - When selected: fills completely with bright party-yellow and dark text with black checkmark.
 * - Springy 0.28s bounce animation honoring prefers-reduced-motion.
 */
export const FriendVoteCard: React.FC<FriendVoteCardProps> = ({
  friend,
  isSelected,
  onVote,
  disabled = false,
  votesCount,
  showVotes = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onVote}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={t.games.voteFor(friend.name || 'friend')}
      whileTap={!disabled && !shouldReduceMotion ? { scale: 0.93 } : undefined}
      animate={
        isSelected && !shouldReduceMotion
          ? { scale: [1, 0.93, 1.04, 1] }
          : { scale: 1 }
      }
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={`relative w-full h-[168px] sm:h-[180px] rounded-[28px] p-3.5 flex flex-col items-center justify-between transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-party-yellow ${
        isSelected
          ? 'bg-party-yellow text-on-party-yellow shadow-[0_12px_32px_rgba(240,220,0,0.35)] border-2 border-party-yellow'
          : 'bg-[var(--stage-card)] text-[var(--stage-text)] border border-[var(--stage-card-border)] hover:border-black/20 dark:hover:border-white/20 shadow-xs'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    >
      {/* Top right vote count badge if votes are revealed */}
      {showVotes && typeof votesCount === 'number' && (
        <span
          className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            isSelected
              ? 'bg-black/15 text-on-party-yellow'
              : 'bg-black/5 dark:bg-white/10 text-[var(--stage-muted)]'
          }`}
        >
          {votesCount}
        </span>
      )}

      {/* Centered 86px Avatar with check overlay */}
      <div className="relative mt-2 flex items-center justify-center">
        <div
          className={`rounded-full p-0.5 transition-colors ${
            isSelected
              ? 'ring-3 ring-black/20'
              : 'ring-1 ring-black/5 dark:ring-white/10'
          }`}
        >
          <Avatar
            user={friend}
            size="2xl"
            className="w-[84px] h-[84px] min-w-[84px] min-h-[84px] shadow-sm"
          />
        </div>

        {/* Selected Black Check Badge */}
        {isSelected && (
          <motion.div
            initial={shouldReduceMotion ? { scale: 1 } : { scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#171512] text-white flex items-center justify-center shadow-md z-10"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </motion.div>
        )}
      </div>

      {/* Friend Name Label */}
      <div className="w-full text-center px-1 mb-1">
        <span className="font-display font-bold text-sm sm:text-base leading-tight truncate block">
          {friend.name || 'Friend'}
        </span>
      </div>
    </motion.button>
  );
};
