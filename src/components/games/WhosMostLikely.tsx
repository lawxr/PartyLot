'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Users, Zap, XCircle, Copy, Check } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { WHOS_MOST_LIKELY_QUESTIONS } from '@/data/mockData';

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
  } = usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';

  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const partyMembers = party?.members || [];
  const [questionIndex, setQuestionIndex] = useState(0);
  const [votedMemberId, setVotedMemberId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

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
  const questionText = (isEs && currentQ.questionEs) ? currentQ.questionEs : currentQ.question;

  // Real party members strictly (up to 6)
  const friendsToDisplay = partyMembers.slice(0, 6).map((m) => ({
    id: m.id,
    name: m.name,
    avatar: m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  }));

  const totalQuestions = questions.length;
  const currentStep = (questionIndex % totalQuestions) + 1;

  const handleVote = (memberId: string) => {
    setVotedMemberId(memberId);
    voteWhosMostLikely(currentQ.id, memberId);

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#F0DC00', '#171512', '#FFA000'],
    });
  };

  const handlePrev = () => {
    setVotedMemberId(null);
    setQuestionIndex((prev) => (prev > 0 ? prev - 1 : questions.length - 1));
  };

  const handleSkip = () => {
    setVotedMemberId(null);
    setQuestionIndex((prev) => prev + 1);
  };

  const handleCopyCode = () => {
    if (party?.code && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(party.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (!party || partyMembers.length < 2) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col justify-between min-h-[85vh] px-4 py-2 text-[#171512]">
        <header className="flex items-center justify-between pt-2 pb-4">
          <button
            onClick={() => {
              if (goBack) goBack();
              else setCurrentView('party-detail');
            }}
            className="w-10 h-10 rounded-full glass-light border border-black/10 flex items-center justify-center text-[#171512] shadow-sm hover:scale-105 active:scale-90 transition-transform cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div className="text-center">
            <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#171512] tracking-tight leading-none">
              {isEs ? '¿Quién es más probable?' : "Who's Most Likely?"}
            </h2>
          </div>
          <div className="w-10" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto">
          <div className="w-16 h-16 rounded-full bg-[#FFF5C0] border border-[#F0DC00]/50 flex items-center justify-center text-[#9A7D00] mb-4 shadow-sm">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-display font-extrabold text-xl text-[#171512] mb-2">
            {isEs ? 'Invita a tu grupo para jugar' : 'Invite friends to play'}
          </h3>
          <p className="text-xs text-[#6F6A62] max-w-xs leading-relaxed mb-6">
            {isEs
              ? 'Este juego necesita al menos 2 personas en la fiesta para poder votar quién encaja mejor con cada pregunta.'
              : 'This game requires at least 2 members in the party to vote on who fits each prompt best.'}
          </p>

          {party?.code && (
            <div className="w-full max-w-xs p-4 rounded-2xl bg-[#F2ECE1] border border-black/5 mb-4 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A8173] block mb-1">
                {isEs ? 'Código de la fiesta' : 'Party code'}
              </span>
              <span className="font-mono text-2xl font-black tracking-widest text-[#171512]">
                {party.code}
              </span>
            </div>
          )}

          {party?.code && (
            <button
              onClick={handleCopyCode}
              className="w-full max-w-xs py-3.5 px-6 rounded-full bg-[#F0DC00] text-[#171512] font-bold text-xs sm:text-sm shadow-sm hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mb-3"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 text-emerald-800 stroke-[3]" />
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
            onClick={() => {
              if (goBack) goBack();
              else setCurrentView('party-detail');
            }}
            className="w-full max-w-xs py-3 px-6 rounded-full border border-black/10 bg-white/70 hover:bg-white text-[#171512] font-semibold text-xs transition-all active:scale-95 cursor-pointer"
          >
            {isEs ? 'Volver al detalle' : 'Back to gathering'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-between min-h-[85vh] px-4 py-2 text-[#171512]">
      {/* ============================================================== */}
      {/* PHONE 4 HEADER                                                 */}
      {/* ============================================================== */}
      <header className="flex items-center justify-between pt-2 pb-4">
        {/* Previous Question Button */}
        <button
          onClick={handlePrev}
          className="w-10 h-10 rounded-full glass-light border border-black/10 dark:border-white/10 flex items-center justify-center text-[#171512] dark:text-white shadow-sm hover:scale-105 active:scale-90 transition-transform cursor-pointer"
          aria-label={isEs ? 'Pregunta anterior' : 'Previous question'}
          title={isEs ? 'Pregunta anterior' : 'Previous question'}
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Title & Subtitle */}
        <div className="text-center">
          <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#171512] dark:text-white tracking-tight leading-none">
            {isEs ? '¿Quién es más probable?' : "Who's Most Likely?"}
          </h2>
          <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] font-medium mt-1">
            {isEs ? 'Toca un amigo para votar' : 'Tap a friend to vote'}
          </p>
        </div>

        {/* Participant Count Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-light border border-black/10 dark:border-white/10 shadow-sm text-xs font-bold text-[#171512] dark:text-white">
          <Users className="w-3.5 h-3.5 text-[#6F6A62] dark:text-[#A8A196]" />
          <span>{partyMembers.length}</span>
        </div>
      </header>

      {/* ============================================================== */}
      {/* QUESTION CARD (Lightning Hero)                                 */}
      {/* ============================================================== */}
      <motion.div
        key={currentQ.id}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full rounded-[32px] p-6 sm:p-7 bg-[#F2ECE1] border border-black/5 text-center flex flex-col items-center shadow-[0_4px_20px_rgba(40,30,20,0.04)] my-4"
      >
        {/* Lightning Icon Badge */}
        <div className="w-11 h-11 rounded-full bg-[#FFF5C0] border border-[#F0DC00]/50 flex items-center justify-center text-[#B89600] mb-3 shadow-sm">
          <Zap className="w-5 h-5 fill-[#F0DC00] text-[#9A7D00]" />
        </div>

        {/* Question Text */}
        <h3 className="font-display font-extrabold text-xl sm:text-2xl text-[#171512] tracking-tight leading-snug max-w-xs sm:max-w-sm">
          {questionText}
        </h3>
      </motion.div>

      {/* ============================================================== */}
      {/* PARTICIPANTS 2x3 GRID                                          */}
      {/* ============================================================== */}
      <div className="grid grid-cols-3 gap-y-5 gap-x-4 my-2 px-2">
        {friendsToDisplay.map((friend) => {
          const isSelected = votedMemberId === friend.id;
          const votesCount = currentQ.votes?.[friend.id] || (isSelected ? 1 : 0);

          return (
            <motion.div
              key={friend.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleVote(friend.id)}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className="relative">
                {/* Circular Avatar */}
                <div
                  className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden transition-all duration-200 ${
                    isSelected
                      ? 'ring-4 ring-[#F0DC00] ring-offset-2 ring-offset-[#F7F2E8] scale-105 shadow-md'
                      : 'border-2 border-transparent group-hover:border-black/20 group-hover:scale-102'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Vote Count Badge (Yellow circle top-right on selected) */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#F0DC00] text-[#171512] font-black text-[11px] flex items-center justify-center border-2 border-[#F7F2E8] shadow-sm z-10"
                    >
                      {votesCount > 0 ? votesCount : '✓'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Friend Name Label */}
              <span className={`text-xs sm:text-sm font-bold mt-2 text-center transition-colors ${
                isSelected ? 'text-[#171512]' : 'text-[#6F6A62] group-hover:text-[#171512]'
              }`}>
                {friend.name}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* SECONDARY ACTIONS: PREV & SKIP/NEXT BUTTONS                    */}
      {/* ============================================================== */}
      <div className="w-full flex items-center justify-center gap-3 mt-6 mb-4">
        <button
          onClick={handlePrev}
          className="flex-1 max-w-[130px] py-3 px-4 rounded-full border border-black/15 dark:border-white/15 bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-[#171512] dark:text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isEs ? 'Anterior' : 'Previous'}</span>
        </button>
        <button
          onClick={handleSkip}
          className="flex-1 max-w-[180px] py-3 px-4 rounded-full border border-black/15 dark:border-white/15 bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-[#171512] dark:text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <span>{isEs ? 'Omitir / Sig' : 'Skip / Next'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ============================================================== */}
      {/* PROGRESS DOTS & INDICATOR                                      */}
      {/* ============================================================== */}
      <footer className="flex items-center justify-center gap-4 py-3">
        {/* 10 Progress Dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalQuestions }).map((_, i) => {
            const isFilled = i < currentStep;
            return (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isFilled ? 'bg-[#F0DC00]' : 'bg-[#D9D1C3]'
                }`}
              />
            );
          })}
        </div>

        {/* Step Text Counter */}
        <span className="text-xs font-bold text-[#6F6A62] tracking-wide">
          {currentStep} / {totalQuestions}
        </span>
      </footer>
    </div>
  );
};
