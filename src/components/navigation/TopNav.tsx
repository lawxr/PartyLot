'use client';

import React from 'react';
import { ArrowLeft, Share2, Sparkles } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { formatPartyInviteText } from '@/services/party';

interface TopNavProps {
  title?: string;
  showBack?: boolean;
  showShare?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const TopNav: React.FC<TopNavProps> = ({
  title,
  showBack = true,
  showShare = false,
  onBack,
  rightAction,
}) => {
  const { goBack, parties, currentPartyId } = usePartyStore();

  const currentParty = parties.find((p) => p.id === currentPartyId);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      goBack();
    }
  };

  const handleShare = async () => {
    if (!currentParty) return;
    const text = formatPartyInviteText(currentParty);
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentParty.title,
          text,
        });
      } catch {
        // Fallback to clipboard
        await navigator.clipboard.writeText(text);
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Invite link copied to clipboard!');
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-40 px-4 py-3 safe-top flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-2 pointer-events-auto">
        {showBack && (
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full liquid-glass-button flex items-center justify-center text-white/90 hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {title && (
        <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none max-w-[55%] truncate">
          <span className="font-display font-bold text-sm tracking-tight text-white drop-shadow-md">
            {title}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 pointer-events-auto">
        {showShare && (
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full liquid-glass-button flex items-center justify-center text-white/90 hover:text-white"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
        {rightAction}
      </div>
    </header>
  );
};
