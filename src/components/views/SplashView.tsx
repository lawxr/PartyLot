'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassButton } from '@/components/ui/GlassButton';
import { PrivyAuthModal } from '@/components/ui/PrivyAuthModal';
import { usePartyStore } from '@/store/usePartyStore';
import { Sparkles, KeyRound, ShieldCheck } from 'lucide-react';

export const SplashView: React.FC = () => {
  const { setCurrentView } = usePartyStore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden flex flex-col justify-between bg-black text-white select-none">
      {/* Background cinematic party photography */}
      <motion.div
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=85")',
        }}
      >
        {/* Soft vignette and atmospheric gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/30 to-black/80" />
      </motion.div>

      {/* Top Bar / Badge */}
      <div className="relative z-10 p-6 safe-top flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full liquid-glass-card text-xs font-semibold text-white/80"
        >
          <span className="w-2 h-2 rounded-full bg-[#E9FF32] animate-pulse" />
          <span>MONAD METROPOLIS · PRIVATE ALPHA</span>
        </motion.div>
      </div>

      {/* Main Bottom Section */}
      <div className="relative z-10 px-6 pb-8 safe-bottom flex flex-col items-start max-w-lg mx-auto w-full">
        {/* Giant Editorial Logo & Tagline */}
        <motion.div
          initial={{ opacity: 0, filter: 'blur(8px)', y: 20 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="mb-8"
        >
          <h1 className="font-display font-black text-6xl sm:text-7xl tracking-tight leading-[0.9] text-white drop-shadow-2xl">
            PARTY
            <br />
            <span className="text-[#E9FF32]">LOT</span>
          </h1>
          <p className="mt-4 font-display font-semibold text-base sm:text-lg text-white/90 tracking-wide max-w-[280px] leading-snug">
            THE NIGHT BELONGS TO THE GROUP.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
          className="w-full flex flex-col gap-3"
        >
          <GlassButton
            variant="accent"
            size="lg"
            fullWidth
            onClick={() => setIsAuthOpen(true)}
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
          className="mt-6 flex items-center justify-center gap-1.5 w-full text-[11px] text-white/50 tracking-wider font-mono"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#E9FF32]" />
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
