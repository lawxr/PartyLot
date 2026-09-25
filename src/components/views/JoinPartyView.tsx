'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Check, AlertCircle, MapPin, Clock, RefreshCw, QrCode } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassButton } from '@/components/ui/GlassButton';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { Party } from '@/types';
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { PrivyAuthModal } from '@/components/ui/PrivyAuthModal';
import { validateServerInviteCode } from '@/services/supabaseService';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { QRScannerModal } from '@/components/ui/QRScannerModal';
import confetti from 'canvas-confetti';
import { isPrivyConfigured } from '@/lib/runtimeMode';

export const JoinPartyView: React.FC = () => {
  const {
    parties,
    joinPartyByCode,
    selectParty,
    setCurrentView,
    currentUser,
    goBack,
    hydrateFromSupabase,
    pendingInviteCode,
    setPendingInviteCode,
  } = usePartyStore();
  const { authenticated, ready, getAccessToken } = usePrivy();
  const { t, language } = useTranslation();

  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [isJoining, setIsJoining] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
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

  // Handle prefilled invite code from QR scan or query parameter
  useEffect(() => {
    if (pendingInviteCode && pendingInviteCode.length === 4) {
      const codeChars = pendingInviteCode.toUpperCase().split('');
      queueMicrotask(() => {
        setDigits(codeChars);
        setPendingInviteCode(null);
      });
    }
  }, [pendingInviteCode, setPendingInviteCode]);

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

      const runValidation = async () => {
        setIsValidating(true);
        setJoinError(null);

        try {
          const res = await validateServerInviteCode(fullCode);
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
        } catch {
          if (!isCurrent) return;
          setServerPreview(null);
          setJoinError('Invite validation is unavailable. Please try again later.');
        } finally {
          if (isCurrent) {
            setIsValidating(false);
          }
        }
      };

      queueMicrotask(() => {
        if (isCurrent) {
          runValidation();
        }
      });

      return () => {
        isCurrent = false;
      };
    } else {
      queueMicrotask(() => {
        setIsValidating(false);
        if (fullCode.length < 4) {
          setServerPreview(null);
          setJoinError(null);
        }
      });
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

  const isGoing = Boolean(
    activeParty &&
      activeParty.members?.some(
        (m) =>
          (currentUser.id && m.id === currentUser.id) ||
          (currentUser.walletAddress &&
            m.walletAddress &&
            m.walletAddress.toLowerCase() === currentUser.walletAddress?.toLowerCase()) ||
          (currentUser.name && m.name?.toLowerCase() === currentUser.name?.toLowerCase())
      )
  );

  const hostMember =
    activeParty?.members?.find((m) => m.role === 'host') || activeParty?.members?.[0];

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

  const handleQRScanned = (code: string) => {
    if (code && code.length === 4) {
      setJoinError(null);
      setDigits(code.toUpperCase().split(''));
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#F0DC00', '#A855F7', '#38BDF8'],
      });
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
    <div className="min-h-screen w-full bg-[#F7F2E8] text-[#171512] flex flex-col justify-between p-4 sm:p-6 md:p-10 safe-top safe-bottom select-none">
      {/* Top Header Bar */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between mb-4 sm:mb-8 shrink-0">
        <button
          onClick={goBack}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FFFDF8] border border-[rgba(35,30,22,0.1)] shadow-sm flex items-center justify-center text-[#171512] hover:bg-[#F8F3EA] transition-transform active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Responsive Main Shell: Invitation Landing Page when activeParty, or Code Entry when !activeParty */}
      <div className="w-full max-w-2xl mx-auto my-auto flex-1 flex flex-col justify-center py-2 sm:py-4">
        <AnimatePresence mode="wait">
          {activeParty ? (
            /* DEDICATED PARTY INVITATION SCREEN (Pantalla de Invitación) */
            <motion.div
              key="invitation-card"
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="w-full max-w-xl mx-auto"
            >
              <div className="rounded-[36px] overflow-hidden border border-[rgba(35,30,22,0.1)] shadow-[0_16px_50px_rgba(65,48,25,0.1)] bg-[#FFFDF8] relative text-left">
                {/* Hero Cover Image Banner */}
                <div className="relative h-64 sm:h-80 w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeParty.coverImage}
                    alt={activeParty.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#FFFDF8] via-[#FFFDF8]/30 to-black/20" />

                  {/* Top Floating Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFDF8]/90 backdrop-blur-md text-[#171512] text-xs font-bold uppercase tracking-wider shadow-sm border border-[rgba(35,30,22,0.1)]">
                      <Sparkles className="w-3.5 h-3.5 text-[#E6D300]" />
                      <span>{t.joinParty.invitationBadge}</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-full bg-[#171512]/80 backdrop-blur-md text-xs font-mono font-bold text-white border border-white/15 shadow-sm">
                      CODE: {activeParty.code}
                    </div>
                  </div>

                  {/* Host info floating on bottom of image */}
                  {hostMember && (
                    <div className="absolute bottom-4 left-5 right-5 flex items-center gap-3 z-10">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#F0DC00] shadow-md bg-[#FFFDF8] flex items-center justify-center shrink-0">
                        {hostMember.avatar ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={hostMember.avatar}
                            alt={hostMember.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#F0DC00]/30 text-[#171512] font-black flex items-center justify-center text-sm">
                            {hostMember.name ? hostMember.name.charAt(0).toUpperCase() : 'H'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] uppercase font-bold text-[#6F6A62] tracking-wider block truncate">
                          {t.joinParty.invitedBy(hostMember.name || 'Host')}
                        </span>
                        <span className="font-display font-extrabold text-base text-[#171512] drop-shadow truncate block">
                          {hostMember.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Details Body */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-widest text-[#B8A700] mb-1 block">
                      {t.joinParty.onTheList}
                    </span>
                    <h1 className="font-bubble text-4xl sm:text-5xl lg:text-6xl text-[#171512] tracking-tight leading-[0.92]">
                      {activeParty.title}
                    </h1>
                  </div>

                  {/* Date, Time & Location Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.08)] flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F0DC00]/25 text-[#171512] flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-[#6F6A62] block">
                          {t.joinParty.when}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-[#171512] truncate block">
                          {activeParty.date} · {activeParty.time}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.08)] flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-700 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-[#6F6A62] block">
                          {t.joinParty.where}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-[#171512] truncate block">
                          {activeParty.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {activeParty.description && (
                    <p className="text-xs sm:text-sm text-[#6F6A62] leading-relaxed font-normal bg-[#F8F3EA] border border-[rgba(35,30,22,0.08)] p-4 rounded-2xl">
                      {activeParty.description}
                    </p>
                  )}

                  {/* Who's Going */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.08)]">
                    <div className="flex items-center gap-3">
                      <AvatarStack members={activeParty.members || []} maxDisplay={4} size="md" variant="light" />
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-[#171512] block">
                          {t.joinParty.peopleGoing(activeParty.members.length)}
                        </span>
                        <span className="text-[11px] text-[#6F6A62]">
                          {t.joinParty.confirmedGuestlist}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Error Notification if join failed */}
                  {joinError && (
                    <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-700">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{joinError}</span>
                    </div>
                  )}

                  {/* Action CTA */}
                  <div>
                    {isGoing ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-bold text-emerald-600">
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{t.joinParty.alreadyInParty}</span>
                        </div>
                        <GlassButton
                          variant="accent"
                          fullWidth
                          size="lg"
                          onClick={() => {
                            selectParty(activeParty.id);
                            setCurrentView('party-detail');
                          }}
                          icon={<ArrowRight className="w-4 h-4 text-black stroke-[3]" />}
                        >
                          {t.joinParty.enterParty}
                        </GlassButton>
                      </div>
                    ) : (
                      <GlassButton
                        variant="accent"
                        fullWidth
                        size="lg"
                        disabled={isJoining}
                        onClick={handleConfirmJoin}
                        icon={
                          isJoining ? (
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-black" />
                          )
                        }
                      >
                        {isJoining
                          ? t.joinParty.accepting
                          : authenticated
                          ? t.joinParty.acceptAndJoin
                          : t.joinParty.signInToAccept}
                      </GlassButton>
                    )}
                  </div>

                  {/* Switch to manual code option */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDigits(['', '', '', '']);
                        setServerPreview(null);
                        setJoinError(null);
                      }}
                      className="text-xs text-[#6F6A62] hover:text-[#171512] transition-colors underline cursor-pointer"
                    >
                      {t.joinParty.enterDifferentCode}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* CODE ENTRY & SCANNER VIEW */
            <motion.div
              key="code-entry"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <div
                className="w-full p-6 sm:p-10 border border-[rgba(35,30,22,0.1)] bg-[#FFFDF8] rounded-[32px] shadow-[0_16px_50px_rgba(65,48,25,0.08)] relative overflow-hidden flex flex-col items-center text-center max-w-lg mx-auto"
              >
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#B8A700] mb-2 block">
                  {t.joinParty.joinCircle}
                </span>

                <h2 className="font-display font-black text-3xl sm:text-5xl text-[#171512] tracking-tight leading-none mb-3">
                  {t.joinParty.gotACode}
                </h2>

                <p className="text-xs sm:text-sm text-[#6F6A62] mb-6 sm:mb-8 leading-relaxed max-w-sm mx-auto">
                  {t.joinParty.codeDescription}
                </p>

                {/* 4-Capsule Code Input */}
                <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 mb-5">
                  {digits.map((digit, idx) => (
                    <div
                      key={idx}
                      className={`w-14 h-18 sm:w-18 sm:h-22 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-display font-black transition-all ${
                        digit
                          ? 'border-2 border-[#171512] text-[#171512] shadow-sm bg-[#F0DC00]/25 scale-105'
                          : 'border border-[rgba(35,30,22,0.15)] bg-[#F8F3EA] text-[#171512] hover:border-[rgba(35,30,22,0.3)]'
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
                        className="w-full h-full bg-transparent text-center font-display font-black outline-none uppercase text-[#171512] caret-[#171512]"
                        autoFocus={idx === 0}
                      />
                    </div>
                  ))}
                </div>

                {/* Scan QR Code button */}
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="mb-4 px-4 py-2.5 rounded-2xl bg-[#F8F3EA] hover:bg-[#F1EADF] border border-[rgba(35,30,22,0.1)] text-[#171512] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <QrCode className="w-4 h-4 text-[#171512]" />
                  <span>{language === 'es' ? 'Escanear Código QR' : 'Scan QR Code'}</span>
                </button>

                {/* Validation Spinner Indicator */}
                {isValidating && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 text-xs text-[#171512] font-semibold mb-4 p-2.5 rounded-xl bg-[#F0DC00]/20 border border-[#F0DC00]/40 max-w-sm mx-auto shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#171512]" />
                    <span>{language === 'es' ? 'Buscando fiesta...' : 'Checking invite code...'}</span>
                  </motion.div>
                )}

                {/* Error Message */}
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 text-xs text-rose-700 font-medium mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 max-w-sm mx-auto"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Security Assurance */}
      <div className="w-full max-w-4xl mx-auto pt-4 text-center shrink-0">
        <p className="text-[11px] font-medium text-[#8E887E]">
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

      {/* In-App Camera QR Code Scanner */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onScanSuccess={handleQRScanned}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
};
