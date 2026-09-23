'use client';

import React from 'react';
import { ArrowLeft, Share2 } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { formatPartyInviteText } from '@/services/party';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface TopNavProps {
  title?: string;
  showBack?: boolean;
  showShare?: boolean;
  showLanguageSwitch?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const TopNav: React.FC<TopNavProps> = ({
  title,
  showBack = true,
  showShare = false,
  showLanguageSwitch = false,
  onBack,
  rightAction,
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

  return (
    <header className="sticky top-0 left-0 right-0 z-40 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-3 safe-top pointer-events-none">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between relative w-full">
        <div className="flex items-center gap-2 pointer-events-auto">
          {showBack && (
            <button
              onClick={handleBack}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full liquid-glass-button flex items-center justify-center text-white/90 hover:text-white transition-transform active:scale-95"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {title && (
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none max-w-[55%] truncate">
            <span className="font-display font-bold text-sm sm:text-base tracking-tight text-white drop-shadow-md">
              {title}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pointer-events-auto">
          {showLanguageSwitch && <LanguageSwitch compact />}
          {showShare && (
            <button
              onClick={handleShare}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full liquid-glass-button flex items-center justify-center text-white/90 hover:text-white transition-transform active:scale-95"
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
