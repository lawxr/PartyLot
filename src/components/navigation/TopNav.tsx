'use client';

import React from 'react';
import { ArrowLeft, Share2 } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { formatPartyInviteText } from '@/services/party';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface TopNavProps {
  title?: string;
  showBack?: boolean;
  showShare?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  variant?: 'light' | 'over-image';
}

export const TopNav: React.FC<TopNavProps> = ({
  title,
  showBack = true,
  showShare = false,
  onBack,
  rightAction,
  variant = 'light',
}) => {
  const { goBack, parties, currentPartyId } = usePartyStore();
  const { t } = useTranslation();

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
      alert(t.common.copied);
    }
  };

  const isOverImage = variant === 'over-image';

  return (
    <header className="sticky top-0 left-0 right-0 z-40 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-3 safe-top pointer-events-none">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between relative w-full">
        <div className="flex items-center gap-2 pointer-events-auto">
          {showBack && (
            <button
              onClick={handleBack}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${
                isOverImage ? 'glass-light text-white' : 'liquid-glass-button text-[#171512] shadow-sm'
              } flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer`}
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {title && (
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none max-w-[55%] truncate">
            <span
              className={`font-display font-extrabold text-sm sm:text-base tracking-tight ${
                isOverImage ? 'text-white drop-shadow-md' : 'text-[#171512]'
              }`}
            >
              {title}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pointer-events-auto">
          {showShare && (
            <button
              onClick={handleShare}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${
                isOverImage ? 'glass-light text-white' : 'liquid-glass-button text-[#171512] shadow-sm'
              } flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer`}
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
          {rightAction}
        </div>
      </div>
    </header>
  );
};
