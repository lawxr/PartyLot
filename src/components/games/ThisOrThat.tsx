'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassButton } from '@/components/ui/GlassButton';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/lib/i18n/useTranslation';

export const ThisOrThat: React.FC = () => {
  const { thisOrThat, voteThisOrThat } = usePartyStore();
  const { t, language } = useTranslation();
  const isEs = language === 'es';
  const [index, setIndex] = useState(0);

  const currentQ = thisOrThat[index % thisOrThat.length];
  const total = currentQ.votesA + currentQ.votesB;
  const percentA = total > 0 ? Math.round((currentQ.votesA / total) * 100) : 50;
  const percentB = total > 0 ? 100 - percentA : 50;

  const handleVote = (choice: 'A' | 'B') => {
    voteThisOrThat(currentQ.id, choice);
    confetti({
      particleCount: 35,
      spread: 45,
      origin: { y: 0.6 },
      colors: ['#F0DC00', '#FFFFFF'],
    });
  };

  const handleNext = () => {
    setIndex((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="text-center mb-5">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#F0DC00]">
          {isEs ? 'JUEGO 02 · DILEMA RÁPIDO' : 'GAME 02 · FAST DILEMMA'}
        </span>
        <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight mt-1">
          {t.games.thisOrThat.toUpperCase()}
        </h3>
        <p className="text-xs text-white/50">{t.games.pickSide}</p>
      </div>

      {/* Split Duel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-6">
        {/* Option A */}
        <motion.div
          whileTap={{ scale: 0.96 }}
          onClick={() => handleVote('A')}
          className={`relative h-48 sm:h-56 rounded-3xl p-5 overflow-hidden flex flex-col justify-between cursor-pointer border transition-all ${
            currentQ.userVote === 'A'
              ? 'border-[#F0DC00] shadow-[0_0_30px_rgba(240, 220, 0,0.3)] bg-gradient-to-b from-[#F0DC00]/20 to-black/60'
              : 'liquid-glass-card hover:border-white/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/60">{t.games.optionA}</span>
            {currentQ.userVote === 'A' && (
              <span className="px-2 py-0.5 rounded-full bg-[#F0DC00] text-black text-[10px] font-extrabold">
                {t.games.voted}
              </span>
            )}
          </div>

          <div className="my-auto">
            <h4 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
              {currentQ.optionA}
            </h4>
          </div>

          {/* Ratio bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-extrabold mb-1.5">
              <span className="text-white/70">{currentQ.votesA} {t.games.votes}</span>
              <span className="text-[#F0DC00] text-base">{percentA}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentA}%` }}
                className="h-full bg-[#F0DC00] rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Option B */}
        <motion.div
          whileTap={{ scale: 0.96 }}
          onClick={() => handleVote('B')}
          className={`relative h-48 sm:h-56 rounded-3xl p-5 overflow-hidden flex flex-col justify-between cursor-pointer border transition-all ${
            currentQ.userVote === 'B'
              ? 'border-[#F0DC00] shadow-[0_0_30px_rgba(240, 220, 0,0.3)] bg-gradient-to-b from-[#F0DC00]/20 to-black/60'
              : 'liquid-glass-card hover:border-white/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/60">{t.games.optionB}</span>
            {currentQ.userVote === 'B' && (
              <span className="px-2 py-0.5 rounded-full bg-[#F0DC00] text-black text-[10px] font-extrabold">
                {t.games.voted}
              </span>
            )}
          </div>

          <div className="my-auto">
            <h4 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
              {currentQ.optionB}
            </h4>
          </div>

          {/* Ratio bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-extrabold mb-1.5">
              <span className="text-white/70">{currentQ.votesB} {t.games.votes}</span>
              <span className="text-white text-base">{percentB}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentB}%` }}
                className="h-full bg-white/80 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Next Question Pill */}
      <GlassButton
        variant="glass"
        size="md"
        onClick={handleNext}
        icon={<RefreshCw className="w-4 h-4 text-[#F0DC00]" />}
      >
        {t.games.nextDilemma || (isEs ? 'Siguiente Pregunta' : 'Next Question')}
      </GlassButton>
    </div>
  );
};
