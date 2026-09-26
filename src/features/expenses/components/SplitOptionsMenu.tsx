'use client';

import React from 'react';
import { Plus, ChevronRight, Share2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { TokenLogo } from '@/components/ui/TokenLogo';
import { useTranslation } from '@/lib/i18n/useTranslation';
import confetti from 'canvas-confetti';

interface SplitOptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddExpense: () => void;
  onOpenSettle: () => void;
}

export const SplitOptionsMenu: React.FC<SplitOptionsMenuProps> = ({
  isOpen,
  onClose,
  onOpenAddExpense,
  onOpenSettle,
}) => {
  const { t, language } = useTranslation();
  const isEs = language === 'es';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t.split.optionsTitle}>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenAddExpense();
          }}
          className="w-full p-3.5 rounded-2xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] flex items-center justify-between text-left hover:bg-[#F7F2E8] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F0DC00]/20 flex items-center justify-center text-[#171512]">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-sm text-[#171512] block">
                {t.split.addExpense}
              </span>
              <span className="text-xs text-[#8A8173]">
                {isEs ? 'Registra una factura pagada por alguien' : 'Log a bill paid by someone'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#999187]" />
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSettle();
          }}
          className="w-full p-3.5 rounded-2xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] flex items-center justify-between text-left hover:bg-[#F7F2E8] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2775CA]/20 to-[#836EF9]/20 flex items-center justify-center text-[#2775CA]">
              <TokenLogo token="usdc" size="sm" />
            </div>
            <div>
              <span className="font-bold text-sm text-[#171512] block">
                {t.split.settleOnMonad}
              </span>
              <span className="text-xs text-[#8A8173]">{t.split.settleSubtitle}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#999187]" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText(window.location.href);
              confetti({ particleCount: 30, spread: 45 });
              onClose();
            }
          }}
          className="w-full p-3.5 rounded-2xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] flex items-center justify-between text-left hover:bg-[#F7F2E8] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] flex items-center justify-center text-[#171512]">
              <Share2 className="w-5 h-5 text-[#8A8173]" />
            </div>
            <div>
              <span className="font-bold text-sm text-[#171512] block">
                {t.split.copyShareLink}
              </span>
              <span className="text-xs text-[#8A8173]">
                {isEs ? 'Envía este desglose a tu grupo' : 'Send this split to the group'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#999187]" />
        </button>
      </div>
    </BottomSheet>
  );
};
