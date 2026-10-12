'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  X,
  Gamepad2,
  Users,
  User,
  Receipt,
  CheckCircle2,
  ShieldCheck,
  Heart,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Member, SharedExperienceConnection } from '@/types';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassButton } from '@/components/ui/GlassButton';
import { ReputationBadge } from '@/components/ui/ReputationBadge';
import { Avatar } from '@/components/ui/Avatar';

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
      color: 'text-[#171512]',
      bg: 'bg-[#F0DC00]/25',
      border: 'border-[#F0DC00]/45',
      icon: Users,
      tag: language === 'es' ? 'NIVEL 4 · INSEPARABLES' : 'LEVEL 4 · RIDE OR DIE',
      desc:
        language === 'es'
          ? 'Sinergia mutua constante en fiestas. Gran vínculo con el crew.'
          : 'Top mutual gathering synergy. Strongest crew bond.',
    },
    'Soul Crew': {
      color: 'text-[#171512]',
      bg: 'bg-[#F0DC00]/20',
      border: 'border-[#F0DC00]/35',
      icon: Users,
      tag: language === 'es' ? 'NIVEL 3 · CÍRCULO ÍNTIMO' : 'LEVEL 3 · INNER CIRCLE',
      desc:
        language === 'es'
          ? 'Círculo íntimo. Alta frecuencia de juegos compartidos y cuentas saldadas.'
          : 'Core inner circle. High frequency of shared games & splits.',
    },
    Ignited: {
      color: 'text-[#171512]',
      bg: 'bg-[#F0DC00]/15',
      border: 'border-[#F0DC00]/30',
      icon: Users,
      tag: language === 'es' ? 'NIVEL 2 · HABITUAL' : 'LEVEL 2 · REGULAR',
      desc:
        language === 'es'
          ? 'Asistentes habituales. Construyendo confianza sostenida de equipo.'
          : 'Frequent co-attendees. Building sustained crew trust.',
    },
    Kindling: {
      color: 'text-[#6F6A62]',
      bg: 'bg-black/5',
      border: 'border-black/10',
      icon: User,
      tag: language === 'es' ? 'NIVEL 1 · PRIMERAS NOCHES' : 'LEVEL 1 · FIRST NIGHTS',
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
        colors: ['#F0DC00', '#DE6B48', '#D48B38', '#547A5B'],
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
              {language === 'es' ? 'HISTORIA COMPARTIDA' : 'SHARED HISTORY'}
            </span>
          </div>

          {/* Mutual Profile Header */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Current User */}
            <div className="flex flex-col items-center">
              <Avatar
                user={{
                  avatar: currentUser.avatar,
                  name: currentUser.name || (language === 'es' ? 'Tú' : 'You'),
                }}
                size="lg"
              />
              <span className="text-xs font-bold mt-1 text-[#6F6A62]">
                {language === 'es' ? 'Tú' : 'You'}
              </span>
            </div>

            {/* Spark Connector */}
            <div className="flex flex-col items-center">
              {onchainReceipt ? (
                <div className="flex items-center gap-1.5 text-[#171512] font-black font-mono text-xs px-3 py-1 rounded-full bg-[#F0DC00]/20 border border-[#F0DC00]/40 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#171512]" />
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
                  title={language === 'es' ? 'Guardar en la historia' : 'Save connection'}
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
              <Avatar
                user={{
                  avatar: member.avatar,
                  name: member.name,
                }}
                size="lg"
              />
              <span className="text-xs font-bold mt-1 text-[#171512]">{member.name}</span>
              <ReputationBadge
                sharedNights={displayedGatherings}
                gatheringsCount={displayedGatherings}
                size="xs"
                className="mt-1"
              />
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
            {connection.settlementReputation ? (
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-[#8E887E]">
                  {language === 'es' ? 'REPUTACIÓN DE PAGO' : 'SETTLEMENT REPUTATION'}
                </span>
                <span className="text-emerald-700 font-bold">
                  {connection.settlementReputation}
                </span>
              </div>
            ) : null}
            {connection.favoriteGame ? (
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-[#8E887E]">
                  {language === 'es' ? 'JUEGO FAVORITO' : 'FAVORITE GAME'}
                </span>
                <span className="text-[#171512] font-bold">
                  {connection.favoriteGame}
                </span>
              </div>
            ) : null}
          </div>

          {/* Verified On-Chain Card */}
          {onchainReceipt && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-[#F0DC00]/15 border border-[#F0DC00]/35 text-xs space-y-2 mb-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#171512] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#171512]" />
                  <span>
                    {language === 'es'
                      ? 'Guardado en la historia del crew'
                      : 'Saved to crew history'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#6F6A62]">
                  Bloque #{onchainReceipt.blockNumber}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono bg-[#FFFDF8] px-2.5 py-1.5 rounded-lg border border-[rgba(35,30,22,0.08)]">
                <span className="text-[#6F6A62]">TX</span>
                <a
                  href={onchainReceipt.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#171512] hover:underline truncate max-w-[200px] flex items-center gap-1 font-bold"
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
                  className="w-full py-3 px-4 rounded-2xl bg-[#F0DC00]/20 hover:bg-[#F0DC00]/30 border border-[#F0DC00]/40 text-[#171512] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#171512]" />
                  <span>
                    {language === 'es'
                      ? 'Ver en el explorador'
                      : 'View on explorer'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <GlassButton
                  variant="glass"
                  size="md"
                  fullWidth
                  onClick={handleCheers}
                  icon={<Heart className="w-4 h-4 text-[#171512]" />}
                >
                  {cheersSent
                    ? language === 'es'
                      ? '¡Brindis enviado a la fiesta!'
                      : 'Cheers sent to party!'
                    : language === 'es'
                    ? `Brindar con ${member.name}`
                    : `Toast with ${member.name}`}
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
                      <Heart className="w-4 h-4 text-black fill-black" />
                    )
                  }
                >
                  {isSyncing
                    ? language === 'es'
                      ? 'Guardando en la historia...'
                      : 'Saving to crew history...'
                    : language === 'es'
                    ? 'Guardar en la historia del crew'
                    : 'Save to crew history'}
                </GlassButton>

                <GlassButton
                  variant="glass"
                  size="md"
                  fullWidth
                  onClick={handleCheers}
                  icon={<Heart className="w-4 h-4 text-[#171512]" />}
                >
                  {cheersSent
                    ? language === 'es'
                      ? '¡Brindis enviado a la fiesta!'
                      : 'Cheers sent to party!'
                    : language === 'es'
                    ? `Brindar con ${member.name}`
                    : `Toast with ${member.name}`}
                </GlassButton>
              </>
            )}
          </div>

          <div className="mt-3 text-center">
            <span className="text-[10px] font-mono text-[#8E887E]">
              {language === 'es'
                ? 'Conexión verificada · Cero datos privados expuestos'
                : 'Verified connection · Zero private data exposed'}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
