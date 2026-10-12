'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Eye, Copy, Check, Users } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { WHOS_MOST_LIKELY_QUESTIONS } from '@/data/mockData';
import {
  GameStage,
  GameEyebrow,
  FriendVoteCard,
  WinnerReveal,
  VoteBar,
  GameProgress,
} from './stage';

export const WhosMostLikely: React.FC = () => {
  const {
    parties,
    currentPartyId,
    whosMostLikely,
    voteWhosMostLikely,
    setCurrentView,
    goBack,
    loadPartyFromSupabase,
    listenToActivePartyRealtime,
    currentUser,
  } = usePartyStore();

  const { language } = useTranslation();
  const isEs = language === 'es';
  const shouldReduceMotion = useReducedMotion();

  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const partyMembers = party?.members || [];

  const [questionIndex, setQuestionIndex] = useState(0);
  const [votedMemberId, setVotedMemberId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [viewMode, setViewMode] = useState<'voting' | 'results'>('voting');

  useEffect(() => {
    if (!party?.id) return;
    loadPartyFromSupabase(party.id);
    const unsub = listenToActivePartyRealtime(party.id);
    return () => {
      unsub();
    };
  }, [party?.id, listenToActivePartyRealtime, loadPartyFromSupabase]);

  const questions = whosMostLikely && whosMostLikely.length > 0 ? whosMostLikely : WHOS_MOST_LIKELY_QUESTIONS;
  const currentQ = questions[questionIndex % questions.length] || WHOS_MOST_LIKELY_QUESTIONS[0];
  const questionText = isEs && currentQ.questionEs ? currentQ.questionEs : currentQ.question;

  // Real party members mapped with current user priority
  const friendsToDisplay = useMemo(() => {
    return partyMembers.map((m) => {
      const isMe =
        (currentUser?.id && m.id === currentUser.id) ||
        (currentUser?.walletAddress &&
          m.walletAddress &&
          m.walletAddress.toLowerCase() === currentUser.walletAddress.toLowerCase()) ||
        (currentUser?.name && m.name === currentUser.name);

      return {
        id: m.id,
        name: isMe && currentUser?.name ? currentUser.name : m.name,
        avatar: isMe && currentUser?.avatar ? currentUser.avatar : m.avatar,
      };
    });
  }, [partyMembers, currentUser]);

  const totalQuestions = questions.length;
  const currentStep = (questionIndex % totalQuestions) + 1;

  // Votes aggregation
  const effectiveVotes = useMemo(() => {
    const votesMap = { ...(currentQ.votes || {}) };
    if (votedMemberId && !votesMap[votedMemberId]) {
      votesMap[votedMemberId] = 1;
    }
    return votesMap;
  }, [currentQ.votes, votedMemberId]);

  const totalVotesCount = useMemo(() => {
    return Object.values(effectiveVotes).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [effectiveVotes]);

  // Ranked results for results screen
  const rankedFriends = useMemo(() => {
    return [...friendsToDisplay].sort((a, b) => {
      const aVotes = effectiveVotes[a.id] || 0;
      const bVotes = effectiveVotes[b.id] || 0;
      return bVotes - aVotes;
    });
  }, [friendsToDisplay, effectiveVotes]);

  const topVoteCount = rankedFriends.length > 0 ? effectiveVotes[rankedFriends[0].id] || 0 : 0;
  const winners = useMemo(() => {
    if (topVoteCount === 0 && rankedFriends.length > 0) {
      return [rankedFriends[0]];
    }
    return rankedFriends.filter((f) => (effectiveVotes[f.id] || 0) === topVoteCount);
  }, [rankedFriends, effectiveVotes, topVoteCount]);

  const handleVote = (memberId: string) => {
    setVotedMemberId(memberId);
    voteWhosMostLikely(currentQ.id, memberId);
  };

  const handleOpenResults = () => {
    setViewMode('results');
    if (!shouldReduceMotion) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.35 },
        colors: ['#F0DC00', '#FFF8E6', '#FF7A3D', '#171512'],
        disableForReducedMotion: true,
      });
    }
  };

  const handlePrev = () => {
    setVotedMemberId(null);
    setViewMode('voting');
    setQuestionIndex((prev) => (prev > 0 ? prev - 1 : questions.length - 1));
  };

  const handleNext = () => {
    setVotedMemberId(null);
    setViewMode('voting');
    setQuestionIndex((prev) => (prev + 1) % questions.length);
  };

  const handleCopyCode = () => {
    if (party?.code && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(party.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Safe fallback if less than 2 friends in party
  if (!party || partyMembers.length < 2) {
    return (
      <GameStage partyCoverImage={party?.coverImage}>
        <GameEyebrow
          label={isEs ? '¿QUIÉN ENCAJA MÁS?' : "WHO'S MOST LIKELY?"}
          onBack={goBack || (() => setCurrentView('party-detail'))}
          currentUser={currentUser}
        />

        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto">
          <div className="w-16 h-16 rounded-full bg-party-yellow/20 border border-party-yellow text-party-yellow flex items-center justify-center mb-4 shadow-sm">
            <Users className="w-8 h-8" />
          </div>

          <h3 className="font-display font-extrabold text-xl sm:text-2xl text-[var(--stage-text)] mb-2">
            {isEs ? 'Invita a tu grupo para jugar' : 'Invite friends to play'}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--stage-muted)] max-w-xs leading-relaxed mb-6">
            {isEs
              ? 'Este juego necesita al menos 2 personas en la fiesta para poder votar quién encaja mejor con cada pregunta.'
              : 'This game requires at least 2 members in the party to vote on who fits each prompt best.'}
          </p>

          {party?.code && (
            <div className="w-full max-w-xs p-4 rounded-2xl bg-[var(--stage-card)] border border-[var(--stage-card-border)] mb-4 flex flex-col items-center shadow-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--stage-muted)] block mb-1">
                {isEs ? 'Código de la fiesta' : 'Party code'}
              </span>
              <span className="font-mono text-3xl font-black tracking-widest text-[var(--stage-text)]">
                {party.code}
              </span>
            </div>
          )}

          {party?.code && (
            <button
              type="button"
              onClick={handleCopyCode}
              className="w-full max-w-xs py-3.5 px-6 rounded-full bg-party-yellow hover:bg-party-yellow-hover text-on-party-yellow font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mb-3"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isEs ? '¡Código copiado!' : 'Code copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{isEs ? 'Copiar código para invitar' : 'Copy code to invite'}</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={goBack || (() => setCurrentView('party-detail'))}
            className="w-full max-w-xs py-3 px-6 rounded-full border border-[var(--stage-card-border)] bg-[var(--stage-card)] text-[var(--stage-text)] font-semibold text-xs transition-all active:scale-95 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
          >
            {isEs ? 'Volver al detalle' : 'Back to gathering'}
          </button>
        </div>
      </GameStage>
    );
  }

  return (
    <GameStage partyCoverImage={party?.coverImage}>
      {/* ============================================================== */}
      {/* 1. TOP STAGE EYEBROW                                           */}
      {/* ============================================================== */}
      <GameEyebrow
        label={isEs ? '¿QUIÉN ENCAJA MÁS?' : "WHO'S MOST LIKELY?"}
        stepIndicator={`${currentStep}/${totalQuestions}`}
        onBack={goBack || (() => setCurrentView('party-detail'))}
        currentUser={currentUser}
      />

      <AnimatePresence mode="wait">
        {viewMode === 'voting' ? (
          /* ============================================================ */
          /* 2A. VOTING MODE (2x2 Grid matching Trailer choreography)      */
          /* ============================================================ */
          <motion.div
            key={`voting-${currentQ.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="flex-1 flex flex-col justify-between w-full"
          >
            {/* Prompt Heading (31px / 700 bold directly on stage) */}
            <div className="my-auto py-2 text-center">
              <h2 className="font-display font-black text-2xl sm:text-[30px] leading-[1.12] text-[var(--stage-text)] tracking-tight px-1">
                {questionText}
              </h2>
            </div>

            {/* 2-Column Responsive Participant Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-3.5 my-3 w-full max-h-[380px] overflow-y-auto scrollbar-none py-1">
              {friendsToDisplay.map((friend) => {
                const isSelected = votedMemberId === friend.id;
                const votesCount = effectiveVotes[friend.id] || 0;

                return (
                  <FriendVoteCard
                    key={friend.id}
                    friend={friend}
                    isSelected={isSelected}
                    onVote={() => handleVote(friend.id)}
                    votesCount={votesCount}
                    showVotes={false}
                  />
                );
              })}
            </div>

            {/* Live Progress Indicator with aria-live */}
            <GameProgress
              votedCount={totalVotesCount}
              totalMembers={partyMembers.length}
              hintText={isEs ? 'Toca un amigo para votar' : 'Tap a friend to vote'}
            />

            {/* Bottom Actions: Reveal Results + Nav Controls */}
            <div className="w-full space-y-2 pt-2">
              <button
                type="button"
                onClick={handleOpenResults}
                disabled={totalVotesCount === 0}
                className="w-full py-3.5 px-5 rounded-full bg-party-yellow hover:bg-party-yellow-hover text-on-party-yellow font-display font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Eye className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {isEs ? 'Ver resultado' : 'View result'}
                  {totalVotesCount > 0 ? ` · ${totalVotesCount}` : ''}
                </span>
              </button>

              <div className="w-full flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex-1 py-2.5 px-4 rounded-full border border-[var(--stage-card-border)] bg-[var(--stage-card)] text-[var(--stage-text)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isEs ? 'Anterior' : 'Previous'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-2.5 px-4 rounded-full border border-[var(--stage-card-border)] bg-[var(--stage-card)] text-[var(--stage-text)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 cursor-pointer shadow-2xs"
                >
                  <span>{isEs ? 'Siguiente' : 'Next'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ============================================================ */
          /* 2B. RESULTS MODE ("The crew has spoken" Outcome Choreography)  */
          /* ============================================================ */
          <motion.div
            key={`results-${currentQ.id}`}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -100 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-1 flex flex-col justify-between w-full"
          >
            {/* Winner Avatar + Name Celebration */}
            <WinnerReveal
              winners={winners}
              votesCount={topVoteCount}
              totalVotes={totalVotesCount}
              subtitle={isEs ? 'Más votado' : 'Top pick'}
            />

            {/* Cascading Bars Breakdown */}
            <div className="w-full bg-[var(--stage-card)] rounded-[28px] border border-[var(--stage-card-border)] p-4 sm:p-5 my-3 shadow-xs">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--stage-muted)] block mb-2">
                {isEs ? 'Desglose de votos' : 'Vote breakdown'}
              </span>

              <div className="divide-y divide-black/5 dark:divide-white/5">
                {rankedFriends.map((friend, idx) => {
                  const votes = effectiveVotes[friend.id] || 0;
                  const percentage =
                    totalVotesCount > 0 ? Math.round((votes / totalVotesCount) * 100) : 0;
                  const isWinner = topVoteCount > 0 && votes === topVoteCount;

                  return (
                    <VoteBar
                      key={friend.id}
                      friend={friend}
                      votes={votes}
                      totalVotes={totalVotesCount}
                      percentage={percentage}
                      isWinner={isWinner}
                      index={idx}
                    />
                  );
                })}
              </div>
            </div>

            {/* Bottom Controls: Keep Voting / Next Prompt */}
            <div className="w-full space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setViewMode('voting')}
                className="w-full py-3.5 px-5 rounded-full bg-[var(--stage-card)] border border-[var(--stage-card-border)] text-[var(--stage-text)] font-display font-black text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
              >
                <span>{isEs ? 'Seguir votando' : 'Keep voting'}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3.5 px-5 rounded-full bg-party-yellow hover:bg-party-yellow-hover text-on-party-yellow font-display font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <span>{isEs ? 'Siguiente pregunta' : 'Next prompt'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GameStage>
  );
};
