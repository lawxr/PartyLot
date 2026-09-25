'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Apple, Wallet, Sparkles } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { usePrivy } from '@privy-io/react-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { isPrivyConfigured } from '@/lib/runtimeMode';

interface PrivyAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivyAuthModal: React.FC<PrivyAuthModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { login, ready } = usePrivy();
  const { t } = useTranslation();
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const authConfigured = isPrivyConfigured();

  const handleSocialAuth = async (method: 'apple' | 'google' | 'email') => {
    if (!authConfigured || !ready) {
      setAuthError('Sign-in is unavailable because the authentication provider is not configured.');
      return;
    }

    setLoadingMethod(method);
    setAuthError(null);
    try {
      await login();
      setLoadingMethod(null);
    } catch (error) {
      console.warn('Privy sign-in could not start:', error);
      setAuthError('Sign-in could not be started. Please try again later.');
      setLoadingMethod(null);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t.privy.welcomeTitle}>
      <div className="space-y-4 text-center select-none py-1 relative">
        {/* Golden bokeh */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#F0DC00]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Badge */}
        <div className="flex items-center justify-center pb-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-[#F0DC00]">
            <Sparkles className="w-3 h-3 text-[#F0DC00]" />
            <span>PARTYLOT AUTH</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
            <motion.div key="options" className="space-y-3 relative z-10">
              <p className="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
                {t.privy.welcomeSubtitle}
              </p>

              {(!authConfigured || authError) && (
                <p role="alert" className="text-xs text-amber-200 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3">
                  {authError || 'Sign-in is unavailable because the authentication provider is not configured.'}
                </p>
              )}

              {/* Apple Login - VisionOS Tactile Specular Button */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSocialAuth('apple')}
                disabled={loadingMethod !== null || !authConfigured || !ready}
                className="w-full min-h-[50px] py-3 px-4 rounded-2xl liquid-glass-auth-apple font-semibold text-sm flex items-center justify-center gap-3 cursor-pointer"
              >
                <Apple className="w-4 h-4 fill-black shrink-0" />
                <span className="truncate">
                  {loadingMethod === 'apple' ? t.privy.accessing : t.privy.continueApple}
                </span>
              </motion.button>

              {/* Google login */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSocialAuth('google')}
                disabled={loadingMethod !== null || !authConfigured || !ready}
                className="w-full min-h-[50px] py-3 px-4 rounded-2xl liquid-glass-auth-glass text-white font-semibold text-sm flex items-center justify-center gap-3 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <span className="font-black text-sm text-[#F0DC00]">G</span>
                </div>
                <span className="truncate">
                  {loadingMethod === 'google' ? t.privy.accessing : t.privy.continueGoogle}
                </span>
              </motion.button>

              {/* Email login */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSocialAuth('email')}
                disabled={loadingMethod !== null || !authConfigured || !ready}
                className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl liquid-glass-auth-glass text-white/90 font-medium text-xs flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-white/60 shrink-0" />
                <span className="truncate">{t.privy.continueEmail}</span>
              </motion.button>

              {/* Wallet sign-in uses the configured authentication provider. */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSocialAuth('email')}
                disabled={loadingMethod !== null || !authConfigured || !ready}
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
        </AnimatePresence>
      </div>
    </BottomSheet>
  );
};
