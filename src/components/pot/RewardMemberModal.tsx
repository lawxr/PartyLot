'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Trophy, X, Coins, ExternalLink, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePartyStore } from '@/store/usePartyStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Member } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useMonPrice } from '@/hooks/useMonPrice';
import { GAME_CONFETTI_COLORS } from '@/lib/games';
import { Web3ErrorBanner } from '@/components/ui/Web3ErrorBanner';
import { formatWeb3Error, type FormattedWeb3Error } from '@/lib/web3Error';

interface RewardMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  defaultRecipientId?: string;
}

export const RewardMemberModal: React.FC<RewardMemberModalProps> = ({
  isOpen,
  onClose,
  gameTitle,
  defaultRecipientId,
}) => {
  const { parties, currentPartyId, currentUser, rewardGameWinner } = usePartyStore();
  const { t, language } = useTranslation();
  const isEs = language === 'es';
  const shouldReduceMotion = useReducedMotion();
  const { formatUsd } = useMonPrice();

  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const members: Member[] =
    party?.members && party.members.length > 0
      ? party.members
      : currentUser
      ? [currentUser]
      : [];

  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    defaultRecipientId || members[0]?.id || ''
  );
  const [rewardAmount, setRewardAmount] = useState<number>(0.25);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<FormattedWeb3Error | null>(null);

  const potBalance = Number(party?.potBalance || 0);
  const presetAmounts = [0.1, 0.25, 0.5, 1.0];

  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];
  const recipientName = selectedMember?.name || 'Winner';

  const handleSelectPreset = (amount: number) => {
    setRewardAmount(amount);
    setCustomAmount('');
    setErrorState(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setRewardAmount(num);
      setErrorState(null);
    }
  };

  const handleReward = async () => {
    if (!party?.id) {
      setErrorState({
        title: t.common.error,
        message: t.common.error,
        isUserRejection: false,
      });
      return;
    }

    if (!selectedMemberId) {
      setErrorState({
        title: t.common.error,
        message: t.partyPot.selectRecipient,
        isUserRejection: false,
      });
      return;
    }

    if (rewardAmount <= 0) {
      setErrorState({
        title: t.common.error,
        message: t.partyPot.rewardAmountLabel,
        isUserRejection: false,
      });
      return;
    }

    setIsLoading(true);
    setErrorState(null);

    try {
      const res = await rewardGameWinner({
        partyId: party.id,
        memberId: selectedMemberId,
        amount: rewardAmount,
        gameTitle,
      });

      if (res?.receipt?.txHash) {
        setTxHash(res.receipt.txHash);
      } else {
        setTxHash(`0x${'f'.repeat(64)}`);
      }

      if (!shouldReduceMotion) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: [...GAME_CONFETTI_COLORS],
          disableForReducedMotion: true,
        });
      }
    } catch (err: unknown) {
      console.error('Error distributing reward:', err);
      setErrorState(formatWeb3Error(err, isEs));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setTxHash(null);
    setErrorState(null);
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          className="relative w-full max-w-md rounded-[32px] p-6 bg-[var(--stage-card)] border border-[var(--stage-card-border)] shadow-2xl overflow-hidden text-[var(--stage-text)]"
        >
          {/* Close button */}
          <button
            onClick={handleResetAndClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-[var(--stage-muted)] hover:text-[var(--stage-text)] transition-all cursor-pointer"
            aria-label={t.common.close}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Success Screen */}
          {txHash ? (
            <div className="text-center py-4 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="text-[11px] font-mono font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                {t.partyPot.rewardSuccessTitle}
              </span>
              <h3 className="font-display font-black text-2xl mt-1 mb-2">
                {recipientName}
              </h3>
              <p className="text-xs text-[var(--stage-muted)] max-w-xs mb-4">
                {t.partyPot.rewardSuccessSubtitle(formatUsd(rewardAmount), recipientName)}
              </p>

              {/* Technical Details Accordion (Closed by default) */}
              <details className="group w-full mb-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-3 text-left">
                <summary className="cursor-pointer font-mono text-xs font-bold text-[var(--stage-muted)] flex items-center justify-between select-none">
                  <span>{t.glossary.technicalDetails}</span>
                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2.5 pt-2.5 border-t border-black/5 dark:border-white/5 flex flex-col gap-1.5 text-[11px] font-mono text-[var(--stage-muted)] break-all">
                  <span>Tx: {txHash}</span>
                  <a
                    href={`https://testnet.monadexplorer.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-[var(--stage-accent-text)] hover:underline mt-1"
                  >
                    <span>Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </details>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-3.5 px-5 rounded-2xl bg-party-yellow hover:bg-party-yellow-hover text-on-party-yellow font-display font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer"
              >
                {t.common.confirm}
              </button>
            </div>
          ) : (
            /* Form Screen */
            <div>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-party-yellow/20 border border-party-yellow text-[var(--stage-accent-text)] flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--stage-muted)]">
                      {t.glossary.partyPot}
                    </span>
                  </div>
                  <h3 className="font-display font-black text-xl tracking-tight leading-tight">
                    {t.partyPot.rewardModalTitle}
                  </h3>
                </div>
              </div>

              {/* Pot Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/8 dark:border-white/10 mb-4 text-xs">
                <span className="text-[var(--stage-muted)] font-medium flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-party-yellow" />
                  {t.partyPot.availablePot}
                </span>
                <span className="font-mono font-black text-sm text-[var(--stage-text)]">
                  {formatUsd(potBalance)}
                </span>
              </div>

              {/* Recipient Selection */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-[var(--stage-muted)] mb-2 uppercase tracking-wider">
                  {t.partyPot.selectRecipient}
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {members.map((m) => {
                    const isSelected = selectedMemberId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMemberId(m.id)}
                        className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'border-party-yellow bg-party-yellow/15 dark:bg-party-yellow/20 shadow-sm'
                            : 'border-[var(--stage-card-border)] bg-transparent hover:border-black/20 dark:hover:border-white/20'
                        }`}
                      >
                        <Avatar
                          user={{
                            avatar: m.avatar,
                            name: m.name,
                          }}
                          size="xs"
                        />
                        <span className="text-xs font-bold truncate text-[var(--stage-text)]">
                          {m.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Selection */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-[var(--stage-muted)] mb-2 uppercase tracking-wider">
                  {t.partyPot.rewardAmountLabel}
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {presetAmounts.map((amt) => {
                    const isSelected = rewardAmount === amt && !customAmount;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectPreset(amt)}
                        className={`py-2 px-1 rounded-xl border font-mono font-bold text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--stage-text)] text-[var(--stage-card)] dark:bg-party-yellow dark:text-on-party-yellow border-transparent shadow-sm'
                            : 'border-[var(--stage-card-border)] hover:border-black/20 dark:hover:border-white/20 text-[var(--stage-text)]'
                        }`}
                      >
                        {formatUsd(amt)}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="number"
                  step="0.05"
                  min="0.01"
                  placeholder={t.partyPot.customAmountPlaceholder}
                  value={customAmount}
                  onChange={handleCustomChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--stage-card-border)] bg-black/[0.02] dark:bg-white/[0.05] text-xs font-mono focus:outline-none focus:border-party-yellow"
                />
              </div>

              {/* Error notice */}
              <Web3ErrorBanner
                error={errorState}
                isEs={isEs}
                onDismiss={() => setErrorState(null)}
                className="mb-4"
              />

              {/* Action Button */}
              <button
                type="button"
                onClick={handleReward}
                disabled={isLoading}
                className="w-full py-3.5 px-5 rounded-2xl bg-party-yellow hover:bg-party-yellow-hover text-on-party-yellow font-display font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.partyPot.processing}</span>
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4" />
                    <span>
                      {t.partyPot.sendRewardTo(formatUsd(rewardAmount), recipientName)}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
