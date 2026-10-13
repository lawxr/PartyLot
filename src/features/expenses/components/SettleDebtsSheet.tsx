'use client';

import React from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlassButton } from '@/components/ui/GlassButton';
import { TokenLogo, CryptoBadge } from '@/components/ui/TokenLogo';
import { Avatar } from '@/components/ui/Avatar';
import { Web3ErrorBanner } from '@/components/ui/Web3ErrorBanner';
import type { FormattedWeb3Error } from '@/lib/web3Error';
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
  errorMessage?: FormattedWeb3Error | string | null;
  onClearError?: () => void;
}

export const SettleDebtsSheet: React.FC<SettleDebtsSheetProps> = ({
  isOpen,
  onClose,
  isSettling,
  debtorsList,
  onSettle,
  errorMessage,
  onClearError,
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
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#836EF9]/10 via-[#A78BFA]/10 to-transparent border border-[#836EF9]/20">
          <div className="flex items-center gap-2.5">
            <TokenLogo token="mon" size="md" />
            <div>
              <span className="text-xs font-bold text-[#171512] dark:text-white block">
                {t.split.settleEngineBadge}
              </span>
              <span className="text-[10px] text-[#6F6A62] dark:text-[#A8A196]">
                {t.split.settleEngineDesc}
              </span>
            </div>
          </div>
          <CryptoBadge token="mon" network="Monad" showNetwork={false} />
        </div>

        {errorMessage && (
          <Web3ErrorBanner
            error={errorMessage}
            isEs={isEs}
            onDismiss={onClearError}
          />
        )}

        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {debtorsList.length > 0 ? (
            debtorsList.map((member, i) => (
              <div
                key={`settle-${member.id}-${i}`}
                className="p-3.5 rounded-2xl bg-[#FFFDF8] dark:bg-white/5 border border-[rgba(35,30,22,0.08)] dark:border-white/10 flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar user={member} size="sm" />
                  <div>
                    <span className="font-bold text-xs text-[#171512] dark:text-white block">{member.name}</span>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">{member.subtitle}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <TokenLogo token="mon" size="xs" />
                  <span className="font-display font-black text-base text-[#171512] dark:text-white">
                    {member.amount}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-[#8A8173] dark:text-[#A8A196]">
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
