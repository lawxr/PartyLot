'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CheckCircle2, XCircle, Sparkles, RotateCcw, ArrowRight, Coins, Check } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import confetti from 'canvas-confetti';

export const CrewTrivia: React.FC = () => {
  const { trivia, parties, currentPartyId, currentUser, rewardGameWinner } = usePartyStore();

  const party = parties.find((p) => p.id === currentPartyId) || parties[0];
  const [currentRound, setCurrentRound] = useState(0); // 0 to 4 (5 rounds)
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimedBounty, setHasClaimedBounty] = useState(false);

  const totalRounds = trivia.length;
  const currentQ = trivia[currentRound];

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
    setHasClaimedBounty(false);
  };

  const handleClaimBounty = async () => {
    if (isClaiming || hasClaimedBounty || party.potBalance < 5) return;
    setIsClaiming(true);
    try {
      await rewardGameWinner({
        partyId: party.id,
        memberId: currentUser.id,
        amount: 5,
        gameTitle: 'Crew Lore Trivia',
      });
      setHasClaimedBounty(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F0DC00', '#10B981', '#FFFFFF'],
      });
    } finally {
      setIsClaiming(false);
    }
  };

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center text-center w-full py-4">
        <GlassPanel level={3} className="p-8 w-full max-w-sm border border-white/20">
          <div className="w-16 h-16 rounded-full bg-[#F0DC00]/20 border border-[#F0DC00] text-[#F0DC00] flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8" />
          </div>

          <span className="text-xs uppercase font-extrabold tracking-widest text-[#F0DC00]">
            FINAL PODIUM
          </span>
          <h3 className="font-display font-black text-3xl text-white tracking-tight mt-1 mb-2">
            CREW GENIUS!
          </h3>
          <p className="text-xs text-white/60 mb-6">
            You completed all {totalRounds} rounds of 404 Trivia.
          </p>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/10 mb-6">
            <span className="text-[11px] uppercase font-bold text-white/50 tracking-wider">
              YOUR SCORE
            </span>
            <div className="font-display font-black text-4xl text-[#F0DC00] mt-1">
              {score} PTS
            </div>
            <span className="text-xs text-white/70 block mt-1">
              {score >= 400 ? 'Certified Inner Circle Legend' : 'Needs more party attendance'}
            </span>
          </div>

          {score >= 300 && party.potBalance >= 5 && (
            <div className="mb-4">
              <button
                onClick={handleClaimBounty}
                disabled={isClaiming || hasClaimedBounty}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold font-display flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                  hasClaimedBounty
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-[#F0DC00] text-black hover:brightness-105 shadow-[#F0DC00]/20'
                }`}
              >
                {hasClaimedBounty ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>$5 Trivia Bounty Claimed</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    <span>{isClaiming ? 'Transferring...' : 'Claim $5 Bounty from Party Pot'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          <GlassButton
            variant="glass"
            size="lg"
            fullWidth
            onClick={handleRestart}
            icon={<RotateCcw className="w-5 h-5 text-white" />}
          >
            Play Again
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
          Round {currentRound + 1} / {totalRounds}
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
          CREW LORE & TRIVIA
        </span>
        <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight mt-2 mb-2 leading-snug">
          {currentQ.question}
        </h3>
      </GlassPanel>

      {/* Options List */}
      <div className="w-full space-y-2.5 mb-6">
        {currentQ.options.map((option, idx) => {
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
              💡 <span className="font-bold text-white">Lore check:</span> {currentQ.explanation}
            </div>

            <GlassButton
              variant="accent"
              size="lg"
              fullWidth
              onClick={handleNextRound}
              icon={<ArrowRight className="w-5 h-5 text-black" />}
            >
              {currentRound + 1 === totalRounds ? 'View Final Score' : 'Next Round →'}
            </GlassButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
