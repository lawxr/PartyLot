'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Trophy, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { TRIVIA_QUESTIONS } from '@/data/mockData';
import { GAME_CONFETTI_COLORS } from '@/lib/games';
import { GameEyebrow } from './stage';

export const CrewTrivia: React.FC = () => {
  const {
    parties,
    currentPartyId,
    trivia,
    crewTrivia,
    loadPartyFromSupabase,
    listenToActivePartyRealtime,
    currentUser,
  } = usePartyStore();

  const { t, language } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const party = parties.find((p) => p.id === currentPartyId) || parties[0];

  useEffect(() => {
    if (!party?.id) return;
    loadPartyFromSupabase(party.id);
    const unsub = listenToActivePartyRealtime(party.id);
    return () => {
      unsub();
    };
  }, [party?.id, listenToActivePartyRealtime, loadPartyFromSupabase]);

  const [currentRound, setCurrentRound] = useState(0);
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

  const questionText = (language === 'es' && currentQ.questionEs) ? currentQ.questionEs : currentQ.question;
  const optionsList = (language === 'es' && currentQ.optionsEs) ? currentQ.optionsEs : currentQ.options;
  const explanationText = (language === 'es' && currentQ.explanationEs) ? currentQ.explanationEs : currentQ.explanation;

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      setScore((prev) => prev + 100);
      if (!shouldReduceMotion) {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#F0DC00', '#10B981', '#FFFFFF'],
          disableForReducedMotion: true,
        });
      }
    }
  };

  const handleNextRound = () => {
    if (currentRound + 1 < totalRounds) {
      setCurrentRound((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsGameOver(true);
      if (!shouldReduceMotion) {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.4 },
          colors: [...GAME_CONFETTI_COLORS],
          disableForReducedMotion: true,
        });
      }
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
      <div className="w-full flex-1 flex flex-col justify-between">
        <GameEyebrow
          label={t.games.crewTriviaEyebrow}
          currentUser={currentUser}
        />

        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto w-full">
          <div className="w-20 h-20 rounded-full bg-party-yellow/20 ring-6 ring-party-yellow text-[var(--stage-accent-text)] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Trophy className="w-10 h-10 stroke-[2.5]" />
          </div>

          <span className="font-mono text-xs uppercase font-black tracking-widest text-[var(--stage-accent-text)]">
            {t.games.finalPodium}
          </span>
          <h3 className="font-display font-black text-3xl sm:text-4xl text-[var(--stage-text)] tracking-tight mt-1 mb-2">
            {t.games.crewGenius}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--stage-muted)] mb-6 max-w-xs">
            {t.games.completedAllRounds(totalRounds)}
          </p>

          <div className="w-full max-w-xs p-5 rounded-3xl bg-[var(--stage-card)] border border-[var(--stage-card-border)] mb-6 shadow-xs">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--stage-muted)] block">
              {t.games.finalScore}
            </span>
            <div className="font-display font-black text-4xl text-[var(--stage-accent-text)] mt-1">
              {score} PTS
            </div>
            <span className="text-xs text-[var(--stage-muted)] block mt-1.5 font-medium">
              {score >= 200 ? t.games.legendaryKnowledge : t.games.needsMoreAttendance}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRestart}
            className="w-full max-w-xs py-3.5 px-6 rounded-full bg-party-yellow hover:bg-party-yellow-hover text-on-party-yellow font-display font-black text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>{t.games.playAgain}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col justify-between">
      {/* Eyebrow Header */}
      <GameEyebrow
        label={t.games.crewTriviaEyebrow}
        stepIndicator={`${currentRound + 1}/${totalRounds}`}
        currentUser={currentUser}
      />

      {/* Main Arena */}
      <div className="flex-1 flex flex-col justify-between my-auto w-full py-2">
        {/* Question Heading */}
        <div className="text-center my-auto py-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--stage-accent-text)] block mb-1">
            {t.games.crewPrompt}
          </span>
          <h2 className="font-display font-black text-2xl sm:text-[28px] text-[var(--stage-text)] tracking-tight leading-[1.12]">
            {questionText}
          </h2>
        </div>

        {/* Options List */}
        <div className="w-full space-y-2.5 my-3">
          {optionsList.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correctIndex;

            let cardStyle =
              'bg-[var(--stage-card)] border-[var(--stage-card-border)] text-[var(--stage-text)] hover:border-party-yellow shadow-2xs';

            if (isAnswered) {
              if (isCorrect) {
                cardStyle = 'border-party-yellow bg-party-yellow text-on-party-yellow shadow-md';
              } else if (isSelected) {
                cardStyle = 'border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300';
              } else {
                cardStyle = 'opacity-40 border-[var(--stage-card-border)] bg-[var(--stage-card)] text-[var(--stage-muted)]';
              }
            }

            return (
              <motion.button
                key={idx}
                type="button"
                whileTap={isAnswered ? undefined : { scale: 0.98 }}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${cardStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold ${
                      isAnswered && isCorrect
                        ? 'bg-black text-white'
                        : 'bg-black/5 dark:bg-white/10 text-[var(--stage-text)]'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-display font-bold text-sm sm:text-base">
                    {option}
                  </span>
                </div>

                {isAnswered && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-on-party-yellow shrink-0 stroke-[2.5]" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 stroke-[2.5]" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Answer Explanation & Next Round Action */}
        <div className="w-full min-h-[80px] flex flex-col justify-end">
          <AnimatePresence>
            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-2.5"
              >
                <div className="p-3.5 rounded-2xl bg-[var(--stage-card)] border border-[var(--stage-card-border)] text-xs text-[var(--stage-text)] leading-relaxed shadow-2xs">
                  <span className="font-bold text-[var(--stage-accent-text)] mr-1">
                    {t.games.factLabel}
                  </span>
                  <span>{explanationText}</span>
                </div>

                <button
                  type="button"
                  onClick={handleNextRound}
                  className="w-full py-3.5 px-5 rounded-full bg-party-yellow hover:bg-party-yellow-hover text-on-party-yellow font-display font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <span>{t.games.nextQuestion}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
