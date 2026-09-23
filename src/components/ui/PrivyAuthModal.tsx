'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Apple, CheckCircle2, Wallet } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { getOrCreateSmartAccount } from '@/lib/web3/smartAccount';
import { usePrivy } from '@privy-io/react-auth';
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

    // Simulate instant silent embedded wallet creation
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
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Welcome to Partylot">
      <div className="space-y-4 text-center select-none py-1">
        <AnimatePresence mode="wait">
          {successAccount ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-4"
            >
              <div className="w-14 h-14 rounded-full bg-[#F0DC00]/20 border border-[#F0DC00] text-[#F0DC00] flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-display font-black text-xl text-white">
                Account Ready
              </h4>
              <p className="text-xs text-white/60 mt-1">
                Embedded passkey created silently. Gas is sponsored by Pimlico.
              </p>
            </motion.div>
          ) : (
            <motion.div key="options" className="space-y-3">
              <p className="text-xs text-white/70">
                Continue seamlessly. No seed phrases, no gas tokens, no crypto popups.
              </p>

              {/* Apple Login */}
              <button
                onClick={() => handleSocialAuth('apple')}
                disabled={loadingMethod !== null}
                className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-white text-black font-semibold text-sm flex items-center justify-center gap-2.5 hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg"
              >
                <Apple className="w-4 h-4 fill-black shrink-0" />
                <span className="truncate">
                  {loadingMethod === 'apple' ? 'Creating Passkey...' : 'Continue with Apple'}
                </span>
              </button>

              {/* Google Login */}
              <button
                onClick={() => handleSocialAuth('google')}
                disabled={loadingMethod !== null}
                className="w-full min-h-[48px] py-3 px-4 rounded-2xl liquid-glass-card text-white font-semibold text-sm flex items-center justify-center gap-2.5 hover:bg-white/10 active:scale-[0.98] transition-all border border-white/20"
              >
                <span className="font-black text-[#F0DC00] shrink-0">G</span>
                <span className="truncate">
                  {loadingMethod === 'google' ? 'Creating Passkey...' : 'Continue with Google'}
                </span>
              </button>

              {/* Email Login */}
              <button
                onClick={() => handleSocialAuth('email')}
                disabled={loadingMethod !== null}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl liquid-glass-card text-white/80 font-medium text-xs flex items-center justify-center gap-2 hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-white/60 shrink-0" />
                <span className="truncate">Continue with Email or Phone</span>
              </button>

              {/* WalletConnect / External Wallet */}
              <button
                onClick={() => {
                  onClose();
                  login();
                }}
                disabled={loadingMethod !== null}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl liquid-glass-card text-white/80 font-medium text-xs flex items-center justify-center gap-2 hover:text-[#F0DC00] hover:border-[#F0DC00]/40 transition-all border border-white/10"
              >
                <Wallet className="w-3.5 h-3.5 text-[#F0DC00] shrink-0" />
                <span className="truncate">Connect with WalletConnect / Web3</span>
              </button>

              <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-white/40 font-mono text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F0DC00] shrink-0" />
                <span>PRIVY EMBEDDED SMART WALLET · MONAD TESTNET</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BottomSheet>
  );
};
