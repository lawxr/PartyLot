'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface PickBlockProps {
  choice: 'A' | 'B';
  title: string;
  isChosen: boolean;
  isOtherChosen: boolean;
  percentage?: number;
  votesCount?: number;
  onPick: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * PickBlock matching the trailer's This or That split layout:
 * - Option A in energetic warm orange (--game-orange) and Option B in party yellow.
 * - Text is high contrast across both themes.
 * - Interactive state: grows to scale 1.03 with a thick 6px ring when chosen.
 */
export const PickBlock: React.FC<PickBlockProps> = ({
  choice,
  title,
  isChosen,
  isOtherChosen,
  percentage,
  votesCount,
  onPick,
  disabled = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const isA = choice === 'A';

  // Base background: A = game-orange, B = party-yellow
  const bgStyle = isA
    ? 'bg-[var(--game-orange)] text-[var(--game-orange-ink)]'
    : 'bg-party-yellow text-on-party-yellow';

  return (
    <motion.button
      type="button"
      onClick={onPick}
      disabled={disabled}
      aria-pressed={isChosen}
      aria-label={t.games.choose(title)}
      whileTap={!disabled && !shouldReduceMotion ? { scale: 0.96 } : undefined}
      animate={{
        scale: isChosen && !shouldReduceMotion ? 1.03 : 1,
        opacity: isOtherChosen ? 0.55 : 1,
      }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`relative w-full rounded-[32px] p-6 flex flex-col justify-between items-center text-center transition-all cursor-pointer select-none overflow-hidden ${bgStyle} ${
        isChosen
          ? 'ring-6 ring-[var(--stage-ring-outline)] dark:ring-white shadow-2xl z-20'
          : 'shadow-md hover:brightness-105 active:brightness-95'
      } ${disabled ? 'cursor-not-allowed' : ''} ${className}`}
    >
      {/* Top Header: Choice identifier pill */}
      <div className="w-full flex items-center justify-between">
        <span className="px-3 py-1 rounded-full bg-black/15 text-[11px] font-mono font-black uppercase tracking-wider">
          {t.games.optionLabel(choice)}
        </span>

        {isChosen && (
          <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shadow-xs">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </span>
        )}
      </div>

      {/* Center: Large dilemma title */}
      <div className="my-auto py-3">
        <h3 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-none">
          {title}
        </h3>
      </div>

      {/* Bottom: Result stats when votes exist */}
      <div className="w-full min-h-[32px] flex items-center justify-between text-xs font-mono font-black">
        {typeof percentage === 'number' ? (
          <>
            <span className="text-xl sm:text-2xl">{percentage}%</span>
            {typeof votesCount === 'number' && (
              <span className="opacity-80">{t.games.votesCountText(votesCount)}</span>
            )}
          </>
        ) : (
          <span className="mx-auto text-[11px] opacity-75 uppercase tracking-wider font-bold">
            {t.games.tapToVote}
          </span>
        )}
      </div>
    </motion.button>
  );
};
