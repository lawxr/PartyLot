'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Zap, XCircle } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { WHOS_MOST_LIKELY_QUESTIONS } from '@/data/mockData';

export const WhosMostLikely: React.FC = () => {
  const { parties, currentPartyId, whosMostLikely, voteWhosMostLikely, setCurrentView, goBack } =
    usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';

  const fallbackParty = {
    id: 'demo-party',
    title: 'Partylot',
    members: [],
  };
  const party = parties.find((p) => p.id === currentPartyId) || parties[0] || fallbackParty;
  const partyMembers = party.members || [];
  const [questionIndex, setQuestionIndex] = useState(0);
  const [votedMemberId, setVotedMemberId] = useState<string | null>('u-sofi');

  const questions = whosMostLikely && whosMostLikely.length > 0 ? whosMostLikely : WHOS_MOST_LIKELY_QUESTIONS;
  const currentQ = questions[questionIndex % questions.length] || WHOS_MOST_LIKELY_QUESTIONS[0];
  const questionText = (isEs && currentQ.questionEs) ? currentQ.questionEs : currentQ.question;

  // Get party participants list (curated 6 friends for the 2x3 grid)
  const defaultFriends = [
    {
      id: 'u-ana',
      name: 'Ana',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'u-sofi',
      name: 'Sofi',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'u-cam',
      name: 'Cam',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'u-valen',
      name: 'Valen',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'u-diego',
      name: 'Diego',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'u-sara',
      name: 'Sara',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
  ];

  // Merge with actual party members if available, ensuring 6 slots
  const friendsToDisplay = defaultFriends.map((df) => {
    const existing = partyMembers.find((m) => m.id === df.id || m.name.toLowerCase() === df.name.toLowerCase());
    return existing ? { id: existing.id, name: existing.name, avatar: existing.avatar || df.avatar } : df;
  });

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

  const handleSkip = () => {
    setVotedMemberId(null);
    setQuestionIndex((prev) => prev + 1);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-between min-h-[85vh] px-4 py-2 text-[#171512]">
      {/* ============================================================== */}
      {/* PHONE 4 HEADER                                                 */}
      {/* ============================================================== */}
      <header className="flex items-center justify-between pt-2 pb-4">
        {/* Back Button */}
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

        {/* Title & Subtitle */}
        <div className="text-center">
          <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#171512] tracking-tight leading-none">
            {isEs ? '¿Quién es más probable?' : "Who's Most Likely?"}
          </h2>
          <p className="text-xs text-[#6F6A62] font-medium mt-1">
            {isEs ? 'Toca un amigo para votar' : 'Tap a friend to vote'}
          </p>
        </div>

        {/* Participant Count Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-light border border-black/10 shadow-sm text-xs font-bold text-[#171512]">
          <Users className="w-3.5 h-3.5 text-[#6F6A62]" />
          <span>8</span>
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
          const votesCount = currentQ.votes[friend.id] || (isSelected ? 3 : 0);

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
      {/* SECONDARY ACTION: SKIP FOR NOW PILL BUTTON                     */}
      {/* ============================================================== */}
      <div className="w-full flex justify-center mt-6 mb-4">
        <button
          onClick={handleSkip}
          className="w-full max-w-[280px] py-3.5 px-6 rounded-full border border-black/15 bg-white/70 hover:bg-white text-[#171512] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <XCircle className="w-4 h-4 text-[#6F6A62]" />
          <span>{isEs ? 'Omitir por ahora' : 'Skip for now'}</span>
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
