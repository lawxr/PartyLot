'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { THIS_OR_THAT_QUESTIONS } from '@/data/mockData';

export const ThisOrThat: React.FC = () => {
  const { thisOrThat, voteThisOrThat } = usePartyStore();
  const { t, language } = useTranslation();
  const isEs = language === 'es';
  const [index, setIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const questions = thisOrThat && thisOrThat.length > 0 ? thisOrThat : THIS_OR_THAT_QUESTIONS;
  const currentQ = questions[index % questions.length] || THIS_OR_THAT_QUESTIONS[0];
  const total = (currentQ.votesA || 0) + (currentQ.votesB || 0);
  const percentA = total > 0 ? Math.round(((currentQ.votesA || 0) / total) * 100) : 50;
  const percentB = total > 0 ? 100 - percentA : 50;

  const optionTextA = isEs && currentQ.optionAEs ? currentQ.optionAEs : currentQ.optionA;
  const optionTextB = isEs && currentQ.optionBEs ? currentQ.optionBEs : currentQ.optionB;

  // Framer Motion drag physics for Tinder-like swiping
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-18, 0, 18]);
  const stampOpacityA = useTransform(x, [-120, -25, 0], [1, 0.4, 0]);
  const stampOpacityB = useTransform(x, [0, 25, 120], [0, 0.4, 1]);
  const cardScale = useTransform(x, [-150, 0, 150], [1.02, 1, 1.02]);

  const handleVote = (choice: 'A' | 'B') => {
    voteThisOrThat(currentQ.id, choice);
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.65 },
      colors: ['#F0DC00', '#171512', '#FFA000'],
    });
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 85;
    const velocityThreshold = 400;

    if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      // Swiped Left -> Option A
      setSwipeDirection('left');
      handleVote('A');
    } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      // Swiped Right -> Option B
      setSwipeDirection('right');
      handleVote('B');
    }
  };

  const handleNext = () => {
    setSwipeDirection(null);
    setIndex((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* Header */}
      <div className="text-center mb-4">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#B89600] dark:text-[#F0DC00] flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {isEs ? 'JUEGO 02 · DILEMA SWIPE' : 'GAME 02 · SWIPE DILEMMA'}
        </span>
        <h3 className="font-display font-black text-2xl sm:text-3xl text-[#171512] dark:text-[#F5F1E8] tracking-tight mt-0.5">
          {t.games.thisOrThat.toUpperCase()}
        </h3>
        <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] mt-0.5">
          {isEs
            ? '👈 Desliza izquierda para Opción A · Derecha para Opción B 👉'
            : '👈 Swipe left for Option A · Swipe right for Option B 👉'}
        </p>
      </div>

      {/* Tinder Card Container */}
      <div className="relative w-full max-w-sm h-[380px] sm:h-[410px] flex items-center justify-center mb-5">
        {/* Underneath Stack Layer Effect */}
        <div className="absolute w-[92%] h-[350px] sm:h-[380px] rounded-[32px] bg-black/[0.04] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 translate-y-3 scale-95 pointer-events-none" />
        <div className="absolute w-[96%] h-[360px] sm:h-[390px] rounded-[32px] bg-black/[0.06] dark:bg-white/[0.06] border border-black/5 dark:border-white/5 translate-y-1.5 scale-98 pointer-events-none" />

        {/* Main Swipeable Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id + index}
            style={{ x, rotate, scale: cardScale }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8}
            onDragEnd={handleDragEnd}
            whileTap={{ cursor: 'grabbing' }}
            initial={{ scale: 0.9, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{
              x: swipeDirection === 'left' ? -350 : swipeDirection === 'right' ? 350 : 0,
              opacity: 0,
              transition: { duration: 0.25 },
            }}
            className="absolute inset-0 rounded-[32px] p-6 bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/10 dark:border-white/10 shadow-[0_16px_40px_rgba(65,48,25,0.08)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)] flex flex-col justify-between cursor-grab active:cursor-grabbing overflow-hidden"
          >
            {/* Swipe Left Badge (Option A) */}
            <motion.div
              style={{ opacity: stampOpacityA }}
              className="absolute top-5 left-5 z-20 px-3.5 py-1.5 rounded-2xl border-2 border-[#F0DC00] bg-[#F0DC00]/90 text-[#171512] font-black text-xs uppercase tracking-wider shadow-md pointer-events-none rotate-[-10deg]"
            >
              👈 {optionTextA}
            </motion.div>

            {/* Swipe Right Badge (Option B) */}
            <motion.div
              style={{ opacity: stampOpacityB }}
              className="absolute top-5 right-5 z-20 px-3.5 py-1.5 rounded-2xl border-2 border-[#171512] dark:border-white bg-[#171512] dark:bg-white text-white dark:text-[#171512] font-black text-xs uppercase tracking-wider shadow-md pointer-events-none rotate-[10deg]"
            >
              {optionTextB} 👉
            </motion.div>

            {/* Top Indicator */}
            <div className="flex items-center justify-between text-xs font-bold text-[#6F6A62] dark:text-[#A8A196]">
              <span className="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 font-mono text-[11px]">
                #{((index % questions.length) + 1).toString().padStart(2, '0')} / {questions.length}
              </span>
              {currentQ.userVote && (
                <span className="px-2.5 py-1 rounded-full bg-[#F0DC00] text-[#171512] font-extrabold text-[10px] flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                  {isEs ? `Votaste: Opción ${currentQ.userVote}` : `Voted: Option ${currentQ.userVote}`}
                </span>
              )}
            </div>

            {/* Dual Options in Card */}
            <div className="flex flex-col gap-3 my-auto py-2">
              {/* Option A Section */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleVote('A');
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  currentQ.userVote === 'A'
                    ? 'border-[#F0DC00] bg-[#F0DC00]/15 dark:bg-[#F0DC00]/20 shadow-sm'
                    : 'border-black/8 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] hover:border-[#F0DC00]/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black tracking-wider uppercase text-[#B89600] dark:text-[#F0DC00]">
                    {t.games.optionA}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#171512] dark:text-[#F5F1E8]">
                    {percentA}%
                  </span>
                </div>
                <h4 className="font-display font-black text-lg sm:text-xl text-[#171512] dark:text-white leading-tight">
                  {optionTextA}
                </h4>
                <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentA}%` }}
                    className="h-full bg-[#F0DC00] rounded-full"
                  />
                </div>
              </div>

              {/* VS Pill */}
              <div className="flex items-center justify-center -my-1">
                <span className="w-7 h-7 rounded-full bg-[#171512] dark:bg-white text-white dark:text-[#171512] font-black text-[10px] flex items-center justify-center shadow-sm">
                  VS
                </span>
              </div>

              {/* Option B Section */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleVote('B');
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  currentQ.userVote === 'B'
                    ? 'border-[#171512] dark:border-white bg-black/5 dark:bg-white/10 shadow-sm'
                    : 'border-black/8 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] hover:border-black/30 dark:hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black tracking-wider uppercase text-[#6F6A62] dark:text-[#A8A196]">
                    {t.games.optionB}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#171512] dark:text-[#F5F1E8]">
                    {percentB}%
                  </span>
                </div>
                <h4 className="font-display font-black text-lg sm:text-xl text-[#171512] dark:text-white leading-tight">
                  {optionTextB}
                </h4>
                <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentB}%` }}
                    className="h-full bg-[#171512] dark:bg-white rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Total Votes */}
            <div className="text-center text-[11px] font-semibold text-[#6F6A62] dark:text-[#A8A196]">
              {total} {isEs ? 'votos registrados' : 'total votes registered'}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Swipe Control Buttons */}
      <div className="flex items-center gap-3 w-full max-w-sm justify-between px-2 mb-4">
        {/* Swipe Left Button (Option A) */}
        <button
          onClick={() => handleVote('A')}
          className="flex-1 py-3 px-4 rounded-2xl bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/10 dark:border-white/10 shadow-sm hover:border-[#F0DC00] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-extrabold text-[#171512] dark:text-[#F5F1E8]"
        >
          <ArrowLeft className="w-4 h-4 text-[#B89600] dark:text-[#F0DC00]" />
          <span className="truncate">{optionTextA}</span>
        </button>

        {/* Swipe Right Button (Option B) */}
        <button
          onClick={() => handleVote('B')}
          className="flex-1 py-3 px-4 rounded-2xl bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/10 dark:border-white/10 shadow-sm hover:border-black/30 dark:hover:border-white/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-extrabold text-[#171512] dark:text-[#F5F1E8]"
        >
          <span className="truncate">{optionTextB}</span>
          <ArrowRight className="w-4 h-4 text-[#171512] dark:text-white" />
        </button>
      </div>

      {/* Next Question Button */}
      <button
        onClick={handleNext}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-xs font-bold text-[#171512] dark:text-[#F5F1E8] transition-all cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5 text-[#B89600] dark:text-[#F0DC00]" />
        <span>{t.games.nextDilemma || (isEs ? 'Siguiente Carta' : 'Next Card')}</span>
      </button>
    </div>
  );
};
