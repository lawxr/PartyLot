'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Check, AlertCircle, ShieldCheck, MapPin, Clock } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { Party } from '@/types';
import { resolveInviteCodeToPermit } from '@/lib/web3/permits';
import { getOrCreateSmartAccount } from '@/lib/web3/smartAccount';
import { usePrivySync } from '@/hooks/usePrivySync';
import { useLogin } from '@privy-io/react-auth';
import { PrivyAuthModal } from '@/components/ui/PrivyAuthModal';
import confetti from 'canvas-confetti';

export const JoinPartyView: React.FC = () => {
  const { parties, joinPartyByCode, selectParty, goBack } = usePartyStore();
  const { authenticated, ready } = usePrivySync();

  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [isJoining, setIsJoining] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const pendingPartyRef = useRef<Party | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const fullCode = digits.join('').toUpperCase();
  const matchedParty = fullCode.length === 4 ? parties.find((p) => p.code.toUpperCase() === fullCode) || null : null;
  const errorMsg = fullCode.length === 4 && !matchedParty ? 'No party found with this code. Double-check with your host!' : null;

  const executeJoinFlow = useCallback(
    async (party: Party) => {
      setIsJoining(true);

      // Simulate smart account sponsored UserOp execution of joinPartyWithPermit()
      await new Promise((resolve) => setTimeout(resolve, 500));

      const res = joinPartyByCode(party.code);
      if (res.success) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#E9FF32', '#FFFFFF'],
        });
        setTimeout(() => {
          selectParty(party.id);
        }, 500);
      }
      setIsJoining(false);
    },
    [joinPartyByCode, selectParty]
  );

  const { login } = useLogin({
    onComplete: () => {
      if (pendingPartyRef.current) {
        const target = pendingPartyRef.current;
        pendingPartyRef.current = null;
        executeJoinFlow(target);
      }
    },
  });

  // Resolve EIP-712 permit offchain whenever a valid 4-digit code is found
  useEffect(() => {
    if (fullCode.length === 4 && matchedParty) {
      const account = getOrCreateSmartAccount();
      resolveInviteCodeToPermit(fullCode, account.address);
    }
  }, [fullCode, matchedParty]);

  const handleChange = (index: number, value: string) => {
    const val = value.slice(-1).toUpperCase();
    const newDigits = [...digits];
    newDigits[index] = val;
    setDigits(newDigits);

    if (val && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
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
    const pasted = e.clipboardData.getData('text').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (pasted.length >= 4) {
      const chars = pasted.slice(0, 4).split('');
      setDigits(chars);
      inputsRef.current[3]?.focus();
    }
  };

  const handleConfirmJoin = async () => {
    if (!matchedParty) return;

    if (!authenticated) {
      pendingPartyRef.current = matchedParty;
      const isLivePrivy =
        Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID) &&
        !process.env.NEXT_PUBLIC_PRIVY_APP_ID?.includes('demo') &&
        !process.env.NEXT_PUBLIC_PRIVY_APP_ID?.includes('placeholder');

      if (isLivePrivy && ready) {
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

    executeJoinFlow(matchedParty);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] text-white flex flex-col justify-between p-4 sm:p-6 md:p-10 safe-top safe-bottom select-none overflow-y-auto">
      {/* Top Header Bar */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between mb-4 sm:mb-8 shrink-0">
        <button
          onClick={goBack}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full liquid-glass-button flex items-center justify-center text-white/80 hover:text-white transition-transform active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-card border border-white/15">
          <span className="w-2 h-2 rounded-full bg-[#E9FF32] animate-pulse" />
          <span className="text-[11px] sm:text-xs uppercase tracking-wider text-white/80 font-mono font-semibold">
            PRIVATE ACCESS · EIP-712
          </span>
        </div>

        <div className="w-10 sm:w-12" />
      </div>

      {/* Responsive Main Shell: Single column on mobile, 2-column card layout on desktop when matched */}
      <div className="w-full max-w-4xl mx-auto my-auto flex-1 flex flex-col justify-center">
        <GlassPanel
          level={2}
          className="w-full p-6 sm:p-8 md:p-12 border border-white/15 shadow-2xl relative overflow-hidden"
        >
          <div
            className={`w-full transition-all duration-300 ${
              matchedParty
                ? 'grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center'
                : 'flex flex-col items-center text-center max-w-lg mx-auto'
            }`}
          >
            {/* Left Column: Code Input & Instructions */}
            <div className={matchedParty ? 'text-left' : 'text-center w-full'}>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#E9FF32] mb-2 block">
                JOIN PRIVATE CIRCLE
              </span>

              <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-none mb-3">
                GOT A CODE?
              </h2>

              <p className="text-xs sm:text-sm text-white/60 mb-6 sm:mb-8 leading-relaxed max-w-sm">
                Enter the 4-character invite code provided by your host. The code resolves directly to an encrypted permit.
              </p>

              {/* 4-Capsule Code Input (Fully responsive from mobile to desktop) */}
              <div
                className={`flex items-center gap-2.5 sm:gap-3.5 md:gap-4 mb-4 ${
                  matchedParty ? 'justify-start' : 'justify-center'
                }`}
              >
                {digits.map((digit, idx) => (
                  <div
                    key={idx}
                    className={`w-14 h-18 sm:w-18 sm:h-22 md:w-20 md:h-24 rounded-2xl liquid-glass-card flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-display font-black transition-all ${
                      digit
                        ? 'border-[#E9FF32] text-[#E9FF32] shadow-[0_0_24px_rgba(233,255,50,0.28)] bg-[#E9FF32]/10 scale-105'
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
                      className="w-full h-full bg-transparent text-center font-display font-black outline-none uppercase text-white caret-[#E9FF32]"
                      autoFocus={idx === 0}
                    />
                  </div>
                ))}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-xs text-rose-300 font-medium mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 max-w-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              {/* Quick Preset Hints */}
              {!matchedParty && !errorMsg && (
                <div className="text-xs text-white/50 mt-3">
                  Try test codes:{' '}
                  <span
                    className="font-mono text-[#E9FF32] font-bold cursor-pointer hover:underline underline-offset-4"
                    onClick={() => setDigits(['8', 'F', '4', 'K'])}
                  >
                    8F4K
                  </span>{' '}
                  or{' '}
                  <span
                    className="font-mono text-[#E9FF32] font-bold cursor-pointer hover:underline underline-offset-4"
                    onClick={() => setDigits(['9', 'X', '2', 'M'])}
                  >
                    9X2M
                  </span>
                </div>
              )}
            </div>

            {/* Right Column: Resolved Party Card (Desktop & Mobile) */}
            <AnimatePresence>
              {matchedParty && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 15 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="w-full"
                >
                  <div className="liquid-glass-modal rounded-3xl overflow-hidden border border-white/20 shadow-2xl relative text-left">
                    {/* Cover image banner */}
                    <div className="h-36 sm:h-44 w-full relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={matchedParty.coverImage}
                        alt={matchedParty.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C10] via-black/30 to-transparent" />

                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-[#E9FF32] border border-white/15 flex items-center gap-1.5 shadow-lg">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#E9FF32]" />
                        <span>EIP-712 VERIFIED</span>
                      </div>
                    </div>

                    {/* Party Details */}
                    <div className="p-5 sm:p-6">
                      <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                        {matchedParty.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 font-semibold mt-1 mb-2">
                        <span className="flex items-center gap-1 text-[#E9FF32]">
                          <Clock className="w-3.5 h-3.5" />
                          {matchedParty.date} · {matchedParty.time}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-white/70">
                          <MapPin className="w-3.5 h-3.5 text-white/50" />
                          {matchedParty.location}
                        </span>
                      </div>

                      <p className="text-xs text-white/60 line-clamp-2 mb-4 font-normal">
                        {matchedParty.description}
                      </p>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                        <AvatarStack members={matchedParty.members} size="sm" countLabel="going" />
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
                            ? 'Signing Permit...'
                            : !authenticated
                            ? 'Sign in to join party'
                            : 'Join party'}
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
        <p className="text-[11px] font-mono text-white/40">
          SPONSORED BY PIMLICO PAYMASTER · ZERO GAS REQUIRED
        </p>
      </div>

      {/* Privy Auth BottomSheet Gate */}
      <PrivyAuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          pendingPartyRef.current = null;
        }}
        onSuccess={() => {
          setIsAuthOpen(false);
          const target = pendingPartyRef.current || matchedParty;
          pendingPartyRef.current = null;
          if (target) {
            executeJoinFlow(target);
          }
        }}
      />
    </div>
  );
};
