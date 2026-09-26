'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CheckCircle2, XCircle, Sparkles, RotateCcw, ArrowRight } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { TRIVIA_QUESTIONS } from '@/data/mockData';

export const CrewTrivia: React.FC = () => {
  const { trivia } = usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';
  const [currentRound, setCurrentRound] = useState(0); // 0 to 4 (5 rounds)
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const questions = trivia && trivia.length > 0 ? trivia : TRIVIA_QUESTIONS;
  const totalRounds = questions.length;
  const currentQ = questions[currentRound % totalRounds] || TRIVIA_QUESTIONS[0];

  const questionText = (isEs && currentQ.questionEs) ? currentQ.questionEs : currentQ.question;
  const optionsList = (isEs && currentQ.optionsEs) ? currentQ.optionsEs : currentQ.options;
  const explanationText = (isEs && currentQ.explanationEs) ? currentQ.explanationEs : currentQ.explanation;

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      setScore((prev) => prev + 100);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#F0DC00', '#34D399'],
      });
    }
  };

  const handleNextRound = () => {
    if (currentRound + 1 < totalRounds) {
      setCurrentRound((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsGameOver(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#F0DC00', '#FFFFFF', '#F59E0B'],
      });
    }
  };

  const handleRestart = () => {
    setCurrentRound(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsGameOver(false);
  };

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center text-center w-full py-4">
        <GlassPanel level={3} className="p-8 w-full max-w-sm border border-white/20">
          <div className="w-16 h-16 rounded-full bg-[#F0DC00]/20 border border-[#F0DC00] text-[#F0DC00] flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8" />
          </div>

          <span className="text-xs uppercase font-extrabold tracking-widest text-[#F0DC00]">
            {isEs ? 'PODIO FINAL' : 'FINAL PODIUM'}
          </span>
          <h3 className="font-display font-black text-3xl text-white tracking-tight mt-1 mb-2">
            {isEs ? '¡GENIO DE LA CREW!' : 'CREW GENIUS!'}
          </h3>
          <p className="text-xs text-white/60 mb-6">
            {isEs
              ? `Completaste las ${totalRounds} rondas de la Trivia.`
              : `You completed all ${totalRounds} rounds of 404 Trivia.`}
          </p>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/10 mb-6">
            <span className="text-[11px] uppercase font-bold text-white/50 tracking-wider">
              {isEs ? 'TU PUNTAJE' : 'YOUR SCORE'}
            </span>
            <div className="font-display font-black text-4xl text-[#F0DC00] mt-1">
              {score} PTS
            </div>
            <span className="text-xs text-white/70 block mt-1">
              {score >= 400
                ? isEs ? 'Leyenda certificada del círculo íntimo' : 'Certified Inner Circle Legend'
                : isEs ? 'Necesitas más asistencia a fiestas' : 'Needs more party attendance'}
            </span>
          </div>

          <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl border border-[#836EF9]/30 bg-[#836EF9]/10 px-4 py-3 text-xs text-white/90">
            <Sparkles className="w-4 h-4 text-[#F0DC00]" />
            <span>
              {isEs
                ? '¡Demostraste tu conocimiento en la Crew!'
                : 'You proved your trivia skills in the Crew!'}
            </span>
          </div>

          <GlassButton
            variant="glass"
            size="lg"
            fullWidth
            onClick={handleRestart}
            icon={<RotateCcw className="w-5 h-5 text-white" />}
          >
            {isEs ? 'Jugar de Nuevo' : 'Play Again'}
          </GlassButton>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Round & Score Header */}
      <div className="w-full flex items-center justify-between mb-4 px-1">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#F0DC00] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {isEs ? `Ronda ${currentRound + 1} / ${totalRounds}` : `Round ${currentRound + 1} / ${totalRounds}`}
        </span>

        <span className="px-3 py-1 rounded-full liquid-glass-card text-xs font-mono font-bold text-white">
          {score} PTS
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/10 rounded-full h-1.5 mb-6 overflow-hidden">
        <motion.div
          animate={{ width: `${((currentRound + 1) / totalRounds) * 100}%` }}
          className="h-full bg-[#F0DC00] rounded-full"
        />
      </div>

      {/* Question Box */}
      <GlassPanel level={3} className="p-6 mb-6 text-center w-full border border-white/20">
        <span className="text-[10px] uppercase font-extrabold tracking-widest text-white/50">
          {isEs ? 'HISTORIA Y TRIVIA DE LA CREW' : 'CREW LORE & TRIVIA'}
        </span>
        <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight mt-2 mb-2 leading-snug">
          {questionText}
        </h3>
      </GlassPanel>

      {/* Options List */}
      <div className="w-full space-y-2.5 mb-6">
        {optionsList.map((option, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = idx === currentQ.correctIndex;

          let btnStyle = 'liquid-glass-card hover:bg-white/10 border-white/15 text-white/90';

          if (isAnswered) {
            if (isCorrect) {
              btnStyle = 'border-emerald-400 bg-emerald-500/20 text-emerald-200';
            } else if (isSelected) {
              btnStyle = 'border-rose-400 bg-rose-500/20 text-rose-200';
            } else {
              btnStyle = 'liquid-glass-card opacity-50 border-white/10 text-white/50';
            }
          }

          return (
            <motion.button
              key={idx}
              whileTap={{ scale: isAnswered ? 1 : 0.98 }}
              onClick={() => handleSelectOption(idx)}
              className={`w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-xs font-mono font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="font-display font-bold text-sm sm:text-base">
                  {option}
                </span>
              </div>

              {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isAnswered && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Explanation & Next Button */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/15 text-xs text-white/80 mb-4 leading-relaxed">
              💡 <span className="font-bold text-white">{isEs ? 'Dato del lore:' : 'Lore check:'}</span> {explanationText}
            </div>

            <GlassButton
              variant="accent"
              size="lg"
              fullWidth
              onClick={handleNextRound}
              icon={<ArrowRight className="w-5 h-5 text-black" />}
            >
              {currentRound + 1 === totalRounds
                ? isEs ? 'Ver Puntaje Final' : 'View Final Score'
                : isEs ? 'Siguiente Ronda →' : 'Next Round →'}
            </GlassButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
