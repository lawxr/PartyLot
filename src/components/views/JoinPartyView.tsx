'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Check, AlertCircle, ShieldCheck, MapPin, Clock, RefreshCw } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { Party } from '@/types';
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { PrivyAuthModal } from '@/components/ui/PrivyAuthModal';
import { validateServerInviteCode } from '@/services/supabaseService';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
import confetti from 'canvas-confetti';
import { isPrivyConfigured } from '@/lib/runtimeMode';

export const JoinPartyView: React.FC = () => {
  const { parties, joinPartyByCode, selectParty, goBack, hydrateFromSupabase } = usePartyStore();
  const { authenticated, ready, getAccessToken } = usePrivy();
  const { t } = useTranslation();

  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [isJoining, setIsJoining] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [serverPreview, setServerPreview] = useState<{
    id: string;
    title: string;
    location: string;
    code: string;
  } | null>(null);

  const pendingPartyRef = useRef<Party | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    hydrateFromSupabase().catch(() => {});
  }, [hydrateFromSupabase]);

  useEffect(() => {
    return () => {
      setDigits(['', '', '', '']);
    };
  }, []);

  const fullCode = digits.join('').toUpperCase();
  const matchedParty = fullCode.length === 4 ? parties.find((p) => p.code.toUpperCase() === fullCode) || null : null;

  // Auto-fetch if not found locally yet with robust async loading state
  useEffect(() => {
    if (fullCode.length === 4 && !matchedParty) {
      let isCurrent = true;
      setIsValidating(true);
      setJoinError(null);

      validateServerInviteCode(fullCode)
        .then((res) => {
          if (!isCurrent) return;
          if (res.valid && res.partyId) {
            setJoinError(null);
            setServerPreview({
              id: res.partyId,
              title: res.partyTitle || 'Private Gathering',
              location: res.partyLocation || 'Secret Location',
              code: fullCode,
            });
            hydrateFromSupabase().catch(() => {});
          } else {
            setServerPreview(null);
            setJoinError(res.error || 'No party found with this code. Double-check with your host!');
          }
        })
        .catch(() => {
          if (!isCurrent) return;
          setServerPreview(null);
          setJoinError('Invite validation is unavailable. Please try again later.');
        })
        .finally(() => {
          if (isCurrent) {
            setIsValidating(false);
          }
        });

      return () => {
        isCurrent = false;
      };
    } else {
      setIsValidating(false);
      if (fullCode.length < 4) {
        setServerPreview(null);
        setJoinError(null);
      }
    }
  }, [fullCode, matchedParty, hydrateFromSupabase]);

  const activeParty: Party | null =
    matchedParty ||
    (serverPreview && serverPreview.code === fullCode
      ? {
          id: serverPreview.id,
          code: fullCode,
          title: serverPreview.title,
          location: serverPreview.location,
          date: 'Upcoming',
          time: 'TBA',
          description: 'Private gathering invitation confirmed by server.',
          coverImage:
            'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
          members: [],
          potBalance: 0,
          status: 'upcoming',
          hostId: 'host',
          hostName: 'Host',
          createdAt: new Date().toISOString(),
        }
      : null);

  const errorMsg =
    !isValidating &&
    (joinError ||
      (fullCode.length === 4 && !activeParty
        ? 'No party found with this code. Double-check with your host!'
        : null));

  const executeJoinFlow = useCallback(
    async (code: string) => {
      setIsJoining(true);
      setJoinError(null);
      try {
        let token: string | null = null;
        if (authenticated) {
          try {
            token = await getAccessToken();
          } catch (tErr) {
            console.warn('Failed to obtain Privy access token:', tErr);
          }
        }
        const res = await joinPartyByCode(code, token);
        if (res.success && res.party) {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#F0DC00', '#FFFFFF'],
          });
          setDigits(['', '', '', '']);
          selectParty(res.party.id);
        } else {
          setJoinError(res.message || 'The server could not confirm this invite join.');
        }
      } catch {
        setJoinError('Joining is unavailable. Please try again later.');
      }
      setIsJoining(false);
    },
    [joinPartyByCode, selectParty, authenticated, getAccessToken]
  );

  const { login } = useLogin({
    onComplete: () => {
      if (pendingPartyRef.current) {
        const target = pendingPartyRef.current;
        pendingPartyRef.current = null;
        executeJoinFlow(target.code);
      }
    },
  });

  const handleChange = (index: number, value: string) => {
    setJoinError(null);
    const val = value.slice(-1).toUpperCase();
    const newDigits = [...digits];
    newDigits[index] = val;
    setDigits(newDigits);

    if (val && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    setJoinError(null);
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setJoinError(null);
    const pasted = e.clipboardData.getData('text').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (pasted.length >= 4) {
      const chars = pasted.slice(0, 4).split('');
      setDigits(chars);
      inputsRef.current[3]?.focus();
    }
  };

  const handleConfirmJoin = async () => {
    if (!activeParty) return;

    if (!authenticated) {
      pendingPartyRef.current = activeParty;
      if (isPrivyConfigured() && ready) {
        try {
          login();
          return;
        } catch {
          setIsAuthOpen(true);
          return;
        }
      } else {
        setIsAuthOpen(true);
        return;
      }
    }

    executeJoinFlow(activeParty.code);
  };

  return (
    <div className="min-h-screen w-full bg-[#15140f] text-white flex flex-col justify-between p-4 sm:p-6 md:p-10 safe-top safe-bottom select-none">
      {/* Top Header Bar */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between mb-4 sm:mb-8 shrink-0">
        <button
          onClick={goBack}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full liquid-glass-button flex items-center justify-center text-white/80 hover:text-white transition-transform active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <LanguageSwitch compact />
      </div>

      {/* Responsive Main Shell: Single column on mobile, 2-column card layout on desktop when matched */}
      <div className="w-full max-w-4xl mx-auto my-auto flex-1 flex flex-col justify-center py-2 sm:py-4">
        <GlassPanel
          level={2}
          className="w-full p-5 sm:p-8 md:p-12 border border-white/15 shadow-2xl relative overflow-hidden"
        >
          <div
            className={`w-full transition-all duration-300 ${
              activeParty
                ? 'grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center'
                : 'flex flex-col items-center text-center max-w-lg mx-auto'
            }`}
          >
            {/* Left Column: Code Input & Instructions */}
            <div className="flex flex-col items-center text-center w-full">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#F0DC00] mb-2 block">
                {t.joinParty.joinCircle}
              </span>

              <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-none mb-3">
                {t.joinParty.gotACode}
              </h2>

              <p className="text-xs sm:text-sm text-white/60 mb-6 sm:mb-8 leading-relaxed max-w-sm mx-auto">
                {t.joinParty.codeDescription}
              </p>

              {/* 4-Capsule Code Input (Fully responsive from mobile to desktop) */}
              <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 md:gap-4 mb-4">
                {digits.map((digit, idx) => (
                  <div
                    key={idx}
                    className={`w-14 h-18 sm:w-18 sm:h-22 md:w-20 md:h-24 rounded-2xl liquid-glass-card flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-display font-black transition-all ${
                      digit
                        ? 'border-[#F0DC00] text-[#F0DC00] shadow-[0_0_24px_rgba(240, 220, 0,0.28)] bg-[#F0DC00]/10 scale-105'
                        : 'border-white/20 text-white/40 hover:border-white/40'
                    }`}
                  >
                    <input
                      ref={(el) => {
                        inputsRef.current[idx] = el;
                      }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      className="w-full h-full bg-transparent text-center font-display font-black outline-none uppercase text-white caret-[#F0DC00]"
                      autoFocus={idx === 0}
                    />
                  </div>
                ))}
              </div>

              {/* Validation Spinner Indicator */}
              {isValidating && !activeParty && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 text-xs text-[#F0DC00] font-semibold mb-4 p-2.5 rounded-xl bg-[#F0DC00]/10 border border-[#F0DC00]/25 max-w-sm mx-auto shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F0DC00]" />
                  <span>Checking invite code...</span>
                </motion.div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 text-xs text-rose-300 font-medium mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 max-w-sm mx-auto"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

            </div>

            {/* Right Column: Resolved Party Card (Desktop & Mobile) */}
            <AnimatePresence>
              {activeParty && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 15 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="w-full mt-6 md:mt-0"
                >
                  <div className="liquid-glass-modal rounded-3xl overflow-hidden border border-white/20 shadow-2xl relative text-left">
                    {/* Cover image banner */}
                    <div className="h-36 sm:h-44 w-full relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeParty.coverImage}
                        alt={activeParty.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C10] via-black/30 to-transparent" />

                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-[#F0DC00] border border-white/15 flex items-center gap-1.5 shadow-lg">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#F0DC00]" />
                        <span>Invite preview</span>
                      </div>
                    </div>

                    {/* Party Details */}
                    <div className="p-5 sm:p-6">
                      <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                        {activeParty.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 font-semibold mt-1 mb-2">
                        <span className="flex items-center gap-1 text-[#F0DC00]">
                          <Clock className="w-3.5 h-3.5" />
                          {activeParty.date} · {activeParty.time}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-white/70">
                          <MapPin className="w-3.5 h-3.5 text-white/50" />
                          {activeParty.location}
                        </span>
                      </div>

                      <p className="text-xs text-white/60 line-clamp-2 mb-4 font-normal">
                        {activeParty.description}
                      </p>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                        <AvatarStack members={activeParty.members} size="sm" countLabel={t.home.going} />
                      </div>

                      {/* Confirm Join Button */}
                      <div className="mt-5">
                        <GlassButton
                          variant="accent"
                          size="lg"
                          fullWidth
                          onClick={handleConfirmJoin}
                          icon={
                            isJoining ? (
                              <Check className="w-5 h-5 text-black" />
                            ) : (
                              <Sparkles className="w-5 h-5 text-black" />
                            )
                          }
                        >
                          {isJoining
                            ? t.joinParty.enteringButton
                            : !authenticated
                            ? t.joinParty.connectToJoin
                            : t.joinParty.enterPartyButton}
                        </GlassButton>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassPanel>
      </div>

      {/* Bottom Security Assurance */}
      <div className="w-full max-w-4xl mx-auto pt-4 text-center shrink-0">
        <p className="text-[11px] font-medium text-white/50">
          {t.splash.privateAccess}
        </p>
      </div>

      {/* Privy Auth BottomSheet Gate */}
      <PrivyAuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          pendingPartyRef.current = null;
        }}
      />
    </div>
  );
};
