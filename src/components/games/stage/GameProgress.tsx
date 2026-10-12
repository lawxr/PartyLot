'use client';

import React from 'react';

interface GameProgressProps {
  votedCount: number;
  totalMembers: number;
  hintText?: string;
  className?: string;
}

/**
 * GameProgress footer element matching the trailer:
 * - Shows live counter "n of N voted"
 * - Contextual instruction hint ("Tap a friend to vote")
 * - Integrated aria-live region for accessibility screen reader announcements.
 */
export const GameProgress: React.FC<GameProgressProps> = ({
  votedCount,
  totalMembers,
  hintText = 'Tap a friend to vote',
  className = '',
}) => {
  return (
    <footer
      aria-live="polite"
      className={`w-full flex flex-col items-center text-center gap-1.5 pt-3 pb-1 ${className}`}
    >
      <span className="text-xs sm:text-[13px] font-semibold text-[var(--stage-muted)]">
        {hintText}
      </span>
      <span className="font-mono text-[11px] font-bold text-[var(--stage-text)] opacity-80 uppercase tracking-wider">
        {votedCount} de {totalMembers} {totalMembers === 1 ? 'persona votó' : 'personas votaron'}
      </span>
    </footer>
  );
};
