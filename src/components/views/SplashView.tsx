'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassButton } from '@/components/ui/GlassButton';
import { PrivyAuthModal } from '@/components/ui/PrivyAuthModal';
import { usePartyStore } from '@/store/usePartyStore';
import { KeyRound, ShieldCheck, Sparkles, MapPin, Clock } from 'lucide-react';
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
    <div className="relative w-full min-h-[100dvh] overflow-y-auto overflow-x-hidden flex flex-col justify-between bg-[#15140f] text-[#FCFAF7] select-none">
      {/* Background warm golden hour party photography */}
      <motion.div
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1600&q=85")',
        }}
      >
        {/* Soft warm amber gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#15140f] via-[#15140f]/70 to-[#0c0b0a]/40" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#15140f]/40 to-[#0c0b0a]/80" />
      </motion.div>

      {/* Warm fairy light bulbs */}
      <div className="bulb" style={{ left: '10%', top: '90px' }} />
      <div className="bulb" style={{ left: '28%', top: '115px' }} />
      <div className="bulb" style={{ left: '48%', top: '88px' }} />
      <div className="bulb" style={{ left: '68%', top: '110px' }} />
      <div className="bulb" style={{ left: '88%', top: '94px' }} />

      {/* Main Content Area */}
      <div className="relative z-10 px-5 sm:px-6 pt-12 pb-8 sm:pb-10 safe-bottom flex flex-col items-center text-center max-w-md mx-auto w-full my-auto">
        {/* Mini Stack of Preview Event Cards with Warm Photography */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full relative h-[180px] mb-6 flex items-center justify-center"
        >
          {/* Left card */}
          <div
            className="absolute left-2 w-[160px] h-[140px] rounded-2xl liquid-glass-card p-3 flex flex-col justify-end transform -rotate-6 shadow-xl border border-white/20 overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=400&q=80"
              alt="New York Jam"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b0a] via-[#0c0b0a]/50 to-transparent" />
            <span className="relative z-10 self-end px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] font-bold text-[#F0DC00] mb-auto">
              48d
            </span>
            <b className="relative z-10 font-display text-xs text-white uppercase tracking-tight drop-shadow">New York Jam</b>
            <small className="relative z-10 text-[10px] text-white/80 flex items-center gap-1 mt-0.5">
              <MapPin className="w-2.5 h-2.5 text-[#F0DC00]" /> Miami
            </small>
          </div>

          {/* Right card */}
          <div
            className="absolute right-2 w-[160px] h-[140px] rounded-2xl liquid-glass-card p-3 flex flex-col justify-end transform rotate-6 shadow-xl border border-white/20 overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=400&q=80"
              alt="Rooftop Party"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b0a] via-[#0c0b0a]/50 to-transparent" />
            <span className="relative z-10 self-end px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] font-bold text-[#F0DC00] mb-auto">
              27d
            </span>
            <b className="relative z-10 font-display text-xs text-white uppercase tracking-tight drop-shadow">Rooftop Party</b>
            <small className="relative z-10 text-[10px] text-white/80 flex items-center gap-1 mt-0.5">
              <MapPin className="w-2.5 h-2.5 text-[#F0DC00]" /> Jersey
            </small>
          </div>

          {/* Center card */}
          <div
            className="relative z-10 w-[190px] h-[160px] rounded-2xl liquid-glass-card p-3.5 flex flex-col justify-end shadow-2xl border border-white/30 transform hover:scale-105 transition-transform overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=600&q=80"
              alt="Cocktails Night"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b0a] via-[#0c0b0a]/40 to-transparent" />
            <span className="relative z-10 self-end px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] font-bold text-[#F0DC00] flex items-center gap-1 mb-auto">
              <Sparkles className="w-2.5 h-2.5" /> 2d
            </span>
            <b className="relative z-10 font-display text-sm text-white uppercase tracking-tight drop-shadow">Cocktails Night</b>
            <small className="relative z-10 text-[10px] text-white/90 flex items-center gap-1 mt-1">
              <Clock className="w-2.5 h-2.5 text-[#F0DC00]" /> 3 jul · New York
            </small>
            <div className="relative z-10 flex -space-x-1.5 mt-2">
              <span className="w-4 h-4 rounded-full bg-[#f0dc00] border border-black/40" />
              <span className="w-4 h-4 rounded-full bg-[#ff8fb1] border border-black/40" />
              <span className="w-4 h-4 rounded-full bg-[#8fd1ff] border border-black/40" />
            </div>
          </div>
        </motion.div>

        {/* Wordmark & Description */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-6"
        >
          <div className="text-xs uppercase tracking-[3px] text-[#F0DC00] font-semibold mb-1">
            BIENVENIDO A
          </div>
          <h1 className="bubble text-6xl sm:text-7xl tracking-tight text-white mb-2 drop-shadow-2xl">
            PartyLot
          </h1>
          <p className="font-display font-medium text-sm sm:text-base text-white/80 max-w-[270px] leading-relaxed mx-auto">
            Crea invitaciones con estilo y compártelas para cualquier evento
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="w-full flex flex-col gap-2.5"
        >
          <GlassButton
            variant="accent"
            size="lg"
            fullWidth
            onClick={handleGetStarted}
            className="shadow-[0_8px_24px_rgba(240,220,0,0.35)]"
          >
            Crear un evento
          </GlassButton>

          <GlassButton
            variant="glass"
            size="lg"
            fullWidth
            onClick={() => setCurrentView('join-party')}
            icon={<KeyRound className="w-4 h-4 text-white/80" />}
          >
            Tengo un código de invitación
          </GlassButton>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex items-center justify-center gap-1.5 w-full text-[11px] text-white/50 tracking-wide font-medium"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#F0DC00] shrink-0" />
          <span>Acceso privado · Sin comisiones ni anuncios</span>
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
