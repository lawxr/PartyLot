'use client';

import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Avatar, AvatarUser } from '@/components/ui/Avatar';

interface GameEyebrowProps {
  label: string;
  stepIndicator?: string;
  onBack?: () => void;
  onClose?: () => void;
  currentUser?: AvatarUser | null;
  className?: string;
}

/**
 * Top header eyebrow matching the trailer:
 * Uppercase yellow label with letter-tracking, round back/exit button, and personal avatar.
 */
export const GameEyebrow: React.FC<GameEyebrowProps> = ({
  label,
  stepIndicator,
  onBack,
  onClose,
  currentUser,
  className = '',
}) => {
  return (
    <header className={`w-full flex items-center justify-between gap-3 pt-1 pb-3 shrink-0 ${className}`}>
      {/* Left: Back or Close button */}
      <div className="flex items-center gap-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="w-9 h-9 rounded-full bg-[var(--stage-card)] border border-[var(--stage-card-border)] text-[var(--stage-text)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
        ) : onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close game"
            className="w-9 h-9 rounded-full bg-[var(--stage-card)] border border-[var(--stage-card-border)] text-[var(--stage-text)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        ) : null}

        {/* Yellow Tracking Eyebrow Label */}
        <div className="flex items-center gap-1.5 font-mono text-xs sm:text-[13px] font-black uppercase tracking-wider text-party-yellow">
          <span>{label}</span>
          {stepIndicator && (
            <span className="text-[var(--stage-muted)] font-bold">
              · {stepIndicator}
            </span>
          )}
        </div>
      </div>

      {/* Right: Personal user avatar */}
      {currentUser && (
        <div className="shrink-0" title={currentUser.name || 'Your avatar'}>
          <Avatar user={currentUser} size="xs" border="light" />
        </div>
      )}
    </header>
  );
};
