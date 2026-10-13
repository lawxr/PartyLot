'use client';

import React, { useState, useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useTransform,
  PanInfo,
} from 'framer-motion';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { THIS_OR_THAT_QUESTIONS } from '@/data/mockData';
import { percentages, votersCount } from '@/lib/games';
import { GameEyebrow, PickBlock } from './stage';

export const ThisOrThat: React.FC = () => {
  const {
    parties,
    currentPartyId,
    thisOrThat,
    voteThisOrThat,
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

  const [index, setIndex] = useState(0);

  const questions = thisOrThat && thisOrThat.length > 0 ? thisOrThat : THIS_OR_THAT_QUESTIONS;
  const currentQ = questions[index % questions.length] || THIS_OR_THAT_QUESTIONS[0];
  const totalVotes = votersCount(currentQ);
  const votePcts = percentages([currentQ.votesA || 0, currentQ.votesB || 0]);
  const percentA = totalVotes > 0 ? votePcts[0] : 50;
  const percentB = totalVotes > 0 ? votePcts[1] : 50;

  const optionTextA = (language === 'es' && currentQ.optionAEs) ? currentQ.optionAEs : currentQ.optionA;
  const optionTextB = (language === 'es' && currentQ.optionBEs) ? currentQ.optionBEs : currentQ.optionB;

  const userChoice = currentUser?.id ? currentQ.voters?.[currentUser.id] : currentQ.userVote;
  const isVotedA = userChoice === 'A';
  const isVotedB = userChoice === 'B';
  const hasVoted = Boolean(userChoice);
  const currentStep = (index % questions.length) + 1;

  // Swipe gesture motion values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 0, 150], shouldReduceMotion ? [0, 0, 0] : [-6, 0, 6]);
  const stampOpacityA = useTransform(x, [-90, -30, 0], shouldReduceMotion ? [0, 0, 0] : [1, 0.4, 0]);
  const stampOpacityB = useTransform(x, [0, 30, 90], shouldReduceMotion ? [0, 0, 0] : [0, 0.4, 1]);

  useEffect(() => {
    x.set(0);
  }, [currentQ.id, x]);

  const handleVote = (choice: 'A' | 'B') => {
    voteThisOrThat(currentQ.id, choice);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -90) {
      handleVote('A');
    } else if (info.offset.x > 90) {
      handleVote('B');
    }
  };

  const handlePrev = () => {
    setIndex((prev) => (prev > 0 ? prev - 1 : questions.length - 1));
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % questions.length);
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between">
      {/* 1. Header with Eyebrow */}
      <GameEyebrow
        label={t.games.thisOrThatEyebrow}
        stepIndicator={`${currentStep}/${questions.length}`}
        currentUser={currentUser}
      />

      {/* 2. Main Arena: Stacked PickBlocks with central VS pill */}
      <div
        data-disable-swipe-back="true"
        className="flex-1 flex flex-col justify-center my-auto w-full relative py-2"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            drag={hasVoted ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={handleDragEnd}
            style={{ x, rotate }}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`w-full flex flex-col gap-3 relative ${hasVoted ? '' : 'cursor-grab active:cursor-grabbing'}`}
          >
            {/* Stamp A: Swipe Left Indicator */}
            {!hasVoted && !shouldReduceMotion && (
              <motion.div
                style={{ opacity: stampOpacityA }}
                className="pointer-events-none absolute top-4 left-4 z-40 px-3.5 py-1.5 rounded-2xl border-3 border-[var(--game-orange)] text-[var(--game-orange)] bg-[var(--stage-card)]/90 backdrop-blur-xs font-display font-black text-base sm:text-lg -rotate-12 shadow-lg tracking-wider uppercase select-none"
              >
                {t.games.chooseOption('A')}
              </motion.div>
            )}

            {/* Stamp B: Swipe Right Indicator */}
            {!hasVoted && !shouldReduceMotion && (
              <motion.div
                style={{ opacity: stampOpacityB }}
                className="pointer-events-none absolute top-4 right-4 z-40 px-3.5 py-1.5 rounded-2xl border-3 border-party-yellow text-[var(--stage-accent-text)] bg-[var(--stage-card)]/90 backdrop-blur-xs font-display font-black text-base sm:text-lg rotate-12 shadow-lg tracking-wider uppercase select-none"
              >
                {t.games.chooseOption('B')}
              </motion.div>
            )}

            {/* OPTION A: Warm Orange Block */}
            <PickBlock
              choice="A"
              title={optionTextA}
              isChosen={isVotedA}
              isOtherChosen={isVotedB}
              percentage={hasVoted ? percentA : undefined}
              votesCount={hasVoted ? currentQ.votesA || 0 : undefined}
              onPick={() => handleVote('A')}
              className="min-h-[190px] sm:min-h-[210px]"
            />

            {/* Central Overlapping Floating VS Circle */}
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-[var(--stage-vs)] text-white font-mono font-black text-xs flex items-center justify-center border-4 border-white shadow-xl pointer-events-none"
            >
              VS
            </div>

            {/* OPTION B: Bright Party Yellow Block */}
            <PickBlock
              choice="B"
              title={optionTextB}
              isChosen={isVotedB}
              isOtherChosen={isVotedA}
              percentage={hasVoted ? percentB : undefined}
              votesCount={hasVoted ? currentQ.votesB || 0 : undefined}
              onPick={() => handleVote('B')}
              className="min-h-[190px] sm:min-h-[210px]"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. Footer Controls */}
      <footer className="w-full space-y-2 pt-2 shrink-0">
        {hasVoted ? (
          <button
            type="button"
            onClick={handleNext}
            className="w-full py-3.5 px-5 rounded-full bg-party-yellow hover:bg-party-yellow-hover text-on-party-yellow font-display font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <span>{t.games.nextDilemma}</span>
            <RefreshCw className="w-4 h-4 stroke-[2.5]" />
          </button>
        ) : (
          <div className="w-full flex items-center justify-between text-xs text-center font-mono font-bold text-[var(--stage-muted)] py-1">
            <span className="mx-auto">
              {t.games.votesRegistered(totalVotes)}
            </span>
          </div>
        )}

        <div className="w-full flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="flex-1 py-2.5 px-4 rounded-full border border-[var(--stage-card-border)] bg-[var(--stage-card)] text-[var(--stage-text)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.games.previous}</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-2.5 px-4 rounded-full border border-[var(--stage-card-border)] bg-[var(--stage-card)] text-[var(--stage-text)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 cursor-pointer shadow-2xs"
          >
            <span>{t.games.skip}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
