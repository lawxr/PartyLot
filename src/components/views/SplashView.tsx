'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassButton } from '@/components/ui/GlassButton';
import { PrivyAuthModal } from '@/components/ui/PrivyAuthModal';
import { usePartyStore } from '@/store/usePartyStore';
import { Sparkles, KeyRound, ShieldCheck } from 'lucide-react';
import { usePrivySync } from '@/hooks/usePrivySync';

export const SplashView: React.FC = () => {
  const { setCurrentView } = usePartyStore();
  const { login, ready } = usePrivySync();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleGetStarted = () => {
    const isLivePrivy =
      Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID) &&
      !process.env.NEXT_PUBLIC_PRIVY_APP_ID?.includes('demo') &&
      !process.env.NEXT_PUBLIC_PRIVY_APP_ID?.includes('placeholder');

    if (isLivePrivy && ready) {
      try {
        login();
      } catch {
        setIsAuthOpen(true);
      }
    } else {
      setIsAuthOpen(true);
    }
  };

  return (
    <div className="relative w-full min-h-[100dvh] overflow-y-auto overflow-x-hidden flex flex-col justify-between bg-black text-white select-none">
      {/* Background cinematic party photography */}
      <motion.div
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=85")',
        }}
      >
        {/* Soft vignette and atmospheric gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/45 to-black/35" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/30 to-black/80" />
      </motion.div>

      {/* Top Bar / Badge */}
      <div className="relative z-10 px-5 sm:px-6 pt-5 safe-top flex items-center justify-between max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass-card text-[11px] sm:text-xs font-semibold text-white/80"
        >
          <span className="w-2 h-2 rounded-full bg-[#E9FF32] animate-pulse" />
          <span>MONAD METROPOLIS · PRIVATE ALPHA</span>
        </motion.div>
      </div>

      {/* Main Content & Actions Area */}
      <div className="relative z-10 px-5 sm:px-6 pt-8 pb-8 sm:pb-10 safe-bottom flex flex-col items-start max-w-lg mx-auto w-full my-auto">
        {/* Giant Editorial Logo & Tagline */}
        <motion.div
          initial={{ opacity: 0, filter: 'blur(8px)', y: 20 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="font-display font-black text-5xl sm:text-6xl md:text-7xl tracking-tight leading-[0.9] text-white drop-shadow-2xl">
            PARTY
            <br />
            <span className="text-[#E9FF32]">LOT</span>
          </h1>
          <p className="mt-3 sm:mt-4 font-display font-semibold text-sm sm:text-base md:text-lg text-white/90 tracking-wide max-w-[280px] leading-snug">
            THE NIGHT BELONGS TO THE GROUP.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
          className="w-full flex flex-col gap-2.5 sm:gap-3"
        >
          <GlassButton
            variant="accent"
            size="lg"
            fullWidth
            onClick={handleGetStarted}
            icon={<Sparkles className="w-5 h-5 text-black" />}
          >
            Get started
          </GlassButton>

          <GlassButton
            variant="glass"
            size="lg"
            fullWidth
            onClick={() => setCurrentView('join-party')}
            icon={<KeyRound className="w-5 h-5 text-white/80" />}
          >
            Join with code
          </GlassButton>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.5 }}
          className="mt-5 sm:mt-6 flex items-center justify-center gap-1.5 w-full text-[10px] sm:text-[11px] text-white/50 tracking-wider font-mono text-center"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#E9FF32] shrink-0" />
          <span>PRIVY SMART WALLET · PIMLICO SPONSORED GAS</span>
        </motion.div>
      </div>

      {/* Silent Auth BottomSheet */}
      <PrivyAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setCurrentView('home')}
      />
    </div>
  );
};
