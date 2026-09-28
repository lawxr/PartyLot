'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CheckCircle2, XCircle, Sparkles, RotateCcw, ArrowRight } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { TRIVIA_QUESTIONS } from '@/data/mockData';

export const CrewTrivia: React.FC = () => {
  const { trivia, crewTrivia } = usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';
  const [currentRound, setCurrentRound] = useState(0); // 0 to 4 (5 rounds)
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const questions =
    crewTrivia && crewTrivia.length > 0
      ? crewTrivia
      : trivia && trivia.length > 0
      ? trivia
      : TRIVIA_QUESTIONS;
  const totalRounds = questions.length;
  const currentQ = questions[currentRound % totalRounds] || TRIVIA_QUESTIONS[0];

  const questionText = isEs && currentQ.questionEs ? currentQ.questionEs : currentQ.question;
  const optionsList = isEs && currentQ.optionsEs ? currentQ.optionsEs : currentQ.options;
  const explanationText = isEs && currentQ.explanationEs ? currentQ.explanationEs : currentQ.explanation;

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
        colors: ['#F0DC00', '#10B981'],
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
        colors: ['#F0DC00', '#171512', '#F59E0B'],
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
      <div className="flex flex-col items-center text-center w-full py-4 select-none">
        <div className="rounded-[32px] p-8 w-full max-w-sm bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/10 dark:border-white/10 shadow-[0_16px_40px_rgba(65,48,25,0.08)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
          <div className="w-16 h-16 rounded-full bg-[#F0DC00]/20 border border-[#F0DC00] text-[#B89600] dark:text-[#F0DC00] flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8" />
          </div>

          <span className="text-xs uppercase font-extrabold tracking-widest text-[#B89600] dark:text-[#F0DC00]">
            {isEs ? 'PODIO FINAL' : 'FINAL PODIUM'}
          </span>
          <h3 className="font-display font-black text-2xl sm:text-3xl text-[#171512] dark:text-[#F5F1E8] tracking-tight mt-1 mb-2">
            {isEs ? '¡GENIO DE LA CREW!' : 'CREW GENIUS!'}
          </h3>
          <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] mb-6">
            {isEs
              ? `Completaste las ${totalRounds} rondas de la Trivia de la Crew.`
              : `You completed all ${totalRounds} rounds of Crew Trivia.`}
          </p>

          <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/8 dark:border-white/10 mb-6">
            <span className="text-[11px] uppercase font-bold text-[#6F6A62] dark:text-[#A8A196] tracking-wider">
              {isEs ? 'TU PUNTAJE' : 'YOUR SCORE'}
            </span>
            <div className="font-display font-black text-4xl text-[#B89600] dark:text-[#F0DC00] mt-1">
              {score} PTS
            </div>
            <span className="text-xs text-[#6F6A62] dark:text-[#A8A196] block mt-1">
              {score >= 200
                ? isEs ? 'Leyenda certificada del círculo íntimo' : 'Certified Inner Circle Legend'
                : isEs ? 'Necesitas más asistencia a fiestas' : 'Needs more party attendance'}
            </span>
          </div>

          <div className="mb-5 flex items-center justify-center gap-2 rounded-2xl border border-[#836EF9]/30 bg-[#836EF9]/10 px-4 py-3 text-xs text-[#6D28D9] dark:text-[#C4B5FD] font-semibold">
            <Sparkles className="w-4 h-4 text-[#B89600] dark:text-[#F0DC00]" />
            <span>
              {isEs
                ? '¡Demostraste tu conocimiento en la Crew!'
                : 'You proved your trivia skills in the Crew!'}
            </span>
          </div>

          <button
            onClick={handleRestart}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#F0DC00] hover:bg-[#E6D300] text-[#171512] font-black text-sm shadow-[0_4px_16px_rgba(240,220,0,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>{isEs ? 'Jugar de Nuevo' : 'Play Again'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* Round & Score Header */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#B89600] dark:text-[#F0DC00] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {isEs ? `Ronda ${currentRound + 1} / ${totalRounds}` : `Round ${currentRound + 1} / ${totalRounds}`}
        </span>

        <span className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 text-xs font-mono font-bold text-[#171512] dark:text-[#F5F1E8]">
          {score} PTS
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 mb-5 overflow-hidden">
        <motion.div
          animate={{ width: `${((currentRound + 1) / totalRounds) * 100}%` }}
          className="h-full bg-[#F0DC00] rounded-full"
        />
      </div>

      {/* Question Box */}
      <div className="rounded-[24px] p-6 mb-5 text-center w-full bg-[#FFFDF8] dark:bg-[#1C1A16] border border-black/10 dark:border-white/15 shadow-[0_8px_24px_rgba(65,48,25,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
        <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#6F6A62] dark:text-[#A8A196]">
          {isEs ? 'HISTORIA Y LORE DE LA CREW' : 'CREW LORE & TRIVIA'}
        </span>
        <h3 className="font-display font-black text-xl sm:text-2xl text-[#171512] dark:text-white tracking-tight mt-2 mb-1 leading-snug">
          {questionText}
        </h3>
      </div>

      {/* Options List */}
      <div className="w-full space-y-2.5 mb-5">
        {optionsList.map((option, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = idx === currentQ.correctIndex;

          let btnStyle =
            'bg-[#FFFDF8] dark:bg-[#1C1A16] border-black/10 dark:border-white/10 text-[#171512] dark:text-[#F5F1E8] hover:border-[#F0DC00] shadow-sm';

          if (isAnswered) {
            if (isCorrect) {
              btnStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 shadow-sm';
            } else if (isSelected) {
              btnStyle = 'border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-200 shadow-sm';
            } else {
              btnStyle = 'opacity-50 border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] text-[#6F6A62] dark:text-white/40';
            }
          }

          return (
            <motion.button
              key={idx}
              whileTap={{ scale: isAnswered ? 1 : 0.98 }}
              onClick={() => handleSelectOption(idx)}
              className={`w-full p-4 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-xs font-mono font-bold text-[#171512] dark:text-white">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="font-display font-bold text-sm sm:text-base">
                  {option}
                </span>
              </div>

              {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              {isAnswered && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
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
            className="w-full flex flex-col gap-3"
          >
            <div className="p-4 rounded-2xl bg-[#F0DC00]/15 dark:bg-[#F0DC00]/20 border border-[#F0DC00]/30 text-xs text-[#171512] dark:text-[#F5F1E8] leading-relaxed">
              💡 <span className="font-bold">{isEs ? 'Dato del lore:' : 'Lore check:'}</span> {explanationText}
            </div>

            <button
              onClick={handleNextRound}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#F0DC00] hover:bg-[#E6D300] text-[#171512] font-black text-sm shadow-[0_4px_16px_rgba(240,220,0,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isEs ? 'Siguiente Pregunta' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
