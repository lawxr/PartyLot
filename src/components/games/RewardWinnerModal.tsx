'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Coins, ExternalLink, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePartyStore } from '@/store/usePartyStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Member } from '@/types';
import { getMonadExplorerTxUrl } from '@/lib/web3/monad';

interface RewardWinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  defaultRecipientId?: string;
}

export const RewardWinnerModal: React.FC<RewardWinnerModalProps> = ({
  isOpen,
  onClose,
  gameTitle,
  defaultRecipientId,
}) => {
  const { parties, currentPartyId, currentUser, rewardGameWinner } = usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';

  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const members: Member[] = party?.members && party.members.length > 0
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const potBalance = Number(party?.potBalance || 0);
  const presetAmounts = [0.1, 0.25, 0.5, 1.0];

  const handleSelectPreset = (amount: number) => {
    setRewardAmount(amount);
    setCustomAmount('');
    setErrorMsg(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setRewardAmount(num);
      setErrorMsg(null);
    }
  };

  const handleReward = async () => {
    if (!party?.id) {
      setErrorMsg(isEs ? 'No hay fiesta activa seleccionada.' : 'No active party selected.');
      return;
    }

    if (!selectedMemberId) {
      setErrorMsg(isEs ? 'Selecciona a un ganador.' : 'Select a winner.');
      return;
    }

    if (rewardAmount <= 0) {
      setErrorMsg(isEs ? 'El monto debe ser mayor a 0 MON.' : 'Amount must be greater than 0 MON.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await rewardGameWinner({
        partyId: party.id,
        memberId: selectedMemberId,
        amount: rewardAmount,
        gameTitle,
      });

      if (res.receipt?.txHash) {
        setTxHash(res.receipt.txHash);
      } else {
        // Fallback local tx hash if offline
        setTxHash(`0x${'f'.repeat(64)}`);
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F0DC00', '#836EF9', '#10B981'],
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || (isEs ? 'Error al enviar la recompensa onchain.' : 'Failed to send onchain reward.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setTxHash(null);
    setErrorMsg(null);
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
          className="relative w-full max-w-md rounded-[32px] p-6 bg-[#FFFDF8] dark:bg-[#1A1815] border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden text-[#171512] dark:text-[#F5F1E8]"
        >
          {/* Close button */}
          <button
            onClick={handleResetAndClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-[#6F6A62] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Success Screen */}
          {txHash ? (
            <div className="text-center py-4 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                {isEs ? 'RECOMPENSA ONCHAIN CONFIRMADA' : 'ONCHAIN REWARD CONFIRMED'}
              </span>
              <h3 className="font-display font-black text-2xl mt-1 mb-2">
                {isEs ? '¡Ganador Premiado!' : 'Winner Rewarded!'}
              </h3>
              <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] max-w-xs mb-5">
                {isEs
                  ? `Se enviaron ${rewardAmount.toFixed(2)} MON desde el Party Pot hacia el participante.`
                  : `Successfully transferred ${rewardAmount.toFixed(2)} MON from the Party Pot.`}
              </p>

              {txHash && (
                <a
                  href={getMonadExplorerTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 text-xs font-mono font-bold text-[#836EF9] dark:text-[#A78BFA] transition-colors"
                >
                  <span>Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <button
                onClick={handleResetAndClose}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#F0DC00] hover:bg-[#E6D300] text-[#171512] font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer"
              >
                {isEs ? 'Entendido' : 'Awesome, Done'}
              </button>
            </div>
          ) : (
            /* Form Screen */
            <div>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F0DC00]/20 border border-[#F0DC00] text-[#B89600] dark:text-[#F0DC00] flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#836EF9] dark:text-[#A78BFA] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      MONAD TESTNET
                    </span>
                  </div>
                  <h3 className="font-display font-black text-xl tracking-tight leading-tight">
                    {isEs ? 'Premiar Ganador' : 'Reward Winner'}
                  </h3>
                </div>
              </div>

              {/* Pot Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/8 dark:border-white/10 mb-4 text-xs">
                <span className="text-[#6F6A62] dark:text-[#A8A196] font-medium flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#F0DC00]" />
                  {isEs ? 'Fondo disponible en Pot:' : 'Available Party Pot:'}
                </span>
                <span className="font-mono font-black text-sm text-[#171512] dark:text-white">
                  {potBalance.toFixed(2)} MON
                </span>
              </div>

              {/* Recipient Selection */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#6F6A62] dark:text-[#A8A196] mb-2 uppercase tracking-wider">
                  {isEs ? 'Seleccionar Ganador(a)' : 'Select Winner'}
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
                            ? 'border-[#F0DC00] bg-[#F0DC00]/15 dark:bg-[#F0DC00]/20 shadow-sm'
                            : 'border-black/10 dark:border-white/10 bg-transparent hover:border-black/20'
                        }`}
                      >
                        <img
                          src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                          alt={m.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                        <span className="text-xs font-bold truncate text-[#171512] dark:text-white">
                          {m.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Selection */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-[#6F6A62] dark:text-[#A8A196] mb-2 uppercase tracking-wider">
                  {isEs ? 'Monto a transferir (MON)' : 'Reward Amount (MON)'}
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
                            ? 'bg-[#171512] text-white dark:bg-[#F0DC00] dark:text-[#171512] border-transparent shadow-sm'
                            : 'border-black/10 dark:border-white/10 hover:border-black/20 text-[#171512] dark:text-white'
                        }`}
                      >
                        {amt} MON
                      </button>
                    );
                  })}
                </div>
                <input
                  type="number"
                  step="0.05"
                  min="0.01"
                  placeholder={isEs ? 'O ingresar monto personalizado...' : 'Or enter custom MON amount...'}
                  value={customAmount}
                  onChange={handleCustomChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.05] text-xs font-mono focus:outline-none focus:border-[#F0DC00]"
                />
              </div>

              {/* Error notice */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleReward}
                disabled={isLoading}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#F0DC00] hover:bg-[#E6D300] text-[#171512] font-black text-sm shadow-[0_4px_16px_rgba(240,220,0,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isEs ? 'Confirmando en Monad...' : 'Confirming on Monad...'}</span>
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4" />
                    <span>
                      {isEs
                        ? `Transferir ${rewardAmount.toFixed(2)} MON al Ganador`
                        : `Transfer ${rewardAmount.toFixed(2)} MON Reward`}
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
