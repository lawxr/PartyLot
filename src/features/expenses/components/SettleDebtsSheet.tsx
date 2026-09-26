'use client';

import React from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlassButton } from '@/components/ui/GlassButton';
import { TokenLogo, CryptoBadge } from '@/components/ui/TokenLogo';
import { useTranslation } from '@/lib/i18n/useTranslation';

export interface SettleDebtorItem {
  id: string;
  name: string;
  avatar: string;
  subtitle: string;
  amount: string;
}

interface SettleDebtsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isSettling: boolean;
  debtorsList: SettleDebtorItem[];
  onSettle: () => Promise<void>;
}

export const SettleDebtsSheet: React.FC<SettleDebtsSheetProps> = ({
  isOpen,
  onClose,
  isSettling,
  debtorsList,
  onSettle,
}) => {
  const { t, language } = useTranslation();
  const isEs = language === 'es';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => {
        if (!isSettling) onClose();
      }}
      title={t.split.settleTitle}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#2775CA]/10 via-[#836EF9]/10 to-transparent border border-[#2775CA]/20">
          <div className="flex items-center gap-2.5">
            <TokenLogo token="usdc" size="md" />
            <div>
              <span className="text-xs font-bold text-[#171512] block">
                {t.split.settleEngineBadge}
              </span>
              <span className="text-[10px] text-[#6F6A62]">
                {t.split.settleEngineDesc}
              </span>
            </div>
          </div>
          <CryptoBadge token="usdc" network="Monad" showNetwork={false} />
        </div>

        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {debtorsList.length > 0 ? (
            debtorsList.map((member, i) => (
              <div
                key={`settle-${member.id}-${i}`}
                className="p-3.5 rounded-2xl bg-[#FFFDF8] border border-[rgba(35,30,22,0.08)] flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-[#EFEAE2]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#171512] block">{member.name}</span>
                    <span className="text-[10px] text-rose-600 font-semibold">{member.subtitle}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <TokenLogo token="usdc" size="xs" />
                  <span className="font-display font-black text-base text-[#171512]">
                    {member.amount}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-[#8A8173]">
              {isEs ? 'No hay deudas pendientes' : 'No pending debts'}
            </div>
          )}
        </div>

        <div className="pt-2 space-y-2">
          <GlassButton
            variant="accent"
            size="lg"
            fullWidth
            disabled={isSettling || debtorsList.length === 0}
            onClick={onSettle}
          >
            {isSettling
              ? t.split.settling
              : t.split.confirmSettle(debtorsList.length || 4)}
          </GlassButton>
        </div>
      </div>
    </BottomSheet>
  );
};
