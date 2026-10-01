'use client';

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowLeft, ArrowRight, Check, Sparkles, Crown, Zap } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { THIS_OR_THAT_QUESTIONS } from '@/data/mockData';

export const ThisOrThat: React.FC = () => {
  const {
    parties,
    currentPartyId,
    thisOrThat,
    voteThisOrThat,
    loadPartyFromSupabase,
    listenToActivePartyRealtime,
  } = usePartyStore();
  const { t, language } = useTranslation();
  const isEs = language === 'es';
  const party = parties.find((p) => p.id === currentPartyId) || parties[0];

  useEffect(() => {
    if (!party?.id) return;
    loadPartyFromSupabase(party.id);
    const unsub = listenToActivePartyRealtime(party.id);
    return () => {
      unsub();
    };
  }, [party?.id, listenToActivePartyRealtime, loadPartyFromSupabase]);

  const [index, setIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const questions = thisOrThat && thisOrThat.length > 0 ? thisOrThat : THIS_OR_THAT_QUESTIONS;
  const currentQ = questions[index % questions.length] || THIS_OR_THAT_QUESTIONS[0];
  const total = (currentQ.votesA || 0) + (currentQ.votesB || 0);
  const percentA = total > 0 ? Math.round(((currentQ.votesA || 0) / total) * 100) : 50;
  const percentB = total > 0 ? 100 - percentA : 50;

  const optionTextA = isEs && currentQ.optionAEs ? currentQ.optionAEs : currentQ.optionA;
  const optionTextB = isEs && currentQ.optionBEs ? currentQ.optionBEs : currentQ.optionB;

  // Framer Motion drag physics for Tinder-like swiping between the two vertical cards
  const x = useMotionValue(0);
  const arenaRotate = useTransform(x, [-240, 0, 240], [-8, 0, 8]);
  const cardAScale = useTransform(x, [-160, 0, 160], [1.06, 1, 0.94]);
  const cardBScale = useTransform(x, [-160, 0, 160], [0.94, 1, 1.06]);
  const cardAOpacity = useTransform(x, [-160, 0, 160], [1, 1, 0.45]);
  const cardBOpacity = useTransform(x, [-160, 0, 160], [0.45, 1, 1]);
  const stampOpacityA = useTransform(x, [-120, -25, 0], [1, 0.45, 0]);
  const stampOpacityB = useTransform(x, [0, 25, 120], [0, 0.45, 1]);

  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(18);
      }
    } catch {
      // Haptics optional
    }
  };

  const handleVote = (choice: 'A' | 'B') => {
    voteThisOrThat(currentQ.id, choice);
    triggerHaptic();
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.65 },
      colors: choice === 'A' ? ['#F0DC00', '#FFA000', '#FFFFFF'] : ['#171512', '#F0DC00', '#6F6A62'],
    });
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 65;
    const velocityThreshold = 300;

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

  const handlePrev = () => {
    setSwipeDirection(null);
    setIndex((prev) => (prev > 0 ? prev - 1 : questions.length - 1));
  };

  const handleNext = () => {
    setSwipeDirection(null);
    setIndex((prev) => prev + 1);
  };

  const currentStep = (index % questions.length) + 1;
  const isVotedA = currentQ.userVote === 'A';
  const isVotedB = currentQ.userVote === 'B';
  const hasVoted = Boolean(currentQ.userVote);

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* Header with Game Title, Counter and Previous Card arrow */}
      <div className="w-full flex items-center justify-between mb-2 px-1">
        <button
          onClick={handlePrev}
          className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-[#171512] dark:text-white transition-all cursor-pointer"
          title={isEs ? 'Carta anterior' : 'Previous card'}
          aria-label={isEs ? 'Carta anterior' : 'Previous card'}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B89600] dark:text-[#F0DC00] flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            {isEs ? `CARTA #${currentStep.toString().padStart(2, '0')} / ${questions.length}` : `CARD #${currentStep.toString().padStart(2, '0')} / ${questions.length}`}
          </span>
          <h3 className="font-display font-black text-xl sm:text-2xl text-[#171512] dark:text-[#F5F1E8] tracking-tight leading-tight mt-0.5">
            {t.games.thisOrThat.toUpperCase()}
          </h3>
        </div>

        <button
          onClick={handleNext}
          className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-[#171512] dark:text-white transition-all cursor-pointer"
          title={isEs ? 'Siguiente carta' : 'Next card'}
          aria-label={isEs ? 'Siguiente carta' : 'Next card'}
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11px] text-[#6F6A62] dark:text-[#A8A196] mb-3 text-center">
        {isEs
          ? '👈 Desliza izquierda por A · Desliza derecha por B 👉'
          : '👈 Swipe left for A · Swipe right for B 👉'}
      </p>

      {/* Two Vertical Playing Cards Arena with Tinder Swiping */}
      <div
        data-disable-swipe-back="true"
        className="relative w-full max-w-md min-h-[380px] sm:min-h-[410px] flex items-center justify-center mb-4"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id + index}
            style={{ x, rotate: arenaRotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.65}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{
              x: swipeDirection === 'left' ? -380 : swipeDirection === 'right' ? 380 : 0,
              opacity: 0,
              transition: { duration: 0.25 },
            }}
            className="w-full flex items-stretch justify-between gap-2.5 sm:gap-3 cursor-grab active:cursor-grabbing relative"
          >
            {/* ============================================================== */}
            {/* FLOATING TINDER SWIPE STAMPS                                   */}
            {/* ============================================================== */}
            <motion.div
              style={{ opacity: stampOpacityA }}
              className="absolute -top-3 left-4 z-30 px-3.5 py-1 rounded-2xl border-2 border-[#171512] dark:border-white bg-[#F0DC00] text-[#171512] font-black text-xs uppercase tracking-wider shadow-lg pointer-events-none rotate-[-12deg]"
            >
              👈 {isEs ? 'ELEGIR A' : 'PICK A'}
            </motion.div>

            <motion.div
              style={{ opacity: stampOpacityB }}
              className="absolute -top-3 right-4 z-30 px-3.5 py-1 rounded-2xl border-2 border-[#F0DC00] bg-[#171512] dark:bg-white text-white dark:text-[#171512] font-black text-xs uppercase tracking-wider shadow-lg pointer-events-none rotate-[12deg]"
            >
              {isEs ? 'ELEGIR B' : 'PICK B'} 👉
            </motion.div>

            {/* ============================================================== */}
            {/* CARD A (Vertical Playing Card - Option A / Left)               */}
            {/* ============================================================== */}
            <motion.div
              style={{ scale: cardAScale, opacity: cardAOpacity }}
              onClick={() => handleVote('A')}
              className={`flex-1 rounded-[28px] p-4 sm:p-5 flex flex-col justify-between cursor-pointer border-2 transition-all relative overflow-hidden bg-[#FFFDF8] dark:bg-[#1C1A16] ${
                isVotedA
                  ? 'border-[#F0DC00] shadow-[0_16px_36px_rgba(240,220,0,0.28)] ring-2 ring-[#F0DC00]/40'
                  : 'border-black/10 dark:border-white/10 hover:border-[#F0DC00]/70 shadow-sm'
              }`}
            >
              {/* Inner Playing Card Border Inset */}
              <div className="absolute inset-1.5 rounded-[22px] border border-amber-500/20 pointer-events-none" />

              {/* Card A Top Pip & Badge */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-1 text-[#B89600] dark:text-[#F0DC00] font-mono font-black text-xs">
                  <Crown className="w-3.5 h-3.5" />
                  <span>A</span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B89600] dark:text-[#F0DC00] bg-[#F0DC00]/15 px-2 py-0.5 rounded-full">
                  {t.games.optionA}
                </span>
              </div>

              {/* Card A Body */}
              <div className="my-auto py-3 text-center z-10">
                <h4 className="font-display font-black text-base sm:text-lg md:text-xl text-[#171512] dark:text-white leading-snug">
                  {optionTextA}
                </h4>

                {isVotedA && (
                  <span className="inline-flex items-center gap-1 mt-2.5 px-2.5 py-0.5 rounded-full bg-[#F0DC00] text-[#171512] font-black text-[10px] uppercase shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" />
                    {isEs ? 'Tu Voto' : 'Your Pick'}
                  </span>
                )}
              </div>

              {/* Card A Footer (Percentages & Votes) */}
              <div className="z-10 mt-auto pt-2 border-t border-black/5 dark:border-white/10">
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                  <span className="text-[#6F6A62] dark:text-[#A8A196] text-[11px]">
                    {hasVoted ? `${currentQ.votesA || 0} votes` : (isEs ? '👈 Desliza' : '👈 Swipe')}
                  </span>
                  <span className="text-[#B89600] dark:text-[#F0DC00] font-black text-sm">
                    {hasVoted ? `${percentA}%` : '50%'}
                  </span>
                </div>
                <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${hasVoted ? percentA : 50}%` }}
                    className="h-full bg-[#F0DC00] rounded-full"
                  />
                </div>

                {/* Bottom Inverted Pip */}
                <div className="flex justify-end mt-2 text-[#B89600] dark:text-[#F0DC00] font-mono font-black text-[10px] rotate-180">
                  <Crown className="w-3 h-3" />
                  <span>A</span>
                </div>
              </div>
            </motion.div>

            {/* ============================================================== */}
            {/* FLOATING CENTER "VS" BADGE                                     */}
            {/* ============================================================== */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#171512] dark:bg-white text-white dark:text-[#171512] font-black text-xs flex items-center justify-center border-2 border-[#F7F2E8] dark:border-[#12110E] shadow-md pointer-events-none">
              VS
            </div>

            {/* ============================================================== */}
            {/* CARD B (Vertical Playing Card - Option B / Right)              */}
            {/* ============================================================== */}
            <motion.div
              style={{ scale: cardBScale, opacity: cardBOpacity }}
              onClick={() => handleVote('B')}
              className={`flex-1 rounded-[28px] p-4 sm:p-5 flex flex-col justify-between cursor-pointer border-2 transition-all relative overflow-hidden bg-[#FFFDF8] dark:bg-[#1C1A16] ${
                isVotedB
                  ? 'border-[#171512] dark:border-white shadow-[0_16px_36px_rgba(0,0,0,0.3)] ring-2 ring-[#171512]/30 dark:ring-white/40'
                  : 'border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 shadow-sm'
              }`}
            >
              {/* Inner Playing Card Border Inset */}
              <div className="absolute inset-1.5 rounded-[22px] border border-black/10 dark:border-white/10 pointer-events-none" />

              {/* Card B Top Pip & Badge */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-1 text-[#6F6A62] dark:text-[#A8A196] font-mono font-black text-xs">
                  <Zap className="w-3.5 h-3.5" />
                  <span>B</span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6F6A62] dark:text-[#A8A196] bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">
                  {t.games.optionB}
                </span>
              </div>

              {/* Card B Body */}
              <div className="my-auto py-3 text-center z-10">
                <h4 className="font-display font-black text-base sm:text-lg md:text-xl text-[#171512] dark:text-white leading-snug">
                  {optionTextB}
                </h4>

                {isVotedB && (
                  <span className="inline-flex items-center gap-1 mt-2.5 px-2.5 py-0.5 rounded-full bg-[#171512] dark:bg-white text-white dark:text-[#171512] font-black text-[10px] uppercase shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" />
                    {isEs ? 'Tu Voto' : 'Your Pick'}
                  </span>
                )}
              </div>

              {/* Card B Footer (Percentages & Votes) */}
              <div className="z-10 mt-auto pt-2 border-t border-black/5 dark:border-white/10">
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                  <span className="text-[#6F6A62] dark:text-[#A8A196] text-[11px]">
                    {hasVoted ? `${currentQ.votesB || 0} votes` : (isEs ? 'Desliza 👉' : 'Swipe 👉')}
                  </span>
                  <span className="text-[#171512] dark:text-white font-black text-sm">
                    {hasVoted ? `${percentB}%` : '50%'}
                  </span>
                </div>
                <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${hasVoted ? percentB : 50}%` }}
                    className="h-full bg-[#171512] dark:bg-white rounded-full"
                  />
                </div>

                {/* Bottom Inverted Pip */}
                <div className="flex justify-end mt-2 text-[#6F6A62] dark:text-[#A8A196] font-mono font-black text-[10px] rotate-180">
                  <Zap className="w-3 h-3" />
                  <span>B</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Total Votes registered banner */}
      <div className="text-center text-[11px] font-semibold text-[#6F6A62] dark:text-[#A8A196] mb-3">
        {total} {isEs ? 'votos en la fiesta' : 'votes registered in party'}
      </div>

      {/* Swipe Quick Controls & Navigation Dock */}
      <div className="flex items-center gap-2.5 w-full max-w-md justify-between px-1 mb-3">
        {/* Back / Previous Card Button */}
        <button
          onClick={handlePrev}
          className="flex-1 py-2.5 px-3 rounded-2xl bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/10 dark:border-white/10 shadow-sm hover:border-black/30 dark:hover:border-white/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold text-[#6F6A62] dark:text-[#A8A196]"
          title={isEs ? 'Carta anterior' : 'Previous card'}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isEs ? 'Anterior' : 'Prev'}</span>
        </button>

        {/* Quick Vote A Button */}
        <button
          onClick={() => handleVote('A')}
          className={`flex-1 py-2.5 px-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-extrabold ${
            isVotedA
              ? 'bg-[#F0DC00] text-[#171512] border-[#F0DC00] shadow-sm'
              : 'bg-[#FFFDF8] dark:bg-[#1C1A16] border-black/10 dark:border-white/10 text-[#171512] dark:text-[#F5F1E8] hover:border-[#F0DC00]'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-[#B89600] dark:text-[#F0DC00]" />
          <span>{isEs ? 'Votar A' : 'Vote A'}</span>
        </button>

        {/* Quick Vote B Button */}
        <button
          onClick={() => handleVote('B')}
          className={`flex-1 py-2.5 px-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-extrabold ${
            isVotedB
              ? 'bg-[#171512] dark:bg-white text-white dark:text-[#171512] border-[#171512] dark:border-white shadow-sm'
              : 'bg-[#FFFDF8] dark:bg-[#1C1A16] border-black/10 dark:border-white/10 text-[#171512] dark:text-[#F5F1E8] hover:border-black/30 dark:hover:border-white/30'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-[#171512] dark:text-white" />
          <span>{isEs ? 'Votar B' : 'Vote B'}</span>
        </button>

        {/* Next Card Button */}
        <button
          onClick={handleNext}
          className="flex-1 py-2.5 px-3 rounded-2xl bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/10 dark:border-white/10 shadow-sm hover:border-black/30 dark:hover:border-white/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold text-[#6F6A62] dark:text-[#A8A196]"
          title={isEs ? 'Siguiente carta' : 'Next card'}
        >
          <span>{isEs ? 'Sig' : 'Next'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Prominent Next Dilemma Button when Voted */}
      {hasVoted && (
        <motion.button
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F0DC00] hover:bg-[#E6D300] text-[#171512] font-black text-xs shadow-[0_4px_16px_rgba(240,220,0,0.3)] active:scale-95 transition-all cursor-pointer"
        >
          <span>{t.games.nextDilemma || (isEs ? 'Siguiente Dilema' : 'Next Dilemma')}</span>
          <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
        </motion.button>
      )}
    </div>
  );
};
