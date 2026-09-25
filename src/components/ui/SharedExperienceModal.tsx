'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  X,
  Flame,
  Gamepad2,
  Users,
  Receipt,
  Sparkles,
  ShieldCheck,
  Heart,
  Crown,
  Zap,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Member, SharedExperienceConnection } from '@/types';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassButton } from '@/components/ui/GlassButton';

interface SharedExperienceModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SharedExperienceModal: React.FC<SharedExperienceModalProps> = ({
  member,
  isOpen,
  onClose,
}) => {
  const { currentUser, getSharedConnection, syncConnectionOnchain, sendPartyCheers, language } =
    usePartyStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [onchainReceipt, setOnchainReceipt] = useState<{
    txHash: string;
    explorerUrl: string;
    blockNumber: number;
    nightsTogether?: number;
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [cheersSent, setCheersSent] = useState(false);

  if (!isOpen || !member) return null;

  const connection: SharedExperienceConnection = getSharedConnection(member);

  const sparkTheme = {
    'Ride or Die': {
      color: 'text-amber-300',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/30',
      glow: 'shadow-[0_0_25px_rgba(251,191,36,0.3)]',
      icon: Crown,
      tag: 'LEVEL 4 · RIDE OR DIE',
      desc:
        language === 'es'
          ? 'Sinergia mutua en el top 1% de fiestas. Dúo imparable de tripulación.'
          : 'Top 1% mutual gathering synergy. Unstoppable party duo.',
    },
    'Soul Crew': {
      color: 'text-purple-300',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      glow: 'shadow-[0_0_25px_rgba(168,85,247,0.3)]',
      icon: Sparkles,
      tag: 'LEVEL 3 · SOUL CREW',
      desc:
        language === 'es'
          ? 'Círculo íntimo esencial. Alta frecuencia de juegos compartidos y cuentas saldadas.'
          : 'Core inner circle. High frequency of shared games & splits.',
    },
    Ignited: {
      color: 'text-sky-300',
      bg: 'bg-sky-400/10',
      border: 'border-sky-400/30',
      glow: 'shadow-[0_0_25px_rgba(56,189,248,0.3)]',
      icon: Zap,
      tag: 'LEVEL 2 · IGNITED',
      desc:
        language === 'es'
          ? 'Asistentes habituales. Construyendo confianza sostenida de equipo.'
          : 'Frequent co-attendees. Building sustained crew trust.',
    },
    Kindling: {
      color: 'text-[#F0DC00]',
      bg: 'bg-[#F0DC00]/10',
      border: 'border-[#F0DC00]/30',
      glow: 'shadow-[0_0_25px_rgba(240,220,0,0.2)]',
      icon: Flame,
      tag: 'LEVEL 1 · KINDLING',
      desc:
        language === 'es'
          ? 'Conexión inicial. Primeras noches y dinámicas compartidas.'
          : 'Early connection. First shared gatherings and votes.',
    },
  }[connection.sparkLevel];

  const SparkIcon = sparkTheme.icon;

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncError(null);

    const result = await syncConnectionOnchain(member);
    setIsSyncing(false);

    if (result.success && result.txHash) {
      setOnchainReceipt({
        txHash: result.txHash,
        explorerUrl: result.explorerUrl || `https://testnet.monadexplorer.com/tx/${result.txHash}`,
        blockNumber: result.blockNumber || 0,
        nightsTogether: result.nightsTogether,
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F0DC00', '#38BDF8', '#A855F7', '#10B981'],
      });
    } else {
      setSyncError(
        result.error ||
          (language === 'es'
            ? 'No se pudo sincronizar en la blockchain de Monad.'
            : 'Could not sync on Monad blockchain.')
      );
    }
  };

  const handleCheers = async () => {
    if (cheersSent) return;
    setCheersSent(true);
    await sendPartyCheers(member);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#F0DC00', '#F43F5E', '#A855F7'],
    });
  };

  const displayedGatherings = onchainReceipt?.nightsTogether ?? connection.gatheringsTogether;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-md rounded-[32px] bg-[#FFFDF8] border border-[rgba(35,30,22,0.12)] p-6 shadow-[0_24px_70px_rgba(65,48,25,0.18)] text-[#171512] z-10 overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#F8F3EA] hover:bg-[#F1EADF] flex items-center justify-center text-[#171512] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Label */}
          <div className="text-center mb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E887E] block">
              SHARED-EXPERIENCE GRAPH
            </span>
          </div>

          {/* Mutual Profile Header */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Current User */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[rgba(35,30,22,0.12)] shadow-sm flex items-center justify-center bg-[#F1EADF]">
                {currentUser.avatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#F0DC00]/30 text-[#171512] flex items-center justify-center font-display font-black text-lg">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'Y'}
                  </div>
                )}
              </div>
              <span className="text-xs font-bold mt-1 text-[#6F6A62]">
                {language === 'es' ? 'Tú' : 'You'}
              </span>
            </div>

            {/* Spark Connector */}
            <div className="flex flex-col items-center">
              {onchainReceipt ? (
                <div className="flex items-center gap-1.5 text-emerald-800 font-black font-mono text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>SYNCED</span>
                </div>
              ) : isSyncing ? (
                <div className="flex items-center gap-1.5 text-[#171512] font-black font-mono text-xs px-3 py-1 rounded-full bg-[#F8F3EA] border border-[rgba(35,30,22,0.1)] animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>SYNCING</span>
                </div>
              ) : (
                <button
                  onClick={handleSync}
                  title={language === 'es' ? 'Sincronizar en Monad' : 'Sync on Monad'}
                  className="flex items-center gap-1 text-[#171512] hover:bg-[#F0DC00] font-black font-mono text-xs px-3 py-1 rounded-full bg-[#F0DC00]/20 border border-[#F0DC00]/40 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <Heart className="w-3.5 h-3.5 fill-[#171512]" />
                  <span>SYNC</span>
                </button>
              )}
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#F0DC00] to-transparent mt-1" />
            </div>

            {/* Target Member */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#F0DC00] shadow-sm flex items-center justify-center bg-[#F1EADF]">
                {member.avatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#F0DC00]/30 text-[#171512] flex items-center justify-center font-display font-black text-lg">
                    {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                  </div>
                )}
              </div>
              <span className="text-xs font-bold mt-1 text-[#171512]">{member.name}</span>
            </div>
          </div>

          {/* Spark Level Banner */}
          <div
            className={`p-4 rounded-2xl ${sparkTheme.bg} ${sparkTheme.border} border mb-5 text-center`}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <SparkIcon className={`w-4 h-4 ${sparkTheme.color}`} />
              <span
                className={`font-display font-black text-xs uppercase tracking-wider ${sparkTheme.color}`}
              >
                {sparkTheme.tag}
              </span>
            </div>
            <p className="text-xs text-[#171512] leading-relaxed font-medium">
              {sparkTheme.desc}
            </p>
          </div>

          {/* 4 Core Interaction Metrics */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <div className="p-3 rounded-2xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.08)] text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8E887E] block mb-1">
                {language === 'es' ? 'Fiestas Juntos' : 'Gatherings Together'}
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <Users className="w-4 h-4 text-[#B8A700]" />
                <span className="font-display font-black text-2xl text-[#171512]">
                  {displayedGatherings}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.08)] text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8E887E] block mb-1">
                {language === 'es' ? 'Minijuegos Jugados' : 'Minigames Played'}
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-purple-600" />
                <span className="font-display font-black text-2xl text-[#171512]">
                  {connection.gamesPlayedTogether}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.08)] text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8E887E] block mb-1">
                {language === 'es' ? 'Cuentas Saldadas' : 'Settlements Verified'}
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <Receipt className="w-4 h-4 text-rose-500" />
                <span className="font-display font-black text-2xl text-[#171512]">
                  {connection.settlementsTogether}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.08)] text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8E887E] block mb-1">
                {language === 'es' ? 'Crews Compartidos' : 'Recurring Crews'}
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-display font-black text-2xl text-[#171512]">
                  {connection.recurringCrewsShared}
                </span>
              </div>
            </div>
          </div>

          {/* Social Lore Badges */}
          <div className="p-3 rounded-2xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.08)] mb-4 text-xs text-[#6F6A62] space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-[#8E887E]">{language === 'es' ? 'USUARIO' : 'HANDLE'}</span>
              <span className="text-[#B8A700] font-bold">{connection.targetUserHandle}</span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-[#8E887E]">
                {language === 'es' ? 'REPUTACIÓN DE PAGO' : 'SETTLEMENT REPUTATION'}
              </span>
              <span className="text-emerald-700 font-bold">
                {connection.settlementReputation || '100% Instant Settler'}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-[#8E887E]">
                {language === 'es' ? 'JUEGO FAVORITO' : 'FAVORITE GAME'}
              </span>
              <span className="text-[#171512] font-bold">
                {connection.favoriteGame || "Who's Most Likely"}
              </span>
            </div>
          </div>

          {/* Verified On-Chain Card */}
          {onchainReceipt && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2 mb-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === 'es'
                      ? 'Certificado en Monad Blockchain'
                      : 'Certified on Monad Blockchain'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700">
                  Bloque #{onchainReceipt.blockNumber}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono bg-[#F8F3EA] px-2.5 py-1.5 rounded-lg border border-[rgba(35,30,22,0.08)]">
                <span className="text-[#6F6A62]">TX</span>
                <a
                  href={onchainReceipt.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:underline truncate max-w-[200px] flex items-center gap-1 font-bold"
                >
                  <span>
                    {onchainReceipt.txHash.slice(0, 8)}...{onchainReceipt.txHash.slice(-6)}
                  </span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </motion.div>
          )}

          {/* Sync Error Notice */}
          {syncError && (
            <p
              role="alert"
              className="mb-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-700"
            >
              {syncError}
            </p>
          )}

          {/* Bottom Actions */}
          <div className="space-y-2.5">
            {onchainReceipt ? (
              <>
                <a
                  href={onchainReceipt.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-800 font-display font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === 'es'
                      ? 'Ver Certificado en Monad Explorer'
                      : 'View Certificate on Monad Explorer'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <GlassButton
                  variant="glass"
                  size="md"
                  fullWidth
                  onClick={handleCheers}
                  icon={<Sparkles className="w-4 h-4 text-[#171512]" />}
                >
                  {cheersSent
                    ? language === 'es'
                      ? '¡Brindis enviado a la fiesta! 🥂'
                      : 'Cheers sent to party! 🥂'
                    : language === 'es'
                    ? `Brindar con ${member.name} 🥂`
                    : `Toast with ${member.name} 🥂`}
                </GlassButton>
              </>
            ) : (
              <>
                <GlassButton
                  variant="accent"
                  size="md"
                  fullWidth
                  onClick={handleSync}
                  disabled={isSyncing}
                  icon={
                    isSyncing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <Zap className="w-4 h-4 text-black fill-black" />
                    )
                  }
                >
                  {isSyncing
                    ? language === 'es'
                      ? 'Sincronizando en Monad Testnet...'
                      : 'Certifying on Monad Testnet...'
                    : language === 'es'
                    ? '⚡ Sincronizar Vínculo en Monad Blockchain'
                    : '⚡ Sync Connection on Monad Blockchain'}
                </GlassButton>

                <GlassButton
                  variant="glass"
                  size="md"
                  fullWidth
                  onClick={handleCheers}
                  icon={<Sparkles className="w-4 h-4 text-[#171512]" />}
                >
                  {cheersSent
                    ? language === 'es'
                      ? '¡Brindis enviado a la fiesta! 🥂'
                      : 'Cheers sent to party! 🥂'
                    : language === 'es'
                    ? `Brindar con ${member.name} 🥂`
                    : `Toast with ${member.name} 🥂`}
                </GlassButton>
              </>
            )}
          </div>

          <div className="mt-3 text-center">
            <span className="text-[10px] font-mono text-[#8E887E]">
              {language === 'es'
                ? 'Conexión descentralizada en Monad · Cero datos privados expuestos'
                : 'Decentralized ties on Monad · Zero private data exposed'}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
