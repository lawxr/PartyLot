'use client';

import React, { useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Users, Check, UserPlus, ArrowLeft, Share2 } from 'lucide-react';
import { Party, User, Member } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { toast } from '@/store/useToastStore';

interface GameWaitingLobbyProps {
  party: Party;
  currentUser?: User;
  onBack?: () => void;
}

/**
 * GameWaitingLobby: Gating stage component that renders when a party
 * does not have enough real-time members (minimum 2 players).
 * Follows DESIGN.md specifications for warm, tactile, mobile-first design.
 */
export const GameWaitingLobby: React.FC<GameWaitingLobbyProps> = ({
  party,
  currentUser,
  onBack,
}) => {
  const { t, language } = useTranslation();
  const isEs = language === 'es';
  const shouldReduceMotion = useReducedMotion();
  const [copiedCode, setCopiedCode] = useState(false);

  const members: Member[] = party?.members || [];
  const minRequired = 2;
  const needed = Math.max(0, minRequired - members.length);

  const handleCopyCode = async () => {
    if (!party?.code) return;
    try {
      await navigator.clipboard.writeText(party.code);
      setCopiedCode(true);
      toast.success(t.games.codeCopied);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShareInvite = async () => {
    if (!party?.code) return;
    const shareText = isEs
      ? `¡Únete a los juegos en vivo de ${party.title || 'Partylot'} con el código: ${party.code}!`
      : `Join the live games at ${party.title || 'Partylot'} with party code: ${party.code}!`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: party.title || 'Partylot Games',
          text: shareText,
          url: window.location.origin,
        });
        return;
      } catch {
        // Fall back to copy
      }
    }
    handleCopyCode();
  };

  return (
    <div
      data-testid="game-waiting-lobby"
      className="w-full flex-1 flex flex-col items-center justify-between py-2 text-center select-none"
    >
      {/* 1. Pulsing Real-time Radar Indicator & Icon */}
      <div className="flex flex-col items-center mt-2 mb-4">
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-full bg-party-yellow/20 border border-party-yellow/80 text-[var(--stage-accent-text)] flex items-center justify-center shadow-sm">
            <Users className="w-8 h-8 stroke-[2.2] text-[var(--stage-text)]" />
          </div>
          {/* Real-time radar ping dot */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            {!shouldReduceMotion && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-party-yellow opacity-75" />
            )}
            <span className="relative inline-flex rounded-full h-4 w-4 bg-party-yellow border-2 border-[var(--stage-bg)]" />
          </span>
        </div>

        {/* Live Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--stage-card)] border border-[var(--stage-card-border)] text-xs font-mono font-bold tracking-wider text-[var(--stage-accent-text)] shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-party-yellow" />
          <span>{t.games.minPlayersRequired(members.length, minRequired)}</span>
        </span>
      </div>

      {/* 2. Headline & Editorial Context */}
      <div className="max-w-xs mb-4">
        <h2 className="font-display font-black text-2xl sm:text-[28px] leading-tight text-[var(--stage-text)] tracking-tight mb-2">
          {t.games.inviteFriendsToPlay}
        </h2>
        <p className="text-xs sm:text-sm text-[var(--stage-muted)] leading-relaxed">
          {t.games.gamesLockedHint}
        </p>
      </div>

      {/* 3. Real-Time Attendees Grid (ParticipantGrid from DESIGN.md) */}
      <div className="w-full max-w-xs mb-4">
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--stage-muted)] mb-2 text-left px-1">
          {isEs ? 'Jugadores en la sala' : 'Players in Room'}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Current Connected Members */}
          {members.map((m) => {
            const isMe = m.id === currentUser?.id || m.name === currentUser?.name;
            return (
              <div
                key={m.id}
                className="p-2.5 rounded-2xl bg-[var(--stage-card)] border border-[var(--stage-card-border)] flex items-center gap-2.5 shadow-2xs"
              >
                <Avatar
                  user={{ avatar: m.avatar, name: m.name }}
                  size="sm"
                  border="light"
                />
                <div className="text-left min-w-0 flex-1">
                  <span className="text-xs font-bold text-[var(--stage-text)] truncate block">
                    {isMe ? `${m.name} (${isEs ? 'Tú' : 'You'})` : m.name}
                  </span>
                  <span className="text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 block">
                    ● {isEs ? 'En sala' : 'Ready'}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Missing/Waiting Slots */}
          {Array.from({ length: needed }).map((_, idx) => (
            <div
              key={`waiting-slot-${idx}`}
              className="p-2.5 rounded-2xl border-2 border-dashed border-[var(--stage-card-border)] bg-black/[0.02] dark:bg-white/[0.02] flex items-center gap-2 text-[var(--stage-muted)]"
            >
              <div className="w-8 h-8 rounded-full border border-dashed border-[var(--stage-card-border)] flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4 text-party-yellow/80" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <span className="text-[11px] font-semibold truncate block">
                  {t.games.waitingForFriend}
                </span>
                <span className="text-[9px] text-[var(--stage-muted)] block">
                  {isEs ? 'Esperando...' : 'Pending...'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Party Code Box & Interactive Actions */}
      <div className="w-full max-w-xs flex flex-col items-center mt-auto">
        {party?.code && (
          <div className="w-full p-3.5 rounded-2xl bg-[var(--stage-card)] border border-[var(--stage-card-border)] mb-3 shadow-2xs flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--stage-muted)] block mb-0.5">
              {t.games.partyCode}
            </span>
            <span className="font-mono text-3xl font-black tracking-widest text-[var(--stage-text)]">
              {party.code}
            </span>
          </div>
        )}

        {/* Copy / Share Primary Action */}
        <button
          type="button"
          onClick={handleShareInvite}
          className="w-full py-3.5 px-6 rounded-full bg-party-yellow hover:bg-party-yellow-hover text-on-party-yellow font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mb-2"
        >
          {copiedCode ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t.games.codeCopied}</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 stroke-[2.4]" />
              <span>{t.games.copyCodeToInvite}</span>
            </>
          )}
        </button>

        {/* Back to Party Detail CTA */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-full py-2.5 px-4 rounded-full border border-[var(--stage-card-border)] bg-[var(--stage-card)] text-[var(--stage-muted)] hover:text-[var(--stage-text)] font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.games.backToParty}</span>
          </button>
        )}
      </div>
    </div>
  );
};
