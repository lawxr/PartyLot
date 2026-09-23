'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Flame,
  Gamepad2,
  Users,
  Receipt,
  Sparkles,
  ShieldCheck,
  Send,
  Heart,
  Crown,
  Zap,
} from 'lucide-react';
import { Member, SharedExperienceConnection } from '@/types';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassButton } from '@/components/ui/GlassButton';
import confetti from 'canvas-confetti';

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
  const { currentUser, getSharedConnection, addToPot, currentPartyId } = usePartyStore();

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
      desc: 'Top 1% mutual gathering synergy. Unstoppable party duo.',
    },
    'Soul Crew': {
      color: 'text-purple-300',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      glow: 'shadow-[0_0_25px_rgba(168,85,247,0.3)]',
      icon: Sparkles,
      tag: 'LEVEL 3 · SOUL CREW',
      desc: 'Core inner circle. High frequency of shared games & splits.',
    },
    Ignited: {
      color: 'text-sky-300',
      bg: 'bg-sky-400/10',
      border: 'border-sky-400/30',
      glow: 'shadow-[0_0_25px_rgba(56,189,248,0.3)]',
      icon: Zap,
      tag: 'LEVEL 2 · IGNITED',
      desc: 'Frequent co-attendees. Building sustained crew trust.',
    },
    Kindling: {
      color: 'text-[#F0DC00]',
      bg: 'bg-[#F0DC00]/10',
      border: 'border-[#F0DC00]/30',
      glow: 'shadow-[0_0_25px_rgba(240, 220, 0,0.2)]',
      icon: Flame,
      tag: 'LEVEL 1 · KINDLING',
      desc: 'Early connection. First shared gatherings and votes.',
    },
  }[connection.sparkLevel];

  const SparkIcon = sparkTheme.icon;

  const handleSendTip = () => {
    addToPot(currentPartyId, 5, `Tip/Shoutout to ${member.name}`);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#F0DC00', '#EC4899', '#A855F7'],
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-md rounded-[32px] liquid-glass-card border border-white/20 p-6 shadow-2xl text-white z-10 overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#F0DC00]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Label */}
          <div className="text-center mb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block">
              SHARED-EXPERIENCE GRAPH
            </span>
          </div>

          {/* Mutual Profile Header */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Current User */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-bold mt-1 text-white/70">You</span>
            </div>

            {/* Spark Connector */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[#F0DC00] font-black font-mono text-sm px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                <Heart className="w-3.5 h-3.5 fill-[#F0DC00]" />
                <span>SYNC</span>
              </div>
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#F0DC00] to-transparent mt-1" />
            </div>

            {/* Target Member */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#F0DC00] shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-bold mt-1 text-white">{member.name}</span>
            </div>
          </div>

          {/* Spark Level Banner */}
          <div
            className={`p-4 rounded-2xl ${sparkTheme.bg} ${sparkTheme.border} border ${sparkTheme.glow} mb-5 text-center`}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <SparkIcon className={`w-4 h-4 ${sparkTheme.color}`} />
              <span
                className={`font-display font-black text-xs uppercase tracking-wider ${sparkTheme.color}`}
              >
                {sparkTheme.tag}
              </span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed font-medium">
              {sparkTheme.desc}
            </p>
          </div>

          {/* 4 Core Interaction Metrics (No Follower Signals) */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block mb-1">
                Gatherings Together
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <Users className="w-4 h-4 text-[#F0DC00]" />
                <span className="font-display font-black text-2xl text-white">
                  {connection.gatheringsTogether}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block mb-1">
                Minigames Played
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-purple-400" />
                <span className="font-display font-black text-2xl text-white">
                  {connection.gamesPlayedTogether}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block mb-1">
                Settlements Verified
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <Receipt className="w-4 h-4 text-rose-400" />
                <span className="font-display font-black text-2xl text-white">
                  {connection.settlementsTogether}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block mb-1">
                Recurring Crews
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-display font-black text-2xl text-white">
                  {connection.recurringCrewsShared}
                </span>
              </div>
            </div>
          </div>

          {/* Social Lore Badges */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 mb-5 text-xs text-white/70 space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-white/40">HANDLE</span>
              <span className="text-[#F0DC00] font-bold">{connection.targetUserHandle}</span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-white/40">SETTLEMENT REPUTATION</span>
              <span className="text-emerald-400 font-bold">100% Instant Settler</span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-white/40">FAVORITE GAME</span>
              <span className="text-white font-bold">Who&apos;s Most Likely</span>
            </div>
          </div>

          {/* Bottom Action */}
          <GlassButton
            variant="accent"
            size="md"
            fullWidth
            onClick={handleSendTip}
            icon={<Send className="w-4 h-4 text-black stroke-[2.5]" />}
          >
            Send $5 Pot Bounty / Tip to {member.name}
          </GlassButton>

          <div className="mt-3 text-center">
            <span className="text-[10px] font-mono text-white/40">
              Conexión directa entre amigos · Privacidad garantizada
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
