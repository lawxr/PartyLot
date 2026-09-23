'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { Party } from '@/types';
import { resolveInviteCodeToPermit } from '@/lib/web3/permits';
import { getOrCreateSmartAccount } from '@/lib/web3/smartAccount';
import confetti from 'canvas-confetti';

export const JoinPartyView: React.FC = () => {
  const { parties, joinPartyByCode, selectParty, goBack } = usePartyStore();

  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [matchedParty, setMatchedParty] = useState<Party | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Check code whenever digits change
  useEffect(() => {
    const fullCode = digits.join('').toUpperCase();
    if (fullCode.length === 4) {
      const found = parties.find((p) => p.code.toUpperCase() === fullCode);
      if (found) {
        setMatchedParty(found);
        setErrorMsg(null);

        // Resolve EIP-712 permit offchain (protecting code from brute force)
        const account = getOrCreateSmartAccount();
        resolveInviteCodeToPermit(fullCode, account.address);
      } else {
        setMatchedParty(null);
        setErrorMsg('No party found with this code. Double-check with your host!');
      }
    } else {
      setMatchedParty(null);
      setErrorMsg(null);
    }
  }, [digits, parties]);

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
    setIsJoining(true);

    // Simulate smart account sponsored UserOp execution of joinPartyWithPermit()
    await new Promise((resolve) => setTimeout(resolve, 500));

    const res = joinPartyByCode(matchedParty.code);
    if (res.success) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#E9FF32', '#FFFFFF'],
      });
      setTimeout(() => {
        selectParty(matchedParty.id);
      }, 500);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto safe-top safe-bottom select-none overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-full liquid-glass-button flex items-center justify-center text-white/80 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs uppercase tracking-wider text-white/50 font-semibold">
          PRIVATE ACCESS
        </span>
        <div className="w-10" />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center text-center py-4 sm:py-6">
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#E9FF32] mb-1.5 sm:mb-2">
          JOIN PRIVATE CIRCLE
        </span>
        <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight mb-2 sm:mb-3">
          GOT A CODE?
        </h2>
        <p className="text-xs sm:text-sm text-white/60 max-w-xs mb-6 sm:mb-8">
          Enter the 4-character invite code provided by the party host.
        </p>

        {/* 4-Capsule Code Input (Fully responsive) */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-4 mb-4 sm:mb-6 w-full max-w-xs">
          {digits.map((digit, idx) => (
            <div
              key={idx}
              className={`flex-1 aspect-[3.5/4.5] max-w-[68px] rounded-2xl liquid-glass-card flex items-center justify-center text-2xl sm:text-3xl font-display font-black transition-all ${
                digit
                  ? 'border-[#E9FF32] text-[#E9FF32] shadow-[0_0_20px_rgba(233,255,50,0.25)]'
                  : 'border-white/20 text-white/40'
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

        {/* Error message */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 text-xs text-rose-400 font-medium mb-4 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 max-w-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{errorMsg}</span>
          </motion.div>
        )}

        {/* Quick hint for tester */}
        {!matchedParty && !errorMsg && (
          <div className="text-xs text-white/40 mb-2">
            Hint: try sample code <span className="font-mono text-[#E9FF32] font-bold cursor-pointer" onClick={() => setDigits(['8','F','4','K'])}>8F4K</span> or <span className="font-mono text-[#E9FF32] font-bold cursor-pointer" onClick={() => setDigits(['9','X','2','M'])}>9X2M</span>
          </div>
        )}

        {/* Morphing Party Preview Card with EIP-712 badge */}
        <AnimatePresence>
          {matchedParty && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-sm mt-3"
            >
              <GlassPanel level={3} className="p-4 sm:p-5 overflow-hidden relative text-left border border-white/25">
                <div className="h-28 sm:h-32 -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 mb-3 sm:mb-4 relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={matchedParty.coverImage}
                    alt={matchedParty.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101015] via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-[#E9FF32] border border-white/10 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#E9FF32]" />
                    <span>EIP-712 PERMIT SIGNED</span>
                  </div>
                </div>

                <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight truncate">
                  {matchedParty.title}
                </h3>

                <p className="text-xs text-[#E9FF32] font-bold mt-0.5">
                  {matchedParty.date} · {matchedParty.time}
                </p>

                <p className="text-xs text-white/60 mt-1 mb-3 truncate">
                  {matchedParty.location}
                </p>

                <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                  <AvatarStack members={matchedParty.members} size="sm" countLabel="people" />
                </div>
              </GlassPanel>

              {/* Confirm Join Button */}
              <div className="mt-4 w-full">
                <GlassButton
                  variant="accent"
                  size="lg"
                  fullWidth
                  onClick={handleConfirmJoin}
                  icon={isJoining ? <Check className="w-5 h-5 text-black" /> : <Sparkles className="w-5 h-5 text-black" />}
                >
                  {isJoining ? 'Signing Permit...' : 'Join party'}
                </GlassButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
