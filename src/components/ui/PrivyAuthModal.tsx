'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Apple, CheckCircle2, Wallet, Sparkles } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { getOrCreateSmartAccount } from '@/lib/web3/smartAccount';
import { usePrivy } from '@privy-io/react-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
import confetti from 'canvas-confetti';

interface PrivyAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PrivyAuthModal: React.FC<PrivyAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { login, ready } = usePrivy();
  const { t } = useTranslation();
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);
  const [successAccount, setSuccessAccount] = useState<string | null>(null);

  const handleSocialAuth = async (method: 'apple' | 'google' | 'email') => {
    setLoadingMethod(method);

    const isLivePrivy =
      Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID) &&
      !process.env.NEXT_PUBLIC_PRIVY_APP_ID?.includes('demo') &&
      !process.env.NEXT_PUBLIC_PRIVY_APP_ID?.includes('placeholder');

    if (isLivePrivy && ready) {
      try {
        onClose();
        login();
        setLoadingMethod(null);
        return;
      } catch (e) {
        console.warn('Privy native modal fallback:', e);
      }
    }

    // Simulate instant silent embedded smart wallet creation
    await new Promise((resolve) => setTimeout(resolve, 600));

    const session = getOrCreateSmartAccount(
      method,
      method === 'apple' ? 'law.party@icloud.com' : 'law@gmail.com'
    );

    setLoadingMethod(null);
    setSuccessAccount(session.address);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#F0DC00', '#FFFFFF'],
    });

    setTimeout(() => {
      onClose();
      if (onSuccess) onSuccess();
    }, 800);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t.privy.welcomeTitle}>
      <div className="space-y-4 text-center select-none py-1 relative">
        {/* Ambient Warm Golden Bokeh */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#F0DC00]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Row with Language Switch */}
        <div className="flex items-center justify-between pb-1 px-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-[#F0DC00]">
            <Sparkles className="w-3 h-3 text-[#F0DC00]" />
            <span>PARTYLOT AUTH</span>
          </div>
          <LanguageSwitch compact />
        </div>

        <AnimatePresence mode="wait">
          {successAccount ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="py-5"
            >
              <div className="w-16 h-16 rounded-full bg-[#F0DC00]/20 border border-[#F0DC00] text-[#F0DC00] flex items-center justify-center mx-auto mb-3.5 shadow-[0_0_24px_rgba(240,220,0,0.35)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-display font-black text-2xl text-white tracking-tight">
                {t.privy.accountReadyTitle}
              </h4>
              <p className="text-xs text-white/70 mt-1 max-w-xs mx-auto">
                {t.privy.accountReadySubtitle}
              </p>
            </motion.div>
          ) : (
            <motion.div key="options" className="space-y-3 relative z-10">
              <p className="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
                {t.privy.welcomeSubtitle}
              </p>

              {/* Apple Login - VisionOS Tactile Specular Button */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSocialAuth('apple')}
                disabled={loadingMethod !== null}
                className="w-full min-h-[50px] py-3 px-4 rounded-2xl liquid-glass-auth-apple font-semibold text-sm flex items-center justify-center gap-3 cursor-pointer"
              >
                <Apple className="w-4 h-4 fill-black shrink-0" />
                <span className="truncate">
                  {loadingMethod === 'apple' ? t.privy.accessing : t.privy.continueApple}
                </span>
              </motion.button>

              {/* Google Login - Frosted Liquid Glass Button */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSocialAuth('google')}
                disabled={loadingMethod !== null}
                className="w-full min-h-[50px] py-3 px-4 rounded-2xl liquid-glass-auth-glass text-white font-semibold text-sm flex items-center justify-center gap-3 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <span className="font-black text-sm text-[#F0DC00]">G</span>
                </div>
                <span className="truncate">
                  {loadingMethod === 'google' ? t.privy.accessing : t.privy.continueGoogle}
                </span>
              </motion.button>

              {/* Email Login - Frosted Smoked Glass */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSocialAuth('email')}
                disabled={loadingMethod !== null}
                className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl liquid-glass-auth-glass text-white/90 font-medium text-xs flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-white/60 shrink-0" />
                <span className="truncate">{t.privy.continueEmail}</span>
              </motion.button>

              {/* Monad / External Web3 Wallet - Radiant Amber Glass */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onClose();
                  login();
                }}
                disabled={loadingMethod !== null}
                className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl liquid-glass-auth-web3 text-white font-medium text-xs flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Wallet className="w-4 h-4 text-[#F0DC00] shrink-0" />
                <span className="truncate text-[#F0DC00] font-semibold">{t.privy.connectWeb3}</span>
              </motion.button>

              {/* Security Pill Badge */}
              <div className="pt-3 flex items-center justify-center gap-1.5 text-[10px] text-white/50 font-mono tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F0DC00] shrink-0" />
                <span>{t.privy.secureAccessBadge}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BottomSheet>
  );
};
